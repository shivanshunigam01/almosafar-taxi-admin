import type { Metadata } from "next";
import "./globals.css";
import { ClientProviders } from "../components/providers/ClientProviders";
import { AdminShell } from "../components/layout/AdminShell";

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
    <html lang="en">
      <body>
        <ClientProviders>
          <AdminShell>{children}</AdminShell>
        </ClientProviders>
      </body>
    </html>
  );
}
