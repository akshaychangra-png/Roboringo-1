(() => {
  const tabs = [...document.querySelectorAll('.phone-tabs [role="tab"]')];
  function selectTab(active) {
    for (const tab of tabs) {
      const selected = tab === active;
      tab.setAttribute('aria-selected', String(selected));
      tab.tabIndex = selected ? 0 : -1;
      const panel = document.getElementById(tab.getAttribute('aria-controls'));
      if (panel) panel.hidden = !selected;
    }
  }
  tabs.forEach((tab, index) => {
    tab.addEventListener('click', () => selectTab(tab));
    tab.addEventListener('keydown', event => {
      const offsets = { ArrowDown: 1, ArrowRight: 1, ArrowUp: -1, ArrowLeft: -1 };
      const offset = offsets[event.key];
      const next = event.key === 'Home' ? tabs[0]
        : event.key === 'End' ? tabs.at(-1)
        : offset ? tabs[(index + offset + tabs.length) % tabs.length] : null;
      if (!next) return;
      event.preventDefault();
      selectTab(next);
      next.focus();
    });
  });
})();

(() => {
  const section = document.getElementById('routing-architecture');
  if (!section || !window.gsap) return;
  const board = section.querySelector('.architecture-board');
  const nodes = [...board.querySelectorAll('.wire-node')];
  const wires = board.querySelector('.architecture-wires');
  const replay = section.querySelector('.architecture-replay');
  const caption = section.querySelector('.architecture-caption');
  const depth = board.querySelector('.architecture-depth');
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  const labels = [
    'The customer calls your number.',
    'RoboRingo answers in a dedicated call room.',
    'A specialist AI or human teammate can join the same room.',
    'MCP connects the conversation to your business tools.',
  ];
  let timeline;
  let disposeDepth;
  let library;

  function loadThree() {
    if (window.THREE) return Promise.resolve(window.THREE);
    if (!library) library = new Promise(resolve => {
      const script = document.createElement('script');
      script.src = 'assets/vendor/three.min.js';
      script.onload = () => resolve(window.THREE);
      script.onerror = () => resolve(null);
      document.head.append(script);
    });
    return library;
  }

  async function addDepth(current) {
    const THREE = await loadThree();
    if (!THREE || current !== timeline || !current.isActive() || reducedMotion.matches) return;
    let renderer;
    try {
      renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    } catch {
      return;
    }
    renderer.setPixelRatio(Math.min(devicePixelRatio, 1.5));
    renderer.setSize(depth.clientWidth, depth.clientHeight);
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(42, depth.clientWidth / depth.clientHeight, .1, 30);
    camera.position.z = 8;
    const orbit = new THREE.TorusGeometry(1.65, .008, 5, 96);
    const material = new THREE.MeshBasicMaterial({ color: 0x89a77b, transparent: true, opacity: .5 });
    const rings = new THREE.Group();
    const first = new THREE.Mesh(orbit, material);
    const second = new THREE.Mesh(orbit, material);
    first.rotation.x = .82;
    second.rotation.y = .95;
    rings.add(first, second);
    scene.add(rings);
    depth.append(renderer.domElement);

    const rotation = gsap.to(rings.rotation, {
      x: .9, y: 1.65, z: .7, duration: Math.max(.2, current.duration() - current.time()),
      ease: 'sine.inOut', onUpdate: () => renderer.render(scene, camera),
    });
    disposeDepth = () => {
      rotation.kill();
      orbit.dispose();
      material.dispose();
      renderer.dispose();
      renderer.domElement.remove();
    };
  }

  function reset() {
    timeline?.kill();
    timeline = undefined;
    disposeDepth?.();
    disposeDepth = undefined;
    gsap.set([...nodes, wires], { clearProps: 'transform,opacity,visibility,zIndex' });
    caption.hidden = true;
  }

  function play() {
    if (reducedMotion.matches) return;
    reset();
    const bounds = board.getBoundingClientRect();
    const compact = bounds.width < 390;
    const centers = nodes.map(node => {
      const rect = node.getBoundingClientRect();
      return {
        x: bounds.left + bounds.width / 2 - (rect.left + rect.width / 2),
        y: bounds.top + bounds.height * .48 - (rect.top + rect.height / 2),
        scale: compact ? 1.16 : 1.35,
      };
    });
    gsap.set([...nodes, wires], { autoAlpha: 0 });
    caption.hidden = false;
    const sequence = gsap.timeline({
      onComplete() {
        caption.textContent = 'Caller, call room, agents, and business tools connected.';
        disposeDepth?.();
        disposeDepth = undefined;
      },
    });
    timeline = sequence;
    nodes.forEach((node, index) => {
      sequence.call(() => { caption.textContent = labels[index]; });
      sequence.fromTo(node, { ...centers[index], autoAlpha: 0, zIndex: 3 },
        { autoAlpha: 1, duration: .3, ease: 'sine.inOut', immediateRender: false });
      sequence.to(node, {
        x: centers[index].x * .52 + (index % 2 ? 16 : -16),
        y: centers[index].y * .52 - 15,
        scale: 1.08, duration: .32, delay: .32, ease: 'sine.in',
      });
      sequence.to(node, { x: 0, y: 0, scale: 1, duration: .37, ease: 'sine.out' });
      sequence.set(node, { clearProps: 'zIndex' });
    });
    sequence.to(wires, { autoAlpha: 1, duration: .55, ease: 'sine.inOut' });
    void addDepth(sequence);
  }

  replay.addEventListener('click', play);
  replay.hidden = reducedMotion.matches;
  reducedMotion.addEventListener('change', () => {
    replay.hidden = reducedMotion.matches;
    if (reducedMotion.matches) reset();
  });
  const observer = new IntersectionObserver(entries => {
    if (!entries[0].isIntersecting) return;
    observer.disconnect();
    play();
  }, { threshold: .4 });
  observer.observe(board);
  window.addEventListener('resize', () => {
    if (timeline?.isActive()) reset();
  });
})();

