import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen flex items-center justify-center px-4">
      <div className="max-w-lg w-full card p-8">
        <div className="text-2xl font-semibold">Arbexita</div>
        <p className="small mt-2">SAM-portal för små och medelstora företag. Logga in för att komma igång.</p>
        <div className="mt-6 flex gap-3">
          <Link className="btn btn-primary" href="/login">Logga in</Link>
          <Link className="btn" href="/register">Skapa konto</Link>
        </div>
      </div>
    </main>
  );
}
