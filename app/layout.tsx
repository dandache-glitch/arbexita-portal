import "./globals.css";
import { AuthProvider } from "@/app/providers/AuthProvider";
import { CompanyProvider } from "@/app/providers/CompanyProvider";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="sv">
      <body>
        <AuthProvider>
          <CompanyProvider>{children}</CompanyProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
