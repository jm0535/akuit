import type { Metadata } from "next";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { ThemeProvider } from "@/lib/theme-provider";
import { AnimatedBackground } from "@/components/ui/animated-background";

export const metadata: Metadata = {
  title: "Akuit - Acquittal Review & Reporting",
  description: "Enterprise acquittal review and reporting system. AI-powered document analysis, compliance checking, and comprehensive reporting.",
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
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="antialiased bg-background text-foreground font-sans">
        <ThemeProvider>
          <AnimatedBackground />
          {children}
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
