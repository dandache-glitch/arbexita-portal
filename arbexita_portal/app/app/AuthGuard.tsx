"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabaseBrowser } from "@/lib/supabase/client";

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const supabase = supabaseBrowser();

    supabase.auth
      .getSession()
      .then(({ data, error }) => {
        if (error || !data.session) {
          router.replace("/login?next=/app");
          return;
        }
        setReady(true);
      })
      .catch(() => {
        router.replace("/login?next=/app");
      });

    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) router.replace("/login?next=/app");
    });

    return () => {
      sub.subscription.unsubscribe();
    };
  }, [router]);

  if (!ready) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        Laddar...
      </div>
    );
  }

  return <>{children}</>;
}
