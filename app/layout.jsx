import '../styles/global.css';
import { SITE_BRAND } from '../lib/seo';
export const metadata = {
    title: SITE_BRAND,
    description: `${SITE_BRAND} – Reliable intercity cab booking service`,
    openGraph: {
        title: SITE_BRAND,
        description: `${SITE_BRAND} – Reliable intercity cab booking service`,
    },
    twitter: {
        card: 'summary_large_image',
        title: SITE_BRAND,
        description: `${SITE_BRAND} – Reliable intercity cab booking service`,
    },
};
export default function RootLayout({ children, }) {
    return (<html lang="en">
      <body>
        {children}
      </body>
    </html>);
}
