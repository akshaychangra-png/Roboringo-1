import Head from 'next/head';
import { useEffect } from 'react';
import parse from 'html-react-parser';
import { connectEnquiryNavigation } from '../lib/enquiry-navigation';
import { connectEnquiryForms } from '../lib/form-submit-client';

export default function SitePage({ page, shell, formSubmitEndpoint }) {
  useEffect(() => {
    document.body.className = page.bodyClass;
    const disconnectNavigation = connectEnquiryNavigation();
    const disconnectForms = connectEnquiryForms(formSubmitEndpoint);
    let cancelled = false;
    async function loadScripts() {
      for (const source of page.scripts) {
        if (cancelled) return;
        await new Promise(resolve => {
          const script = document.createElement('script');
          script.src = source;
          script.onload = resolve;
          script.onerror = resolve;
          document.body.append(script);
        });
      }
    }
    loadScripts();
    return () => { cancelled = true; disconnectForms(); disconnectNavigation(); };
  }, [page, formSubmitEndpoint]);
  const normalize = value => value.replace(/\/$/, '') || '/';
  const header = shell.header.replace(/<a([^>]*?)href="([^"]+)"([^>]*)>/g, (tag, before, href, after) =>
    normalize(href) === normalize(page.route)
      ? '<a' + before + 'href="' + href + '"' + after + ' aria-current="page">'
      : tag
  );
  return <>
    <Head>
      <title>{page.title}</title>
      {(page.structuredData || []).map((data, index) =>
        <script key={index} type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, '\\u003c') }} />
      )}
      <meta name="description" content={page.description} />
      <link rel="canonical" href={'https://roboringo.com' + page.route} />
      {page.styles.map(href => <link key={href} rel="stylesheet" href={href} />)}
    </Head>
    <div className="site-colour-glow" aria-hidden="true"><i /><i /></div>
    <div className="ambient-texture" aria-hidden="true" />
    <a className="sr-skip" href="#main-content">Skip to content</a>
    {parse(header)}
    <div className="theme-dock"><button className="theme-toggle" type="button" aria-label="Switch color theme" aria-pressed="false"><span className="theme-glyph" aria-hidden="true" /><span className="theme-label">Theme</span></button></div>
    {parse(page.html)}
    {parse(page.extras || "")}
    {parse(shell.footer)}
    <div className="bottom-scroll-blur" aria-hidden="true" />
  </>;
}
