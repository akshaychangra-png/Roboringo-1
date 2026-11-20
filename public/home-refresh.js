(() => {
  const button = document.querySelector('.motion-control');
  const image = document.getElementById('call-flow-motion');
  if (!button || !image) return;

  const preference = matchMedia('(prefers-reduced-motion: reduce)');
  const animation = 'assets/images/call-flow.gif';
  const poster = 'assets/images/call-flow-poster.png';
  let playing = !preference.matches;

  function render() {
    image.src = playing ? animation : poster;
    button.hidden = preference.matches;
    button.setAttribute('aria-label', playing ? 'Pause animation' : 'Play animation');
    button.querySelector('path').setAttribute('d', playing ? 'M8 5h3v14H8zm5 0h3v14h-3z' : 'M8 5v14l11-7z');
  }

  button.addEventListener('click', () => {
    playing = !playing;
    render();
  });
  preference.addEventListener('change', () => {
    if (preference.matches) playing = false;
    render();
  });
  render();
})();

(() => {
  const track = document.querySelector('.highlights-track');
  const controls = document.querySelector('.highlight-controls');
  if (!track || !controls) return;

  const cards = [...track.children];
  const previous = controls.querySelector('[data-direction="-1"]');
  const next = controls.querySelector('[data-direction="1"]');
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');

  function updateControls() {
    previous.disabled = track.scrollLeft < 2;
    next.disabled = track.scrollLeft + track.clientWidth >= track.scrollWidth - 2;
  }

  function move(direction) {
    const trackStart = track.getBoundingClientRect().left;
    const positions = cards.map(card => track.scrollLeft + card.getBoundingClientRect().left - trackStart);
    const target = direction > 0
      ? positions.find(position => position > track.scrollLeft + 4)
      : positions.findLast(position => position < track.scrollLeft - 4);
    track.scrollTo({
      left: target ?? (direction > 0 ? track.scrollWidth : 0),
      behavior: reducedMotion.matches ? 'instant' : 'smooth',
    });
  }

  previous.addEventListener('click', () => move(-1));
  next.addEventListener('click', () => move(1));
  track.addEventListener('scroll', updateControls, { passive: true });
  new ResizeObserver(updateControls).observe(track);
  track.addEventListener('keydown', event => {
    if (event.target !== track || !['ArrowLeft', 'ArrowRight'].includes(event.key)) return;
    event.preventDefault();
    move(event.key === 'ArrowRight' ? 1 : -1);
  });
  controls.hidden = false;
  updateControls();
})();
