import type { Metadata } from "next";
import "./globals.css";
import Sidebar from "@/components/Sidebar";

export const metadata: Metadata = {
  title: "Lubricants Inventory System",
  description: "Petrol Pump Lubricants Inventory and Sales Management",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark antialiased h-full">
      <body className="h-full bg-background text-foreground flex overflow-hidden">
        <Sidebar className="w-64 border-r border-border shrink-0" />
        <main className="flex-1 overflow-y-auto">
          <div className="mx-auto max-w-7xl p-8">{children}</div>
        </main>
      </body>
    </html>
  );
}
