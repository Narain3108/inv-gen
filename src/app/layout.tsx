import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "sonner";
import { ThemeProvider } from "@/contexts/ThemeContext";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: 'swap',
});

export const metadata: Metadata = {
  title: "InvoiceHub - Professional GST Invoice Generator",
  description: "Modern, mobile-first invoice billing system for Indian businesses with GST compliance. Create professional invoices instantly.",
  icons: {
    icon: "/loo.jpg",
    shortcut: "/loo.jpg",
    apple: "/loo.jpg",
  },
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#0a0a0a' },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning className="overflow-x-hidden">
      <body className={`${inter.variable} font-sans antialiased overflow-x-hidden`}>
        <ThemeProvider>
          {children}
          <Toaster 
            position="top-right" 
            richColors 
            closeButton 
            toastOptions={{
              className: 'dark:bg-gray-800 dark:text-white dark:border-gray-700',
            }}
          />
        </ThemeProvider>
      </body>
    </html>
  );
}
