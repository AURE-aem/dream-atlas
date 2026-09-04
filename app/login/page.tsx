import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import LoginForm from "@/components/auth/LoginForm";
import { getCurrentUser } from "@/lib/auth/session";

export const metadata: Metadata = {
  title: "Sign in | Dream Atlas",
};

export default async function LoginPage() {
  const user = await getCurrentUser();

  if (user) {
    redirect("/dreams");
  }

  return (
    <main className="relative grid min-h-screen place-items-center overflow-hidden bg-[#03050d] px-5 py-16 text-white">
      <div className="pointer-events-none absolute -inset-8 bg-[url('/dream-atlas-galaxy-v2.webp')] bg-cover bg-center opacity-45" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_36%,rgba(196,181,253,.14),transparent_34%),linear-gradient(180deg,rgba(3,5,13,.42),#03050d_88%)]" />

      <section className="relative z-10 w-full max-w-md rounded-[2rem] border border-white/10 bg-[#090b18]/80 p-7 shadow-[0_0_80px_rgba(139,92,246,.12)] backdrop-blur-xl sm:p-10">
        <Link
          href="/"
          className="flex items-center justify-center gap-3 text-[10px] uppercase tracking-[0.32em] text-white/55 transition hover:text-white"
        >
          <span aria-hidden="true">✦</span>
          Dream Atlas
        </Link>

        <div className="pb-8 pt-10 text-center">
          <p className="text-[9px] uppercase tracking-[0.36em] text-slate-200/38">
            Return to your memories
          </p>

          <h1 className="mt-4 font-serif text-4xl tracking-[-0.035em]">
            Sign in to the Atlas.
          </h1>

          <p className="mx-auto mt-4 max-w-sm text-sm leading-6 text-white/38">
            Your preserved dreams are waiting where you left them.
          </p>
        </div>

        <LoginForm />
      </section>
    </main>
  );
}