/* ============================================
   CODJU AI CREATOR CAMP — Interactions & Animations
   ============================================ */

(function () {
  'use strict';

  // --- Navigation scroll effect ---
  const nav = document.getElementById('nav');
  const handleNavScroll = () => {
    if (window.scrollY > 100) {
      nav.classList.add('nav--scrolled');
    } else {
      nav.classList.remove('nav--scrolled');
    }
  };
  window.addEventListener('scroll', handleNavScroll, { passive: true });
  handleNavScroll();



  // --- Mobile menu toggle ---
  const mobileToggle = document.getElementById('mobileToggle');
  const mobileMenu = document.getElementById('mobileMenu');

  if (mobileToggle && mobileMenu) {
    mobileToggle.addEventListener('click', () => {
      mobileMenu.classList.toggle('active');
      const isOpen = mobileMenu.classList.contains('active');
      mobileToggle.setAttribute('aria-expanded', isOpen);
      document.body.classList.toggle('mobile-menu-open', isOpen);
    });

    // Close mobile menu on link click
    mobileMenu.querySelectorAll('a').forEach((link) => {
      link.addEventListener('click', () => {
        mobileMenu.classList.remove('active');
        mobileToggle.setAttribute('aria-expanded', 'false');
        document.body.classList.remove('mobile-menu-open');
      });
    });

    // Handle screen resize to clean up mobile menu state
    window.addEventListener('resize', () => {
      if (window.innerWidth > 1024) {
        mobileMenu.classList.remove('active');
        mobileToggle.setAttribute('aria-expanded', 'false');
        document.body.classList.remove('mobile-menu-open');
      }
    }, { passive: true });
  }

  // --- Learning Path Tabs ---
  const tabBtns = document.querySelectorAll('.tab-btn');
  const tabPanes = document.querySelectorAll('.tab-pane');

  if (tabBtns.length > 0 && tabPanes.length > 0) {
    tabBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        tabBtns.forEach(b => b.classList.remove('active'));
        tabPanes.forEach(p => p.classList.remove('active'));
        
        btn.classList.add('active');
        
        const targetId = btn.getAttribute('data-tab');
        const targetPane = document.getElementById(targetId);
        if (targetPane) {
          targetPane.classList.add('active');
        }
        
        // Smoothly scroll the clicked tab button into view in its horizontal container on mobile
        btn.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
      });
    });
  }

  // --- Smooth scroll for anchor links ---
  document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
    anchor.addEventListener('click', function (e) {
      const targetId = this.getAttribute('href');
      if (targetId === '#') return;
      if (targetId === '#reserve') return;
      const targetEl = document.querySelector(targetId);
      if (targetEl) {
        e.preventDefault();
        // Measure navigation header height (using .nav__inner to ignore open mobile menu height)
        const navInner = document.querySelector('.nav__inner');
        const navHeight = navInner ? navInner.offsetHeight : 72;
        const targetPosition = targetEl.getBoundingClientRect().top + window.pageYOffset - navHeight - 16;
        window.scrollTo({
          top: targetPosition,
          behavior: 'smooth',
        });
      }
    });
  });

  // --- Intersection Observer for reveal animations ---
  const revealElements = document.querySelectorAll('.reveal');

  if ('IntersectionObserver' in window) {
    const revealObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible');
            revealObserver.unobserve(entry.target);
          }
        });
      },
      {
        threshold: 0.1,
        rootMargin: '0px 0px -40px 0px',
      }
    );

    revealElements.forEach((el) => revealObserver.observe(el));
  } else {
    // Fallback for browsers without IntersectionObserver
    revealElements.forEach((el) => el.classList.add('visible'));
  }

  // --- Animated counter for stats ---
  const animateCounter = (el, target, duration) => {
    const start = 0;
    const startTime = performance.now();
    const suffix = el.textContent.replace(/[\d.,]/g, '');

    const step = (currentTime) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // Ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = Math.floor(eased * target);

      if (target >= 1000) {
        el.textContent = current.toLocaleString() + suffix;
      } else {
        el.textContent = current + suffix;
      }

      if (progress < 1) {
        requestAnimationFrame(step);
      }
    };
    requestAnimationFrame(step);
  };

  const statNumbers = document.querySelectorAll('.stat-card__number');

  if (statNumbers.length > 0 && 'IntersectionObserver' in window) {
    const statsObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const el = entry.target;
            const text = el.textContent.trim();
            // Extract the numeric value
            const numMatch = text.match(/[\d,]+/);
            if (numMatch) {
              const numVal = parseInt(numMatch[0].replace(/,/g, ''), 10);
              animateCounter(el, numVal, 1800);
            }
            statsObserver.unobserve(el);
          }
        });
      },
      { threshold: 0.3 }
    );

    statNumbers.forEach((el) => statsObserver.observe(el));
  }

  // --- Parallax subtle effect on hero glow ---
  const heroGlow = document.querySelector('.hero__visual-glow');
  if (heroGlow) {
    window.addEventListener(
      'mousemove',
      (e) => {
        const x = (e.clientX / window.innerWidth - 0.5) * 20;
        const y = (e.clientY / window.innerHeight - 0.5) * 20;
        heroGlow.style.transform = `translate(calc(-50% + ${x}px), calc(-50% + ${y}px))`;
      },
      { passive: true }
    );
  }
  // --- Support Interactive Features ---
  const supportTrack = document.getElementById('support-img-track');
  const supportBtns = document.querySelectorAll('.support-feature-btn');

  if (supportTrack && supportBtns.length > 0) {
    let currentSupportIndex = 0;
    let supportInterval;

    const activateSupportFeature = (index) => {
      // Update Buttons (modulo 3 because there are only 3 buttons)
      const realIndex = index % 3;
      supportBtns.forEach(b => b.classList.remove('support-feature-btn--active'));
      supportBtns[realIndex].classList.add('support-feature-btn--active');
      
      // Ensure transition is on (in case it was turned off by a previous reset)
      supportTrack.style.transition = 'transform 0.6s cubic-bezier(0.25, 1, 0.5, 1)';
      
      // Update Images (Horizontal Slide - multiply by 25% because there are 4 slides)
      supportTrack.style.transform = `translateX(-${index * 25}%)`;

      // If we just slid to the cloned slide (index 3)
      if (index === 3) {
        setTimeout(() => {
          // Turn off transition
          supportTrack.style.transition = 'none';
          // Instantly jump back to the real first slide (index 0)
          supportTrack.style.transform = `translateX(0%)`;
          // Update index tracking
          currentSupportIndex = 0;
        }, 600); // 600ms matches the CSS transition time exactly
      }
    };

    const startSupportRotation = () => {
      stopSupportRotation();
      supportInterval = setInterval(() => {
        // Increment index, can go up to 3 (the clone)
        currentSupportIndex++;
        if (currentSupportIndex > 3) currentSupportIndex = 1; // Safeguard
        
        activateSupportFeature(currentSupportIndex);
      }, 3500); // 3.5 seconds is the sweet spot for premium pacing
    };

    const stopSupportRotation = () => {
      if (supportInterval) clearInterval(supportInterval);
    };

    supportBtns.forEach((btn, index) => {
      btn.addEventListener('click', () => {
        currentSupportIndex = index;
        activateSupportFeature(index);
        startSupportRotation(); // Reset timer
      });
      
      // Pause rotation on hover
      btn.addEventListener('mouseenter', stopSupportRotation);
      btn.addEventListener('mouseleave', startSupportRotation);
    });

    startSupportRotation();
  }

  // --- FAQ Interactive Logic ---
  const faqItems = document.querySelectorAll('.faq-item');
  
  faqItems.forEach(item => {
    const header = item.querySelector('.faq-item__header');
    const body = item.querySelector('.faq-item__body');
    
    header.addEventListener('click', () => {
      // Check if current item is already open
      const isOpen = item.classList.contains('active');
      
      // Close all items
      faqItems.forEach(otherItem => {
        otherItem.classList.remove('active');
        otherItem.querySelector('.faq-item__body').style.maxHeight = null;
      });
      
      // If it wasn't open, open it
      if (!isOpen) {
        item.classList.add('active');
        body.style.maxHeight = body.scrollHeight + "px";
      }
    });
  });

  // --- Hero Video Play/Pause on Scroll ---
  const heroIframe = document.getElementById('hero-youtube-video');
  if (heroIframe && 'IntersectionObserver' in window) {
    const videoObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (heroIframe.contentWindow) {
          if (entry.isIntersecting) {
            heroIframe.contentWindow.postMessage('{"event":"command","func":"playVideo","args":""}', '*');
          } else {
            heroIframe.contentWindow.postMessage('{"event":"command","func":"pauseVideo","args":""}', '*');
          }
        }
      });
    }, { threshold: 0.1 });
    
    videoObserver.observe(heroIframe);
  }

  // --- Enrollment payment form ---
  const paymentModal = document.getElementById('payment-modal');
  const paymentForm = document.querySelector('[data-payment-form]');
  if (paymentModal && paymentForm) {
    const phoneInput = paymentForm.querySelector('input[name="phone"]');
    const submitButton = paymentForm.querySelector('button[type="submit"]');
    const submitLabel = paymentForm.querySelector('[data-payment-label]');
    const parentNameInput = paymentForm.querySelector('input[name="parent_name"]');
    const reserveLinks = document.querySelectorAll('a[href="#reserve"]');
    const quoteBase = paymentModal.querySelector('[data-quote-base]');
    const quoteGst = paymentModal.querySelector('[data-quote-gst]');
    const quoteGstLabel = paymentModal.querySelector('[data-quote-gst-label]');
    const quoteTotal = paymentModal.querySelector('[data-quote-total]');
    let lastTrigger = null;
    let quoteLoaded = false;

    const formatInr = (amount) => new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
    }).format(Number(amount));

    const loadPaymentQuote = async () => {
      if (quoteLoaded) return;

      try {
        const response = await fetch('/api/payments/quote', {
          headers: { Accept: 'application/json' },
        });
        if (!response.ok) throw new Error('Unable to load payment amount.');

        const quote = await response.json();
        quoteBase.textContent = formatInr(quote.base);
        quoteGstLabel.textContent = `GST (${quote.gstRate}%)`;
        quoteGst.textContent = formatInr(quote.gst);
        quoteTotal.textContent = formatInr(quote.total);
        quoteLoaded = true;
      } catch (error) {
        quoteBase.textContent = 'Unavailable';
        quoteGst.textContent = '--';
        quoteTotal.textContent = '--';
        console.error(error);
      }
    };

    const openPaymentModal = (trigger) => {
      lastTrigger = trigger;
      paymentModal.hidden = false;
      document.body.classList.add('payment-modal-open');
      loadPaymentQuote();
      requestAnimationFrame(() => parentNameInput?.focus());
    };

    const closePaymentModal = () => {
      paymentModal.hidden = true;
      document.body.classList.remove('payment-modal-open');
      lastTrigger?.focus();
    };

    reserveLinks.forEach((link) => {
      link.addEventListener('click', (event) => {
        event.preventDefault();
        mobileMenu?.classList.remove('active');
        mobileToggle?.setAttribute('aria-expanded', 'false');
        document.body.classList.remove('mobile-menu-open');
        openPaymentModal(link);
      });
    });

    paymentModal.querySelectorAll('[data-payment-close]').forEach((button) => {
      button.addEventListener('click', closePaymentModal);
    });

    document.addEventListener('keydown', (event) => {
      if (paymentModal.hidden) return;

      if (event.key === 'Escape') {
        closePaymentModal();
        return;
      }

      if (event.key === 'Tab') {
        const focusable = Array.from(paymentModal.querySelectorAll(
          'button:not([disabled]), input:not([disabled]), select:not([disabled]), a[href]',
        )).filter((element) => element.offsetParent !== null);
        const first = focusable[0];
        const last = focusable[focusable.length - 1];

        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last?.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first?.focus();
        }
      }
    });

    if (phoneInput) {
      phoneInput.addEventListener('input', () => {
        const hasLeadingPlus = phoneInput.value.trim().startsWith('+');
        const digits = phoneInput.value.replace(/\D/g, '').slice(0, 15);
        phoneInput.value = `${hasLeadingPlus ? '+' : ''}${digits}`;
      });
    }

    paymentForm.addEventListener('submit', () => {
      if (!paymentForm.checkValidity()) return;
      submitButton.disabled = true;
      submitLabel.textContent = 'Opening CCAvenue...';
    });
  }

})();
