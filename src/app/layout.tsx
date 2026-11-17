import type { Metadata, Viewport } from "next";
import { Noto_Sans_Devanagari } from "next/font/google";
import "./globals.css";
import { LanguageProvider } from "@/context/LanguageContext";
import { AuthProvider } from "@/context/AuthContext";
import { Header } from "@/components/layout/Header";
import { BottomNav } from "@/components/layout/BottomNav";

const notoSansDevanagari = Noto_Sans_Devanagari({
  variable: "--font-noto-sans-devanagari",
  subsets: ["devanagari", "latin"],
  weight: ["400", "500", "600", "700", "800"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "KaamXa (काम छ) - Jobs in Nepal",
  description: "काम खोज्ने र दिने ठाउँ / Free mobile-first job marketplace for Nepal.",
  applicationName: "KaamXa",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "KaamXa",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#1F7A4D",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ne" className={notoSansDevanagari.variable}>
      <body className="font-sans min-h-screen flex flex-col bg-brand-bg text-brand-text antialiased">
        <LanguageProvider>
          <AuthProvider>
            <Header />
            <main className="flex-1 max-w-5xl w-full mx-auto px-3 sm:px-6 py-4 pb-24 sm:pb-8">
              {children}
            </main>
            <BottomNav />
          </AuthProvider>
        </LanguageProvider>
      </body>
    </html>
  );
}
