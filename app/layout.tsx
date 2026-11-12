import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
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
  title: "SUDESTADA GIN · El espíritu del sur",
  description:
    "Gin rioplatense destilado en Buenos Aires. Descubrí nuestra colección, botánicos seleccionados, recetas y puntos de venta en CABA.",
  icons: {
    icon: "/sudestada-bottle.png",
    apple: "/sudestada-bottle.png",
  },
  openGraph: {
    title: "SUDESTADA GIN · El espíritu del sur",
    description:
      "Gin artesanal rioplatense destilado en Buenos Aires.",
    siteName: "Sudestada Gin",
    locale: "es_AR",
    type: "website",
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="es"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
