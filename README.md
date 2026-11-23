# RoboRingo Next.js

Requires Node.js 18.18 or newer. Install with npm ci.

- npm run dev starts the development preview at http://localhost:8830.
- npm run build creates the production build.
- npm start serves the production build at http://localhost:8830.

Page content lives in content/pages. Blog content lives in content/blogs. Each JSON record contains the route, title, description, article HTML, and listing card HTML. Add or edit a blog record, then rebuild. Routes, the blog listing, and /sitemap.xml read these records automatically.

Shared navigation and footer markup live in content/shell.json. React renders the shared shell through components/SitePage.js. Existing animation scripts are retained in public and initialize after React mounts. Internal navigation currently uses ordinary links and full page loads to safely reinitialize these scripts.

## Contact and enquiry email

Both forms (homepage and Contact Us) use the shared `lib/form-submit-client.js` handler and FormSubmit AJAX. No mail server, SMTP credentials, or API keys are needed. Set `FORMSUBMIT_RECIPIENT` in `.env.local` or the deployment environment; the default public form alias mapped to Amit’s inbox is defined once in `lib/form-config.js`. The current site uses the activated public alias rather than the email-address endpoint. Rebuild/redeploy after changing it. If FormSubmit supplies a public activated form ID, set `FORMSUBMIT_FORM_ID` to that ID instead; it takes precedence over the email destination. Do not use an activation-link token. This destination is public in the form endpoint; it is not a secret.

One-time activation: submit an enquiry from the deployed website, open FormSubmit’s confirmation email in the recipient inbox (check spam), and click the activation link. Then send another test enquiry and confirm receipt. Until activation, a successful AJAX response means FormSubmit accepted the request, not that an enquiry reached the inbox. FormSubmit may require activation for a new site/origin.

All fields, form name, page URL, timestamp, and enquiry topic are included, with the visitor’s email as Reply-To. `_honey` is the supported spam trap. `_captcha=false` keeps AJAX submission on-page without a CAPTCHA redirect; no autoresponse is used. Failure preserves entered values, success resets the form, and the submit button stays disabled during the request. Requests time out after 25 seconds; there are no automatic retries to avoid duplicate messages.

Run `node --test tests/form-submit.test.mjs` for mocked transport checks. These checks never send email. A CMS admin interface is not configured.

The original static review remains in ../robo-ringo00 and is served separately at port 8820.

The AJAX request explicitly supplies the clean form URL as both `_url` and the per-request referrer to avoid origin-only versus full-path activation mismatches. Query strings and fragments are excluded; no global referrer policy is changed.
