export function renderArticleLayout(markup, route) {
  return markup.replace(/<article class="blog-article-body"[^>]*>[\s\S]*?<\/article>/, article => {
    let banner = '';
    article = article.replace(/<div class="article-cta">[\s\S]*?<\/div><\/div>/, match => {
      banner = match;
      return '';
    });
    const headings = [];
    article = article.replace(/<h2([^>]*)>([\s\S]*?)<\/h2>/g, (heading, attributes, title) => {
      const id = attributes.match(/\bid="([^"]+)"/)?.[1] || 'article-section-' + (headings.length + 1);
      headings.push({ id, title });
      return '<h2' + (attributes.includes('id=') ? attributes : attributes + ' id="' + id + '"') + '>' + title + '</h2>';
    });
    article = article.replace(/(<div\b[^>]*class="article-faq-answer"[^>]*)(>)/g, '$1 hidden$2');
    if (!headings.length) return article + banner;
    const sidebar = `<aside class="article-highlights" aria-label="Article highlights">
      <a class="article-explore primary" href="https://calendly.com/amit-mds" target="_blank" rel="noopener"><img src="/assets/icons/phone.png" width="22" height="22" alt="">Book a Demo</a>
      <h2>In this article</h2>
      <nav aria-label="Jump to a section">${headings.map((heading, index) =>
        '<a href="' + route + '#' + heading.id + '"' + (index > 2 ? ' hidden' : '') +
        (index === 0 ? ' aria-current="location"' : '') + '><span>' + heading.title + '</span></a>'
      ).join('')}</nav>
      ${headings.length > 3 ? '<div class="article-section-controls"><button type="button" disabled>Previous</button><button type="button">Next</button></div>' : ''}
    </aside>`;
    return '<div class="article-reading-layout">' + article + sidebar + '</div>' + banner;
  });
}
