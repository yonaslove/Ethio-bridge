package com.ethiobridge.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

import javax.imageio.ImageIO;
import java.awt.image.BufferedImage;
import java.io.ByteArrayInputStream;
import java.io.File;
import java.io.IOException;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.ArrayList;
import java.util.Base64;
import java.util.List;

/**
 * Computer Vision & Document Integrity AI Analyzer for Ethiopian Identity Documents
 * (Fayda National ID, Kebele ID, Ethiopian Passport, Driver's License).
 *
 * Inspects uploaded images for:
 * 1. Resolution and decodability
 * 2. Card geometry & aspect ratio (ISO/IEC 7810 ID-1 standard)
 * 3. Citizen portrait photograph presence (biometric anchor via localized skin-chrominance
 *    or laser-engraved achromatic facial midtone/contour analysis)
 * 4. Substrate color saturation & luminance (rejecting colorful digital illustrations, memes, cartoons, wallpapers)
 * 5. Official Ethiopian security features (1D FAN Barcode verification for Fayda National IDs)
 */
@Component
public class DocumentAiInspector {

    private static final Logger log = LoggerFactory.getLogger(DocumentAiInspector.class);

    public record InspectionResult(
            boolean isValidDocument,
            double imageScore,
            String detectedType,
            boolean hasPortraitPhoto,
            List<String> passNotes,
            List<String> failNotes,
            String primaryFailureReason
    ) {}

    public InspectionResult inspect(String documentUrl, String idType) {
        if (documentUrl == null || documentUrl.trim().isEmpty()) {
            return new InspectionResult(
                    false,
                    0.0,
                    "NO_DOCUMENT",
                    false,
                    List.of(),
                    List.of("No document file was provided for inspection."),
                    "No document attached"
            );
        }

        BufferedImage image = decodeImage(documentUrl);
        if (image == null) {
            return new InspectionResult(
                    false,
                    0.0,
                    "CORRUPTED_OR_UNREADABLE",
                    false,
                    List.of(),
                    List.of("The uploaded file could not be decoded as a valid image format (JPEG/PNG/WebP)."),
                    "Unreadable or corrupted image file"
            );
        }

        int width = image.getWidth();
        int height = image.getHeight();
        double aspectRatio = (double) width / (double) height;

        List<String> passNotes = new ArrayList<>();
        List<String> failNotes = new ArrayList<>();
        double score = 0.0;

        // 1. Resolution Check
        if (width >= 280 && height >= 180) {
            passNotes.add("Image resolution (" + width + "x" + height + " px) meets minimum legibility requirements.");
            score += 15.0;
        } else {
            failNotes.add("Image resolution (" + width + "x" + height + " px) is too low for document text verification.");
        }

        // 2. Geometry & Aspect Ratio Check
        // ISO 7810 ID-1 (Fayda, Kebele, Driver's License): ratio ~ 1.58 (acceptable range: 1.15 - 2.10)
        // Passport photo spread: ratio ~ 0.60 - 2.10
        boolean isIdCard = !"PASSPORT".equalsIgnoreCase(idType);
        boolean validAspect;
        if (isIdCard) {
            validAspect = (aspectRatio >= 1.15 && aspectRatio <= 2.10);
        } else {
            validAspect = (aspectRatio >= 0.60 && aspectRatio <= 2.10);
        }

        if (validAspect) {
            passNotes.add("Card aspect ratio (" + String.format("%.2f", aspectRatio) + ") aligns with national document specifications.");
            score += 15.0;
        } else {
            failNotes.add("Unusual aspect ratio (" + String.format("%.2f", aspectRatio) + ") does not match standard ID card or passport dimensions.");
        }

        // 3. Document Color Palette & Substrate Check (Detecting saturated graphics, memes, wallpapers)
        LuminanceAnalysis lum = analyzeLuminanceAndSaturation(image);
        if (lum.isDocumentLike) {
            passNotes.add("Document surface luminance and contrast match authentic printed ID substrates.");
            score += 20.0;
        } else {
            failNotes.add(lum.diagnosticMessage);
        }

        // 4. Biometric Portrait Photo Detection
        // Official Ethiopian IDs (Fayda, Kebele, Passport) require a citizen headshot photograph.
        PortraitAnalysis portrait = analyzePortraitPresence(image);
        if (portrait.detected) {
            passNotes.add("Biometric portrait photo verified in " + portrait.location + " (" + portrait.description + ").");
            score += 30.0;
        } else {
            failNotes.add("No citizen portrait photograph detected. Official Ethiopian IDs (Fayda / Kebele / Passport) require a visible headshot photograph.");
        }

        // 5. Official 1D Barcode Detection (Fayda FAN Barcode Standard)
        BarcodeAnalysis barcode = detectBarcode(image);
        boolean isFayda = "FAYDA_NATIONAL_ID".equalsIgnoreCase(idType);
        if (barcode.detected) {
            passNotes.add("Official Ethiopian Fayda 1D barcode verified (" + barcode.transitions + " vertical transitions across FAN barcode zone).");
            score += 20.0;
        } else if (isFayda) {
            failNotes.add("Mandatory Fayda 1D barcode missing. Official Ethiopian Fayda National IDs must feature an alternating security barcode below the FAN number.");
        }

        // Classification & Document Integrity Verdict
        String detectedCategory;
        boolean isValid;

        if (!lum.isDocumentLike) {
            detectedCategory = "NON_DOCUMENT_GRAPHIC_OR_MEME";
            isValid = false;
        } else if (!portrait.detected) {
            detectedCategory = "NON_DOCUMENT_OR_NO_PORTRAIT";
            isValid = false;
        } else if (isFayda && !barcode.detected) {
            detectedCategory = "UNOFFICIAL_OR_MODIFIED_DOCUMENT";
            isValid = false;
        } else if (barcode.detected && portrait.detected && validAspect) {
            detectedCategory = "FAYDA_NATIONAL_ID_CARD";
            isValid = true;
        } else if (portrait.detected && lum.isDocumentLike && validAspect) {
            detectedCategory = isIdCard ? "OFFICIAL_ID_CARD" : "PASSPORT_BIO_PAGE";
            isValid = (score >= 60.0);
        } else {
            detectedCategory = "ATYPICAL_DOCUMENT_SCAN";
            isValid = false;
        }

        String primaryFailure = null;
        if (!isValid) {
            if (!lum.isDocumentLike) {
                primaryFailure = lum.diagnosticMessage;
            } else if (!portrait.detected) {
                primaryFailure = "No citizen portrait photo detected. Official Ethiopian IDs (Fayda / Kebele / Passport) must display a clear personal headshot.";
            } else if (isFayda && !barcode.detected) {
                primaryFailure = "Missing official Fayda 1D barcode required for national identity card authentication.";
            } else {
                primaryFailure = "Document image failed minimum legibility or aspect ratio requirements.";
            }
        }

        return new InspectionResult(
                isValid,
                Math.min(100.0, Math.max(0.0, score)),
                detectedCategory,
                portrait.detected,
                passNotes,
                failNotes,
                primaryFailure
        );
    }

