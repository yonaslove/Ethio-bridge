package com.ethiobridge.service;

import com.ethiobridge.entity.Listing;
import com.ethiobridge.entity.PlatformRevenue;
import com.ethiobridge.entity.ProviderProfile;
import com.ethiobridge.repository.ListingRepository;
import com.ethiobridge.repository.PlatformRevenueRepository;
import com.ethiobridge.repository.ProviderProfileRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.*;

@Service
@Transactional
public class MonetizationService {

    private final PlatformRevenueRepository revenueRepository;
    private final ProviderProfileRepository providerProfileRepository;
    private final ListingRepository listingRepository;
    private final NotificationService notificationService;
    private final AuditLogService auditLogService;
    private final PaymentService paymentService;

    public MonetizationService(PlatformRevenueRepository revenueRepository,
                               ProviderProfileRepository providerProfileRepository,
                               ListingRepository listingRepository,
                               NotificationService notificationService,
                               AuditLogService auditLogService,
                               PaymentService paymentService) {
        this.revenueRepository = revenueRepository;
        this.providerProfileRepository = providerProfileRepository;
        this.listingRepository = listingRepository;
        this.notificationService = notificationService;
        this.auditLogService = auditLogService;
        this.paymentService = paymentService;
    }

    public PlatformRevenue recordEscrowCommission(UUID milestoneId, UUID payerUserId, BigDecimal grossAmount,
                                                 BigDecimal feeAmount, BigDecimal netAmount, String description) {
        String ref = "REV-ESC-" + System.currentTimeMillis();
        PlatformRevenue revenue = new PlatformRevenue(
                "ESCROW_COMMISSION",
                milestoneId,
                payerUserId,
                grossAmount,
                feeAmount,
                netAmount,
                "SYSTEM_ESCROW",
                ref,
                description
        );
        PlatformRevenue saved = revenueRepository.save(revenue);
        auditLogService.log(payerUserId, "RECORD_REVENUE", "PlatformRevenue", saved.getId().toString(),
                "Escrow 10% fee recorded: " + feeAmount + " ETB", null);
        return saved;
    }

    public Map<String, Object> topUpConnects(UUID providerUserId, int connectsAmount, String paymentMethod) {
        ProviderProfile profile = providerProfileRepository.findByUserId(providerUserId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Provider profile not found"));

        BigDecimal price = switch (connectsAmount) {
            case 10 -> new BigDecimal("50.00");
            case 25 -> new BigDecimal("100.00");
            case 60 -> new BigDecimal("200.00");
            default -> new BigDecimal(connectsAmount * 5); // 5 ETB per connect
        };

        if ("CHAPA".equalsIgnoreCase(paymentMethod)) {
            String purpose = "CONNECTS_TOPUP:" + connectsAmount;
            Map<String, Object> checkout = paymentService.initializeChapaCheckout(null, null, providerUserId, price, purpose);
            Map<String, Object> resp = new HashMap<>(checkout);
            resp.put("status", "PENDING_PAYMENT");
            resp.put("connectsAmount", connectsAmount);
            resp.put("price", price);
            resp.put("message", "Payment initiated with Chapa. Please complete checkout to receive your Connects.");
            return resp;
        }

        String refPrefix = paymentMethod.toUpperCase().contains("TELEBIRR") ? "TB-CON-" : "CBE-CON-";
        String ref = refPrefix + System.currentTimeMillis();

        PlatformRevenue revenue = new PlatformRevenue(
                "CONNECTS_TOPUP",
                profile.getId(),
                providerUserId,
                price,
                price, // 100% platform revenue
                BigDecimal.ZERO,
                paymentMethod.toUpperCase(),
                ref,
                "Connects Top-Up: +" + connectsAmount + " tokens (" + price + " ETB)"
        );
        revenueRepository.save(revenue);

        int current = profile.getConnectsBalance() != null ? profile.getConnectsBalance() : 0;
        profile.setConnectsBalance(current + connectsAmount);
        providerProfileRepository.save(profile);

        auditLogService.log(providerUserId, "TOPUP_CONNECTS", "ProviderProfile", profile.getId().toString(),
                "Added " + connectsAmount + " connects via " + paymentMethod + ". Ref: " + ref, null);

        notificationService.sendNotification(
                providerUserId,
                "Connects Balance Updated (+" + connectsAmount + ")",
                "Your payment of " + price + " ETB via " + paymentMethod + " succeeded. New balance: " + profile.getConnectsBalance() + " Connects.",
                "CONNECTS",
                "/profile/provider"
        );

        Map<String, Object> result = new HashMap<>();
        result.put("success", true);
        result.put("addedConnects", connectsAmount);
        result.put("newBalance", profile.getConnectsBalance());
        result.put("amountPaid", price);
        result.put("referenceId", ref);
        return result;
    }

    public Map<String, Object> verifyConnectsTopup(UUID providerUserId, String txRef) {
        return paymentService.verifyChapaPayment(txRef);
    }
        result.put("paymentMethod", paymentMethod);
        result.put("referenceId", ref);
        return result;
    }

