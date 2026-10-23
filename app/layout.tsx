import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Musab Sarmad(Demo Project - KO Realty) | Vacancy pipeline",
  description: "Turnover operations across Calgary and Edmonton."
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
