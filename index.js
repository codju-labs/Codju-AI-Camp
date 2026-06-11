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

  // --- YouTube background autoplay loop player with interactive toggle controls ---
  let player = null;
  let playerReady = false;

  const initPlayer = () => {
    const playerEl = document.getElementById('hero-player');
    if (!playerEl) return;

    player = new window.YT.Player('hero-player', {
      host: 'https://www.youtube.com',
      videoId: 'xoCqW-ngJDQ',
      playerVars: {
        autoplay: 1,
        mute: 1,
        loop: 1,
        playlist: 'xoCqW-ngJDQ',
        controls: 0,
        rel: 0,
        showinfo: 0,
        modestbranding: 1,
        playsinline: 1,
        enablejsapi: 1,
        vq: 'hd1080'
      },
      events: {
        onReady: (event) => {
          playerReady = true;
          event.target.mute();
          event.target.playVideo();
          setupObserversAndControls();
        },
        onStateChange: (event) => {
          // Loop video explicitly if it ends (0)
          if (event.data === 0) {
            event.target.playVideo();
          }
          // Fade out visual facade when video starts playing (1 is PLAYING)
          if (event.data === 1) {
            const facade = document.getElementById('video-facade');
            if (facade) {
              facade.style.opacity = '0';
              setTimeout(() => {
                if (facade.parentNode) {
                  facade.parentNode.removeChild(facade);
                }
              }, 500);
            }
          }
        }
      }
    });
  };

  const setupObserversAndControls = () => {
    const audioToggle = document.getElementById('video-audio-toggle');
    const overlay = document.getElementById('video-interaction-overlay');
    const container = document.getElementById('yt-lite-container');
    const mutedIcon = document.getElementById('audio-muted-icon');
    const unmutedIcon = document.getElementById('audio-unmuted-icon');

    if (audioToggle && player) {
      audioToggle.addEventListener('click', (e) => {
        e.stopPropagation(); // Prevent triggering manual play/pause on overlay
        if (!playerReady) return;

        if (player.isMuted()) {
          player.unMute();
          if (mutedIcon) mutedIcon.style.display = 'none';
          if (unmutedIcon) unmutedIcon.style.display = 'block';
          audioToggle.setAttribute('aria-label', 'Mute video');
        } else {
          player.mute();
          if (mutedIcon) mutedIcon.style.display = 'block';
          if (unmutedIcon) unmutedIcon.style.display = 'none';
          audioToggle.setAttribute('aria-label', 'Unmute video');
        }
      });
    }

    if (overlay && player) {
      overlay.addEventListener('click', () => {
        if (!playerReady) return;
        const state = player.getPlayerState();
        // YT.PlayerState.PLAYING is 1
        if (state === 1) {
          player.pauseVideo();
        } else {
          player.playVideo();
        }
      });
    }

    // Pause video when out of viewport, play when in view
    if ('IntersectionObserver' in window && container && player) {
      const videoObserver = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (!playerReady) return;
          if (entry.isIntersecting) {
            player.playVideo();
          } else {
            player.pauseVideo();
          }
        });
      }, {
        threshold: 0.1 // Trigger when less than 10% visible
      });
      videoObserver.observe(container);
    }
  };

  const loadYouTubeAPI = () => {
    if (window.YT && window.YT.Player) {
      initPlayer();
      return;
    }
    const tag = document.createElement('script');
    tag.src = 'https://www.youtube.com/iframe_api';
    const firstScriptTag = document.getElementsByTagName('script')[0];
    if (firstScriptTag && firstScriptTag.parentNode) {
      firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
    } else {
      document.head.appendChild(tag);
    }
  };

  // Bind to window ready safely to preserve other callbacks
  const previousAPIReady = window.onYouTubeIframeAPIReady;
  window.onYouTubeIframeAPIReady = () => {
    if (previousAPIReady) previousAPIReady();
    initPlayer();
  };

  // Load YouTube API deferred to prevent blocking critical path
  let youtubeApiLoaded = false;
  const triggerYouTubeLoad = () => {
    if (youtubeApiLoaded) return;
    youtubeApiLoaded = true;

    // Clean up event listeners and timeout
    window.removeEventListener('scroll', triggerYouTubeLoad);
    window.removeEventListener('mousemove', triggerYouTubeLoad);
    window.removeEventListener('touchstart', triggerYouTubeLoad);
    window.removeEventListener('click', triggerYouTubeLoad);
    clearTimeout(youtubeTimeout);

    loadYouTubeAPI();
  };

  // Defer YouTube load: trigger after 2.5s or on first user interaction
  const youtubeTimeout = setTimeout(triggerYouTubeLoad, 2500);
  window.addEventListener('scroll', triggerYouTubeLoad, { passive: true });
  window.addEventListener('mousemove', triggerYouTubeLoad, { passive: true });
  window.addEventListener('touchstart', triggerYouTubeLoad, { passive: true });
  window.addEventListener('click', triggerYouTubeLoad, { passive: true });

  // --- Razorpay enrollment checkout ---
  const paymentModal = document.getElementById('payment-modal');
  const paymentForm = document.querySelector('[data-payment-form]');
  if (paymentModal && paymentForm) {
    const reserveLinks = document.querySelectorAll('a[href="#reserve"]');
    const closeButton = paymentModal.querySelector('.payment-modal__close');
    const phoneInput = paymentForm.querySelector('input[name="phone"]');
    const submitButton = paymentForm.querySelector('button[type="submit"]');
    const submitLabel = paymentForm.querySelector('[data-payment-label]');
    const message = paymentForm.querySelector('[data-payment-message]');
    const parentNameInput = paymentForm.querySelector('input[name="parent_name"]');
    let lastTrigger = null;
    let checkoutOpen = false;

    const setMessage = (text, tone = '') => {
      message.textContent = text;
      message.dataset.tone = tone;
    };

    const setSubmitting = (submitting, label = 'Pay ₹2,999 securely') => {
      submitButton.disabled = submitting;
      submitLabel.textContent = label;
    };

    const openPaymentModal = (trigger) => {
      lastTrigger = trigger;
      paymentModal.hidden = false;
      document.body.classList.add('payment-modal-open');
      setMessage('');
      requestAnimationFrame(() => parentNameInput?.focus());
    };

    const closePaymentModal = () => {
      if (checkoutOpen) return;
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

    // Lazy-load Razorpay checkout.js on first payment attempt
    let razorpayLoaded = typeof window.Razorpay === 'function';
    const loadRazorpay = () => {
      if (razorpayLoaded) return Promise.resolve();
      return new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = 'https://checkout.razorpay.com/v1/checkout.js';
        script.onload = () => { razorpayLoaded = true; resolve(); };
        script.onerror = () => reject(new Error('Failed to load payment gateway.'));
        document.head.appendChild(script);
      });
    };

    paymentForm.addEventListener('submit', async (event) => {
      event.preventDefault();
      if (!paymentForm.checkValidity()) {
        paymentForm.reportValidity();
        return;
      }

      // Load Razorpay on demand
      setSubmitting(true, 'Loading secure checkout...');
      setMessage('');
      try {
        await loadRazorpay();
      } catch (err) {
        setSubmitting(false);
        setMessage(err.message + ' Please refresh and try again.', 'error');
        return;
      }

      if (typeof window.Razorpay !== 'function') {
        setSubmitting(false);
        setMessage('Secure checkout could not be loaded. Please refresh and try again.', 'error');
        return;
      }

      const enrollment = Object.fromEntries(new FormData(paymentForm).entries());
      setSubmitting(true, 'Creating secure order...');
      setMessage('');

      try {
        const orderResponse = await fetch('/api/create-order', {
          method: 'POST',
          headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(enrollment),
        });
        const order = await orderResponse.json();
        if (!orderResponse.ok) {
          throw new Error(order.error || 'Unable to create a payment order.');
        }

        const checkout = new window.Razorpay({
          key: order.key_id,
          amount: order.amount,
          currency: order.currency,
          name: 'M/s CODJU TECHNOLOGIES',
          description: 'AI Creator Camp | June 22–28, 2026',
          image: `${window.location.origin}/assets/logo.png`,
          order_id: order.order_id,
          prefill: {
            name: enrollment.parent_name,
            email: enrollment.email,
            contact: enrollment.phone,
          },
          notes: {
            student_name: enrollment.student_name,
          },
          theme: {
            color: '#7c3aed',
          },
          modal: {
            confirm_close: true,
            ondismiss: () => {
              checkoutOpen = false;
              setSubmitting(false);
              setMessage('Payment was cancelled. No charge was confirmed.', 'warning');
            },
          },
          handler: async (payment) => {
            checkoutOpen = false;
            setSubmitting(true, 'Verifying payment...');
            setMessage('Payment received. Verifying securely...', 'info');

            try {
              const verificationResponse = await fetch('/api/verify-payment', {
                method: 'POST',
                headers: {
                  Accept: 'application/json',
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify(payment),
              });
              const result = await verificationResponse.json();
              if (!verificationResponse.ok || !result.success) {
                throw new Error(result.error || 'Payment verification failed.');
              }

              setSubmitting(true, 'Payment verified');
              setMessage(
                `Enrollment confirmed. Your ID is ${result.enrollment_id}. A confirmation email will arrive shortly.`,
                'success',
              );
            } catch (error) {
              setSubmitting(false, 'Retry verification');
              setMessage(
                `${error.message} Please contact support before attempting another payment.`,
                'error',
              );
            }
          },
        });

        checkout.on('payment.failed', (failure) => {
          checkoutOpen = false;
          setSubmitting(false);
          const description = failure.error?.description || 'The payment could not be completed.';
          setMessage(`${description} Please try again or use another payment method.`, 'error');
        });

        checkoutOpen = true;
        setSubmitting(false);
        checkout.open();
      } catch (error) {
        checkoutOpen = false;
        setSubmitting(false);
        setMessage(error.message || 'Unable to start payment. Please try again.', 'error');
      }
    });

  }

})();
