(function(){
  'use strict';
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ============================================================
     Nav: scroll state + mobile menu
     ============================================================ */
  var nav = document.getElementById('siteNav');
  var navBurger = document.getElementById('navBurger');
  var mobileMenu = document.getElementById('mobileMenu');

  function onScroll(){
    var y = window.scrollY || window.pageYOffset;
    if (nav) nav.classList.toggle('is-scrolled', y > 30);
  }
  document.addEventListener('scroll', onScroll, { passive:true });
  onScroll();

  if (navBurger && mobileMenu){
    navBurger.addEventListener('click', function(){
      var open = mobileMenu.classList.toggle('is-open');
      navBurger.classList.toggle('is-open', open);
      navBurger.setAttribute('aria-expanded', open ? 'true' : 'false');
      document.body.style.overflow = open ? 'hidden' : '';
    });
    document.querySelectorAll('[data-nav]').forEach(function(link){
      link.addEventListener('click', function(){
        mobileMenu.classList.remove('is-open');
        navBurger.classList.remove('is-open');
        document.body.style.overflow = '';
      });
    });
  }

  /* ============================================================
     Scroll reveal (IntersectionObserver)
     ============================================================ */
  var revealEls = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window){
    var io = new IntersectionObserver(function(entries){
      entries.forEach(function(entry, i){
        if (entry.isIntersecting){
          var delay = Math.min(i * 60, 240);
          setTimeout(function(){ entry.target.classList.add('is-visible'); }, delay);
          io.unobserve(entry.target);
        }
      });
    }, { threshold:0.15, rootMargin:'0px 0px -6% 0px' });
    revealEls.forEach(function(el){ io.observe(el); });
  } else {
    revealEls.forEach(function(el){ el.classList.add('is-visible'); });
  }

  /* ============================================================
     Hero project-shelf (pshelf) — mouse tilt + ambient auto scroll
     ============================================================ */
  var pshelf = document.getElementById('pshelf');
  if (pshelf){
    var group = document.getElementById('pshelfGroup');
    var glow = document.getElementById('pshelfGlow');
    var scrolls = Array.prototype.slice.call(pshelf.querySelectorAll('.pshelf__scroll'));

    if (window.matchMedia('(hover:hover) and (pointer:fine)').matches && !reduceMotion){
      pshelf.addEventListener('mousemove', function(e){
        var r = pshelf.getBoundingClientRect();
        var x = (e.clientX - r.left) / r.width;
        var y = (e.clientY - r.top) / r.height;
        var rotY = (x - 0.5) * 16;
        var rotX = (0.5 - y) * 11;
        group.style.transform = 'rotateY(' + (rotY - 9) + 'deg) rotateX(' + (rotX + 5) + 'deg)';
        glow.style.setProperty('--gx', (x * 100) + '%');
        glow.style.setProperty('--gy', (y * 100) + '%');
      });
      pshelf.addEventListener('mouseleave', function(){
        group.style.transform = 'rotateY(-9deg) rotateX(5deg)';
      });
    }

    if (!reduceMotion){
      scrolls.forEach(function(el){
        var viewport = el.parentElement;
        var img = el.querySelector('img');
        var duration = parseInt(el.dataset.duration, 10) || 6000;
        var delay = parseInt(el.dataset.delay, 10) || 0;
        var holdTime = 900;
        var maxShift = 0;

        function measure(){ maxShift = Math.max(0, el.scrollHeight - viewport.clientHeight); }

        function start(){
          measure();
          window.addEventListener('resize', measure);
          var state = 'down';
          var legStart = null;
          function ease(t){ return t < 0.5 ? 2*t*t : -1 + (4 - 2*t)*t; }
          function tick(now){
            if (legStart === null) legStart = now + delay;
            var elapsed = now - legStart;
            if (elapsed < 0){ requestAnimationFrame(tick); return; }
            if (maxShift <= 0){ requestAnimationFrame(tick); return; }
            if (state === 'down'){
              var p = Math.min(1, elapsed / duration);
              el.style.transform = 'translateY(' + (-ease(p) * maxShift) + 'px)';
              if (p >= 1){ state = 'holdBottom'; legStart = now; }
            } else if (state === 'holdBottom'){
              if (elapsed >= holdTime){ state = 'up'; legStart = now; }
            } else if (state === 'up'){
              var p2 = Math.min(1, elapsed / duration);
              el.style.transform = 'translateY(' + (-(1 - ease(p2)) * maxShift) + 'px)';
              if (p2 >= 1){ state = 'holdTop'; legStart = now; }
            } else if (state === 'holdTop'){
              if (elapsed >= holdTime){ state = 'down'; legStart = now; }
            }
            requestAnimationFrame(tick);
          }
          requestAnimationFrame(tick);
        }

        if (img && !img.complete){ img.addEventListener('load', start, { once:true }); }
        else { start(); }
      });
    }
  }

  /* ============================================================
     Card 3D tilt (project cards / service cards with data-tilt)
     ============================================================ */
  if (window.matchMedia('(hover:hover) and (pointer:fine)').matches && !reduceMotion){
    document.querySelectorAll('[data-tilt]').forEach(function(card){
      card.style.perspective = '900px';
      card.addEventListener('mousemove', function(e){
        var rect = card.getBoundingClientRect();
        var x = (e.clientX - rect.left) / rect.width - 0.5;
        var y = (e.clientY - rect.top) / rect.height - 0.5;
        card.style.transform = 'rotateY(' + (x * 6) + 'deg) rotateX(' + (-y * 6) + 'deg) translateY(-3px)';
      });
      card.addEventListener('mouseleave', function(){ card.style.transform = ''; });
    });
  }

  /* ============================================================
     Simple parallax on elements marked data-parallax
     ============================================================ */
  var parallaxEls = document.querySelectorAll('[data-parallax]');
  if (parallaxEls.length && !reduceMotion){
    function onParallax(){
      var vh = window.innerHeight;
      parallaxEls.forEach(function(el){
        var r = el.getBoundingClientRect();
        var center = r.top + r.height / 2;
        var offset = (center - vh / 2) / vh;
        var speed = parseFloat(el.dataset.parallax) || 0.15;
        el.style.transform = 'translateY(' + (offset * speed * 100) + 'px)';
      });
    }
    document.addEventListener('scroll', onParallax, { passive:true });
    onParallax();
  }

  /* ============================================================
     Contact form — validates client-side, then submits to
     Formspree via fetch (no page reload). Replace the form's
     action="https://formspree.io/f/YOUR_FORM_ID" in contact.html
     with your real Formspree endpoint after signing up.
     ============================================================ */
  var contactForm = document.getElementById('contactForm');
  if (contactForm){
    var statusEl = document.getElementById('formStatus');
    var submitBtn = contactForm.querySelector('.contact-form__submit');

    contactForm.addEventListener('submit', function(e){
      e.preventDefault();
      var valid = true;
      contactForm.querySelectorAll('[required]').forEach(function(field){
        var errorEl = field.parentElement.querySelector('.form-error');
        if (!field.value.trim() || (field.type === 'email' && !/^\S+@\S+\.\S+$/.test(field.value))){
          valid = false;
          if (errorEl) errorEl.textContent = field.type === 'email' ? 'Enter a valid email address.' : 'This field is required.';
        } else if (errorEl){
          errorEl.textContent = '';
        }
      });
      if (!valid){
        if (statusEl) statusEl.textContent = '';
        return;
      }

      if (submitBtn) submitBtn.disabled = true;
      if (statusEl) statusEl.textContent = 'Sending...';

      fetch(contactForm.action, {
        method: 'POST',
        body: new FormData(contactForm),
        headers: { 'Accept': 'application/json' }
      })
      .then(function(res){
        if (res.ok){
          if (statusEl) statusEl.textContent = "Thanks — your message is on its way. I'll reply soon.";
          contactForm.reset();
        } else {
          if (statusEl) statusEl.textContent = "Something went wrong — please try emailing me directly instead.";
        }
      })
      .catch(function(){
        if (statusEl) statusEl.textContent = "Something went wrong — please try emailing me directly instead.";
      })
      .finally(function(){
        if (submitBtn) submitBtn.disabled = false;
      });
    });
  }

})();