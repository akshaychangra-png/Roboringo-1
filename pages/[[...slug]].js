import SitePage from '../components/SitePage';
import { getPage, routes, shell } from '../lib/content';

export default SitePage;

export function getStaticPaths() {
  return { paths: routes.map(route => ({ params: { slug: route === '/' ? [] : route.slice(1).split('/') } })), fallback: false };
}
export function getStaticProps({ params }) {
  const page = getPage('/' + (params.slug || []).join('/'));
  return page ? { props: { page, shell } } : { notFound: true };
}
