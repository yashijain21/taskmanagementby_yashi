import "./globals.css";
import type { Metadata } from "next";
import { AuthProvider } from "@/components/auth-context";
import { ToastProvider } from "@/components/toast";

export const metadata: Metadata = {
  title: "Task Manager",
  description: "Task management system assessment"
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>
          {children}
          <ToastProvider />
        </AuthProvider>
      </body>
    </html>
  );
}
