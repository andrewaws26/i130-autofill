import type { Metadata } from "next";
import { DM_Sans, Source_Serif_4 } from "next/font/google";
import "./globals.css";

const dmSans = DM_Sans({
  variable: "--font-dm-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const sourceSerif = Source_Serif_4({
  variable: "--font-source-serif",
  subsets: ["latin"],
  weight: ["400", "600", "700"],
});

export const metadata: Metadata = {
  title: "I-130 AutoFill | Attum Law",
  description:
    "Automated I-130 petition form filling. Upload supporting documents and let AI extract the data, review it, and generate a completed I-130 PDF.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      data-theme="light"
      style={{ colorScheme: 'light' }}
      className={`${dmSans.variable} ${sourceSerif.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col" style={{ fontFamily: "var(--font-dm-sans), 'DM Sans', sans-serif" }}>
        <header
          className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 py-3"
          style={{
            background: "var(--card-bg)",
            borderBottom: "1px solid var(--border-light)",
          }}
        >
          <div
            className="text-xl font-semibold tracking-tight"
            style={{
              fontFamily: "var(--font-source-serif), 'Source Serif 4', serif",
              color: "var(--heading)",
            }}
          >
            I-130 AutoFill
          </div>
          <div
            className="text-sm"
            style={{ color: "var(--muted)" }}
          >
            Attum Law Office
          </div>
        </header>
        <main className="flex-1 pt-14">{children}</main>
      </body>
    </html>
  );
}