(() => {
  const dashboard = document.querySelector('.dashboard-preview');
  if (!dashboard || !('IntersectionObserver' in window)) return;
  const metrics = [...dashboard.querySelectorAll('[data-count]')];
  const status = dashboard.querySelector('.dashboard-status');
  const toggle = dashboard.querySelector('.dashboard-motion-toggle');
  const motion = matchMedia('(prefers-reduced-motion: reduce)');
  const messages = ['Call summaries ready', 'Team availability updated', 'Customer follow-ups ready'];
  let visible = false;
  let paused = false;
  let counted = false;
  let index = 0;
  let timer;
  let frame;
  let transition;

  function countUp(now, start = now) {
    const elapsed = Math.min((now - start) / 1150, 1);
    const progress = 1 - (1 - elapsed) ** 3;
    for (const metric of metrics) {
      metric.textContent = Math.round(Number(metric.dataset.count) * progress) + metric.dataset.unit;
    }
    if (elapsed < 1) frame = requestAnimationFrame(time => countUp(time, start));
  }

  function updatePlayback() {
    clearInterval(timer);
    transition?.cancel();
    toggle.hidden = motion.matches;
    toggle.setAttribute('aria-label', paused ? 'Resume status' : 'Pause status');
    toggle.querySelector('path').setAttribute('d', paused ? 'M8 5v14l11-7z' : 'M8 5h3v14H8zm5 0h3v14h-3z');
    if (motion.matches) {
      cancelAnimationFrame(frame);
      for (const metric of metrics) metric.textContent = metric.dataset.count + metric.dataset.unit;
      status.textContent = messages[0];
      return;
    }
    if (!visible || document.hidden) return;
    if (!counted) {
      counted = true;
      frame = requestAnimationFrame(countUp);
    }
    if (paused) return;
    timer = setInterval(() => {
      index = (index + 1) % messages.length;
      status.textContent = messages[index];
      transition = status.animate([{ opacity: .25, transform: 'translateY(3px)' }, { opacity: 1, transform: 'none' }], { duration: 330, easing: 'ease-in-out' });
    }, 3600);
  }

  new IntersectionObserver(([entry]) => {
    visible = entry.isIntersecting;
    updatePlayback();
  }, { threshold: .2 }).observe(dashboard);
  toggle.addEventListener('click', () => {
    paused = !paused;
    updatePlayback();
  });
  motion.addEventListener('change', updatePlayback);
  document.addEventListener('visibilitychange', updatePlayback);
})();
