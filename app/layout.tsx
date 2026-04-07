import type { Metadata } from 'next';
import '@/styles/globals.css';

export const metadata: Metadata = {
  title: 'Channel Companion',
  description: 'AI-powered channel management platform',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Channel Companion',
  },
  formatDetection: {
    telephone: false,
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover, user-scalable=no" />
        <meta name="theme-color" content="#157A6E" />
        <meta name="description" content="AI-powered channel management platform" />
        <link rel="manifest" href="/manifest.json" />
        <link rel="icon" href="/icons/icon-192.png" />
        <link rel="apple-touch-icon" href="/icons/icon-192.png" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="Channel Companion" />
        <link href="https://fonts.googleapis.com/css2?family=Newsreader:wght@400;500;600;700&family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
      </head>
      <body>
        {children}
        <PWARegister />
      </body>
    </html>
  );
}

function PWARegister() {
  return (
    <script
      dangerouslySetInnerHTML={{
        __html: `
          if ('serviceWorker' in navigator) {
            window.addEventListener('load', () => {
              navigator.serviceWorker.register('/sw.js').then(reg => {
                console.log('Service Worker registered:', reg);
                // Check for updates immediately and every 60 seconds
                reg.update();
                setInterval(() => reg.update(), 60000);
                // When a new SW is found, tell it to activate immediately
                reg.addEventListener('updatefound', () => {
                  const newWorker = reg.installing;
                  if (newWorker) {
                    newWorker.addEventListener('statechange', () => {
                      if (newWorker.state === 'activated') {
                        console.log('New Service Worker activated — refreshing for latest version');
                        window.location.reload();
                      }
                    });
                  }
                });
              }).catch(err => {
                console.log('Service Worker registration failed:', err);
              });
            });
            // If a new SW takes over, reload to get fresh content
            navigator.serviceWorker.addEventListener('controllerchange', () => {
              console.log('Service Worker controller changed — reloading');
              window.location.reload();
            });
          }
        `,
      }}
    />
  );
}
