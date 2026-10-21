
function updateMarketingText(id, value) {
  const node = document.getElementById(id);
  if (node && typeof value === 'string') {
    node.textContent = value;
  }
}
window.updateMarketingText = updateMarketingText;

/* ==========================================================================
   RAILSAATHI - INTERNATIONALIZATION (i18n) & TRANSLITERATION
   js/core/i18n.js
   ========================================================================== */

let currentMarketingLandingLanguage = 'en';
let marketingLandingRequiresLanguageChoice = false;

    const MARKETING_LANDING_COPY = {
      en: {
        navCopy: 'Duty, attendance and report workflows',
        topbarLogin: 'Login',
        stickyDownload: 'Download APK',
        stickyContinue: 'Login',
        kicker: 'Built around latest public Indian Railways data',
        headlineAccent: '',
        manifesto: 'A smarter way to manage railway field operations—attendance, patrols, TA journals, reports, and everything in between.',
        heroLogin: 'Continue to Login',
        heroDownload: 'Download APK',
        metricRouteValue: '69,439 km',
        metricRouteLabel: 'Total Indian Railways route length as of March 31, 2025.',
        metricFreightValue: '1.67 bn t',
        metricFreightLabel: 'Record freight loading handled in FY 2025-26.',
        mediaEyebrow: 'Chenab Rail Bridge',
        mediaTitle: "The world's highest railway arch bridge opened to rail traffic on June 6, 2025.",
        mediaCopy: 'A landmark on the Udhampur-Srinagar-Baramulla Rail Link in Jammu and Kashmir.',
        marvelLabel: 'Beyond Chenab',
        marvelEyebrow: 'Rotating engineering highlights',
        hudLabel: 'Latest public rail figures',
        hudTitle: '',
        hudCopy: '',
        contextNetworkEyebrow: 'Gauge conversion',
        contextNetworkValue: '67,372 km broad gauge',
        contextNetworkCopy: 'That is 97.02% of the network as of March 31, 2025.',
        contextFreightEyebrow: 'Freight momentum',
        contextFreightValue: '1,670 million tonnes',
        contextFreightCopy: 'Indian Railways reported record freight loading in FY 2025-26.',
        contextCorridorEyebrow: 'Network capacity',
        contextCorridorValue: '1,506 km Western DFC',
        contextCorridorCopy: 'The western dedicated freight corridor reached completion in March 2026.',
        sourcePrefix: 'Sources:',
        downloadRibbon: 'Android release',
        downloadHeading: 'Direct Android download.',
        downloadCopy: 'Use the single APK link for the fastest install path on phone.',
        downloadPrimary: 'Download APK',
        downloadSecondary: 'Go to Login',
        downloadMetaTitle: 'Install path',
        downloadMetaCopy: 'One direct APK link without extra pages or hidden steps.',
        stepsLabel: 'Install steps',
        stepsTitle: 'Short, clear, and phone-ready.',
        step1: 'Tap the APK download button from this page.',
        step2: 'Allow browser-based installation if Android asks for permission.',
        step3: 'Install the app and sign in on your phone.'
      },
      hi: {
        navCopy: 'ड्यूटी, उपस्थिति और रिपोर्ट वर्कफ्लो',
        topbarLogin: 'लॉगिन',
        stickyDownload: 'एपीके डाउनलोड',
        stickyContinue: 'लॉगिन',
        kicker: 'भारतीय रेल के नवीनतम सार्वजनिक आंकड़ों पर आधारित',
        headlineAccent: '',
        manifesto: 'बुद्धिमान उपस्थिति, स्वचालित TA जर्नल, सहज पेट्रोल प्रबंधन और पेपरलेस वर्कफ्लो के साथ रेलवे फील्ड ऑपरेशंस को बदलते हुए ताकि हर कर्मचारी कम लिखे और रेलवे को चलाए रखने में ज्यादा समय दे सके.',
        heroLogin: 'लॉगिन पर जाएं',
        heroDownload: 'एपीके डाउनलोड',
        metricRouteValue: '69,439 किमी',
        metricRouteLabel: '31 मार्च 2025 तक भारतीय रेल की कुल रूट लंबाई.',
        metricFreightValue: '1.67 अरब टन',
        metricFreightLabel: 'वित्त वर्ष 2025-26 में दर्ज रिकॉर्ड माल लदान.',
        mediaEyebrow: 'चिनाब रेल पुल',
        mediaTitle: 'दुनिया का सबसे ऊंचा रेलवे आर्च पुल 6 जून 2025 को रेल यातायात के लिए खुला.',
        mediaCopy: 'जम्मू-कश्मीर में उधमपुर-श्रीनगर-बारामूला रेल लिंक का एक प्रमुख लैंडमार्क.',
        marvelLabel: 'चिनाब के बाद',
        marvelEyebrow: 'घूमते इंजीनियरिंग आकर्षण',
        hudLabel: 'नवीनतम सार्वजनिक रेल आंकड़े',
        hudTitle: 'ताजा आंकड़े इस लैंडिंग पेज को ज्यादा वास्तविक बनाते हैं.',
        hudCopy: 'इस फ्रंट पेज में अब सामान्य कॉपी की जगह हाल के नेटवर्क, माल और कॉरिडोर माइलस्टोन रखे गए हैं.',
        contextNetworkEyebrow: 'गेज परिवर्तन',
        contextNetworkValue: '67,372 किमी ब्रॉड गेज',
        contextNetworkCopy: '31 मार्च 2025 तक यह पूरे नेटवर्क का 97.02% है.',
        contextFreightEyebrow: 'माल गति',
        contextFreightValue: '1,670 मिलियन टन',
        contextFreightCopy: 'भारतीय रेल ने वित्त वर्ष 2025-26 में रिकॉर्ड माल लदान दर्ज किया.',
        contextCorridorEyebrow: 'नेटवर्क क्षमता',
        contextCorridorValue: '1,506 किमी वेस्टर्न DFC',
        contextCorridorCopy: 'वेस्टर्न डेडिकेटेड फ्रेट कॉरिडोर मार्च 2026 में पूरा हुआ.',
        sourcePrefix: 'स्रोत:',
        downloadRibbon: 'एंड्रॉयड रिलीज',
        downloadHeading: 'सीधा एंड्रॉयड डाउनलोड.',
        downloadCopy: 'फोन पर सबसे तेज इंस्टॉल के लिए इसी एक एपीके लिंक का उपयोग करें.',
        downloadPrimary: 'एपीके डाउनलोड',
        downloadSecondary: 'लॉगिन पर जाएं',
        downloadMetaTitle: 'इंस्टॉल पथ',
        downloadMetaCopy: 'एक सीधा एपीके लिंक, बिना अतिरिक्त पेज या छिपे चरणों के.',
        stepsLabel: 'इंस्टॉल चरण',
        stepsTitle: 'छोटा, साफ और फोन के लिए तैयार.',
        step1: 'इस पेज से एपीके डाउनलोड बटन पर टैप करें.',
        step2: 'अगर Android अनुमति मांगे तो ब्राउज़र से इंस्टॉलेशन की अनुमति दें.',
        step3: 'ऐप इंस्टॉल करें और अपने फोन पर साइन इन करें.'
      },
      mr: {
        navCopy: 'ड्यूटी, उपस्थिती आणि रिपोर्ट वर्कफ्लो',
        topbarLogin: 'लॉगिन',
        stickyDownload: 'एपीके डाउनलोड',
        stickyContinue: 'लॉगिन',
        kicker: 'भारतीय रेलच्या ताज्या सार्वजनिक आकडेवारीवर आधारित',
        headlineAccent: '',
        manifesto: 'बुद्धिमान उपस्थिती, स्वयंचलित TA जर्नल, अखंड पेट्रोल व्यवस्थापन आणि पेपरलेस वर्कफ्लो यांच्या मदतीने रेल्वे फील्ड ऑपरेशन्स बदलत आहोत, जेणेकरून प्रत्येक कर्मचारी कमी लिहील आणि रेल्वे चालू ठेवण्यासाठी अधिक वेळ देईल.',
        heroLogin: 'लॉगिनकडे जा',
        heroDownload: 'एपीके डाउनलोड',
        metricRouteValue: '69,439 किमी',
        metricRouteLabel: '31 मार्च 2025 पर्यंत भारतीय रेलची एकूण रूट लांबी.',
        metricFreightValue: '1.67 अब्ज टन',
        metricFreightLabel: 'आर्थिक वर्ष 2025-26 मधील विक्रमी मालवाहतूक लोडिंग.',
        mediaEyebrow: 'चिनाब रेल पूल',
        mediaTitle: 'जगातील सर्वात उंच रेल्वे आर्च पूल 6 जून 2025 रोजी रेल वाहतुकीसाठी खुला झाला.',
        mediaCopy: 'जम्मू-कश्मीरमधील उधमपुर-श्रीनगर-बारामुला रेल लिंकवरील एक प्रमुख लँडमार्क.',
        marvelLabel: 'चिनाबनंतर',
        marvelEyebrow: 'फिरते अभियांत्रिकी आकर्षण',
        hudLabel: 'ताजी सार्वजनिक रेल आकडेवारी',
        hudTitle: 'सध्याचे आकडे हे लँडिंग पेज अधिक खरे वाटू देतात.',
        hudCopy: 'या फ्रंट पेजमध्ये आता सामान्य मजकुराऐवजी अलीकडील नेटवर्क, मालवाहतूक आणि कॉरिडोर मैलाचे दगड आहेत.',
        contextNetworkEyebrow: 'गेज रूपांतरण',
        contextNetworkValue: '67,372 किमी ब्रॉड गेज',
        contextNetworkCopy: '31 मार्च 2025 पर्यंत हे संपूर्ण नेटवर्कच्या 97.02% इतके आहे.',
        contextFreightEyebrow: 'मालवाहतूक वेग',
        contextFreightValue: '1,670 दशलक्ष टन',
        contextFreightCopy: 'भारतीय रेलने आर्थिक वर्ष 2025-26 मध्ये विक्रमी मालवाहतूक नोंदवली.',
        contextCorridorEyebrow: 'नेटवर्क क्षमता',
        contextCorridorValue: '1,506 किमी वेस्टर्न DFC',
        contextCorridorCopy: 'वेस्टर्न डेडिकेटेड फ्रेट कॉरिडोर मार्च 2026 मध्ये पूर्ण झाला.',
        sourcePrefix: 'स्रोत:',
        downloadRibbon: 'अँड्रॉइड रिलीज',
        downloadHeading: 'थेट अँड्रॉइड डाउनलोड.',
        downloadCopy: 'फोनवर सर्वात जलद इंस्टॉलसाठी हाच एक एपीके लिंक वापरा.',
        downloadPrimary: 'एपीके डाउनलोड',
        downloadSecondary: 'लॉगिनकडे जा',
        downloadMetaTitle: 'इंस्टॉल मार्ग',
        downloadMetaCopy: 'एक थेट एपीके लिंक, अतिरिक्त पेज किंवा लपलेले स्टेप्स नाहीत.',
        stepsLabel: 'इंस्टॉल स्टेप्स',
        stepsTitle: 'लहान, स्पष्ट आणि फोनसाठी तयार.',
        step1: 'या पेजवरील एपीके डाउनलोड बटणावर टॅप करा.',
        step2: 'Android परवानगी मागितल्यास ब्राउझरमधून इंस्टॉलेशनला परवानगी द्या.',
        step3: 'अॅप इंस्टॉल करा आणि तुमच्या फोनवर साइन इन करा.'
      }
    };



    function updateMarketingLanguageGuideVisibility() {
      const body = document.body;
      const landing = document.getElementById('railsaathi-landing');
      const guide = document.getElementById('landing-language-guide');
      const shouldShow = Boolean(
        body &&
        landing &&
        !landing.hidden &&
        body.classList.contains('show-marketing-landing') &&
        marketingLandingRequiresLanguageChoice
      );

      body?.classList.toggle('landing-language-prompt-active', shouldShow);

      if (guide) {
        guide.hidden = !shouldShow;
      }
    }


    function applyMarketingLandingLanguage(language, options = {}) {
      const { persist = true } = options;
      const nextLanguage = MARKETING_LANDING_COPY[language] ? language : 'en';
      const copy = MARKETING_LANDING_COPY[nextLanguage];
      const landing = document.getElementById('railsaathi-landing');

      currentMarketingLandingLanguage = nextLanguage;

      if (landing) {
        landing.setAttribute('data-lang', nextLanguage);
      }

      document.documentElement.lang = nextLanguage;

      updateMarketingText('landing-nav-copy', copy.navCopy);
      updateMarketingText('landing-topbar-login', copy.topbarLogin);
      updateMarketingText('landing-manifesto', copy.manifesto);
      updateMarketingText('landing-hero-login', copy.heroLogin);
      updateMarketingText('landing-hero-download', copy.heroDownload);
      updateMarketingText('landing-metric-route-value', copy.metricRouteValue);
      updateMarketingText('landing-metric-route-label', copy.metricRouteLabel);
      updateMarketingText('landing-metric-freight-value', copy.metricFreightValue);
      updateMarketingText('landing-metric-freight-label', copy.metricFreightLabel);
      updateMarketingText('landing-hud-label', copy.hudLabel);
      updateMarketingText('landing-context-network-eyebrow', copy.contextNetworkEyebrow);
      updateMarketingText('landing-context-network-value', copy.contextNetworkValue);
      updateMarketingText('landing-context-network-copy', copy.contextNetworkCopy);
      updateMarketingText('landing-context-freight-eyebrow', copy.contextFreightEyebrow);
      updateMarketingText('landing-context-freight-value', copy.contextFreightValue);
      updateMarketingText('landing-context-freight-copy', copy.contextFreightCopy);
      updateMarketingText('landing-context-corridor-eyebrow', copy.contextCorridorEyebrow);
      updateMarketingText('landing-context-corridor-value', copy.contextCorridorValue);
      updateMarketingText('landing-context-corridor-copy', copy.contextCorridorCopy);
      updateMarketingText('landing-source-prefix', copy.sourcePrefix);
      updateMarketingText('landing-download-ribbon-text', copy.downloadRibbon);
      updateMarketingText('landing-download-heading', copy.downloadHeading);
      updateMarketingText('landing-download-copy', copy.downloadCopy);
      updateMarketingText('landing-download-primary', copy.downloadPrimary);
      updateMarketingText('landing-download-secondary', copy.downloadSecondary);
      updateMarketingText('landing-download-meta-title', copy.downloadMetaTitle);
      updateMarketingText('landing-download-meta-copy', copy.downloadMetaCopy);
      updateMarketingText('landing-steps-label', copy.stepsLabel);
      updateMarketingText('landing-steps-title', copy.stepsTitle);
      updateMarketingText('landing-step-1', copy.step1);
      updateMarketingText('landing-step-2', copy.step2);
      updateMarketingText('landing-step-3', copy.step3);

      document.querySelectorAll('[data-lang-option]').forEach((button) => {
        const isActive = button.dataset.langOption === nextLanguage;
        button.classList.toggle('is-active', isActive);
        button.setAttribute('aria-pressed', isActive ? 'true' : 'false');
      });

      if (persist) {
        marketingLandingRequiresLanguageChoice = false;
        try {
          localStorage.setItem('railsaathiLandingLang', nextLanguage);
        } catch (error) {
          console.warn('Unable to persist landing language:', error);
        }
      }

      updateMarketingLanguageGuideVisibility();
      if (typeof primeMarketingLandingCounts === 'function') {
        primeMarketingLandingCounts(landing || document);
      } else if (typeof window.primeMarketingLandingCounts === 'function') {
        window.primeMarketingLandingCounts(landing || document);
      }

      if (typeof renderMarketingMarvel === 'function') {
        renderMarketingMarvel(window.currentMarketingMarvelIndex || 0);
      } else if (typeof window.renderMarketingMarvel === 'function') {
        window.renderMarketingMarvel(window.currentMarketingMarvelIndex || 0);
      }

      if (typeof startMarketingMarvelCycle === 'function') {
        startMarketingMarvelCycle();
      } else if (typeof window.startMarketingMarvelCycle === 'function') {
        window.startMarketingMarvelCycle();
      }

      if (typeof startMarketingHeadlineTyping === 'function') {
        startMarketingHeadlineTyping();
      } else if (typeof window.startMarketingHeadlineTyping === 'function') {
        window.startMarketingHeadlineTyping();
      }

      if (document.body && document.body.classList.contains('show-marketing-landing')) {
        if (typeof window.requestAnimationFrame === 'function') {
          window.requestAnimationFrame(() => {
            if (typeof window.queueMarketingLandingCounts === 'function') {
              window.queueMarketingLandingCounts(landing || document, { force: true });
            } else if (typeof queueMarketingLandingCounts === 'function') {
              queueMarketingLandingCounts(landing || document, { force: true });
            }
          });
        }
      }
    }


    async function transliterateToHindi(text) {
      if (!text || text.trim() === '' || !/^[a-zA-Z\s]+$/.test(text)) return text;
      try {
        const response = await fetch(`https://inputtools.google.com/request?text=${encodeURIComponent(text.trim())}&itc=hi-t-i0-und&num=1&cp=0&cs=1&ie=utf-8&oe=utf-8`);
        const data = await response.json();
        if (data[0] === 'SUCCESS' && data[1][0] && data[1][0][1]) return data[1][0][1][0];
      } catch (err) { console.error("Bulk trans error:", err); }
      return text;
    }
