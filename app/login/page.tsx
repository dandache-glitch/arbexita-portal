import { Suspense } from "react";
import LoginClient from "./LoginClient";

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="container"><div className="card" style={{padding:24}}>Laddar...</div></div>}>
      <LoginClient />
    </Suspense>
  );
}
