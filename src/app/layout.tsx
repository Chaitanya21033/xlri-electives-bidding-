import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "ElectiVe — Course Bidding Platform",
    template: "%s | ElectiVe",
  },
  description:
    "The premier elective course bidding platform for business schools. Fair, transparent, and efficient allocation for students, professors, and administrators.",
  keywords: [
    "elective bidding",
    "course allocation",
    "b-school",
    "MBA",
    "course registration",
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