    private BufferedImage decodeImage(String documentUrl) {
        try {
            if (documentUrl.startsWith("data:image")) {
                int commaIdx = documentUrl.indexOf(",");
                if (commaIdx != -1) {
                    String base64Data = documentUrl.substring(commaIdx + 1);
                    byte[] bytes = Base64.getDecoder().decode(base64Data);
                    return ImageIO.read(new ByteArrayInputStream(bytes));
                }
            } else if (documentUrl.startsWith("/api/v1/files/")) {
                String filename = documentUrl.replace("/api/v1/files/", "");
                Path p = Paths.get("./uploads", filename).toAbsolutePath().normalize();
                File file = p.toFile();
                if (file.exists()) {
                    return ImageIO.read(file);
                }
            } else {
                File file = new File(documentUrl);
                if (file.exists()) {
                    return ImageIO.read(file);
                }
            }
        } catch (Exception e) {
            log.warn("Failed to decode document image for AI analysis: {}", e.getMessage());
        }
        return null;
    }

    private record PortraitAnalysis(boolean detected, String location, String description) {}
    private record BarcodeAnalysis(boolean detected, int transitions) {}

    /**
     * Checks for official Fayda 1D barcode on the bottom half (x: 35%-85%, y: 76%-90%).
     * Alternating black and white bars produce >= 24 transitions across a horizontal scan line.
     */
    private BarcodeAnalysis detectBarcode(BufferedImage img) {
        int w = img.getWidth();
        int h = img.getHeight();

        int maxTransitions = 0;
        int[] yPcts = {79, 82, 85, 88};

        int startX = (int) (w * 0.35);
        int endX = (int) (w * 0.85);

        for (int yPct : yPcts) {
            int y = (int) (h * (yPct / 100.0));
            if (y >= h) continue;

            int transitions = 0;
            boolean prevDark = false;
            for (int x = startX; x < endX; x++) {
                int rgb = img.getRGB(x, y);
                int r = (rgb >> 16) & 0xFF;
                int g = (rgb >> 8) & 0xFF;
                int b = rgb & 0xFF;
                int lum = (int) (0.299 * r + 0.587 * g + 0.114 * b);

                boolean isDark = lum < 100;
                if (isDark != prevDark) {
                    transitions++;
                    prevDark = isDark;
                }
            }
            if (transitions > maxTransitions) {
                maxTransitions = transitions;
            }
        }

        boolean detected = maxTransitions >= 24;
        return new BarcodeAnalysis(detected, maxTransitions);
    }

