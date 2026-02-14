import "./globals.css";
import { ReactNode } from "react";

export const metadata = {
  title: "Arbexita – SAM-portal",
  description: "Sveriges enklaste SAM-system för små och medelstora företag."
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="sv">
      <body>
        {children}
      </body>
    </html>
  );
}
