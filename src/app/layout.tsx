import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
import Script from "next/script";
import { GoogleOneTap } from "@/components/auth/GoogleOneTap";
import { PWAHandler } from "@/components/PWAHandler";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  metadataBase: new URL("https://liturgiasje.vercel.app"),
  title: "Gestão de Leitores - Liturgia SJE",
  description: "Sistema de gestão de escalas e comunicação para o ministério de leitores.",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Liturgia SJE",
  },
  icons: {
    icon: [
      { url: '/icons/favicon.ico' },
      { url: '/icons/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
      { url: '/icons/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
    ],
    apple: [
      { url: '/icons/apple-touch-icon.png' },
    ],
  },
};

export const viewport = {
  themeColor: "#322113",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" className="h-full" suppressHydrationWarning>
      <body className={`${inter.className} min-h-full bg-background text-foreground antialiased`}>
        <PWAHandler />
        {children}
        <Toaster />
        <GoogleOneTap />
        <Script 
          src="https://accounts.google.com/gsi/client" 
          strategy="afterInteractive"
        />
      </body>
    </html>
  );
}
