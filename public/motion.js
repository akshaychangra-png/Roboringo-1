/* Local classic scripts keep the page compatible with file:// previews. */
(() => {
  'use strict';
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const host=document.querySelector('.voice-sculpture');
  if (!host || !window.THREE) return;
  let renderer;
  try { renderer=new THREE.WebGLRenderer({alpha:true,antialias:devicePixelRatio<2,powerPreference:'low-power'}); }
  catch { return; }
  renderer.setPixelRatio(Math.min(devicePixelRatio,1.6));
  renderer.setClearColor(0x000000,0);
  renderer.domElement.setAttribute('aria-hidden','true');
  host.append(renderer.domElement);
  const scene=new THREE.Scene();
  const camera=new THREE.PerspectiveCamera(36,1,.1,100);camera.position.z=9;
  scene.add(new THREE.AmbientLight(0xc9eec6,1.4));
  const light=new THREE.DirectionalLight(0xdbffc0,3);light.position.set(2,3,4);scene.add(light);
  const rim=new THREE.PointLight(0x75bc84,13);rim.position.set(-3,-2,3);scene.add(rim);
  const group=new THREE.Group();scene.add(group);
  const material=new THREE.MeshStandardMaterial({color:0x7caa85,metalness:.55,roughness:.3,transparent:true,opacity:.65});
  const geo=new THREE.TorusGeometry(2.06,.032,8,120);
  for(let i=0;i<18;i++){
    const mesh=new THREE.Mesh(geo,material);mesh.rotation.y=(i-9)*.055;mesh.rotation.x=.35;mesh.scale.setScalar(1+i*.017);mesh.position.z=(i-9)*.035;group.add(mesh);
  }
  group.rotation.z=-.35;group.rotation.y=.75;group.position.x=.25;
  let visible=true,frame=0,targetX=0,targetY=0;
  function resize(){const r=host.getBoundingClientRect();if(!r.width||!r.height)return;renderer.setSize(r.width,r.height,false);camera.aspect=r.width/r.height;camera.updateProjectionMatrix();render(performance.now());}
  function render(t){group.rotation.y=.75+Math.sin(t*.00018)*.16+targetX;group.rotation.x=Math.sin(t*.00022)*.07+targetY;renderer.render(scene,camera);}
  function tick(t){frame=0;if(!visible||document.hidden||reduced.matches)return;render(t);frame=requestAnimationFrame(tick);}
  function sync(){if(frame)cancelAnimationFrame(frame);frame=0;if(visible&&!document.hidden&&!reduced.matches)frame=requestAnimationFrame(tick);else render(0);}
  const viewport=new IntersectionObserver(entries=>{visible=entries[0].isIntersecting;sync();});viewport.observe(host);
  const sizes=new ResizeObserver(resize);sizes.observe(host);
  const hero=document.querySelector('.hero');hero.addEventListener('pointermove',e=>{if(e.pointerType==='touch'||reduced.matches)return;const r=hero.getBoundingClientRect();targetX=((e.clientX-r.left)/r.width-.5)*.12;targetY=((e.clientY-r.top)/r.height-.5)*.06;},{passive:true});
  hero.addEventListener('pointerleave',()=>{targetX=targetY=0;});
  document.addEventListener('visibilitychange',sync);reduced.addEventListener('change',sync);
  renderer.domElement.addEventListener('webglcontextlost',e=>{e.preventDefault();if(frame)cancelAnimationFrame(frame);host.replaceChildren();sizes.disconnect();viewport.disconnect();});
  window.addEventListener('pagehide',()=>{if(frame)cancelAnimationFrame(frame);sizes.disconnect();viewport.disconnect();geo.dispose();material.dispose();renderer.dispose();},{once:true});
  resize();sync();
})();

/* Roll the hero phrase upward, then leave time to read it. */
(() => {
  const phrases = [...document.querySelectorAll('.hero-roll-phrase')];
  if (phrases.length < 2 || !phrases[0].animate) return;

  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  const timing = { duration: 750, easing: 'cubic-bezier(.45, 0, .55, 1)', fill: 'both' };
  let current = 0;
  let timer;
  let animations = [];

  function schedule() {
    clearTimeout(timer);
    if (!reducedMotion.matches && !document.hidden) timer = setTimeout(roll, 3600);
  }

  async function roll() {
    window.dispatchEvent(new Event('hero-phrase-roll'));
    const next = (current + 1) % phrases.length;
    const outgoing = phrases[current];
    const incoming = phrases[next];
    incoming.classList.add('is-rolling');

    const transition = [
      outgoing.animate([{ transform: 'translateY(0)' }, { transform: 'translateY(-110%)', opacity: 0 }], timing),
      incoming.animate([{ transform: 'translateY(110%)', opacity: 0 }, { transform: 'translateY(0)', opacity: 1 }], timing),
    ];
    animations = transition;
    await Promise.allSettled(transition.map(animation => animation.finished));
    if (animations !== transition) return;

    outgoing.classList.remove('is-current');
    incoming.classList.replace('is-rolling', 'is-current');
    transition.forEach(animation => animation.cancel());
    animations = [];
    current = next;
    schedule();
  }

  reducedMotion.addEventListener('change', () => {
    animations.forEach(animation => animation.cancel());
    animations = [];
    current = 0;
    phrases.forEach((phrase, index) => {
      phrase.classList.remove('is-rolling');
      phrase.classList.toggle('is-current', index === 0);
    });
    schedule();
  });
  document.addEventListener('visibilitychange', () => {
    if (!animations.length) schedule();
  });
  schedule();
})();


/* Decode the reel artwork before it starts moving. The hero layout stays in place. */
(() => {
  const root = document.documentElement;
  if (!root.classList.contains('reels-loading')) return;

  const sources = ['industries-collage', 'industries-business', 'industries-services'];
  const images = sources.map(name => {
    const image = new Image();
    image.src = 'assets/images/' + name + '.jpg';
    return image;
  });
  Promise.allSettled(images.map(image => image.decode())).then(() => {
    root.classList.remove('reels-loading');
  });
})();
