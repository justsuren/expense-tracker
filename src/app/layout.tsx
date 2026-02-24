import type { Metadata } from "next";
import { Geist, Geist_Mono, Playfair_Display } from "next/font/google";
import Link from "next/link";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800", "900"],
});

export const metadata: Metadata = {
  title: "Expense Tracker",
  description: "Align Partners Expense Submission & Tracking",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${playfair.variable} antialiased`}
      >
        <header className="border-b border-border">
          <nav className="max-w-6xl mx-auto px-6 flex items-center gap-10 h-16">
            <Link href="/expenses" className="flex-shrink-0">
              <span className="border-2 border-foreground px-3 py-1.5 font-serif text-lg font-semibold tracking-tight text-foreground">
                expenses
              </span>
            </Link>
            <div className="flex items-center gap-8 text-sm font-medium text-foreground">
              <Link href="/expenses" className="hover:text-muted-foreground transition-colors">
                All Expenses
              </Link>
            </div>
          </nav>
        </header>
        {children}
      </body>
    </html>
  );
}
