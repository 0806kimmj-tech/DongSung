/* 동성상사 — interactions (Figma: Spec — Tokens & Motion) */
(() => {
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  const hasGsap = typeof window.gsap !== 'undefined' && typeof window.ScrollTrigger !== 'undefined';
  if (reduce) document.documentElement.classList.add('reduce');
  if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
  if (!location.hash) window.scrollTo(0, 0);

  /* ---------- Toast ---------- */
  const toastEl = document.querySelector('[data-toast]');
  let toastTimer;
  const toast = (msg) => {
    if (!toastEl) return;
    toastEl.textContent = msg;
    toastEl.classList.add('is-on');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toastEl.classList.remove('is-on'), 2200);
  };

  /* ---------- Copy address ---------- */
  document.querySelectorAll('[data-copy]').forEach((btn) => {
    btn.addEventListener('click', async () => {
      try {
        await navigator.clipboard.writeText(btn.dataset.copy);
        toast('주소를 복사했습니다');
      } catch {
        toast(btn.dataset.copy);
      }
    });
  });

  /* ---------- KakaoTalk placeholder ---------- */
  document.querySelectorAll('[data-kakao]').forEach((a) => {
    a.addEventListener('click', (e) => {
      if (a.getAttribute('href') === '#') {
        e.preventDefault();
        toast('카카오톡 채널 준비 중입니다. 051-971-7744로 연락 주세요');
      }
    });
  });

  /* ---------- Letter roll (nav hover) ---------- */
  document.querySelectorAll('[data-roll]').forEach((el) => {
    const text = el.textContent;
    el.setAttribute('aria-label', text);
    el.textContent = '';
    [...text].forEach((ch, i) => {
      const s = document.createElement('span');
      s.className = 'roll-ch';
      s.dataset.ch = ch;
      s.textContent = ch;
      s.setAttribute('aria-hidden', 'true');
      s.style.transitionDelay = `${i * 18}ms`;
      el.appendChild(s);
    });
  });

  /* ---------- Nav: hide on scroll down, show on up ---------- */
  const nav = document.querySelector('[data-nav]');
  let lastY = window.scrollY;
  const onScroll = (y) => {
    nav.classList.toggle('is-scrolled', y > window.innerHeight * 0.6);
    if (y > 200 && y > lastY + 4) nav.classList.add('is-hidden');
    else if (y < lastY - 4 || y <= 200) nav.classList.remove('is-hidden');
    lastY = y;
  };

  /* ---------- Statement: split into words ---------- */
  const statement = document.querySelector('[data-statement]');
  if (statement && hasGsap && !reduce) {
    statement.querySelectorAll('.l').forEach((line) => {
      const words = line.textContent.trim().split(/\s+/);
      line.innerHTML = words.map((w) => `<span class="w">${w}</span>`).join(' ');
    });
  }

  /* ---------- Parts: cursor-follow image ---------- */
  const plist = document.querySelector('[data-plist]');
  const float = document.querySelector('[data-float]');
  if (plist && float && finePointer) {
    const img = float.querySelector('img');
    const section = plist.closest('.parts');
    let fx = 0, fy = 0, tx = 0, ty = 0, raf;
    const loop = () => {
      fx += (tx - fx) * (reduce ? 1 : 0.14);
      fy += (ty - fy) * (reduce ? 1 : 0.14);
      float.style.transform = `translate3d(${fx}px, ${fy}px, 0)`;
      raf = requestAnimationFrame(loop);
    };
    section.addEventListener('pointermove', (e) => {
      const r = section.getBoundingClientRect();
      tx = e.clientX - r.left - 150;
      ty = e.clientY - r.top - 190;
    });
    plist.querySelectorAll('.prow').forEach((row) => {
      row.addEventListener('pointerenter', () => {
        if (img.getAttribute('src') !== row.dataset.img) img.src = row.dataset.img;
        float.classList.add('is-on');
      });
    });
    plist.addEventListener('pointerenter', () => { if (!raf) loop(); });
    plist.addEventListener('pointerleave', () => {
      float.classList.remove('is-on');
      cancelAnimationFrame(raf); raf = null;
    });
    // preload
    plist.querySelectorAll('.prow').forEach((r) => { const i = new Image(); i.src = r.dataset.img; });
  }

  if (!hasGsap || reduce) {
    window.addEventListener('scroll', () => onScroll(window.scrollY), { passive: true });
    return;
  }

  /* ========== GSAP + Lenis ========== */
  const { gsap, ScrollTrigger } = window;
  gsap.registerPlugin(ScrollTrigger);

  if (typeof window.Lenis !== 'undefined') {
    const lenis = new window.Lenis({ duration: 1.15, smoothWheel: true });
    window.lenis = lenis;
    lenis.on('scroll', (e) => { ScrollTrigger.update(); onScroll(e.scroll); });
    gsap.ticker.add((t) => lenis.raf(t * 1000));
    gsap.ticker.lagSmoothing(0);
    document.querySelectorAll('a[href^="#"]').forEach((a) => {
      a.addEventListener('click', (e) => {
        const id = a.getAttribute('href');
        if (id.length < 2) return;
        const target = document.querySelector(id);
        if (!target) return;
        e.preventDefault();
        lenis.scrollTo(target, { offset: 0 });
      });
    });
  } else {
    window.addEventListener('scroll', () => onScroll(window.scrollY), { passive: true });
  }

  /* 1. Page load: wordmark slides out of mask, hero image settles */
  const tl = gsap.timeline({ defaults: { ease: 'expo.out' } });
  tl.from('.hero__media img', { scale: 1.08, duration: 2.2, ease: 'power3.out' }, 0)
    .from('[data-mark]', { yPercent: 105, duration: 1.4, stagger: 0.12 }, 0.15)
    .from('.hero__ko, [data-hero-intro] > *, .hero__address', { y: 24, opacity: 0, duration: 1.1, stagger: 0.08 }, 0.55)
    .from('.nav__pill', { y: -20, opacity: 0, duration: 1 }, 0.6);

  // hero parallax on scroll
  gsap.to('.hero__media img', {
    yPercent: 12, ease: 'none',
    scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true },
  });

  /* 2. Statement: words light up with scroll */
  const words = gsap.utils.toArray('.statement__text .w');
  if (words.length) {
    gsap.to(words, {
      color: '#E9EBEA', stagger: 0.1, ease: 'none',
      scrollTrigger: { trigger: '.statement__text', start: 'top 75%', end: 'bottom 40%', scrub: true },
    });
  }

  /* 3. Rounded mask grows to full width */
  const mm = gsap.matchMedia();
  mm.add('(min-width: 769px)', () => {
    gsap.fromTo('[data-expand]', { width: '75%' }, {
      width: '100%', ease: 'none',
      scrollTrigger: { trigger: '[data-expand]', start: 'top 85%', end: 'center 50%', scrub: true },
    });
    gsap.fromTo('.statement__frame', { borderRadius: 56 }, {
      borderRadius: 0, ease: 'none',
      scrollTrigger: { trigger: '[data-expand]', start: 'top 85%', end: 'center 50%', scrub: true },
    });
    /* 4. Brands: right column moves slower (parallax) */
    gsap.fromTo('[data-parallax]', { y: 0 }, {
      y: -160, ease: 'none',
      scrollTrigger: { trigger: '.brands__grid', start: 'top bottom', end: 'bottom top', scrub: true },
    });
  });
  gsap.fromTo('.statement__frame img', { yPercent: -8 }, {
    yPercent: 0, ease: 'none',
    scrollTrigger: { trigger: '[data-expand]', start: 'top bottom', end: 'bottom top', scrub: true },
  });

  /* Footer wordmark rises */
  gsap.from('.footer__mark', {
    yPercent: 40, ease: 'none',
    scrollTrigger: { trigger: '.footer', start: 'top bottom', end: 'bottom bottom', scrub: true },
  });

  window.addEventListener('load', () => ScrollTrigger.refresh());
})();
