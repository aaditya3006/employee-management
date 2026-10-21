/* ==========================================================================
   RAILSAATHI - MARKETING LANDING PAGE LOGIC
   js/sections/landing.js
   ========================================================================== */

(function () {
  'use strict';

  let marketingLandingInitialized = false;
  let marketingLandingObserver = null;
  let marketingLandingCountObserver = null;
  let marketingLandingCycleTimer = null;
  let marketingMarvelTimer = null;
  let marketingHeadlineTypingTimer = null;
  let marketingManifestoTypingTimer = null;
  let marketingHeadlineTypingToken = 0;
  let currentMarketingMarvelIndex = 0;
  let lastLandingScrollTop = 0;
  let lastLandingScrollDirection = '';
  let marketingThemeToggleBusy = false;

            const MARKETING_MARVELS = {
      en: [
        {
          category: 'ENGINEERING MARVEL',
          title: 'Chenab Rail Bridge',
          copy: "The world's highest railway arch bridge opened to rail traffic on June 6, 2025.",
          detail: 'A landmark on the Udhampur-Srinagar-Baramulla Rail Link in Jammu and Kashmir.',
          metric: '359 m above river bed',
          image: 'https://img.jagranjosh.com/images/2026/08/25/template/image/Orange-Snake-of-India-vande-bharat-express-1787632373842.webp',
          alt: 'Orange Vande Bharat Express'
        },
        {
          category: 'ROLLING STOCK',
          title: 'Vande Bharat Express',
          copy: 'Indigenous semi-high-speed trainset transforming passenger transit across 100% electrified Indian Railways.',
          detail: 'Engineered with aerodynamic styling, regenerative braking, and intelligent safety systems.',
          metric: '160 km/h operational speed',
          image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c8/Vande_Bharat_Express_at_New_Delhi_station.jpg/1280px-Vande_Bharat_Express_at_New_Delhi_station.jpg',
          alt: 'Vande Bharat Express at New Delhi station'
        },
        {
          category: 'BRIDGE ENGINEERING',
          title: 'Anji Khad Bridge',
          copy: "Indian Railways' first cable-stayed railway bridge connecting Katra and Reasi.",
          detail: 'Supported by a single asymmetric pylon towering 331 meters above the deep gorge.',
          metric: '473 m total length',
          image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a2/Anji_Khad_Bridge_May_2023.jpg/1280px-Anji_Khad_Bridge_May_2023.jpg',
          alt: 'Anji Khad Bridge in Jammu and Kashmir'
        },
        {
          category: 'SEA LINK',
          title: 'New Pamban Sea Bridge',
          copy: "India's first vertical lift sea railway bridge spanning the Palk Strait between Mandapam and Rameswaram.",
          detail: 'Enables maritime vessels to navigate freely while maintaining regular train traffic.',
          metric: '2,070 m sea span',
          image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/d4/Pamban_Bridge_Rameswaram_Tamil_Nadu.jpg/1280px-Pamban_Bridge_Rameswaram_Tamil_Nadu.jpg',
          alt: 'New Pamban Sea Bridge in Tamil Nadu'
        },
        {
          category: 'FREIGHT CORRIDOR',
          title: 'Western Dedicated Freight Corridor',
          copy: 'Heavy-haul 12,000 HP electric locomotives carrying double-stack container rakes.',
          detail: 'High-speed dedicated logistics spine boosting national freight transit capacity.',
          metric: '1,506 km corridor',
          image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/6f/WAG-12_locomotives_hauling_a_freight_train.jpg/1280px-WAG-12_locomotives_hauling_a_freight_train.jpg',
          alt: 'WAG-12 locomotives hauling freight on DFC'
        },
        {
          category: 'INFRASTRUCTURE',
          title: 'Bogibeel Rail-Road Bridge',
          copy: "India's longest combined rail-cum-road bridge over the Brahmaputra River in Assam.",
          detail: 'Provides crucial year-round connectivity and strategic logistics across Northeast India.',
          metric: '4.94 km rail-road span',
          image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/15/Bogibeel_Bridge_Assam.jpg/1280px-Bogibeel_Bridge_Assam.jpg',
          alt: 'Bogibeel Bridge in Assam'
        }
      ],
      hi: [
        {
          category: 'अभियांत्रिकी चमत्कार',
          title: 'चिनाब रेल पुल',
          copy: 'दुनिया का सबसे ऊंचा रेलवे आर्च पुल 6 जून 2025 को रेल यातायात के लिए खोला गया.',
          detail: 'जम्मू और कश्मीर में उधमपुर-श्रीनगर-बारामूला रेल लिंक का प्रमुख मील का पत्थर.',
          metric: 'नदी तल से 359 मीटर ऊंचा',
          image: 'https://images.financialexpressdigital.com/2025/06/Chenab-Bridge-2.jpg?w=1600',
          alt: 'जम्मू और कश्मीर में चिनाब रेल पुल'
        },
        {
          category: 'रोलिंग स्टॉक',
          title: 'वंदे भारत एक्सप्रेस',
          copy: 'स्वदेशी सेमी-हाई स्पीड ट्रेन जो पूरे भारतीय रेलवे नेटवर्क में यात्री अनुभव को बदल रही है.',
          detail: 'कवच संरक्षा प्रणाली और उच्च गति क्षमता से लैस आधुनिक ट्रेनसेट.',
          metric: '160 किमी/घंटा गति',
          image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c8/Vande_Bharat_Express_at_New_Delhi_station.jpg/1280px-Vande_Bharat_Express_at_New_Delhi_station.jpg',
          alt: 'नई दिल्ली में वंदे भारत एक्सप्रेस'
        },
        {
          category: 'केबल-स्टेड पुल',
          title: 'अंजी खड्ड पुल',
          copy: 'भारतीय रेल का पहला केबल-स्टेड रेल पुल जो कटरा और रियासी को जोड़ता है.',
          detail: 'गहरी घाटी के ऊपर 331 मीटर ऊंचे एकल तोरण द्वारा समर्थित.',
          metric: '473 मीटर कुल लंबाई',
          image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a2/Anji_Khad_Bridge_May_2023.jpg/1280px-Anji_Khad_Bridge_May_2023.jpg',
          alt: 'जम्मू और कश्मीर में अंजी खड्ड पुल'
        },
        {
          category: 'समुद्री रेल लिंक',
          title: 'नया पंबन समुद्री पुल',
          copy: 'भारत का पहला वर्टिकल-लिफ्ट समुद्री रेलवे पुल जो मंडपम और रामेश्वरम को जोड़ता है.',
          detail: 'जहाजों की आसान आवाजाही के लिए आधुनिक लिफ्ट स्पैन से सुसज्जित.',
          metric: '2,070 मीटर समुद्री स्पैन',
          image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/d4/Pamban_Bridge_Rameswaram_Tamil_Nadu.jpg/1280px-Pamban_Bridge_Rameswaram_Tamil_Nadu.jpg',
          alt: 'तमिलनाडु में नया पंबन समुद्री पुल'
        },
        {
          category: 'डेडिकेटेड फ्रेट कॉरिडोर',
          title: 'पश्चिमी फ्रेट कॉरिडोर',
          copy: '12,000 हॉर्सपावर WAG-12 लोकोमोटिव के साथ भारी-भरकम डबल स्टैक मालगाड़ियां.',
          detail: 'राष्ट्रव्यापी लॉजिस्टिक्स और माल ढुलाई की रीढ़.',
          metric: '1,506 किमी कॉरिडोर',
          image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/6f/WAG-12_locomotives_hauling_a_freight_train.jpg/1280px-WAG-12_locomotives_hauling_a_freight_train.jpg',
          alt: 'पश्चिमी फ्रेट कॉरिडोर पर मालगाड़ी'
        },
        {
          category: 'रेल-सह-सड़क पुल',
          title: 'बोगीबील पुल',
          copy: 'असम में ब्रह्मपुत्र नदी पर भारत का सबसे लंबा संयुक्त रेल-सह-सड़क पुल.',
          detail: 'पूर्वोत्तर भारत के लिए वर्षभर सुगम रणनीतिक संपर्क प्रदान करता है.',
          metric: '4.94 किमी रेल-रोड स्पैन',
          image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/15/Bogibeel_Bridge_Assam.jpg/1280px-Bogibeel_Bridge_Assam.jpg',
          alt: 'असम में बोगीबील पुल'
        }
      ],
      mr: [
        {
          category: 'अभियांत्रिकी चमत्कार',
          title: 'चिनाब रेल्वे पूल',
          copy: 'जगातील सर्वात उंच रेल्वे आर्च पूल 6 जून 2025 रोजी रेल्वे वाहतुकीसाठी खुला झाला.',
          detail: 'जम्मू आणि काश्मीरमधील उधमपूर-श्रीनगर-बारामुल्ला रेल्वे मार्गावरील ऐतिहासिक मैलाचा दगड.',
          metric: 'नदीच्या पात्रापासून 359 मीटर उंच',
          image: 'https://images.financialexpressdigital.com/2025/06/Chenab-Bridge-2.jpg?w=1600',
          alt: 'जम्मू-काश्मीरमधील चिनाब रेल्वे पूल'
        },
        {
          category: 'रोलिंग स्टॉक',
          title: 'वंदे भारत एक्सप्रेस',
          copy: 'भारतीय रेल्वेचे रूप पालटणारी स्वदेशी सेमी-हाय स्पीड आधुनिक रेल्वेगाडी.',
          detail: 'कवच सुरक्षा प्रणाली आणि अत्याधुनिक प्रवासी सुविधांनी सुसज्ज.',
          metric: '160 किमी/तास वेग',
          image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c8/Vande_Bharat_Express_at_New_Delhi_station.jpg/1280px-Vande_Bharat_Express_at_New_Delhi_station.jpg',
          alt: 'नवी दिल्ली येथील वंदे भारत एक्सप्रेस'
        },
        {
          category: 'केबल-स्टेड पूल',
          title: 'अंजी खड पूल',
          copy: 'भारतीय रेल्वेचा पहिला केबल-स्टेड पूल जो कटरा आणि रियासीला जोडतो.',
          detail: 'खोल दरीवर 331 मीटर उंच पेलणाऱ्या एकाच पिलॉनवर आधारलेला.',
          metric: '473 मीटर एकूण लांबी',
          image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a2/Anji_Khad_Bridge_May_2023.jpg/1280px-Anji_Khad_Bridge_May_2023.jpg',
          alt: 'जम्मू-काश्मीरमधील अंजी खड पूल'
        },
        {
          category: 'समुद्री रेल्वे मार्ग',
          title: 'नवा पंबन पूल',
          copy: 'भारताचा पहिला व्हर्टिकल-लिफ्ट समुद्री रेल्वे पूल जो मंडपम आणि रामेश्वरमला जोडतो.',
          detail: 'जहाजांच्या सुलभ वाहतुकीसाठी आधुनिक लिफ्ट स्पॅनची सोय.',
          metric: '2,070 मीटर समुद्री पूल',
          image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/d4/Pamban_Bridge_Rameswaram_Tamil_Nadu.jpg/1280px-Pamban_Bridge_Rameswaram_Tamil_Nadu.jpg',
          alt: 'रामेश्वरमजवळील नवा पंबन पूल'
        },
        {
          category: 'डेडिकेटेड फ्रेट कॉरिडॉर',
          title: 'पश्चिम फ्रेट कॉरिडॉर',
          copy: '12,000 अश्वशक्तीच्या इंजिनांसह धावणाऱ्या हाय-स्पीड मालगाड्या.',
          detail: 'देशांतर्गत मालवाहतुकीला मोठी गती देणारा स्वतंत्र कॉरिडॉर.',
          metric: '1,506 किमी कॉरिडॉर',
          image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/6f/WAG-12_locomotives_hauling_a_freight_train.jpg/1280px-WAG-12_locomotives_hauling_a_freight_train.jpg',
          alt: 'पश्चिम फ्रेट कॉरिडॉरवरील मालगाडी'
        },
        {
          category: 'रेल-सह-रस्ता पूल',
          title: 'बोगीबील पूल',
          copy: 'आसाममध्ये ब्रह्मपुत्रा नदीवरील भारताचा सर्वात लांब संयुक्त रेल-सह-रस्ता पूल.',
          detail: 'ईशान्य भारतासाठी बारामाही अखंड दळणवळणाची सुविधा निर्माण करतो.',
          metric: '4.94 किमी रेल-रोड',
          image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/15/Bogibeel_Bridge_Assam.jpg/1280px-Bogibeel_Bridge_Assam.jpg',
          alt: 'आसाममधील बोगीबील पूल'
        }
      ]
    };

    function getMarketingLandingElements() {
      return {
        body: document.body,
        landing: document.getElementById('railsaathi-landing'),
        loginScreen: document.getElementById('login-screen'),
        mainApp: document.getElementById('main-wrapper')
      };
    }

    window.updateMarketingText = updateMarketingText;
    function updateMarketingText(id, value) {
      const node = document.getElementById(id);
      if (node && typeof value === 'string') {
        node.textContent = value;
      }
    }

    function parseMarketingLandingCount(text) {
      const value = typeof text === 'string' ? text.trim() : '';
      const match = value.match(/^(.*?)(\d[\d,]*(?:\.\d+)?)(.*)$/u);
      if (!match) return null;

      const numericValue = Number(match[2].replace(/,/g, ''));
      if (!Number.isFinite(numericValue)) return null;

      return {
        prefix: match[1],
        value: numericValue,
        decimals: match[2].includes('.') ? match[2].split('.')[1].length : 0,
        suffix: match[3]
      };
    }

    function formatMarketingLandingCount(value, decimals) {
      return value.toLocaleString('en-IN', {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals
      });
    }

    window.primeMarketingLandingCounts = primeMarketingLandingCounts;
    function primeMarketingLandingCounts(root = document) {
      const scope = root && typeof root.querySelectorAll === 'function' ? root : document;
      const countNodes = Array.from(scope.querySelectorAll('[data-count-up]'));

      countNodes.forEach((node) => {
        if (node._landingCountAnimationFrame) {
          cancelAnimationFrame(node._landingCountAnimationFrame);
          node._landingCountAnimationFrame = null;
        }

        const targetText = node.textContent.trim();
        if (!targetText) return;

        node.dataset.countValue = targetText;
        node.dataset.countTarget = targetText;
        node.dataset.countAnimated = 'false';
      });
    }

    function animateMarketingLandingCount(node, options = {}) {
      if (!node) return;

      const targetText = node.dataset.countTarget || node.textContent.trim();
      const parsed = parseMarketingLandingCount(targetText);
      if (!parsed) return;

      const { duration = 1200, force = false } = options;
      if (!force && node.dataset.countAnimated === 'true') return;

      node.dataset.countAnimated = 'true';
      if (node._landingCountAnimationFrame) {
        cancelAnimationFrame(node._landingCountAnimationFrame);
        node._landingCountAnimationFrame = null;
      }

      const startTime = performance.now();
      const { prefix, value: targetValue, decimals, suffix } = parsed;

      const tick = (now) => {
        const elapsed = now - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const easeProgress = 1 - Math.pow(1 - progress, 3);
        const currentValue = targetValue * easeProgress;

        node.textContent = `${prefix}${formatMarketingLandingCount(currentValue, decimals)}${suffix}`;

        if (progress < 1) {
          node._landingCountAnimationFrame = requestAnimationFrame(tick);
        } else {
          node._landingCountAnimationFrame = null;
          node.textContent = targetText;
        }
      };

      node._landingCountAnimationFrame = requestAnimationFrame(tick);
    }

    function queueMarketingLandingCounts(root = document, options = {}) {
      const scope = root && typeof root.querySelectorAll === 'function' ? root : document;
      const countNodes = Array.from(scope.querySelectorAll('[data-count-up]'));
      countNodes.forEach((node) => animateMarketingLandingCount(node, options));
    }

    function startMarketingManifestoTyping() {
      const manifesto = document.getElementById('landing-manifesto');
      if (!manifesto) return;

      clearTimeout(marketingManifestoTypingTimer);
      const manifestoText = manifesto.textContent.trim();
      manifesto.setAttribute('aria-label', manifestoText);
      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        manifesto.textContent = manifestoText;
        manifesto.classList.remove('is-typing');
        return;
      }

      let characterIndex = 0;
      manifesto.textContent = '';
      manifesto.classList.add('is-typing');

      const typeNextCharacter = () => {
        characterIndex += 1;
        manifesto.textContent = manifestoText.slice(0, characterIndex);
        if (characterIndex < manifestoText.length) {
          marketingManifestoTypingTimer = setTimeout(typeNextCharacter, 36);
        } else {
          manifesto.classList.remove('is-typing');
        }
      };

      marketingManifestoTypingTimer = setTimeout(typeNextCharacter, 180);
    }

    window.startMarketingManifestoTyping = startMarketingManifestoTyping;

    function startMarketingHeadlineTyping() {
      const node = document.querySelector('[data-typing-brand]');
      if (!node) return;

      clearTimeout(marketingHeadlineTypingTimer);
      const targetText = 'Railsaathi';
      node.innerHTML = Array.from(targetText).map((letter, index) => (
        `<span data-typing-letter style="animation-delay:${index * 0.08}s">${letter}</span>`
      )).join('');
      node.dataset.originalText = targetText;
    }



    function renderMarketingMarvel(index = currentMarketingMarvelIndex, restartCycle = false) {
      const marvels = MARKETING_MARVELS[currentMarketingLandingLanguage] || MARKETING_MARVELS.en;
      if (!marvels.length) return;

      currentMarketingMarvelIndex = ((index % marvels.length) + marvels.length) % marvels.length;
      const marvel = marvels[currentMarketingMarvelIndex];

      updateMarketingText('landing-marvel-category', marvel.category || 'RAILWAY HIGHLIGHT');
      updateMarketingText('landing-marvel-title', marvel.title);
      updateMarketingText('landing-marvel-copy', marvel.copy);
      updateMarketingText('landing-marvel-detail', marvel.detail);
      updateMarketingText('landing-marvel-metric', marvel.metric);

      const gallery = document.getElementById('landing-marvel-gallery');
      const image = document.getElementById('landing-marvel-image');
      if (image) {
        image.src = 'images/train0.png';
        image.alt = 'Indian railway train';
      }

      if (gallery) {
        gallery.classList.remove('is-animating');
        void gallery.offsetWidth;
        gallery.classList.add('is-animating');
      }

      document.querySelectorAll('[data-marvel-index]').forEach((dot, dotIndex) => {
        const isActive = dotIndex === currentMarketingMarvelIndex;
        dot.classList.toggle('is-active', isActive);
        dot.setAttribute('aria-pressed', isActive ? 'true' : 'false');
      });

      if (restartCycle) {
        startMarketingMarvelCycle();
      }
    }

    function startMarketingMarvelCycle() {
      clearInterval(marketingMarvelTimer);

      // Keep the requested hero image in place until the visitor chooses another highlight.
      if (document.getElementById('landing-marvel-image')) return;

      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        return;
      }

      const marvels = MARKETING_MARVELS[currentMarketingLandingLanguage] || MARKETING_MARVELS.en;
      if (marvels.length < 2) return;

      marketingMarvelTimer = setInterval(() => {
        if (!document.body.classList.contains('show-marketing-landing')) return;
        renderMarketingMarvel(currentMarketingMarvelIndex + 1);
      }, 4000);
    }




    function setMarketingHash(hash, method = 'replace') {
      try {
        const url = new URL(window.location.href);
        url.hash = hash ? hash.replace(/^#/, '') : '';
        const targetUrl = `${url.pathname}${url.search}${url.hash}`;
        if (method === 'push') {
          history.pushState({}, '', targetUrl);
        } else {
          history.replaceState({}, '', targetUrl);
        }
      } catch (error) {
        console.warn('Unable to update pre-auth hash:', error);
      }
    }

    function scrollPreAuthTop() {
      window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
    }

    function updateLandingProgress() {
      const { body, landing } = getMarketingLandingElements();
      if (!body || !landing || landing.hidden || !body.classList.contains('show-marketing-landing')) {
        document.documentElement.style.setProperty('--landing-progress', '0');
        return;
      }

      const maxScroll = Math.max(landing.scrollHeight - window.innerHeight, 1);
      const currentScroll = Math.max(window.scrollY || window.pageYOffset || 0, 0);
      const progress = Math.min(100, (currentScroll / maxScroll) * 100);
      document.documentElement.style.setProperty('--landing-progress', progress.toFixed(2));

      const hero = landing.querySelector('.landing-hero');
      if (hero) {
        const heroTop = hero.getBoundingClientRect().top;
        const parallaxOffset = Math.max(-24, Math.min(24, -heroTop * 0.08));
        hero.style.setProperty('--landing-train-parallax', `${parallaxOffset.toFixed(1)}px`);
      }

      if (Math.abs(currentScroll - lastLandingScrollTop) > 2) {
        const direction = currentScroll > lastLandingScrollTop ? 'down' : 'up';
        if (direction !== lastLandingScrollDirection) {
          const hero = document.querySelector('#railsaathi-landing .landing-hero');
          if (hero) {
            hero.classList.toggle('landing-hero--scroll-up', direction === 'up');
            hero.classList.toggle('landing-hero--scroll-down', direction === 'down');
          }
          lastLandingScrollDirection = direction;
        }
        lastLandingScrollTop = currentScroll;
      }
    }

    function hideMarketingLanding() {
      const { body, landing } = getMarketingLandingElements();
      if (!body || !landing) return;

      body.classList.remove('show-marketing-landing');
      body.classList.remove('landing-login-open');
      body.classList.remove('landing-language-prompt-active');
      landing.hidden = true;
      landing.setAttribute('aria-hidden', 'true');
      document.documentElement.style.setProperty('--landing-progress', '0');
    }

    function showMarketingLanding() {
      const { body, landing, loginScreen, mainApp } = getMarketingLandingElements();
      if (!body || !landing) return;

      body.classList.add('show-marketing-landing');
      landing.hidden = false;
      landing.setAttribute('aria-hidden', 'false');

      if (loginScreen) {
        loginScreen.style.display = 'flex';
        loginScreen.style.opacity = '1';
        loginScreen.style.pointerEvents = '';
      }

      if (mainApp) {
        mainApp.style.display = 'none';
      }

      window.requestAnimationFrame(() => {
        updateLandingProgress();
        queueMarketingLandingCounts(landing, { force: true });
        updateMarketingLanguageGuideVisibility();
      });
    }

    function navigatePreAuthSurface(mode, options = {}) {
      const { updateUrl = true, focusLogin = false, historyMode = 'replace' } = options;
      const { loginScreen, mainApp } = getMarketingLandingElements();

      if (mode === 'login') {
        const desktopOverlay = window.matchMedia('(min-width: 768px)').matches;
        if (desktopOverlay) {
          document.body.classList.add('landing-login-open');
          const landing = document.getElementById('railsaathi-landing');
          if (landing) {
            landing.hidden = false;
            landing.style.display = '';
          }
        } else {
          hideMarketingLanding();
        }

        if (loginScreen) {
          loginScreen.style.display = 'flex';
          loginScreen.style.opacity = '1';
          loginScreen.style.pointerEvents = '';
        }

        if (mainApp) {
          mainApp.style.display = 'none';
        }

        if (updateUrl) {
          setMarketingHash('login', historyMode);
        }

        scrollPreAuthTop();

        if (focusLogin) {
          setTimeout(() => {
            document.getElementById('login-email')?.focus();
          }, 120);
        }

        return 'login';
      }

      showMarketingLanding();
      document.body.classList.remove('landing-login-open');

      if (updateUrl) {
        setMarketingHash('', historyMode);
      }

      scrollPreAuthTop();
      return 'landing';
    }

    function closeLandingLoginOnScroll() {
      if (
        window.currentUserAuth ||
        !document.body.classList.contains('show-marketing-landing') ||
        !window.matchMedia('(min-width: 768px)').matches ||
        !document.body.classList.contains('landing-login-open')
      ) {
        return;
      }

      navigatePreAuthSurface('landing', { updateUrl: true, historyMode: 'replace' });
    }

    function resolvePreAuthExperience(forceMode) {
      if (window.currentUserAuth) {
        hideMarketingLanding();
        return 'app';
      }

      const hash = (window.location.hash || '').toLowerCase();
      if (forceMode === 'login' || hash === '#login') {
        return navigatePreAuthSurface('login', {
          updateUrl: forceMode === 'login',
          focusLogin: forceMode === 'login'
        });
      }

      showMarketingLanding();
      document.body.classList.remove('landing-login-open');
      return 'landing';
    }

    function setActiveLandingPhoneScreen(screenId) {
      const tabs = document.querySelectorAll('[data-phone-tab]');
      const screens = document.querySelectorAll('[data-phone-screen]');

      tabs.forEach((tab) => {
        tab.classList.toggle('is-active', tab.dataset.phoneTab === screenId);
      });

      screens.forEach((screen) => {
        screen.classList.toggle('is-active', screen.dataset.phoneScreen === screenId);
      });
    }

    function startLandingPhoneCycle() {
      clearInterval(marketingLandingCycleTimer);

      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        return;
      }

      const tabs = Array.from(document.querySelectorAll('[data-phone-tab]'));
      if (tabs.length < 2) return;

      let currentIndex = Math.max(tabs.findIndex((tab) => tab.classList.contains('is-active')), 0);
      marketingLandingCycleTimer = setInterval(() => {
        if (!document.body.classList.contains('show-marketing-landing')) return;
        currentIndex = (currentIndex + 1) % tabs.length;
        setActiveLandingPhoneScreen(tabs[currentIndex].dataset.phoneTab);
      }, 3200);
    }

    function initLandingReveals() {
      const landing = document.getElementById('railsaathi-landing');
      const revealItems = Array.from(landing?.querySelectorAll('.landing-reveal') || []);
      const textRevealItems = Array.from(landing?.querySelectorAll('.landing-manifesto, .landing-section-title') || []);
      if (!landing || !revealItems.length) return;

      const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      if (prefersReducedMotion || !('IntersectionObserver' in window)) {
        revealItems.forEach((item) => item.classList.add('is-visible'));
        textRevealItems.forEach((item) => item.classList.add('is-visible'));
        return;
      }

      landing.classList.add('landing-reveals-enabled');
      if (textRevealItems.length) {
        landing.classList.add('landing-text-reveals-enabled');
        textRevealItems.forEach((item) => item.classList.add('landing-text-mask'));
      }

      const hero = landing.querySelector('.landing-hero');
      if (hero) {
        landing.classList.add('landing-train-reveal-enabled');
        const trainImageObserver = new IntersectionObserver((entries, observer) => {
          entries.forEach((entry) => {
            if (!entry.isIntersecting) return;
            entry.target.classList.add('landing-train-image-visible');
            observer.unobserve(entry.target);
          });
        }, { threshold: 0.12 });
        trainImageObserver.observe(hero);
      }

      const revealObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        });
      }, {
        threshold: 0.12,
        rootMargin: '0px 0px -32px 0px'
      });

      revealItems.forEach((item) => {
        if (!item.classList.contains('is-visible')) revealObserver.observe(item);
      });
      textRevealItems.forEach((item) => {
        if (!item.classList.contains('is-visible')) revealObserver.observe(item);
      });
    }

    function handlePreAuthNavigationChange() {
      if (window.currentUserAuth) return;
      const hash = (window.location.hash || '').toLowerCase();
      if (hash === '#login' || hash === '') {
        resolvePreAuthExperience();
      }
    }

    function initMarketingLanding() {
      if (marketingLandingInitialized) {
        updateLandingProgress();
        updateMarketingLanguageGuideVisibility();
        return;
      }

      marketingLandingInitialized = true;
      initLandingReveals();

      const tabs = Array.from(document.querySelectorAll('[data-phone-tab]'));
      tabs.forEach((tab) => {
        tab.addEventListener('click', () => {
          setActiveLandingPhoneScreen(tab.dataset.phoneTab);
          startLandingPhoneCycle();
        });
      });

      if (tabs[0]) {
        setActiveLandingPhoneScreen(tabs[0].dataset.phoneTab);
      }

      document.querySelectorAll('[data-theme-toggle]').forEach((button) => {
        button.addEventListener('click', () => {
          if (marketingThemeToggleBusy) return;

          const nextTheme = currentMarketingLandingTheme === 'dark' ? 'light' : 'dark';
          const landing = document.getElementById('railsaathi-landing');
          if (!landing) return;

          marketingThemeToggleBusy = true;
          const transition = document.createElement('div');
          transition.id = 'railsaathi-landing-theme-transition';

          const toggleBounds = button.getBoundingClientRect();
          const originX = toggleBounds.left + toggleBounds.width / 2;
          const originY = toggleBounds.top + toggleBounds.height / 2;
          const farthestX = Math.max(originX, window.innerWidth - originX);
          const farthestY = Math.max(originY, window.innerHeight - originY);
          transition.style.setProperty('--theme-origin-x', `${originX}px`);
          transition.style.setProperty('--theme-origin-y', `${originY}px`);
          transition.style.setProperty('--theme-reveal-radius', `${Math.ceil(Math.hypot(farthestX, farthestY))}px`);

          const preview = landing.cloneNode(true);
          preview.setAttribute('data-theme', currentMarketingLandingTheme);
          preview.setAttribute('aria-hidden', 'false');
          preview.hidden = false;
          const previewScrollTop = window.scrollY || window.pageYOffset || 0;

          transition.appendChild(preview);
          document.body.appendChild(transition);
          requestAnimationFrame(() => {
            const maxPreviewScrollTop = Math.max(preview.scrollHeight - preview.clientHeight, 0);
            preview.scrollTop = Math.min(previewScrollTop, maxPreviewScrollTop);
            transition.classList.add('is-animating');
          });

          window.setTimeout(() => {
            preview.setAttribute('data-theme', nextTheme);
            preview.querySelectorAll('[data-theme-toggle]').forEach((previewButton) => {
              previewButton.setAttribute('aria-pressed', nextTheme === 'dark' ? 'true' : 'false');
              previewButton.setAttribute('aria-label', nextTheme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme');
              const icon = previewButton.querySelector('[data-theme-icon]');
              if (icon) {
                icon.innerHTML = nextTheme === 'dark'
                  ? '<circle cx="12" cy="12" r="4"></circle><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41"></path>'
                  : '<path d="M20.5 15.2A8.5 8.5 0 0 1 8.8 3.5 8.5 8.5 0 1 0 20.5 15.2Z"></path>';
              }
            });
          }, 240);

          window.setTimeout(() => {
            applyMarketingLandingTheme(nextTheme);
            transition.remove();
            marketingThemeToggleBusy = false;
          }, 620);
        });
      });

      document.querySelectorAll('[data-lang-option]').forEach((button) => {
        button.addEventListener('click', () => {
          applyMarketingLandingLanguage(button.dataset.langOption || 'en', { persist: true });
        });
      });

      document.querySelectorAll('[data-marvel-index]').forEach((dot) => {
        dot.addEventListener('click', () => {
          const requestedIndex = Number(dot.dataset.marvelIndex || 0);
          renderMarketingMarvel(requestedIndex, true);
        });
      });

      let savedLandingLanguage = 'en';
      let hasSavedLandingLanguage = false;
      try {
        const storedLandingLanguage = localStorage.getItem('railsaathiLandingLang');
        if (storedLandingLanguage && MARKETING_LANDING_COPY[storedLandingLanguage]) {
          savedLandingLanguage = storedLandingLanguage;
          hasSavedLandingLanguage = true;
        }
      } catch (error) {
        console.warn('Unable to read saved landing language:', error);
      }

      let savedLandingTheme = 'dark';
      try {
        const storedLandingTheme = localStorage.getItem('railsaathiLandingTheme');
        if (storedLandingTheme === 'dark' || storedLandingTheme === 'light') {
          savedLandingTheme = storedLandingTheme;
        }
      } catch (error) {
        console.warn('Unable to read saved landing theme:', error);
      }

      marketingLandingRequiresLanguageChoice = !hasSavedLandingLanguage;
      applyMarketingLandingTheme(savedLandingTheme);
      applyMarketingLandingLanguage(savedLandingLanguage, { persist: hasSavedLandingLanguage });
      startMarketingHeadlineTyping();
      startLandingPhoneCycle();

      window.addEventListener('scroll', updateLandingProgress, { passive: true });
      window.addEventListener('scroll', () => {
        if (window.scrollY > 8) closeLandingLoginOnScroll();
      }, { passive: true });
      window.addEventListener('wheel', closeLandingLoginOnScroll, { passive: true });
      window.addEventListener('touchmove', closeLandingLoginOnScroll, { passive: true });
      window.addEventListener('resize', updateLandingProgress);
      window.addEventListener('hashchange', handlePreAuthNavigationChange);
      window.addEventListener('popstate', handlePreAuthNavigationChange);

      updateLandingProgress();
      resolvePreAuthExperience();
      updateMarketingLanguageGuideVisibility();
    }

    window.openMarketingLogin = function (event) {
      event?.preventDefault();
      navigatePreAuthSurface('login', { focusLogin: true, historyMode: 'push' });
      return false;
    };

    window.startMarketingDownload = function (event) {
      event?.preventDefault();

      if (typeof triggerAppDownload === 'function') {
        triggerAppDownload();
      } else {
        window.open(MARKETING_DOWNLOAD_URL, '_blank', 'noopener,noreferrer');
      }

      return false;
    };

    window.hideMarketingLanding = hideMarketingLanding;
    window.showMarketingLanding = showMarketingLanding;
    window.navigatePreAuthSurface = navigatePreAuthSurface;
    window.resolvePreAuthExperience = resolvePreAuthExperience;

    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', initMarketingLanding, { once: true });
    } else {
      initMarketingLanding();
    }



  // Expose on window for inline handlers & core navigation
  window.getMarketingLandingElements = getMarketingLandingElements;
  window.updateMarketingText = updateMarketingText;
  window.renderMarketingMarvel = renderMarketingMarvel;
  window.startMarketingMarvelCycle = startMarketingMarvelCycle;
  window.setMarketingHash = setMarketingHash;
  window.scrollPreAuthTop = scrollPreAuthTop;
  window.updateLandingProgress = updateLandingProgress;
  window.hideMarketingLanding = hideMarketingLanding;
  window.showMarketingLanding = showMarketingLanding;
  window.navigatePreAuthSurface = navigatePreAuthSurface;
  window.resolvePreAuthExperience = resolvePreAuthExperience;
  window.setActiveLandingPhoneScreen = setActiveLandingPhoneScreen;
  window.startLandingPhoneCycle = startLandingPhoneCycle;
  window.initLandingReveals = initLandingReveals;
  window.initMarketingLanding = initMarketingLanding;
  window.handlePreAuthNavigationChange = handlePreAuthNavigationChange;
  window.openMarketingLogin = openMarketingLogin;
  window.startMarketingDownload = startMarketingDownload;
})();
