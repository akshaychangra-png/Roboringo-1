import fs from 'node:fs';
import { renderBlogListing } from './blog-listing';
import { renderArticleLayout } from './article-layout';
import path from 'node:path';

const root = path.join(process.cwd(), 'content');
export const routes = ['pages', 'blogs'].flatMap(folder =>
  fs.readdirSync(path.join(root, folder)).filter(file => file.endsWith('.json')).map(file =>
    JSON.parse(fs.readFileSync(path.join(root, folder, file), 'utf8')).route
  )
);
export function getPage(route) {
  const name = (route.replace(/^\/+|\/+$/g, '').replaceAll('/', '--') || 'home') + '.json';
  const folder = route.startsWith('/blogs/') ? 'blogs' : 'pages';
  const file = path.join(root, folder, name);
  if (!fs.existsSync(file)) return null;
  const page = JSON.parse(fs.readFileSync(file, 'utf8'));
  if (route === '/blogs') {
    const articles = fs.readdirSync(path.join(root, 'blogs'))
      .map(name => JSON.parse(fs.readFileSync(path.join(root, 'blogs', name), 'utf8')))
      .filter(article => article.cardHtml);
    page.html = page.html.replace('<!--BLOG_GRID-->',
      renderBlogListing(articles));
  }
  if (route.startsWith('/blogs/')) page.html = renderArticleLayout(page.html, route);
  return page;
}
export const shell = JSON.parse(fs.readFileSync(path.join(root, 'shell.json'), 'utf8'));
