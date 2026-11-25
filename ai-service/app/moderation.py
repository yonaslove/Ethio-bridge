import re
from typing import Dict, Any, List
from app.schemas import ModerationScanRequest, ModerationScanResponse

# Ethiopian Banking & Payment Regular Expressions
CBE_ACCOUNT_REGEX = re.compile(r'\b1000\d{8,11}\b')
ETH_PHONE_REGEX = re.compile(r'(?:\+?251|0)?[97]\d{8}\b')
TELEGRAM_REGEX = re.compile(r'(@[a-zA-Z0-9_]{4,}|t\.me/[a-zA-Z0-9_]+)', re.IGNORECASE)
WHATSAPP_REGEX = re.compile(r'(wa\.me/\d+|whatsapp\s*[:\-]?\s*[\d+]+)', re.IGNORECASE)
EMAIL_REGEX = re.compile(r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b')

# Escrow Evasion & Offline Payment Keywords (English & Amharic)
ESCROW_EVASION_KEYWORDS = [
    "pay me direct", "direct cbe", "telebirr direct", "send directly to", "outside platform",
    "outside escrow", "offline payment", "avoid fee", "avoid commission", "pay me cash",
    "wire me", "transfer direct", "bank direct", "pay off-site", "without escrow",
    # Amharic
    "ከእስክሮው ውጭ", "በቀጥታ ክፈሉኝ", "በባንክ አስገባ", "በባንክ ላክልኝ", "በቴሌብር ላክልኝ",
    "አካውንት ቁጥር", "ቀጥታ ክፍያ", "ኮሚሽን ላለመክፈል"
]

# Upfront Fee & Employment Scams (English & Amharic)
UPFRONT_FEE_KEYWORDS = [
    "registration fee", "application fee", "deposit required", "interview fee",
    "security deposit", "training fee", "pay before start", "processing fee",
    "materials fee", "equipment deposit", "hiring fee", "prepayment required",
    # Amharic
    "የምዝገባ ክፍያ", "ቅድመ ክፍያ", "የማመልከቻ ክፍያ", "ተቀማጭ ገንዘብ", "የስልጠና ክፍያ", "የመሳሪያ ክፍያ"
]

# Unrealistic Earnings / Pyramid / MLMs
UNREALISTIC_KEYWORDS = [
    "earn 50000 daily", "earn 100000 per week", "earn money without working",
    "work 1 hour earn 5000", "guaranteed profit", "free money", "instant rich"
]

# Abusive Content & Harassment
HARASSMENT_KEYWORDS = [
    "kill you", "i will beat you", "steal your money", "cheat you",
    "ውሸታም ሌባ", "አጭበርባሪ", "እገድልሃለሁ"
]

def scan_text_for_violations(request: ModerationScanRequest) -> ModerationScanResponse:
    text = request.text or ""
    text_lower = text.lower()
    
    flagged = False
    risk_level = "LOW"
    categories: List[str] = []
    reasons: List[str] = []
    matched_patterns: List[str] = []
    
    # 1. Escrow Evasion: CBE Accounts
    cbe_matches = CBE_ACCOUNT_REGEX.findall(text)
    if cbe_matches:
        flagged = True
        categories.append("ESCROW_EVASION")
        reasons.append("Commercial Bank of Ethiopia (CBE) 13-digit account number detected.")
        matched_patterns.extend([f"CBE_ACCOUNT:{m}" for m in cbe_matches])
    
    # 2. Escrow Evasion: Keyword detection
    for kw in ESCROW_EVASION_KEYWORDS:
        if kw in text_lower:
            flagged = True
            if "ESCROW_EVASION" not in categories:
                categories.append("ESCROW_EVASION")
            reasons.append(f"Off-platform escrow evasion phrasing detected: '{kw}'.")
            matched_patterns.append(f"KEYWORD:{kw}")
            break
            
    # 3. Contact Evasion (Only for chat / listings to prevent off-platform disintermediation)
    tg_matches = TELEGRAM_REGEX.findall(text)
    if tg_matches:
        flagged = True
        categories.append("CONTACT_LEAK")
        reasons.append("External Telegram contact handle or link detected.")
        matched_patterns.extend([f"TELEGRAM:{m}" for m in tg_matches[:2]])
        
    wa_matches = WHATSAPP_REGEX.findall(text)
    if wa_matches:
        flagged = True
        categories.append("CONTACT_LEAK")
        reasons.append("External WhatsApp link or direct contact detected.")
        matched_patterns.extend([f"WHATSAPP:{m}" for m in wa_matches[:2]])
        
    # Phone numbers combined with payment context or in job listings
    phone_matches = ETH_PHONE_REGEX.findall(text)
    if phone_matches and ("ESCROW_EVASION" in categories or request.contentType == "LISTING"):
        flagged = True
        if "CONTACT_LEAK" not in categories:
            categories.append("CONTACT_LEAK")
        reasons.append("Direct phone number posted in opportunity/payment context.")
        matched_patterns.extend([f"PHONE:{p}" for p in phone_matches[:2]])
        
    # 4. Upfront Fee Scams (Critical in Listings)
    for kw in UPFRONT_FEE_KEYWORDS:
        if kw in text_lower:
            flagged = True
            categories.append("UPFRONT_FEE_SCAM")
            reasons.append(f"Prohibited upfront fee or deposit solicitation: '{kw}'.")
            matched_patterns.append(f"UPFRONT_FEE:{kw}")
            break
            
    # 5. Unrealistic Earnings
    for kw in UNREALISTIC_KEYWORDS:
        if kw in text_lower:
            flagged = True
            categories.append("DECEPTIVE_LISTING")
            reasons.append(f"Deceptive or unrealistic income guarantee: '{kw}'.")
            matched_patterns.append(f"UNREALISTIC:{kw}")
            break
            
    # 6. Harassment & Abuse
    for kw in HARASSMENT_KEYWORDS:
        if kw in text_lower:
            flagged = True
            categories.append("HARASSMENT")
            reasons.append(f"Hostile, threatening, or abusive content: '{kw}'.")
            matched_patterns.append(f"HARASSMENT:{kw}")
            break

    # Determine risk level
    if "UPFRONT_FEE_SCAM" in categories or "ESCROW_EVASION" in categories:
        risk_level = "HIGH"
    elif "HARASSMENT" in categories or "DECEPTIVE_LISTING" in categories:
        risk_level = "HIGH"
    elif "CONTACT_LEAK" in categories:
        risk_level = "MEDIUM"
        
    explanation = " ".join(reasons) if reasons else "No risk indicators detected. Content compliant."
    
    return ModerationScanResponse(
        flagged=flagged,
        riskLevel=risk_level if flagged else "LOW",
        categories=categories,
        reasons=reasons,
        matchedPatterns=matched_patterns,
        explanation=explanation
    )
