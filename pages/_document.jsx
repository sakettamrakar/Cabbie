import Document, { Html, Head, Main, NextScript } from 'next/document';
import fs from 'node:fs';
import path from 'node:path';
let criticalCss = '';
try {
    criticalCss = fs.readFileSync(path.join(process.cwd(), 'styles', 'critical.css'), 'utf8');
}
catch {
    criticalCss = '/* critical css missing */';
}
export default class MyDocument extends Document {
    static async getInitialProps(ctx) {
        const initialProps = await Document.getInitialProps(ctx);
        return { ...initialProps };
    }
    render() {
        return (<Html lang="en">
        <Head>
          {/* Inline critical CSS (keep <10KB gzip) */}
          <style data-critical dangerouslySetInnerHTML={{ __html: criticalCss }}/>
          {/* Example of deferring a global stylesheet if one existed: */}
          {/* <link rel="preload" href="/styles/global.css" as="style" /> */}
          {/* <link rel="stylesheet" href="/styles/global.css" media="print" onLoad="this.media='all'" /> */}
        </Head>
        <body>
          <Main />
          <NextScript />
        </body>
      </Html>);
    }
}
