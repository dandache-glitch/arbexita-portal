import { Suspense } from "react";
import LoginClient from "./LoginClient";

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center px-4">Laddar...</div>}>
      <LoginClient />
    </Suspense>
  );
}
