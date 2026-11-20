(() => {
  const tabs = [...document.querySelectorAll('.pa-tabs [role="tab"]')];
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  function select(active) {
    for (const tab of tabs) {
      const chosen = tab === active;
      tab.setAttribute('aria-selected', String(chosen));
      tab.tabIndex = chosen ? 0 : -1;
      const panel = document.getElementById(tab.getAttribute('aria-controls'));
      panel.hidden = !chosen;
      if (chosen && !reduced.matches && panel.animate) {
        panel.animate([{ opacity: .2, transform: 'translateY(7px)' }, { opacity: 1, transform: 'none' }], { duration: 350, easing: 'ease-in-out' });
      }
    }
  }
  tabs.forEach((tab, index) => {
    tab.addEventListener('click', () => select(tab));
    tab.addEventListener('keydown', event => {
      const offsets = { ArrowLeft: -1, ArrowRight: 1 };
      const next = event.key === 'Home' ? 0 : event.key === 'End' ? tabs.length - 1
        : offsets[event.key] ? (index + offsets[event.key] + tabs.length) % tabs.length : null;
      if (next === null) return;
      event.preventDefault();
      select(tabs[next]);
      tabs[next].focus();
    });
  });
})();

(() => {
  const cards = [...document.querySelectorAll('.pa-feature-grid article')];
  if (!('IntersectionObserver' in window)) return;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const observer = new IntersectionObserver(entries => {
    for (const entry of entries) {
      if (!entry.isIntersecting) continue;
      observer.unobserve(entry.target);
      if (!reduced.matches) {
        entry.target.classList.add('pa-icon-enter');
        entry.target.addEventListener('animationend', () => entry.target.classList.remove('pa-icon-enter'), { once: true });
      }
    }
  }, { threshold: .3 });
  cards.forEach(card => observer.observe(card));
})();

(() => {
  document.querySelectorAll('.pa-flip').forEach(card => {
    card.addEventListener('click', () => {
      const flipped = card.classList.toggle('is-flipped');
      card.setAttribute('aria-pressed', String(flipped));
    });
    card.addEventListener('keydown', event => {
      if (event.key === 'Escape') {
        card.classList.remove('is-flipped');
        card.setAttribute('aria-pressed', 'false');
      }
    });
  });
})();

(() => {
  const journey = document.querySelector('.pa-hero-journey');
  if (!journey || !Element.prototype.animate) return;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const animations = [];
  const observer = new IntersectionObserver(([entry]) => {
    if (!entry.isIntersecting) return;
    observer.disconnect();
    if (reduced.matches) return;
    journey.querySelectorAll('.pa-journey-stop').forEach((node, index) => {
      animations.push(node.animate([
        { opacity: 0, translate: '0 16px', scale: '.96' },
        { opacity: 1, translate: '0 0', scale: '1' },
      ], { duration: 1600, delay: index * 350, easing: 'ease-in-out', fill: 'backwards' }));
    });
  }, { threshold: .3 });
  observer.observe(journey);
  reduced.addEventListener('change', () => {
    if (reduced.matches) animations.forEach(animation => animation.cancel());
  });
})();