    public Map<String, Object> promoteListingToFeatured(UUID seekerUserId, UUID listingId, String paymentMethod) {
        Listing listing = listingRepository.findById(listingId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Listing not found"));

        if (!listing.getOwnerUserId().equals(seekerUserId)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Only the owner can promote this listing");
        }

        BigDecimal price = new BigDecimal("500.00");
        String refPrefix = paymentMethod.toUpperCase().contains("CHAPA") ? "CHP-FEAT-" :
                paymentMethod.toUpperCase().contains("TELEBIRR") ? "TB-FEAT-" : "CBE-FEAT-";
        String ref = refPrefix + System.currentTimeMillis();

        PlatformRevenue revenue = new PlatformRevenue(
                "FEATURED_LISTING",
                listing.getId(),
                seekerUserId,
                price,
                price, // 100% platform revenue
                BigDecimal.ZERO,
                paymentMethod.toUpperCase(),
                ref,
                "14-Day Featured Job Promotion for \"" + listing.getTitle() + "\""
        );
        revenueRepository.save(revenue);

        listing.setFeatured(true);
        listing.setFeaturedUntil(OffsetDateTime.now().plusDays(14));
        listingRepository.save(listing);

        auditLogService.log(seekerUserId, "PROMOTE_LISTING", "Listing", listing.getId().toString(),
                "Promoted to Featured for 14 days via " + paymentMethod + ". Ref: " + ref, null);

        notificationService.sendNotification(
                seekerUserId,
                "Listing Promoted to ⭐ FEATURED",
                "Your listing \"" + listing.getTitle() + "\" is now highlighted at the top of the marketplace for 14 days.",
                "LISTING",
                "/listings/" + listing.getId()
        );

        Map<String, Object> result = new HashMap<>();
        result.put("success", true);
        result.put("listingId", listing.getId());
        result.put("isFeatured", true);
        result.put("featuredUntil", listing.getFeaturedUntil());
        result.put("amountPaid", price);
        result.put("referenceId", ref);
        return result;
    }

    public Map<String, Object> subscribeToPro(UUID providerUserId, String paymentMethod) {
        ProviderProfile profile = providerProfileRepository.findByUserId(providerUserId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Provider profile not found"));

        BigDecimal price = new BigDecimal("299.00");
        String refPrefix = paymentMethod.toUpperCase().contains("CHAPA") ? "CHP-PRO-" :
                paymentMethod.toUpperCase().contains("TELEBIRR") ? "TB-PRO-" : "CBE-PRO-";
        String ref = refPrefix + System.currentTimeMillis();

        PlatformRevenue revenue = new PlatformRevenue(
                "PRO_SUBSCRIPTION",
                profile.getId(),
                providerUserId,
                price,
                price, // 100% platform revenue
                BigDecimal.ZERO,
                paymentMethod.toUpperCase(),
                ref,
                "EthioBridge Pro Talent 30-Day Subscription"
        );
        revenueRepository.save(revenue);

        profile.setPro(true);
        profile.setProExpiresAt(OffsetDateTime.now().plusDays(30));
        // Bonus 30 connects for subscribing to Pro
        int current = profile.getConnectsBalance() != null ? profile.getConnectsBalance() : 0;
        profile.setConnectsBalance(current + 30);
        providerProfileRepository.save(profile);

        auditLogService.log(providerUserId, "SUBSCRIBE_PRO", "ProviderProfile", profile.getId().toString(),
                "Subscribed to EthioBridge Pro for 30 days via " + paymentMethod + ". Ref: " + ref, null);

        notificationService.sendNotification(
                providerUserId,
                "Welcome to ⭐ EthioBridge Pro!",
                "Your Pro membership is active. You received a verified Pro badge, priority AI matching, and +30 bonus Connects!",
                "MEMBERSHIP",
                "/profile/provider"
        );

        Map<String, Object> result = new HashMap<>();
        result.put("success", true);
        result.put("isPro", true);
        result.put("proExpiresAt", profile.getProExpiresAt());
        result.put("newConnectsBalance", profile.getConnectsBalance());
        result.put("amountPaid", price);
        result.put("referenceId", ref);
        return result;
    }

    @Transactional(readOnly = true)
    public Map<String, Object> getMonetizationStats() {
        BigDecimal totalRevenue = revenueRepository.sumTotalRevenue();
        BigDecimal escrowCommission = revenueRepository.sumRevenueBySourceType("ESCROW_COMMISSION");
        BigDecimal connectsRevenue = revenueRepository.sumRevenueBySourceType("CONNECTS_TOPUP");
        BigDecimal featuredListingRevenue = revenueRepository.sumRevenueBySourceType("FEATURED_LISTING");
        BigDecimal proSubscriptionRevenue = revenueRepository.sumRevenueBySourceType("PRO_SUBSCRIPTION");
        List<PlatformRevenue> recent = revenueRepository.findAllByOrderByCreatedAtDesc().stream().limit(15).toList();

        Map<String, Object> stats = new HashMap<>();
        stats.put("totalRevenue", totalRevenue != null ? totalRevenue : BigDecimal.ZERO);
        stats.put("escrowCommissionRevenue", escrowCommission != null ? escrowCommission : BigDecimal.ZERO);
        stats.put("connectsRevenue", connectsRevenue != null ? connectsRevenue : BigDecimal.ZERO);
        stats.put("featuredListingRevenue", featuredListingRevenue != null ? featuredListingRevenue : BigDecimal.ZERO);
        stats.put("proSubscriptionRevenue", proSubscriptionRevenue != null ? proSubscriptionRevenue : BigDecimal.ZERO);
        stats.put("recentTransactions", recent);
        return stats;
    }
}
