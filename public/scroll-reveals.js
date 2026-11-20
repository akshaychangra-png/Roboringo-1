(() => {
  if (!('IntersectionObserver' in window) || !('animate' in Element.prototype)) return;

  const motion = matchMedia('(prefers-reduced-motion: reduce)');
  const textSelector = 'main :is(h1,h2,h3,h4,p,li,dt,dd,summary,figcaption,label), main .primary, footer :is(h2,h3,p,a)';
  const mediaSelector = '.industry-reels, .process-motion picture, .module-photo, .highlight-image, .highlight-mini-image, .product-page-image, .phone-walkthrough .phone-preview, .pa-lifestyle, .pa-detail-lifestyle, .pa-explainer figure';
  const exclude = '.pa-flip, [aria-hidden="true"], .sr, .sr-only, .hero-roll, .architecture-board, .architecture-caption, .dashboard-motion, .dashboard-metrics, .hero-media';
  const active = new Set();
  const seen = new WeakSet();
  const ease = 'cubic-bezier(.22,.61,.36,1)';
  const canMask = CSS.supports('clip-path', 'inset(0 0 100% 0)');

  function play(element, keyframes, options) {
    const animation = element.animate(keyframes, options);
    active.add(animation);
    animation.finished.then(
      () => active.delete(animation),
      () => active.delete(animation),
    );
    return animation;
  }

  function revealText(element) {
    if (element.matches(':focus-within')) return;
    if (!element.matches('h1,h2,h3,h4')) {
      play(element, [{ opacity: .55 }, { opacity: 1 }], { duration: 420, easing: ease });
      return;
    }

    const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT, {
      acceptNode: node => node.data.trim() &&
        !node.parentElement.closest(exclude) &&
        node.parentElement.closest(textSelector) === element
        ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT,
    });
    const textNodes = [];
    while (walker.nextNode()) textNodes.push(walker.currentNode);

    let index = 0;
    const pace = element.matches('h1,h2,h3,h4') ? 44 : 12;
    for (const text of textNodes) {
      const fragment = document.createDocumentFragment();
      const words = [];
      for (const token of text.data.split(/(\s+)/).filter(Boolean)) {
        if (!token.trim()) {
          fragment.append(token);
          continue;
        }
        const mask = document.createElement('span');
        mask.className = 'reveal-word-mask';
        const word = document.createElement('span');
        word.className = 'reveal-word';
        word.textContent = token;
        mask.append(word);
        fragment.append(mask);
        words.push({ mask, word, token });
      }
      text.replaceWith(fragment);
      for (const { mask, word, token } of words) {
        const animation = play(word, [
          { transform: 'translateY(105%)', opacity: .25 },
          { transform: 'translateY(0)', opacity: 1 },
        ], { duration: 560, delay: Math.min(index++ * pace, 320), easing: ease, fill: 'backwards' });
        const restoreText = () => mask.replaceWith(document.createTextNode(token));
        animation.finished.then(restoreText, restoreText);
      }
    }
  }

  function revealMedia(element) {
    if (element.matches(':focus-within')) return;
    const keyframes = canMask
      ? [{ clipPath: 'inset(0 0 98% 0 round 18px)', opacity: .55 }, { clipPath: 'inset(0 0 0 0 round 0px)', opacity: 1 }]
      : [{ opacity: .35 }, { opacity: 1 }];
    play(element, keyframes, { duration: 920, easing: ease });
  }

  const observer = new IntersectionObserver(entries => {
    for (const { target, isIntersecting } of entries) {
      if (!isIntersecting) continue;
      observer.unobserve(target);
      if (motion.matches || seen.has(target)) continue;
      seen.add(target);
      if (target.matches(mediaSelector)) revealMedia(target);
      else revealText(target);
    }
  }, { rootMargin: '0px 0px -18px' });

  function syncMotion() {
    if (motion.matches) {
      observer.disconnect();
      for (const animation of active) animation.cancel();
      return;
    }
    for (const element of document.querySelectorAll(textSelector + ', ' + mediaSelector)) {
      if (seen.has(element)) continue;
      if (element.matches(mediaSelector) || !element.closest(exclude)) observer.observe(element);
    }
  }

  motion.addEventListener('change', syncMotion);
  syncMotion();
})();
