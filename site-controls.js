(() => {
  const header = document.querySelector('body > header');
  const menu = header?.querySelector('.menu');
  const navigation = header?.querySelector('nav');
  if (menu && navigation) {
    menu.addEventListener('click', () => {
      menu.setAttribute('aria-expanded', String(navigation.classList.toggle('open')));
    });
    navigation.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', () => {
        navigation.classList.remove('open');
        menu.setAttribute('aria-expanded', 'false');
      });
    });
  }

  const themeButton = header?.querySelector('.theme-toggle');
  if (themeButton) {
    const root = document.documentElement;
    function updateThemeButton() {
      const dark = root.dataset.theme === 'dark';
      themeButton.setAttribute('aria-pressed', String(dark));
      themeButton.setAttribute('aria-label', dark ? 'Switch to light theme' : 'Switch to dark theme');
      themeButton.querySelector('.theme-label').textContent = dark ? 'Light' : 'Dark';
    }
    themeButton.addEventListener('click', () => {
      root.dataset.theme = root.dataset.theme === 'dark' ? 'light' : 'dark';
      try { localStorage.setItem('roboringo-theme-v7', root.dataset.theme); } catch {}
      updateThemeButton();
    });
    updateThemeButton();
  }

  const tabs = [...document.querySelectorAll('.route-tabs [role="tab"]')];
  function selectTab(selected) {
    tabs.forEach(tab => {
      const active = tab === selected;
      tab.setAttribute('aria-selected', String(active));
      tab.tabIndex = active ? 0 : -1;
      document.getElementById(tab.getAttribute('aria-controls')).hidden = !active;
    });
  }
  tabs.forEach((tab, index) => {
    tab.addEventListener('click', () => selectTab(tab));
    tab.addEventListener('keydown', event => {
      let next;
      if (event.key === 'ArrowDown') next = (index + 1) % tabs.length;
      else if (event.key === 'ArrowUp') next = (index + tabs.length - 1) % tabs.length;
      else if (event.key === 'Home') next = 0;
      else if (event.key === 'End') next = tabs.length - 1;
      else return;
      event.preventDefault();
      selectTab(tabs[next]);
      tabs[next].focus();
    });
  });
})();

(() => {
  const root = document.documentElement;
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  let lenis;
  let pendingFrame = 0;

  function updateBlur() {
    pendingFrame = 0;
    const remaining = root.scrollHeight - root.clientHeight - window.scrollY;
    const opacity = Math.max(0, Math.min(window.scrollY / 140, remaining / 90, 1));
    root.style.setProperty('--bottom-scroll-blur', opacity.toFixed(3));
  }

  function scheduleBlur() {
    if (!pendingFrame) pendingFrame = requestAnimationFrame(updateBlur);
  }

  function syncScrollLock() {
    if (!lenis) return;
    if (document.body.style.overflow === 'hidden') lenis.stop();
    else if (lenis.isStopped) lenis.start();
  }

  function updateMotion() {
    if (reducedMotion.matches) {
      lenis?.destroy();
      lenis = undefined;
    } else if (!lenis && typeof window.Lenis === 'function') {
      lenis = new window.Lenis({
        autoRaf: true,
        anchors: true,
        stopInertiaOnNavigate: true,
        lerp: 0.11,
        prevent: node => node instanceof Element && Boolean(node.closest('.overlay')),
      });
      syncScrollLock();
    }
    scheduleBlur();
  }

  new MutationObserver(syncScrollLock).observe(document.body, {
    attributes: true,
    attributeFilter: ['style'],
  });
  window.addEventListener('scroll', scheduleBlur, { passive: true });
  window.addEventListener('resize', scheduleBlur);
  window.addEventListener('pageshow', scheduleBlur);
  reducedMotion.addEventListener('change', updateMotion);
  updateMotion();
})();
