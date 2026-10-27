import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ClientProviders } from "../components/providers/ClientProviders";
import { AdminShell } from "../components/layout/AdminShell";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Almosafar Taxi Admin",
  description: "Demo admin dashboard for Almosafar Taxi",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={inter.variable}>
      <body>
        <ClientProviders>
          <AdminShell>{children}</AdminShell>
        </ClientProviders>
      </body>
    </html>
  );
}
