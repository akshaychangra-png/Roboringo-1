import { Html, Head, Main, NextScript } from 'next/document';
const theme = "(function(){try{document.documentElement.dataset.theme=localStorage.getItem('roboringo-theme-v7')==='dark'?'dark':'light'}catch(e){document.documentElement.dataset.theme='light'}})()";
export default function Document() {
  return <Html lang="en" suppressHydrationWarning><Head>
    <link rel="icon" href="/assets/logos/roboringo-mark.svg" type="image/svg+xml" />
    <script dangerouslySetInnerHTML={{ __html: theme }} />
  </Head><body><Main /><NextScript /></body></Html>;
}
