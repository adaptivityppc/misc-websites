const active = new Set();
let viewportObserver;

export function motionMarkup(content, src, label, cls = '') {
  return `<div class="motion-frame ${cls}" data-motion><div class="motion-still">${content}</div><video class="hover-film" data-src="${src}" muted loop playsinline preload="none" aria-hidden="true" tabindex="-1"></video><button class="motion-toggle" type="button" aria-label="Play ${label}" aria-pressed="false"><span aria-hidden="true">▶</span> <span class="motion-button-text">Play film</span></button></div>`;
}

export function attachMotion(frame, {reduced = false} = {}) {
  const video = frame.querySelector('video');
  const button = frame.querySelector('.motion-toggle');
  const text = button.querySelector('.motion-button-text');
  let wanted = false, pinned = false, hovered = false, focused = false, version = 0;
  function stop() {
    wanted = false; version++;
    video.pause();
    frame.classList.remove('is-playing');
    button.setAttribute('aria-pressed', 'false');
    button.setAttribute('aria-label', button.getAttribute('aria-label').replace(/^Pause /, 'Play '));
    text.textContent = 'Play film';
    try { video.currentTime = 0; } catch {}
  }
  async function start(explicit = false) {
    if ((reduced && !explicit) || frame.classList.contains('is-disabled')) return;
    const ticket = ++version;
    wanted = true;
    video.muted = true;
    if (!video.getAttribute('src')) { video.src = video.dataset.src; video.load(); }
    try {
      await video.play();
      if (!wanted || ticket !== version) return;
      frame.classList.add('is-playing');
      button.setAttribute('aria-pressed', 'true');
      button.setAttribute('aria-label', button.getAttribute('aria-label').replace(/^Play /, 'Pause '));
      text.textContent = 'Pause film';
    } catch { if (ticket === version) { pinned = false; stop(); } }
  }
  const sync = () => (pinned || hovered || focused) ? start(pinned) : stop();
  frame.addEventListener('pointerenter', event => { if (event.pointerType === 'mouse' && !reduced) { hovered = true; sync(); } });
  frame.addEventListener('pointerleave', () => { hovered = false; if (!pinned && !focused) stop(); });
  frame.addEventListener('focusin', event => { if (event.target !== button && !reduced) { focused = true; sync(); } });
  frame.addEventListener('focusout', event => { if (!frame.contains(event.relatedTarget)) { focused = false; if (!pinned && !hovered) stop(); } });
  button.addEventListener('click', event => { event.preventDefault(); event.stopPropagation(); if (wanted) { pinned = false; hovered = false; focused = false; stop(); } else { pinned = true; start(true); } });
  video.addEventListener('error', () => { pinned = false; stop(); });
  const controller = { frame, stop() { pinned = false; hovered = false; focused = false; stop(); }, destroy() { this.stop(); active.delete(this); } };
  active.add(controller);
  return controller;
}

export function setupMotion(root = document) {
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (typeof IntersectionObserver !== 'undefined') viewportObserver = new IntersectionObserver(entries => entries.forEach(entry => {
    if (!entry.isIntersecting) active.forEach(controller => { if (controller.frame === entry.target) controller.stop(); });
  }));
  root.querySelectorAll('[data-motion]').forEach(frame => { attachMotion(frame, {reduced}); viewportObserver?.observe(frame); });
}
export function disposeMotion() { viewportObserver?.disconnect(); viewportObserver = undefined; [...active].forEach(controller => controller.destroy()); }
export function pauseMotion() { active.forEach(controller => controller.stop()); }
export function setMotionEnabled(root, enabled) {
  if (!root?.classList) return;
  root.classList.toggle('is-disabled', !enabled);
  const button = root.querySelector?.('.motion-toggle');
  if (button) button.hidden = !enabled;
  if (!enabled) [...active].filter(controller => controller.frame === root).forEach(controller => controller.stop());
}