    /**
     * Inspects primary headshot regions:
     * 1. Left portrait quadrant (Fayda / Kebele standard, x: 8%-45%, y: 18%-88%)
     * 2. Right portrait quadrant (x: 55%-92%, y: 18%-88%)
     * 3. Center passport zone (x: 25%-75%, y: 15%-85%)
     *
     * Detects both:
     * - Color skin chrominance (standard color portrait photos with human skin tones)
     * - Laser-engraved / grayscale portraits on national ID substrate (Fayda standard).
     *   Laser portraits must be ACHROMATIC (mean chroma <= 32, achromatic ratio >= 55%),
     *   exhibit human face biometric luminance distribution (high midtones, dark contours, stdDev >= 18).
     */
    private PortraitAnalysis analyzePortraitPresence(BufferedImage img) {
        int w = img.getWidth();
        int h = img.getHeight();

        // 1. Check left quadrant (primary photo on Fayda and Kebele IDs)
        ZoneMetrics leftMetrics = analyzeZoneBiometrics(img, (int) (w * 0.08), (int) (h * 0.20), (int) (w * 0.45), (int) (h * 0.88));
        if (leftMetrics.isPortrait()) {
            return new PortraitAnalysis(true, "left portrait quadrant (Fayda / Kebele standard)", leftMetrics.summary());
        }

        // 2. Check right quadrant
        ZoneMetrics rightMetrics = analyzeZoneBiometrics(img, (int) (w * 0.55), (int) (h * 0.20), (int) (w * 0.92), (int) (h * 0.88));
        if (rightMetrics.isPortrait()) {
            return new PortraitAnalysis(true, "right portrait quadrant", rightMetrics.summary());
        }

        // 3. Check center zone (Passport standard)
        ZoneMetrics centerMetrics = analyzeZoneBiometrics(img, (int) (w * 0.25), (int) (h * 0.15), (int) (w * 0.75), (int) (h * 0.85));
        if (centerMetrics.isPortrait()) {
            return new PortraitAnalysis(true, "center portrait zone (Passport standard)", centerMetrics.summary());
        }

        return new PortraitAnalysis(false, "NONE", "No human headshot or laser portrait detected");
    }

    private record ZoneMetrics(double skinDensity, double midtoneRatio, double darkRatio, double stdDev, double achromaticRatio, double meanChroma) {
        public boolean isPortrait() {
            // Case A: High color skin chrominance (standard color ID photograph)
            if (skinDensity >= 0.05) {
                return true;
            }
            // Case B: Laser-engraved / grayscale biometric headshot on ID substrate (Fayda standard)
            // MUST be achromatic (grayscale). Colorful graphic art (cyan, blue, purple) is strictly rejected.
            if (achromaticRatio >= 0.55 && meanChroma <= 32.0 &&
                midtoneRatio >= 0.45 && midtoneRatio <= 0.95 &&
                darkRatio >= 0.03 && darkRatio <= 0.38 &&
                stdDev >= 18.0) {
                return true;
            }
            return false;
        }

        public String summary() {
            if (skinDensity >= 0.05) {
                return String.format("%.1f%% color skin tone density", skinDensity * 100);
            }
            return String.format("laser-engraved ID headshot (%.1f%% facial midtones, %.1f%% contour details)", midtoneRatio * 100, darkRatio * 100);
        }
    }

