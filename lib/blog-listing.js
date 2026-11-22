export function renderBlogListing(articles) {
  const cards = articles.map(article => article.cardHtml);
  const categories = [...new Set(cards.map(card =>
    card.match(/class="blog-category-tag"[^>]*>(.*?)<\/span>/)?.[1]
  ).filter(Boolean))];
  return `
    <div class="featured-controls">
      <button type="button" aria-label="Previous featured article" disabled><img src="/assets/icons/arrow-left.svg" width="18" height="18" alt="">Previous</button>
      <button type="button" aria-label="Next featured article">Next<img src="/assets/icons/arrow-right.svg" width="18" height="18" alt=""></button>
    </div>
    <section class="blog-featured" aria-label="Featured articles">
      ${cards.slice(0, 5).join('')}
    </section>
    <div class="blog-toolbar">
      <div class="blog-search-wrap">
        <label class="blog-search">Find an article<img src="/assets/icons/search.svg" width="20" height="20" alt=""><input type="search" placeholder="Search calls, AI, integrations…"></label>
        <div class="blog-search-results" aria-label="Matching articles" hidden></div>
      </div>
      <label class="blog-mobile-filter">View all articles<select aria-label="Filter articles by category">
        <option value="">All articles</option>
        ${categories.map(category => '<option>' + category + '</option>').join('')}
      </select></label>
    </div>
    <p class="blog-filter-status" aria-live="polite">${cards.length} articles</p>
    <div class="blog-grid">${cards.join('')}</div>`;
}
