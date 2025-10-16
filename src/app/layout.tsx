import { ClerkProvider } from '@clerk/nextjs';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Emineon - AI-First Recruitment Platform',
  description: 'Modern recruitment platform built for the future of hiring',
  icons: {
    icon: 'https://res.cloudinary.com/emineon/image/upload/v1749926503/Emineon_logo_tree_k8n5vj.png',
    shortcut: 'https://res.cloudinary.com/emineon/image/upload/v1749926503/Emineon_logo_tree_k8n5vj.png',
    apple: 'https://res.cloudinary.com/emineon/image/upload/v1749926503/Emineon_logo_tree_k8n5vj.png',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const publishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY as string | undefined;
  // In dev, load Clerk JS from a public CDN to avoid local network/script blocking issues
  const clerkJSUrl = process.env.NODE_ENV === 'development'
    ? 'https://cdn.jsdelivr.net/npm/@clerk/clerk-js@latest/dist/clerk.browser.js'
    : undefined;
  return (
    <ClerkProvider publishableKey={publishableKey} clerkJSUrl={clerkJSUrl}>
      <html lang="en">
        <body className={inter.className}>
          {children}
        </body>
      </html>
    </ClerkProvider>
  );
} 