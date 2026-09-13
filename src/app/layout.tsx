import type { Metadata, Viewport } from "next";
import "./globals.css";
import Providers from "@/components/Providers";

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXTAUTH_URL ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000")
  ),
  title: "iMessage — Next-Gen Encrypted Messaging",
  description: "Advanced Apple iMessage real-time messaging, screen effects, voice notes & WebRTC calling",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "iMessage",
  },
  other: {
    "mobile-web-app-capable": "yes",
    "apple-mobile-web-app-capable": "yes",
    "apple-mobile-web-app-status-bar-style": "black-translucent",
    "apple-mobile-web-app-title": "iMessage",
    "application-name": "iMessage",
    "msapplication-TileColor": "#09090b",
    "msapplication-tap-highlight": "no",
    "format-detection": "telephone=no",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: dark)", color: "#09090b" },
    { media: "(prefers-color-scheme: light)", color: "#09090b" },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <head>
        <link rel="manifest" href="/manifest.json" />
        <link rel="apple-touch-icon" href="/icon-192.png" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="iMessage" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="theme-color" content="#09090b" />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                function setAppHeight() {
                  var h = window.innerHeight;
                  if (window.visualViewport && window.visualViewport.height) {
                    h = Math.min(window.innerHeight, window.visualViewport.height);
                  }
                  document.documentElement.style.setProperty('--app-height', h + 'px');
                }
                setAppHeight();
                window.addEventListener('resize', setAppHeight, { passive: true });
                window.addEventListener('orientationchange', setAppHeight, { passive: true });
                if (window.visualViewport) {
                  window.visualViewport.addEventListener('resize', setAppHeight, { passive: true });
                }
              })();
            `,
          }}
        />
      </head>
      <body className="antialiased bg-neutral-950 text-white h-full w-full overflow-hidden select-none">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
