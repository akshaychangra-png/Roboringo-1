import { parseDocument } from 'htmlparser2';
import serialize from 'dom-serializer';

function findAll(node, predicate) {
  const matches = predicate(node) ? [node] : [];
  return matches.concat((node.children || []).flatMap(child => findAll(child, predicate)));
}

function hasClass(node, name) {
  return (node.attribs?.class || '').split(/\s+/).includes(name);
}

function removeNode(node) {
  if (node?.parent) node.parent.children = node.parent.children.filter(child => child !== node);
}

export function renderArticleLayout(markup, route) {
  const document = parseDocument(markup);
  const article = findAll(document, node => hasClass(node, 'blog-article-body'))[0];
  if (!article) return markup;

  const banner = findAll(article, node => hasClass(node, 'article-cta'))[0];
  if (banner) {
    const inner = findAll(banner, node => hasClass(node, 'article-cta-inner'))[0];
    (inner?.children || []).filter(node => node.name === 'div').forEach(group => {
      group.attribs.class = ((group.attribs.class || '') + ' article-cta-buttons').trim();
    });
  }
  removeNode(banner);

  // Older articles include their own contents list. The shared sidebar supplies it.
  const content = findAll(article, node => hasClass(node, 'article-body-content'))[0] || article;
  for (const heading of findAll(content, node => node.name === 'h2')) {
    const text = serialize(heading.children).replace(/<[^>]+>/g, '').trim();
    if (text.toLowerCase() !== 'table of contents') continue;
    const siblings = heading.parent.children;
    const position = siblings.indexOf(heading);
    const list = siblings.slice(position + 1).find(node => node.type !== 'text' || node.data.trim());
    if (list?.name === 'ul' || list?.name === 'ol') removeNode(list);
    removeNode(heading);
  }
  const headings = findAll(content, node => node.name === 'h2');
  headings.forEach((heading, index) => {
    if (!heading.attribs.id) heading.attribs.id = 'article-section-' + (index + 1);
  });
  findAll(article, node => hasClass(node, 'article-faq-answer')).forEach(answer => {
    answer.attribs.hidden = '';
  });
  if (!headings.length) return serialize(document);

  const sidebar = parseDocument(`<aside class="article-highlights" aria-label="Article highlights">
    <a class="article-explore primary" href="https://calendly.com/amit-mds" target="_blank" rel="noopener"><img src="/assets/icons/phone.png" width="22" height="22" alt="">Book a Demo</a>
    <h2>In this article</h2>
    <nav aria-label="Jump to a section">${headings.map((heading, index) =>
      '<a href="' + route + '#' + heading.attribs.id + '"' + (index > 2 ? ' hidden' : '') +
      (index === 0 ? ' aria-current="location"' : '') + '><span>' + serialize(heading.children) + '</span></a>'
    ).join('')}</nav>
    ${headings.length > 3 ? '<div class="article-section-controls"><button type="button" disabled>Previous</button><button type="button">Next</button></div>' : ''}
  </aside>`).children[0];
  const parent = article.parent;
  const position = parent.children.indexOf(article);
  const layout = parseDocument('<div class="article-reading-layout"></div>').children[0];
  layout.children = [article, sidebar];
  layout.parent = parent;
  article.parent = layout;
  sidebar.parent = layout;
  const replacement = [layout];
  if (banner) {
    banner.parent = parent;
    replacement.push(banner);
  }
  parent.children.splice(position, 1, ...replacement);
  return serialize(document);
}
