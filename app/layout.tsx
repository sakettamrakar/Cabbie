import type { ReactNode } from 'react';
import '../styles/global.css';

export const metadata = {
  title: 'Cabbie',
  description: 'Reliable intercity cab booking',
};

export default function RootLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        {children}
      </body>
    </html>
  );
}
