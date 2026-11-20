(() => {
  const control = document.querySelector('.language-control');
  if (!control) return;

  const trigger = control.querySelector('.language-button');
  const panel = control.querySelector('.language-panel');
  const widget = control.querySelector('#google_translate_element');
  const status = control.querySelector('.language-status');
  const retry = control.querySelector('.language-retry');
  const fallback = control.querySelector('.language-fallback');
  let script;
  let pending;
  let timeout;
  let poll;

  function setOpen(open) {
    panel.hidden = !open;
    trigger.setAttribute('aria-expanded', String(open));
  }

  function showFallback(code) {
    const publicPage = /^https?:$/.test(location.protocol) &&
      !/^(localhost|127\.|0\.|\[::1\])/.test(location.hostname);
    fallback.hidden = !publicPage;
    if (!publicPage) return;
    const url = new URL('https://translate.google.com/translate');
    url.search = new URLSearchParams({ sl: 'en', tl: code, u: location.href });
    fallback.href = url.href;
  }

  function stopWaiting() {
    clearTimeout(timeout);
    clearInterval(poll);
  }

  function failed() {
    stopWaiting();
    script?.remove();
    script = undefined;
    status.textContent = 'Google Translate is unavailable on this page.';
    retry.hidden = false;
    if (pending) showFallback(pending);
  }

  function choose(code) {
    if (code === 'en') {
      if (/\bgoogtrans=/.test(document.cookie)) {
        document.cookie = 'googtrans=; Max-Age=0; path=/';
        document.cookie = 'googtrans=; Max-Age=0; path=/; domain=' + location.hostname;
        if (/(^|\.)roboringo\.com$/.test(location.hostname)) {
          document.cookie = 'googtrans=; Max-Age=0; path=/; domain=roboringo.com';
        }
        location.reload();
      }
      pending = undefined;
      fallback.hidden = true;
      status.textContent = 'English selected.';
      return;
    }

    const select = widget.querySelector('select');
    if (!select) {
      pending = code;
      if (!retry.hidden) showFallback(code);
      else load();
      return;
    }
    if (![...select.options].some(option => option.value === code)) {
      showFallback(code);
      status.textContent = 'Choose a language from the list or open Google Translate.';
      return;
    }
    pending = undefined;
    fallback.hidden = true;
    select.value = code;
    select.dispatchEvent(new Event('change', { bubbles: true }));
  }

  window.roboringoTranslateInit = () => {
    if (!script) return;
    try {
      const Translator = window.google.translate.TranslateElement;
      new Translator({ pageLanguage: 'en', autoDisplay: false, layout: Translator.InlineLayout.VERTICAL }, widget.id);
    } catch {
      failed();
      return;
    }
    poll = setInterval(() => {
      const select = widget.querySelector('select');
      if (!select || select.options.length < 2) return;
      stopWaiting();
      select.setAttribute('aria-label', 'All supported translation languages');
      status.textContent = 'Translation powered by Google Translate.';
      if (pending) choose(pending);
    }, 150);
  };

  function load() {
    if (script) return;
    retry.hidden = true;
    fallback.hidden = true;
    status.textContent = 'Loading available languages…';
    script = document.createElement('script');
    script.src = 'https://translate.google.com/translate_a/element.js?cb=roboringoTranslateInit';
    script.async = true;
    script.addEventListener('error', failed, { once: true });
    timeout = setTimeout(failed, 10000);
    document.head.append(script);
  }

  if (/\bgoogtrans=/.test(document.cookie)) load();

  trigger.addEventListener('click', () => {
    const open = panel.hidden;
    setOpen(open);
    if (open && retry.hidden) load();
  });
  control.querySelectorAll('[data-language]').forEach(button => {
    button.addEventListener('click', () => choose(button.dataset.language));
  });
  retry.addEventListener('click', load);
  document.addEventListener('click', event => {
    if (!control.contains(event.target)) setOpen(false);
  });
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && !panel.hidden) {
      setOpen(false);
      trigger.focus();
    }
  });
})();
