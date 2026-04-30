import type { Metadata } from 'next';
import { Manrope, Space_Grotesk } from 'next/font/google';
import {} from 'next/font/google';
import { Providers } from '@/components/providers';
import './globals.css';

const manrope = Manrope({
  variable: '--font-manrope',
  subsets: ['latin'],
  weight: ['400', '500', '600', '700']
});
const spaceGrotesk = Space_Grotesk({
  variable: '--font-space-grotesk',
  subsets: ['latin'],
  weight: ['500', '600', '700']
});

export const metadata: Metadata = {
  title: "clone — Build Your AI Self.",
  description:
    "Create an AI clone of yourself that anyone can talk to, own, and support on Base.",
  icons: {
    icon: "/clone-mark.png",
    apple: "/clone-mark.png",
  },
  openGraph: {
    title: "clone — Build Your AI Self.",
    description:
      "Create an AI clone of yourself that anyone can talk to, own, and support on Base.",
    images: [
      {
        url: "/og_image.png",
        width: 1200,
        height: 630,
        alt: "clone app preview",
      },
    ],
    type: "website",
    siteName: "clone",
    url: "https://clone.fun",
  },
  twitter: {
    card: "summary_large_image",
    title: "clone — Build Your AI Self.",
    description:
      "Create an AI clone of yourself that anyone can talk to, own, and support on Base.",
    images: ["/og_image.png"],
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${manrope.variable} ${spaceGrotesk.variable} antialiased`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
