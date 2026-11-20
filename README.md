# RoboRingo Next.js

Requires Node.js 18.18 or newer. Install with npm ci.

- npm run dev starts the development preview at http://localhost:8830.
- npm run build creates the production build.
- npm start serves the production build at http://localhost:8830.

Page content lives in content/pages. Blog content lives in content/blogs. Each JSON record contains the route, title, description, article HTML, and listing card HTML. Add or edit a blog record, then rebuild. Routes, the blog listing, and /sitemap.xml read these records automatically.

Shared navigation and footer markup live in content/shell.json. React renders the shared shell through components/SitePage.js. Existing animation scripts are retained in public and initialize after React mounts. Internal navigation currently uses ordinary links and full page loads to safely reinitialize these scripts.

The contact form retains the reviewed email-draft behavior. A production mail service and CMS admin interface are not configured. The previous site's private /api/contact implementation and CMS credentials were unavailable.

The original static review remains in ../robo-ringo00 and is served separately at port 8820.
