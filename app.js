/* Public, read-only gallery. Content is maintained in photos.js or scripts/photos.mjs. */
(() => {
  'use strict';
  const photos = Array.isArray(window.MIZHI_PHOTOS) ? window.MIZHI_PHOTOS : [];
  const $ = id => document.getElementById(id);
  const gallery = $('gallery');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const finePointer = matchMedia('(hover: hover) and (pointer: fine)');
  let motion = !reduced.matches;
  let active = 0;
  let returnFocus = null;
  const viewer = $('viewer');
  const number = n => String(n).padStart(2, '0');
  $('year').textContent = new Date().getFullYear();
  $('count').textContent = `(${number(photos.length)})`;
  $('hero-count').textContent = `${number(photos.length)} photographs`;
  $('empty').hidden = photos.length > 0;

  // Fixed one-pixel grid units let photographs keep their natural aspect ratios.
  let layoutFrame;
  function layout() {
    cancelAnimationFrame(layoutFrame);
    layoutFrame = requestAnimationFrame(() => {
      for (const card of gallery.children) {
        card.style.gridRowEnd = `span ${Math.ceil(card.getBoundingClientRect().height)}`;
      }
    });
  }
  const observer = 'IntersectionObserver' in window ? new IntersectionObserver(entries => {
    for (const entry of entries) if (entry.isIntersecting) {
      entry.target.classList.add('reveal');
      observer.unobserve(entry.target);
    }
  }, { threshold: .04 }) : null;
  photos.forEach((photo, index) => {
    const card = document.createElement('figure');
    card.className = 'photo-card';
    const button = document.createElement('button');
    button.className = 'photo-button';
    button.setAttribute('aria-label', `View ${photo.title || `photograph ${index + 1}`}`);
    const surface = document.createElement('span');
    surface.className = 'photo-surface';
    const img = document.createElement('img');
    img.alt = photo.alt || photo.title || 'Photograph';
    img.loading = index < 3 ? 'eager' : 'lazy';
    img.decoding = 'async';
    // An initial ratio avoids empty lazy-image cells; reflow uses natural dimensions.
    img.style.aspectRatio = photo.width && photo.height ? `${photo.width} / ${photo.height}` : '4 / 5';
    img.addEventListener('load', () => { img.style.aspectRatio = `${img.naturalWidth} / ${img.naturalHeight}`; layout(); });
    img.addEventListener('error', () => {
      surface.classList.add('image-unavailable');
      surface.textContent = 'Photograph unavailable';
      layout();
    });
    img.src = photo.src;
    const open = document.createElement('span');
    open.className = 'photo-open'; open.textContent = '↗'; open.setAttribute('aria-hidden', 'true');
    surface.append(img, open); button.append(surface);
    const caption = document.createElement('figcaption');
    caption.className = 'photo-meta';
    const title = document.createElement('span'); title.textContent = photo.title || '';
    const counter = document.createElement('span'); counter.textContent = number(index + 1);
    caption.append(title, counter); card.append(button, caption); gallery.append(card);
    button.addEventListener('click', () => show(index, button));
    button.addEventListener('pointermove', event => {
      if (!motion || !finePointer.matches) return;
      const r = button.getBoundingClientRect();
      surface.style.setProperty('--rx', `${-(event.clientY - r.top - r.height / 2) / r.height * 5}deg`);
      surface.style.setProperty('--ry', `${(event.clientX - r.left - r.width / 2) / r.width * 6}deg`);
    });
    button.addEventListener('pointerleave', () => { surface.style.setProperty('--rx', '0deg'); surface.style.setProperty('--ry', '0deg'); });
    observer?.observe(card);
  });
  if ('ResizeObserver' in window) new ResizeObserver(layout).observe(gallery);
  window.addEventListener('resize', layout);
  document.fonts?.ready.then(layout);
  layout();

  const featured = [photos[1] || photos[0], photos[0], photos[2] || photos[0]].filter(Boolean);
  featured.forEach(photo => {
    const img = document.createElement('img');
    img.className = 'hero-photo'; img.src = photo.src; img.alt = ''; img.decoding = 'async';
    img.addEventListener('error', () => img.remove());
    $('hero-stage').append(img);
  });
  function show(index, opener) {
    if (!photos.length) return;
    active = (index + photos.length) % photos.length;
    const photo = photos[active];
    $('viewer-image').hidden = false;
    $('viewer-error').hidden = true;
    $('viewer-image').alt = photo.alt || photo.title || 'Photograph';
    $('viewer-image').src = photo.src;
    $('viewer-caption').textContent = photo.title || '';
    $('viewer-position').textContent = `${number(active + 1)} / ${number(photos.length)}`;
    $('previous').hidden = $('next').hidden = photos.length < 2;
    if (!viewer.open) { returnFocus = opener; viewer.showModal(); document.body.classList.add('viewing'); }
  }
  $('viewer-image').addEventListener('error', () => { $('viewer-image').hidden = true; $('viewer-error').hidden = false; });
  $('close').addEventListener('click', () => viewer.close());
  $('previous').addEventListener('click', () => show(active - 1));
  $('next').addEventListener('click', () => show(active + 1));
  viewer.addEventListener('close', () => { document.body.classList.remove('viewing'); returnFocus?.focus({ preventScroll: true }); });
  viewer.addEventListener('click', e => { if (e.target === viewer || e.target.classList.contains('viewer-image-wrap')) viewer.close(); });
  viewer.addEventListener('keydown', e => {
    if (e.key === 'ArrowRight') { e.preventDefault(); show(active + 1); }
    if (e.key === 'ArrowLeft') { e.preventDefault(); show(active - 1); }
  });
  let touchStart;
  viewer.addEventListener('touchstart', e => { touchStart = e.changedTouches[0].clientX; }, { passive: true });
  viewer.addEventListener('touchend', e => {
    if (touchStart == null) return;
    const difference = e.changedTouches[0].clientX - touchStart;
    if (Math.abs(difference) > 65) show(active + (difference < 0 ? 1 : -1));
    touchStart = null;
  }, { passive: true });

  // Lightweight, cursor-displaced contour field. No WebGL or motion libraries required.
  const canvas = $('atmosphere');
  const ctx = canvas.getContext('2d');
  let width = 0, height = 0, frame = 0, last = 0;
  const pointer = { x: innerWidth * .7, y: innerHeight * .4, tx: innerWidth * .7, ty: innerHeight * .4 };
  function resizeCanvas() {
    width = innerWidth; height = innerHeight;
    const dpr = Math.min(devicePixelRatio || 1, 1.5);
    canvas.width = width * dpr; canvas.height = height * dpr;
    if (ctx) ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    draw(0);
  }
  function draw(time) {
    if (!ctx) return;
    ctx.clearRect(0, 0, width, height);
    const light = ctx.createRadialGradient(pointer.x, pointer.y, 0, pointer.x, pointer.y, Math.max(width * .55, 550));
    light.addColorStop(0, 'rgba(150,164,94,.10)'); light.addColorStop(1, 'rgba(150,164,94,0)');
    ctx.fillStyle = light; ctx.fillRect(0, 0, width, height);
    ctx.lineWidth = .6;
    for (let line = 0; line < 22; line++) {
      ctx.beginPath(); ctx.strokeStyle = `rgba(178,190,143,${.035 + line * .0015})`;
      for (let x = -30; x <= width + 30; x += 24) {
        const base = height * .15 + line * 42;
        const dx = x - pointer.x, dy = base - pointer.y;
        const force = Math.exp(-(dx * dx + dy * dy) / 130000) * 80;
        const y = base + Math.sin(x * .0028 + line * .13 + time * .00011) * 65 - force;
        if (x === -30) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      }
      ctx.stroke();
    }
  }
  function animate(time) {
    if (!motion || document.hidden) { frame = 0; return; }
    if (time - last > 32) {
      pointer.x += (pointer.tx - pointer.x) * .09;
      pointer.y += (pointer.ty - pointer.y) * .09;
      draw(time); last = time;
    }
    frame = requestAnimationFrame(animate);
  }
  function setMotion(value) {
    motion = value;
    $('motion').setAttribute('aria-pressed', String(motion));
    document.body.classList.toggle('motion-off', !motion);
    cancelAnimationFrame(frame); frame = 0;
    if (motion && !document.hidden) frame = requestAnimationFrame(animate); else draw(0);
  }
  $('motion').addEventListener('click', () => setMotion(!motion));
  reduced.addEventListener('change', e => setMotion(!e.matches));
  document.addEventListener('visibilitychange', () => setMotion(motion));
  window.addEventListener('resize', resizeCanvas);
  window.addEventListener('pointermove', e => {
    if (!motion || !finePointer.matches) return;
    pointer.tx = e.clientX; pointer.ty = e.clientY;
    if (scrollY < innerHeight) {
      [...$('hero-stage').children].forEach((image, i) => {
        const depth = (i + 1) * 8;
        image.style.setProperty('--px', `${(e.clientX / width - .5) * depth}px`);
        image.style.setProperty('--py', `${(e.clientY / height - .5) * depth}px`);
      });
    }
  }, { passive: true });
  resizeCanvas(); setMotion(motion);
})();
