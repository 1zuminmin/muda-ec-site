/* Home exhibit: local catalog only, no network service or player data changes. */
(() => {
  'use strict';
  const root = document.getElementById('hero-carousel');
  if (!root) return;
  const M = window.Muda, products = M.regularProducts;
  if (products.length < 2) return;
  const get = id => document.getElementById(id);
  const stage = get('hero-stage'), track = get('hero-track');
  const motion = matchMedia('(prefers-reduced-motion: reduce)');
  let index = 0, timer = null;
  let hovered = false, focused = false, onscreen = true, gesture = null, suppressClick = false;
  const pad = n => String(n).padStart(2, '0');
  track.innerHTML = products.map((p, i) => `<a class="hero-slide" href="product.html?id=${p.id}" aria-label="${p.name}の詳細"><img src="assets/images/${p.image}" alt="${p.name}" loading="${i ? 'lazy' : 'eager'}" ${i ? '' : 'fetchpriority="high"'} draggable="false"></a>`).join('');
  const slides = Array.from(track.children);
  function schedule() {
    if (timer !== null) clearTimeout(timer);
    timer = null;
    if (!motion.matches && !hovered && !focused && onscreen && !document.hidden && !gesture) {
      timer = setTimeout(() => { timer = null; show(index + 1, false); }, 6000);
    }
  }
  function show(next, announce = true) {
    const previous = index;
    index = (next + products.length) % products.length;
    const p = products[index];
    // Wrap directly instead of racing past all intervening exhibits.
    track.style.transition = Math.abs(index - previous) > 1 ? 'none' : '';
    track.style.transform = `translateX(-${index * 100}%)`;
    slides.forEach((slide, i) => {
      slide.tabIndex = i === index ? 0 : -1;
      slide.setAttribute('aria-hidden', String(i !== index));
      slide.inert = i !== index;
    });
    get('hero-coordinate').textContent = `COLLECTION No. ${String(index + 1).padStart(3, '0')} / ${p.id.toUpperCase()}`;
    get('hero-product-name').textContent = p.name;
    get('hero-product-name').href = `product.html?id=${p.id}`;
    get('hero-price').textContent = M.money(p.price);
    get('hero-note').textContent = p.id === 'stone' ? '何の変哲もない。それこそが、真価。' : p.message;
    get('hero-position').textContent = `${pad(index + 1)} / ${pad(products.length)}`;
    // Preload only the next exhibit; avoid loading every large photo at once.
    slides[(index + 1) % products.length].querySelector('img').loading = 'eager';
    if (announce) get('hero-announcement').textContent = `${index + 1} / ${products.length}、${p.name}、${M.money(p.price)}、架空の価格`;
    schedule();
  }
  get('hero-prev').addEventListener('click', () => show(index - 1));
  get('hero-next').addEventListener('click', () => show(index + 1));
  root.addEventListener('mouseenter', () => { hovered = true; schedule(); });
  root.addEventListener('mouseleave', () => { hovered = false; schedule(); });
  root.addEventListener('focusin', () => { focused = true; schedule(); });
  root.addEventListener('focusout', e => { focused = root.contains(e.relatedTarget); schedule(); });
  stage.addEventListener('keydown', e => {
    if (e.altKey || e.ctrlKey || e.metaKey || !['ArrowLeft', 'ArrowRight'].includes(e.key)) return;
    e.preventDefault();
    show(index + (e.key === 'ArrowRight' ? 1 : -1));
  });
  stage.addEventListener('pointerdown', e => {
    if (!e.isPrimary || e.button !== 0) return;
    suppressClick = false;
    gesture = { id: e.pointerId, x: e.clientX, y: e.clientY };
    schedule();
  });
  stage.addEventListener('pointermove', e => {
    if (!gesture || gesture.id !== e.pointerId) return;
    const dx = Math.abs(e.clientX - gesture.x), dy = Math.abs(e.clientY - gesture.y);
    if (dx > 10 && dx > dy * 1.5 && !stage.hasPointerCapture(e.pointerId)) stage.setPointerCapture(e.pointerId);
  });
  stage.addEventListener('pointerleave', e => {
    if (gesture && !stage.hasPointerCapture(e.pointerId)) { gesture = null; schedule(); }
  });
  stage.addEventListener('pointerup', e => {
    if (!gesture || gesture.id !== e.pointerId) return;
    const dx = e.clientX - gesture.x, dy = e.clientY - gesture.y;
    gesture = null;
    if (stage.hasPointerCapture(e.pointerId)) stage.releasePointerCapture(e.pointerId);
    if (Math.abs(dx) >= 45 && Math.abs(dx) > Math.abs(dy) * 1.5) {
      suppressClick = true;
      show(index + (dx < 0 ? 1 : -1));
    } else schedule();
  });
  const cancelGesture = () => { gesture = null; schedule(); };
  stage.addEventListener('pointercancel', cancelGesture);
  stage.addEventListener('lostpointercapture', cancelGesture);
  stage.addEventListener('click', e => {
    if (suppressClick) { e.preventDefault(); e.stopPropagation(); suppressClick = false; }
  }, true);
  stage.addEventListener('dragstart', e => e.preventDefault());
  document.addEventListener('visibilitychange', () => { if (document.hidden) gesture = null; schedule(); });
  window.addEventListener('pagehide', () => { onscreen = false; cancelGesture(); });
  window.addEventListener('pageshow', () => { onscreen = true; schedule(); });
  motion.addEventListener('change', schedule);
  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver(entries => {
      onscreen = entries.some(entry => entry.isIntersecting); schedule();
    }, { threshold: 0.1 });
    observer.observe(root);
  }
  get('hero-controls').hidden = false;
  show(0, false);
})();
