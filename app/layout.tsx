import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { brandAssets, companyProfile } from "@/lib/company";
import { Providers } from "./providers";
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
  metadataBase: new URL(`https://${companyProfile.website}`),
  title: {
    default: `${companyProfile.appName} | Quản trị quan hệ khách hàng AnViet Tech`,
    template: `%s | ${companyProfile.appName}`,
  },
  description: `${companyProfile.legalName} - Hệ thống quản lý quan hệ khách hàng, dự án & kinh doanh.`,
  applicationName: companyProfile.appName,
  icons: {
    icon: [
      { url: brandAssets.favicon, sizes: "any" },
      { url: brandAssets.mark, type: "image/png" },
    ],
    shortcut: brandAssets.favicon,
    apple: brandAssets.mark,
  },
  openGraph: {
    title: companyProfile.appName,
    description: `${companyProfile.legalName} - Hệ thống CRM & Điều phối kinh doanh`,
    siteName: companyProfile.displayName,
    locale: "vi_VN",
    type: "website",
    images: [
      {
        url: brandAssets.horizontalLogo,
        width: 1200,
        height: 630,
        alt: companyProfile.legalName,
      },
    ],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="vi"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="h-full">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
