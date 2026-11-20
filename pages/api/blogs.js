import { routes, getPage } from '../../lib/content';

export default function handler(request, response) {
  if (request.method !== 'GET') {
    response.setHeader('Allow', 'GET');
    return response.status(405).json({ error: 'Method not allowed' });
  }
  const blogs = routes.filter(route => route.startsWith('/blogs/')).map(route => {
    const page = getPage(route);
    return { title: page.title.replace(/\s*\|\s*RoboRingo$/, ''), url: route, description: page.description };
  });
  response.setHeader('Cache-Control', 'public, max-age=60');
  return response.status(200).json(blogs);
}
