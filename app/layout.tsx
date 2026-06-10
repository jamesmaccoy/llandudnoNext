import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import NavHeader from "@/components/NavHeader";
import { AuthProvider } from "@/components/auth";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Llandudno Booking Engine",
  description: "Next.js Rebuild of Yoco & Firebase Booking Flow",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-zinc-950 text-white">
        <AuthProvider>
          <NavHeader />
          <main className="flex-1 flex flex-col relative">{children}</main>
        </AuthProvider>
      </body>
    </html>
  );
}