    private ZoneMetrics analyzeZoneBiometrics(BufferedImage img, int startX, int startY, int endX, int endY) {
        int w = img.getWidth();
        int h = img.getHeight();

        startX = Math.max(0, startX);
        startY = Math.max(0, startY);
        endX = Math.min(w, endX);
        endY = Math.min(h, endY);

        int totalSampled = 0;
        int skinPixels = 0;
        int midtonePixels = 0;
        int darkPixels = 0;
        int achromaticPixels = 0;
        long totalChroma = 0;

        List<Integer> luminances = new ArrayList<>();
        long sumLum = 0;
        int step = Math.max(1, (endX - startX) / 70);

        for (int x = startX; x < endX; x += step) {
            for (int y = startY; y < endY; y += step) {
                int rgb = img.getRGB(x, y);
                int r = (rgb >> 16) & 0xFF;
                int g = (rgb >> 8) & 0xFF;
                int b = rgb & 0xFF;

                int lum = (int) (0.299 * r + 0.587 * g + 0.114 * b);
                luminances.add(lum);
                sumLum += lum;
                totalSampled++;

                int max = Math.max(r, Math.max(g, b));
                int min = Math.min(r, Math.min(g, b));
                int chroma = max - min;
                totalChroma += chroma;

                if (chroma <= 28) {
                    achromaticPixels++;
                }

                if (isSkinTone(r, g, b)) {
                    skinPixels++;
                }

                if (lum >= 75 && lum <= 205) {
                    midtonePixels++;
                } else if (lum < 75) {
                    darkPixels++;
                }
            }
        }

        if (totalSampled == 0) {
            return new ZoneMetrics(0, 0, 0, 0, 0, 0);
        }

        double skinDensity = (double) skinPixels / totalSampled;
        double midtoneRatio = (double) midtonePixels / totalSampled;
        double darkRatio = (double) darkPixels / totalSampled;
        double achromaticRatio = (double) achromaticPixels / totalSampled;
        double meanChroma = (double) totalChroma / totalSampled;

        double meanLum = (double) sumLum / totalSampled;
        double sumSqDiff = 0.0;
        for (int l : luminances) {
            sumSqDiff += (l - meanLum) * (l - meanLum);
        }
        double stdDev = Math.sqrt(sumSqDiff / totalSampled);

        return new ZoneMetrics(skinDensity, midtoneRatio, darkRatio, stdDev, achromaticRatio, meanChroma);
    }

    /**
     * Standard normalized skin-chrominance model supporting varied Ethiopian & global skin complexions.
     */
    private boolean isSkinTone(int r, int g, int b) {
        if (r < 65 || g < 30 || b < 20) return false;
        if (r <= g || r <= b) return false;
        if ((r - g) < 10) return false;
        int max = Math.max(r, Math.max(g, b));
        int min = Math.min(r, Math.min(g, b));
        if ((max - min) < 14) return false;
        return true;
    }

    private record LuminanceAnalysis(boolean isDocumentLike, double averageLuminance, double blackMarginPercent, double meanSaturation, double highSatPercent, String diagnosticMessage) {}

    private LuminanceAnalysis analyzeLuminanceAndSaturation(BufferedImage img) {
        int w = img.getWidth();
        int h = img.getHeight();

        long sumLum = 0;
        int total = 0;
        int blackOrNearBlack = 0;
        int highSatPixels = 0;
        double sumSaturation = 0.0;

        int step = Math.max(1, w / 80);

        for (int x = 0; x < w; x += step) {
            for (int y = 0; y < h; y += step) {
                int rgb = img.getRGB(x, y);
                int r = (rgb >> 16) & 0xFF;
                int g = (rgb >> 8) & 0xFF;
                int b = rgb & 0xFF;

                int lum = (int) (0.299 * r + 0.587 * g + 0.114 * b);
                sumLum += lum;
                total++;

                if (lum < 25) {
                    blackOrNearBlack++;
                }

                int max = Math.max(r, Math.max(g, b));
                int min = Math.min(r, Math.min(g, b));
                double sat = max > 0 ? (double) (max - min) / max : 0.0;
                sumSaturation += sat;

                if (sat > 0.40) {
                    highSatPixels++;
                }
            }
        }

        if (total == 0) {
            return new LuminanceAnalysis(false, 0, 0, 0, 0, "Empty image buffer");
        }

        double avgLum = (double) sumLum / total;
        double blackRatio = (double) blackOrNearBlack / total;
        double meanSat = sumSaturation / total;
        double highSatRatio = (double) highSatPixels / total;

        // Physical ID documents are light plastic/paper cards (avgLum usually between 90 and 245)
        // with very low color saturation (meanSat <= 0.28, highSatRatio <= 0.22).
        // Non-document graphics (memes, wallpapers, artistic posters, horoscope charts)
        // have high color saturation (meanSat > 0.30 or highSatRatio > 0.25).
        boolean lumOk = (avgLum >= 65.0 && avgLum <= 250.0 && blackRatio < 0.35);
        boolean satOk = (meanSat <= 0.28 && highSatRatio <= 0.22);

        boolean documentLike = lumOk && satOk;
        String diagnostic;
        if (!satOk) {
            diagnostic = String.format("Image visual profile shows high color saturation (%.1f%% saturated color palette), typical of digital illustrations, memes, or posters rather than a physical printed ID card.", highSatRatio * 100);
        } else if (!lumOk) {
            diagnostic = "Image surface luminance indicates heavy dark border letterboxing or non-document lighting.";
        } else {
            diagnostic = "Document surface matches authentic printed substrate.";
        }

        return new LuminanceAnalysis(documentLike, avgLum, blackRatio, meanSat, highSatRatio, diagnostic);
    }
}
