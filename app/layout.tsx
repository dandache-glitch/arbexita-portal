import "./globals.css";
import type { Metadata } from "next";
import { AuthProvider } from "@/app/providers/AuthProvider";
import { CompanyProvider } from "@/app/providers/CompanyProvider";

export const metadata: Metadata = {
  title: {
    default: "Arbexita – SAM & Compliance-portal",
    template: "%s • Arbexita"
  },
  description:
    "En säljbar SAM-portal som hjälper svenska små och medelstora företag bli redo för arbetsmiljöinspektion.",
  icons: {
    icon: "/icon.svg"
  },
  metadataBase: process.env.APP_BASE_URL ? new URL(process.env.APP_BASE_URL) : undefined
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="sv">
      <body>
        <AuthProvider>
          <CompanyProvider>{children}</CompanyProvider>
        </AuthProvider>
        <div id="modal-root" />
      </body>
    </html>
  );
}
