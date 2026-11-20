(() => {
  const header = document.querySelector('header');
  const menu = header?.querySelector('.menu');
  const navigation = header?.querySelector('nav');
  if (menu && navigation) {
    const mobile = matchMedia('(max-width: 760px)');
    const language = header.querySelector('.language-control');
    const login = header.querySelector('.nav-login');
    const controls = [language, login].filter(Boolean);
    const homes = controls.map(control => {
      const marker = document.createComment('Header control position');
      control.before(marker);
      return marker;
    });
    const tools = document.createElement('div');
    tools.className = 'mobile-menu-tools';
    navigation.append(tools);
    const backdrop = document.createElement('button');
    backdrop.className = 'mobile-menu-backdrop';
    backdrop.type = 'button';
    backdrop.hidden = true;
    backdrop.tabIndex = -1;
    backdrop.setAttribute('aria-label', 'Close navigation');
    header.after(backdrop);
    let previousOverflow = '';

    function closeMenu(restoreFocus = false) {
      if (navigation.classList.contains('open')) {
        document.body.style.overflow = previousOverflow;
      }
      navigation.classList.remove('open');
      menu.setAttribute('aria-expanded', 'false');
      backdrop.hidden = true;
      const panel = language?.querySelector('.language-panel');
      if (panel) panel.hidden = true;
      language?.querySelector('.language-button')?.setAttribute('aria-expanded', 'false');
      if (restoreFocus) menu.focus();
    }

    function syncHeader() {
      closeMenu();
      controls.forEach((control, index) => {
        if (mobile.matches) tools.append(control);
        else homes[index].after(control);
      });
    }

    menu.addEventListener('click', () => {
      if (navigation.classList.contains('open')) {
        closeMenu(true);
        return;
      }
      previousOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      navigation.classList.add('open');
      menu.setAttribute('aria-expanded', 'true');
      backdrop.hidden = false;
      navigation.querySelector('a')?.focus();
    });
    backdrop.addEventListener('click', () => closeMenu(true));
    navigation.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', () => closeMenu());
    });
    document.addEventListener('keydown', event => {
      if (!mobile.matches || !navigation.classList.contains('open')) return;
      if (event.key === 'Escape') {
        closeMenu(true);
        return;
      }
      if (event.key !== 'Tab') return;
      const focusable = [...navigation.querySelectorAll('a[href],button,select')]
        .filter(element => !element.disabled && element.getClientRects().length);
      const first = focusable[0];
      const last = focusable.at(-1);
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last?.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first?.focus();
      }
    });
    mobile.addEventListener('change', syncHeader);
    syncHeader();
  }

  const themeButton = document.querySelector('.theme-toggle');
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
        lerp: 0.18,
        prevent: node => node instanceof Element && Boolean(node.closest('.overlay')),
      });
      syncScrollLock();
    }
  }

  window.addEventListener('article-section-scroll', event => {
    const { top, reducedMotion } = event.detail;
    if (lenis) lenis.scrollTo(top, { duration: 0.8, immediate: reducedMotion });
    else window.scrollTo({ top, behavior: reducedMotion ? 'instant' : 'smooth' });
  });

  new MutationObserver(syncScrollLock).observe(document.body, {
    attributes: true,
    attributeFilter: ['style'],
  });
  reducedMotion.addEventListener('change', updateMotion);
  updateMotion();
})();

(() => {
  function updateGlowPlayback() {
    document.documentElement.classList.toggle('glow-paused', document.hidden);
  }
  document.addEventListener('visibilitychange', updateGlowPlayback);
  updateGlowPlayback();
})();

(() => {
  const blur = document.querySelector('.bottom-scroll-blur');
  if (!blur) return;
  let scheduled = false;
  function updateBlur() {
    scheduled = false;
    const remaining = document.documentElement.scrollHeight - window.innerHeight - window.scrollY;
    blur.style.opacity = String(Math.max(0, Math.min(1, remaining / 140)));
  }
  function scheduleUpdate() {
    if (scheduled) return;
    scheduled = true;
    requestAnimationFrame(updateBlur);
  }
  window.addEventListener('scroll', scheduleUpdate, { passive: true });
  window.addEventListener('resize', scheduleUpdate);
  new ResizeObserver(scheduleUpdate).observe(document.body);
  updateBlur();
})();
