import type { Metadata } from "next";
import { Outfit, Fira_Code } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { ThemeProvider } from "@/components/theme-provider";
import { RealtimeProvider } from "@/components/realtime-provider";
import { SessionProvider } from "@/components/session-provider";

const outfit = Outfit({
  variable: "--font-sans",
  subsets: ["latin"],
});

const firaCode = Fira_Code({
  variable: "--font-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "TiketKu - Online Ticketing System",
  description: "Platform ticketing online yang modern dan scalable untuk event management. Beli tiket dengan mudah dan aman.",
  keywords: ["TiketKu", "ticketing", "event", "online", "Next.js", "TypeScript", "Tailwind CSS"],
  authors: [{ name: "TiketKu Team" }],
  icons: {
    icon: "https://z-cdn.chatglm.cn/z-ai/static/logo.svg",
  },
  openGraph: {
    title: "TiketKu - Online Ticketing System",
    description: "Platform ticketing online yang modern dan scalable",
    url: "https://tiketku.com",
    siteName: "TiketKu",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "TiketKu - Online Ticketing System",
    description: "Platform ticketing online yang modern dan scalable",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" suppressHydrationWarning>
      <body
        className={`${outfit.variable} ${firaCode.variable} antialiased bg-background text-foreground font-sans`}
      >
        <ThemeProvider
          defaultTheme="system"
          storageKey="tiketku-theme"
        >
          <SessionProvider>
            <RealtimeProvider>
              {children}
              <Toaster />
            </RealtimeProvider>
          </SessionProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
