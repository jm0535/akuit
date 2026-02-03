import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { ThemeProvider } from "@/lib/theme-provider";
import { AnimatedBackground } from "@/components/ui/animated-background";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Akuit - Acquittal Review & Reporting",
  description: "Premium enterprise acquittal review and reporting system. AI-powered document analysis, compliance checking, and comprehensive reporting.",
  keywords: ["Akuit", "Acquittal", "Compliance", "Audit", "Financial Review", "AI", "Document Analysis"],
  authors: [{ name: "Akuit Team" }],
  icons: {
    icon: "/logo.svg",
  },
  openGraph: {
    title: "Akuit - Acquittal Review & Reporting",
    description: "AI-powered acquittal review system for enterprise compliance",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Akuit - Acquittal Review & Reporting",
    description: "AI-powered acquittal review system for enterprise compliance",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        <ThemeProvider>
          <AnimatedBackground />
          {children}
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
