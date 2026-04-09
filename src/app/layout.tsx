import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
import Script from "next/script";
import { GoogleOneTap } from "@/components/auth/GoogleOneTap";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Gestão de Leitores - Liturgia SJE",
  description: "Sistema de gestão de escalas e comunicação para o ministério de leitores.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" className="h-full" suppressHydrationWarning>
      <body className={`${inter.className} min-h-full bg-background text-foreground antialiased`}>
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
