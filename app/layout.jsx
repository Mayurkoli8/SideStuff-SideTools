import { Bricolage_Grotesque, Manrope, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const bricolage = Bricolage_Grotesque({
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
  weight: ["500", "600", "700", "800"],
});

const manrope = Manrope({
  subsets: ["latin"],
  variable: "--font-body",
  display: "swap",
  weight: ["300", "400", "500", "600", "700"],
});

const jbMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
  weight: ["400", "500", "700"],
});

export const metadata = {
  title: "SideStuff — stop thinking, start building",
  description:
    "Find people actually building things outside the 9 to 5. Not talking. Not planning. Building.",
  openGraph: {
    title: "SideStuff — stop thinking, start building",
    description:
      "Find people actually building things outside the 9 to 5. Not talking. Not planning. Building.",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "SideStuff",
    description: "For people who ship, not just plan.",
  },
  themeColor: "#0a0a0a",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${bricolage.variable} ${manrope.variable} ${jbMono.variable}`}>
      <body>{children}</body>
    </html>
  );
}
