import { routes } from '../lib/content';
export default function Sitemap() { return null; }
export function getServerSideProps({ res }) {
  const entries = routes.map(route => '<url><loc>https://roboringo.com' + route + '</loc></url>').join('');
  res.setHeader('Content-Type', 'application/xml');
  res.end('<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">' + entries + '</urlset>');
  return { props: {} };
}
