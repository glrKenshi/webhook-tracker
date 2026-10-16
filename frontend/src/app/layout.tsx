import type { Metadata } from "next";
import { Geist, Geist_Mono, Figtree } from "next/font/google";
import { AuthProvider } from "@/components/auth-provider";
import { ToastProvider } from "@/components/toast-provider";
import { cn } from "@/lib/utils";
import "./globals.css";

const figtree = Figtree({ subsets: ["latin"], variable: "--font-sans" });

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "Webhook Inbox",
    template: "%s — Webhook Inbox",
  },
  description: "Create webhook endpoints and inspect incoming requests",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={cn(
        "h-full antialiased",
        geistSans.variable,
        geistMono.variable,
        "font-sans",
        figtree.variable,
      )}
    >
      <body className="flex min-h-full flex-col">
        <AuthProvider>
          <ToastProvider>{children}</ToastProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
