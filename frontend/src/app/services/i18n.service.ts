import { Injectable, signal } from '@angular/core';

export type Language = 'en' | 'am';

@Injectable({
  providedIn: 'root'
})
export class I18nService {
  private currentLang = signal<Language>('en');

  readonly lang = this.currentLang.asReadonly();

  private translations: Record<Language, Record<string, string>> = {
    en: {
      // Navbar
      'nav.brandTitle': 'EthioBridge',
      'nav.brandSubtitle': 'Ethiopia Unified Marketplace & AI',
      'nav.browse': 'Browse Marketplace',
      'nav.postListing': 'Post Opportunity',
      'nav.myListings': 'My Listings',
      'nav.myApplications': 'My Applications',
      'nav.recommended': 'Recommended Jobs',
      'nav.messages': 'Messages',
      'nav.contracts': 'Contracts & Escrow',
      'nav.evaluation': 'AI Benchmarks',
      'nav.admin': 'Admin Console',
      'nav.login': 'Sign In',
      'nav.register': 'Create Account',
      'nav.signOut': 'Sign Out',
      'nav.verified': 'Verified Profile',
      'nav.notifications': 'Notifications',
      'nav.terms': 'Terms of Service',
      'nav.privacy': 'Privacy Policy',
      'nav.profile': 'My Profile & Skills',
      'nav.employerProfile': 'Employer Profile',
      'nav.verification': 'National ID Verification',
      'nav.markAllRead': 'Mark all read',
      'nav.noNotifications': 'No notifications yet.',

      // Hero
      'hero.badge': 'Graduation Research & Unified Marketplace',
      'hero.titlePrefix': 'Empowering Ethiopian Talent Across ',
      'hero.titleHighlight': 'Three Integrated Pillars',
      'hero.subtitle': 'EthioBridge securely connects hiring clients with verified providers across Full-Time Employment, Freelance Projects, and Local On-Demand Services. Powered by explainable AI semantic matching evaluated against classical keyword baselines.',
      'hero.exploreBtn': 'Explore Marketplace',
      'hero.hireBtn': 'Post a Listing',
      'hero.signInBtn': 'Sign In',
      'hero.createAccBtn': 'Create Account',
      'hero.stat1Val': '3 Pillars',
      'hero.stat1Label': 'Jobs, Gigs, Local Trades',
      'hero.stat2Val': '+24.7%',
      'hero.stat2Label': 'AI Relevance Gain (nDCG@5)',
      'hero.stat3Val': '100%',
      'hero.stat3Label': 'Explainable Factor Attribution',

      // AI Match Preview
      'preview.tag': 'Explainable Semantic Recommendation',
      'preview.matchScore': '94% Match',
      'preview.candidateTitle': 'Senior Backend Engineer',
      'preview.candidateBio': '"5 years architecting Spring Boot microservices and PostgreSQL distributed queries."',
      'preview.factorSkill': 'Skill Alignment (Java, SQL)',
      'preview.factorAvail': 'Availability (Full Time)',
      'preview.factorSem': 'Semantic Embedding Relevance',
      'preview.model': 'Sentence-BERT Multilingual Semantic Matching',

      // Ownership
      'own.title': 'Separate Responsibilities, Unified Quality',
      'own.subtitle': 'Whether hiring talent or building your career, EthioBridge gives you dedicated tools to manage your opportunities securely.',
      'own.seekerBadge': 'For Clients & Employers',
      'own.seekerTitle': 'Hire Talent & Commission Work',
      'own.seekerDesc': 'Post full-time software positions, milestone-based freelance contracts, or emergency on-site service calls in Addis Ababa and regional hubs.',
      'own.seekerF1': '✓ Instant explainable AI ranking for incoming candidates',
      'own.seekerF2': '✓ Compare AI semantic matching side-by-side with keyword search',
      'own.seekerF3': '✓ Track applications and schedule interviews with verified talent',
      'own.seekerBtn': 'Sign Up to Hire',
      'own.providerBadge': 'For Providers & Freelancers',
      'own.providerTitle': 'Offer Skills & Grow Your Business',
      'own.providerDesc': 'Create a verified profile highlighting your tech stack, language skills, or vocational trade experience. Receive direct job recommendations tailored to your background.',
      'own.providerF1': '✓ Semantic match scoring highlights your exact fit to clients',
      'own.providerF2': '✓ Direct application tracking from submission to acceptance',
      'own.providerF3': '✓ Transparent rating and review system building your local reputation',
      'own.providerBtn': 'Join as a Provider',

      // Pillars
      'pillars.title': 'One Unified Platform, Three Market Segments',
      'pillars.subtitle': 'Bridging Ethiopia\'s fragmented service and tech economy under a single intelligent matching engine.',
      'pillar1.name': 'Employment',
      'pillar1.desc': 'Permanent and contract opportunities with Ethiopian tech firms, banks, and enterprises. Match developers, analysts, and IT managers based on technical stacks and seniority.',
      'pillar1.link': 'Browse Jobs →',
      'pillar2.name': 'Freelance Projects',
      'pillar2.desc': 'Milestone-based digital engagements. Web development, UI/UX design, translation (Amharic/English), and content marketing connecting remote talent with clients.',
      'pillar2.link': 'Explore Projects →',
      'pillar3.name': 'Local Services',
      'pillar3.desc': 'On-demand neighborhood trades and technical services. Certified electricians, plumbers, appliance repair, and tutors filtered by micro-location and availability.',
      'pillar3.link': 'Find Local Pros →',

      // Trust
      'trust.title': 'Institutional Trust & Safe Commerce',
      'trust.subtitle': 'Engineered specifically for the Ethiopian economic, banking, and regulatory ecosystem.',
      'trust.faydaTitle': 'National ID (Fayda) Verification',
      'trust.faydaDesc': 'Cryptographically verified credentials using Ethiopia\'s National ID Program standards to curb ghost accounts and scam vacancies.',
      'trust.escrowTitle': 'Telebirr & CBE Escrow Protection',
      'trust.escrowDesc': 'Funds remain locked in secure milestone escrow until deliverables are inspected and accepted by the client.',
      'trust.disputeTitle': 'Binding Dispute Mediation',
      'trust.disputeDesc': 'Independent platform arbitration with full audit trail logs, work snapshots, and swift payout settlement.',
      'trust.fairnessTitle': 'Regional Fairness Audits (FAT-ML)',
      'trust.fairnessDesc': 'Continuous algorithmic fairness monitoring across all 12 regional states and chartered cities to prevent geographic bias.',

      // Recent Listings
      'recent.title': 'Recent Open Listings',
      'recent.subtitle': 'Explore newly posted opportunities across Ethiopia',
      'recent.viewAll': 'View All Listings',
      'recent.details': 'Details',
      'recent.negotiable': 'Negotiable',

      // Contracts
      'contracts.escrowTitle': 'Milestone Escrow & Telebirr Payments',
      'contracts.fundMilestone': 'Fund Milestone',
      'contracts.releasePayment': 'Release Payout',
      'contracts.raiseDispute': 'Open Dispute',

      // Messages
      'messages.inbox': 'Conversations',
      'messages.typePlaceholder': 'Type a secure message in English or Amharic...',
      'messages.send': 'Send',

      // Verification
      'verification.modalTitle': 'National Identity Verification',
      'verification.submit': 'Submit for Verification',
      'verification.faydaId': 'Fayda National ID (FAN)',
      'verification.kebeleId': 'Kebele ID',
      'verification.passport': 'Ethiopian Passport',

      // Footer
      'footer.desc': 'An AI-powered integrated employment, freelancing, and local-service marketplace for Ethiopia. Evaluating explainable semantic matching, national ID trust, and Telebirr-secured milestone escrow.',
      'footer.rights': '© 2026 EthioBridge Platform. All rights reserved. Addis Ababa, Ethiopia.',
      'footer.compliance': 'Built with Spring Boot 3, Angular 18, FastAPI & Keycloak. In compliance with Ethiopian Personal Data Protection Proclamations.'
    },
    am: {
      // Navbar
      'nav.brandTitle': 'ኢትዮብሪጅ',
      'nav.brandSubtitle': 'የኢትዮጵያ የተቀናጀ የስራ ገበያ እና AI',
      'nav.browse': 'የስራ ገበያ ያስሱ',
      'nav.postListing': 'ስራ ወይም ጨረታ ይለጥፉ',
      'nav.myListings': 'የእኔ ማስታወቂያዎች',
      'nav.myApplications': 'የእኔ ማመልከቻዎች',
      'nav.recommended': 'የተመረጡ ስራዎች',
      'nav.messages': 'መልዕክቶች',
      'nav.contracts': 'ውሎች እና ክፍያ',
      'nav.evaluation': 'የአርቴፊሻል ኢንተለጀንስ ምዘና',
      'nav.admin': 'የአስተዳዳሪ ክፍል',
      'nav.login': 'ይግቡ',
      'nav.register': 'አካውንት ይክፈቱ',
      'nav.signOut': 'ውጣ',
      'nav.verified': 'የተረጋገጠ መለያ',
      'nav.notifications': 'ማሳወቂያዎች',
      'nav.terms': 'የአገልግሎት ውል',
      'nav.privacy': 'የግላዊነት ፖሊሲ',
      'nav.profile': 'የእኔ መገለጫ እና ክህሎቶች',
      'nav.employerProfile': 'የአሰሪ መገለጫ',
      'nav.verification': 'የብሔራዊ መታወቂያ ማረጋገጫ',
      'nav.markAllRead': 'ሁሉንም አንብብ',
      'nav.noNotifications': 'ምንም ማሳወቂያ የለም።',

      // Hero
      'hero.badge': 'የምርቃት ጥናት እና የተቀናጀ የስራ ገበያ',
      'hero.titlePrefix': 'የኢትዮጵያን ሙያተኞች በሶስት የተቀናጁ ',
      'hero.titleHighlight': 'ዘርፎች ማብቃት',
      'hero.subtitle': 'ኢትዮብሪጅ አሰሪዎችን ከተረጋገጡ ባለሙያዎች ጋር በሙሉ ጊዜ ስራ፣ በፍሪላንስ ፕሮጀክቶች እና በፈጣን የሀገር ውስጥ አገልግሎቶች ያገናኛል። በአርቴፊሻል ኢንተለጀንስ የተደገፈ ግልጽ የክህሎት ማዛመጃ።',
      'hero.exploreBtn': 'ገበያውን ያስሱ',
      'hero.hireBtn': 'ስራ ይለጥፉ',
      'hero.signInBtn': 'ይግቡ',
      'hero.createAccBtn': 'አካውንት ይክፈቱ',
      'hero.stat1Val': '3 ዘርፎች',
      'hero.stat1Label': 'መደበኛ ስራ፣ ፍሪላንስ፣ ሙያ አገልግሎቶች',
      'hero.stat2Val': '+24.7%',
      'hero.stat2Label': 'የአርቴፊሻል ኢንተለጀንስ ትክክለኛነት ብልጫ',
      'hero.stat3Val': '100%',
      'hero.stat3Label': 'ግልጽ እና ተዓማኒ የማዛመጃ ትንታኔ',

      // AI Match Preview
      'preview.tag': 'ግልጽ የትርጉም ማዛመጃ ምክረ-ሀሳብ',
      'preview.matchScore': '94% ተዛማጅ',
      'preview.candidateTitle': 'ከፍተኛ የሶፍትዌር መሃንዲስ',
      'preview.candidateBio': '"በSpring Boot ማይክሮሰርቪስ እና በPostgreSQL ዳታቤዝ ለ5 ዓመታት የሰራ።"',
      'preview.factorSkill': 'የክህሎት ተዛምዶ (Java, SQL)',
      'preview.factorAvail': 'የስራ ዝግጁነት (ሙሉ ጊዜ)',
      'preview.factorSem': 'የትርጉም ተዛምዶ ንጽጽር',
      'preview.model': 'Sentence-BERT የብዙ ቋንቋ የትርጉም ማዛመጃ ሞዴል',

      // Ownership
      'own.title': 'የተለያዩ ኃላፊነቶች፣ የተቀናጀ ጥራት',
      'own.subtitle': 'ባለሙያዎችን ለመቅጠርም ሆነ የስራ ጉዞዎን ለማሳደግ፣ ኢትዮብሪጅ ለእርስዎ የተዘጋጁ አስተማማኝ ስርዓቶችን ያቀርባል።',
      'own.seekerBadge': 'ለአሰሪዎች እና ድርጅቶች',
      'own.seekerTitle': 'ባለሙያዎችን ይቅጠሩ እና ስራ ያሰሩ',
      'own.seekerDesc': 'በአዲስ አበባ እና በክልል ከተሞች ሙሉ ጊዜ ሰራተኞችን፣ የፍሪላንስ ባለሙያዎችን ወይም ፈጣን የሙያ አገልግሎቶችን በቀላሉ ይጥሩ።',
      'own.seekerF1': '✓ ለአመልካቾች ወዲያውኑ ግልጽ የ AI የብቃት ደረጃ ማውጫ',
      'own.seekerF2': '✓ የ AI የትርጉም ፍለጋን ከባህላዊ የቁልፍ ቃል ፍለጋ ጋር ያነጻጽሩ',
      'own.seekerF3': '✓ ማመልከቻዎችን ይከታተሉ እና ከተረጋገጡ ባለሙያዎች ጋር ቃለ-መጠይቅ ያድርጉ',
      'own.seekerBtn': 'ለመቅጠር ይመዝገቡ',
      'own.providerBadge': 'ለባለሙያዎች እና ፍሪላንሰሮች',
      'own.providerTitle': 'ሙያዎን ያቅርቡ እና ገቢዎን ያሳድጉ',
      'own.providerDesc': 'የቴክኖሎጂ፣ የቋንቋ ወይም የሙያ ስራ ልምድዎን የሚያሳይ የተረጋገጠ መገለጫ ይፍጠሩ። ከሙያዎ ጋር የሚስማሙ የስራ እድሎችን በቀጥታ ያግኙ።',
      'own.providerF1': '✓ የ AI ተዛምዶ ውጤት ለአሰሪዎች ያለዎትን ብቃት ያሳያል',
      'own.providerF2': '✓ የማመልከቻዎን ሁኔታ ከማስገባት ጀምሮ እስከ መቀበል ይከታተሉ',
      'own.providerF3': '✓ ግልጽ የሆነ የደረጃ እና የአስተያየት አሰጣጥ ስምዎን ይገነባል',
      'own.providerBtn': 'እንደ ባለሙያ ይቀላቀሉ',

      // Pillars
      'pillars.title': 'አንድ የተቀናጀ መድረክ፣ ሶስት የስራ ዘርፎች',
      'pillars.subtitle': 'የኢትዮጵያን የተበታተነ የቴክኖሎጂ እና የአገልግሎት ኢኮኖሚ በአንድ ዘመናዊ የማዛመጃ ቴክኖሎጂ እናገናኛለን።',
      'pillar1.name': 'መደበኛ ቅጥር',
      'pillar1.desc': 'የሙሉ ጊዜ እና የኮንትራት ስራዎች በኢትዮጵያ የቴክኖሎጂ ኩባንያዎች፣ ባንኮች እና ተቋማት ውስጥ። የሶፍትዌር መሃንዲሶችን እና ስራ አስኪያጆችን ያገናኛል።',
      'pillar1.link': 'ስራዎችን ያስሱ →',
      'pillar2.name': 'የፍሪላንስ ፕሮጀክቶች',
      'pillar2.desc': 'በውል እና በደረጃ ክፍያ የሚሰሩ የዲጂታል ስራዎች። የዌብሳይት ልማት፣ የግራፊክስ ዲዛይን፣ የትርጉም እና የማስታወቂያ ስራዎች።',
      'pillar2.link': 'ፕሮጀክቶችን ያስሱ →',
      'pillar3.name': 'የአካባቢ አገልግሎቶች',
      'pillar3.desc': 'የፈጣን የአካባቢ የሙያ አገልግሎቶች። የተመሰከረላቸው የኤሌክትሪክ፣ የቧንቧ፣ የኤሌክትሮኒክስ ጥገና እና የትምህርት አሰልጣኞች።',
      'pillar3.link': 'ባለሙያዎችን ያግኙ →',

      // Trust
      'trust.title': 'ተቋማዊ እምነት እና አስተማማኝ ግብይት',
      'trust.subtitle': 'ለኢትዮጵያ ኢኮኖሚ፣ የባንክ አሰራር እና ህጋዊ ስርዓት ታስቦ በልዩ ሁኔታ የተዘጋጀ።',
      'trust.faydaTitle': 'የብሔራዊ መታወቂያ (ፋይዳ) ማረጋገጫ',
      'trust.faydaDesc': 'የሀሰተኛ አካውንቶችን እና የማጭበርበር ድርጊቶችን ለመከላከል በኢትዮጵያ ብሔራዊ መታወቂያ ፕሮግራም የተረጋገጠ መለያ።',
      'trust.escrowTitle': 'የቴሌብር እና ሲቢኢ ብር የክፍያ ዋስትና',
      'trust.escrowDesc': 'ስራው በአግባቡ ተጠናቆ በአሰሪው እስኪረጋገጥ ድረስ ገንዘብ በደህንነት በዋስትና ሂሳብ ውስጥ ተቆልፎ ይቆያል።',
      'trust.disputeTitle': 'አስገዳጅ የቅሬታ ሽምግልና',
      'trust.disputeDesc': 'ሙሉ የስራ መዝገብ እና ማስረጃዎችን መሰረት ያደረገ ገለልተኛ የመድረክ ሽምግልና እና ፈጣን የክፍያ ውሳኔ።',
      'trust.fairnessTitle': 'የክልሎች ፍትሃዊነት ክትትል (FAT-ML)',
      'trust.fairnessDesc': 'የአካባቢ መድልዎ እንዳይኖር በሁሉም 12 ክልሎች እና የከተማ መስተዳድሮች ላይ የማያቋርጥ የቴክኖሎጂ ፍትሃዊነት ኦዲት።',

      // Recent Listings
      'recent.title': 'በቅርብ የወጡ ክፍት ስራዎች',
      'recent.subtitle': 'በመላው ኢትዮጵያ አዲስ የወጡ የስራ እድሎችን ያስሱ',
      'recent.viewAll': 'ሁሉንም ስራዎች ይመልከቱ',
      'recent.details': 'ዝርዝር',
      'recent.negotiable': 'ተደራዳሪ',

      // Contracts
      'contracts.escrowTitle': 'የክፍያ ዋስትና እና የቴሌብር ክፍያዎች',
      'contracts.fundMilestone': 'ክፍያ ያስይዙ',
      'contracts.releasePayment': 'ክፍያ ይልቀቁ',
      'contracts.raiseDispute': 'ቅሬታ ያቅርቡ',

      // Messages
      'messages.inbox': 'የውይይት መዝገብ',
      'messages.typePlaceholder': 'መልዕክትዎን በአማርኛ ወይም በእንግሊዝኛ ይጻፉ...',
      'messages.send': 'ላክ',

      // Verification
      'verification.modalTitle': 'የብሔራዊ መታወቂያ ማረጋገጫ',
      'verification.submit': 'ለማረጋገጫ አስገባ',
      'verification.faydaId': 'የፋይዳ ብሔራዊ መታወቂያ',
      'verification.kebeleId': 'የቀበሌ መታወቂያ',
      'verification.passport': 'የኢትዮጵያ ፓስፖርት',

      // Footer
      'footer.desc': 'በአርቴፊሻል ኢንተለጀንስ የታገዘ የኢትዮጵያ የተቀናጀ የስራ፣ የፍሪላንስ እና የሀገር ውስጥ አገልግሎቶች መድረክ። ግልጽ የትርጉም ማዛመጃ፣ የብሔራዊ መታወቂያ ታማኝነት እና በቴሌብር የተረጋገጠ የደረጃ ክፍያ ዋስትና።',
      'footer.rights': '© 2026 የኢትዮብሪጅ መድረክ። መብቱ በህግ የተጠበቀ ነው። አዲስ አበባ፣ ኢትዮጵያ።',
      'footer.compliance': 'በSpring Boot 3፣ Angular 18፣ FastAPI እና Keycloak የተገነባ። የኢትዮጵያን የግል መረጃ ጥበቃ ደንብን መሰረት በማድረግ የተዘጋጀ።'
    }
  };

  constructor() {
    if (typeof window !== 'undefined' && window.localStorage) {
      const saved = localStorage.getItem('eb_lang') as Language;
      if (saved === 'am' || saved === 'en') {
        this.currentLang.set(saved);
      }
    }
  }

  setLanguage(lang: Language): void {
    this.currentLang.set(lang);
    if (typeof window !== 'undefined' && window.localStorage) {
      localStorage.setItem('eb_lang', lang);
    }
  }

  toggleLanguage(): void {
    const next = this.currentLang() === 'en' ? 'am' : 'en';
    this.setLanguage(next);
  }

  isAm(): boolean {
    return this.currentLang() === 'am';
  }

  translate(en: string, am: string): string {
    return this.currentLang() === 'am' ? am : en;
  }

  t(key: string, defaultEn?: string): string {
    const lang = this.currentLang();
    if (lang === 'am') {
      return this.translations['am']?.[key] || defaultEn || this.translations['en']?.[key] || key;
    }
    return defaultEn || this.translations['en']?.[key] || key;
  }
}
