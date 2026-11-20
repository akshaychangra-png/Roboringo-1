const blogCards = [...document.querySelectorAll('.blog-page .blog-grid .blog-card')];
const listing = location.pathname.replace(/\/$/, '') === '/blogs';

document.querySelectorAll('.article-faq-question').forEach(button => {
  const answer = document.getElementById(button.getAttribute('aria-controls'));
  if (!answer) return;
  answer.hidden = button.getAttribute('aria-expanded') !== 'true';
  button.addEventListener('click', () => {
    const expanded = button.getAttribute('aria-expanded') === 'true';
    button.setAttribute('aria-expanded', String(!expanded));
    answer.hidden = expanded;
  });
});

const articleBody = document.querySelector('.blog-article-body');
if (articleBody) {
  const content = articleBody.querySelector('.article-body-content');
  const headings = [...(content?.querySelectorAll('h2') || [])];
  if (headings.length) {
    const sidebar = document.querySelector('.article-highlights');
    const navigation = sidebar.querySelector('nav');
    const links = [...navigation.querySelectorAll('a')];
    links.forEach((link, index) => {
      link.addEventListener('click', event => {
        event.preventDefault();
        event.stopPropagation();
        const headerHeight = document.querySelector('header').getBoundingClientRect().height;
        const top = window.scrollY + headings[index].getBoundingClientRect().top - headerHeight - 24;
        window.dispatchEvent(new CustomEvent('article-section-scroll', {
          detail: { top, reducedMotion: matchMedia('(prefers-reduced-motion: reduce)').matches }
        }));
      });
    });
    const [back, forward] = sidebar.querySelectorAll('.article-section-controls button');
    let sectionStart = 0;
    function showSections(start) {
      sectionStart = Math.max(0, Math.min(start, Math.max(0, links.length - 3)));
      links.forEach((link, index) => { link.hidden = index < sectionStart || index >= sectionStart + 3; });
      if (back) back.disabled = sectionStart === 0;
      if (forward) forward.disabled = sectionStart + 3 >= links.length;
    }
    back?.addEventListener('click', () => showSections(sectionStart - 3));
    forward?.addEventListener('click', () => showSections(sectionStart + 3));
    showSections(0);
    let lastActiveIndex = -1;
    let scheduled = false;
    function updateCurrentSection() {
      scheduled = false;
      const activeIndex = headings.reduce((current, heading, index) =>
        heading.getBoundingClientRect().top <= document.querySelector('header').getBoundingClientRect().height + 80 ? index : current, 0);
      if (activeIndex !== lastActiveIndex) {
        showSections(Math.floor(activeIndex / 3) * 3);
        lastActiveIndex = activeIndex;
      }
      links.forEach((link, index) => {
        if (index === activeIndex) link.setAttribute('aria-current', 'location');
        else link.removeAttribute('aria-current');
      });
    }
    window.addEventListener('scroll', () => {
      if (scheduled) return;
      scheduled = true;
      requestAnimationFrame(updateCurrentSection);
    }, { passive: true });
    updateCurrentSection();
  }
}

if (listing && blogCards.length) {
  const search = document.querySelector('.blog-search input');
  const results = document.querySelector('.blog-search-results');
  const select = document.querySelector('.blog-mobile-filter select');
  const wrap = document.querySelector('.blog-search-wrap');
  let index = blogCards.map(card => ({
    title: card.querySelector('.blog-card-title').textContent.trim(),
    url: card.querySelector('.blog-card-link').getAttribute('href'),
    description: card.querySelector('.blog-card-excerpt')?.textContent || ''
  }));
  function normalize(value) {
    try { value = decodeURIComponent(value); } catch {}
    return value.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
  }
  function renderResults() {
    let query = search.value.trim();
    results.replaceChildren();
    results.hidden = !query;
    if (!query) return;
    if (query.includes('/blogs/')) query = query.split('/blogs/')[1].split(/[?#]/)[0];
    const terms = normalize(query).split(' ').filter(Boolean);
    const matches = index.filter(article =>
      terms.every(term => normalize(article.title + ' ' + article.url + ' ' + article.description).includes(term))
    ).slice(0, 4);
    if (!matches.length) {
      const message = document.createElement('p');
      message.textContent = 'No articles found. Try another topic.';
      results.append(message);
    }
    matches.forEach(article => {
      const link = document.createElement('a');
      link.href = article.url;
      const title = document.createElement('strong');
      title.textContent = article.title;
      const url = document.createElement('span');
      url.textContent = article.url;
      link.append(title, url);
      results.append(link);
    });
  }
  search.addEventListener('input', renderResults);
  search.addEventListener('focus', renderResults);
  search.addEventListener('keydown', event => {
    if (event.key === 'Escape') results.hidden = true;
    if (event.key === 'ArrowDown' && !results.hidden) {
      event.preventDefault();
      results.querySelector('a')?.focus();
    }
  });
  document.addEventListener('click', event => {
    if (!wrap.contains(event.target)) results.hidden = true;
  });
  fetch('/api/blogs').then(response => {
    if (!response.ok) throw new Error('Search unavailable');
    return response.json();
  }).then(articles => { index = articles; renderResults(); }).catch(() => {});
  select.addEventListener('change', () => {
    let count = 0;
    blogCards.forEach(card => {
      const visible = !select.value || card.querySelector('.blog-category-tag').textContent.trim() === select.value;
      (card.closest('.blog-grid > *') || card).hidden = !visible;
      if (visible) count++;
    });
    document.querySelector('.blog-filter-status').textContent = `${count} articles`;
  });
  const featured = document.querySelector('.blog-featured');
  const [previous, next] = document.querySelectorAll('.featured-controls button');
  function move(direction) {
    const first = featured.querySelector('.blog-card');
    const gap = parseFloat(getComputedStyle(featured).columnGap) || 0;
    featured.scrollBy({ left: direction * (first.getBoundingClientRect().width + gap),
      behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth' });
  }
  previous.addEventListener('click', () => move(-1));
  next.addEventListener('click', () => move(1));
  function updateControls() {
    previous.disabled = featured.scrollLeft <= 2;
    next.disabled = featured.scrollLeft + featured.clientWidth >= featured.scrollWidth - 2;
  }
  featured.addEventListener('scroll', updateControls, { passive: true });
  window.addEventListener('resize', updateControls);
  updateControls();
}
