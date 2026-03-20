import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/ThemeProvider";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { ApiErrorDialog } from "@/components/api-error-dialog";
import Script from "next/script";

export const metadata: Metadata = {
  title: "学古诗",
  description: "学习古诗词",
};

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN" suppressHydrationWarning>
      <head>
        <link rel="stylesheet" href="https://unpkg.com/heti/umd/heti.min.css" />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased heti--classic`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <div className="flex flex-col min-h-screen">
            <Header />
            <main className="flex-1 overflow-y-auto pt-14 md:pt-16 pb-10 md:pb-12">
              {children}
            </main>
            <Footer />
          </div>
          <ApiErrorDialog />
        </ThemeProvider>
      </body>
    </html>
  );
}
