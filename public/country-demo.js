(() => {
  const demo = document.querySelector('.hero-country-demo');
  if (!demo) return;
  const countries = {
    in: { name: 'India', number: '+91 80 6559 0741', tel: '+918065590741', flag: 'in' },
    'in-alt': { name: 'India', number: '+91-88822-06962', tel: '+918882206962', flag: 'in' },
    au: { name: 'Australia', number: '+61-731-322-283', tel: '+61731322283', flag: 'au' },
    us: { name: 'United States', number: '+1-313-921-6447', tel: '+13139216447', flag: 'us' },
  };
  const order = Object.keys(countries);
  const trigger = demo.querySelector('.hero-number-select');
  const flag = trigger.querySelector('[data-selected-flag]');
  const stack = document.createElement('span');
  stack.className = 'demo-flag-stack';
  flag.before(stack);
  const ghosts = [0, 1].map(() => {
    const image = document.createElement('img');
    image.alt = '';
    image.setAttribute('aria-hidden', 'true');
    stack.append(image);
    return image;
  });
  stack.append(flag);
  const flagImages = [flag, ...ghosts];
  ['in', 'au', 'us'].forEach((country, index) => {
    flagImages[index].src = '/assets/flags/' + country + '.png';
    flagImages[index].dataset.flagCountry = country;
  });
  const options = demo.querySelector('.hero-number-options');
  const call = demo.querySelector('.hero-live-call');
  const choices = [...options.querySelectorAll('[role="option"]')];
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  let selected = 'in';
  let rotation;
  let transition;

  function update(code) {
    selected = code;
    const country = countries[code];
    call.querySelector('strong').textContent = country.number;
    call.href = 'tel:' + country.tel;
    call.setAttribute('aria-label', 'Call ' + country.name + ' demo at ' + country.number);
    const sequence = ['in', 'au', 'us'];
    flagImages.forEach(image => {
      const position = sequence.indexOf(image.dataset.flagCountry);
      image.style.setProperty('--flag-position', position);
      image.classList.toggle('is-active-country', image.dataset.flagCountry === country.flag);
    });
    flag.alt = 'India';
    choices.forEach(option =>
      option.setAttribute('aria-selected', String(option.dataset.numberCountry === code)));
  }
  function cancelTransition() {
    clearInterval(rotation);
    clearTimeout(transition);
    demo.classList.remove('is-changing');
  }
  function close(focus = false) {
    options.hidden = true;
    trigger.setAttribute('aria-expanded', 'false');
    if (focus) trigger.focus();
  }
  function open() {
    options.hidden = false;
    trigger.setAttribute('aria-expanded', 'true');
    choices.find(option => option.dataset.numberCountry === selected).focus();
  }
  function rollNumber() {
    if (reducedMotion.matches || document.hidden) return;
    demo.classList.add('is-changing');
    transition = setTimeout(() => {
      update(order[(order.indexOf(selected) + 1) % order.length]);
    }, 375);
    rotation = setTimeout(() => demo.classList.remove('is-changing'), 750);
  }
  window.addEventListener('hero-phrase-roll', rollNumber);
  trigger.addEventListener('click', () => options.hidden ? open() : close());
  trigger.addEventListener('keydown', event => {
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault();
      open();
    }
  });
  choices.forEach((option, index) => {
    option.addEventListener('click', () => {
        cancelTransition();
      update(option.dataset.numberCountry);
      close(true);
    });
    option.addEventListener('keydown', event => {
      if (event.key === 'Escape') { event.preventDefault(); close(true); }
      if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
        event.preventDefault();
        choices[(index + (event.key === 'ArrowDown' ? 1 : -1) + choices.length) % choices.length].focus();
      }
    });
  });
  document.addEventListener('click', event => {
    if (!demo.contains(event.target)) close();
  });
  demo.addEventListener('focusout', event => {
    if (!demo.contains(event.relatedTarget)) close();
  });
  document.addEventListener('visibilitychange', () => {
    clearInterval(rotation);
    clearTimeout(transition);
    demo.classList.remove('is-changing');

  });
  reducedMotion.addEventListener('change', () => {
    clearTimeout(transition);
    demo.classList.remove('is-changing');

  });
  update(selected);
})();
