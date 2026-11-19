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
