import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import AuthProvider from "@/components/providers/AuthProvider";
import { Toaster } from "sonner";

const fontSans = Plus_Jakarta_Sans({
  variable: "--font-sans",
  subsets: ["latin"],
  display: "swap",
});

const fontHeading = Plus_Jakarta_Sans({
  variable: "--font-heading",
  subsets: ["latin"],
  weight: ["600", "700", "800"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Galactic Jewelry | Dashboard",
  description: "Adult Futuristic Dashboard for Media Reports",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${fontSans.variable} ${fontHeading.variable} dark h-full antialiased`}
    >
      <body className="min-h-full flex flex-col font-sans">
        <AuthProvider>
          {children}
          <Toaster position="top-right" richColors theme="dark" />
        </AuthProvider>
      </body>
    </html>
  );
}
