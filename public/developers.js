(() => {
  const consolePanel = document.querySelector('.developer-console');
  if (!consolePanel) return;
  const tabs = [...consolePanel.querySelectorAll('[data-code-tab]')];
  function select(tab) {
    tabs.forEach(item => {
      const active = item === tab;
      item.setAttribute('aria-selected', String(active));
      item.tabIndex = active ? 0 : -1;
      document.getElementById(item.getAttribute('aria-controls')).hidden = !active;
    });
  }
  tabs.forEach((tab, index) => {
    tab.addEventListener('click', () => select(tab));
    tab.addEventListener('keydown', event => {
      if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
      event.preventDefault();
      const target = event.key === 'Home' ? tabs[0] : event.key === 'End' ? tabs[tabs.length - 1] : tabs[(index + 1) % tabs.length];
      select(target);
      target.focus();
    });
  });
  consolePanel.querySelector('.developer-copy').addEventListener('click', async () => {
    const status = consolePanel.querySelector('[role="status"]');
    try {
      await navigator.clipboard.writeText(consolePanel.querySelector('pre:not([hidden])').textContent);
      status.textContent = 'Code copied';
    } catch {
      status.textContent = 'Select the code to copy it.';
    }
  });
})();
