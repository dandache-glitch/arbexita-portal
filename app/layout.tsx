import "./globals.css";

export const metadata = {
  title: "Arbexita – SAM-portal",
  description: "Säljbar SAM-portal för små och medelstora företag i Sverige."
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="sv">
      <body>{children}</body>
    </html>
  );
}
