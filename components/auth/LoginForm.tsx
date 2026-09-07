"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";

type LoginErrorResponse = {
  error?: string;
};

export default function LoginForm() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setIsSubmitting(true);

    const formData = new FormData(event.currentTarget);

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: formData.get("email"),
          password: formData.get("password"),
        }),
      });

      if (!response.ok) {
        const body = (await response.json()) as LoginErrorResponse;

        setError(body.error ?? "Could not sign in. Please try again.");
        return;
      }

      router.replace("/dreams");
      router.refresh();
    } catch {
      setError("Could not reach the Atlas. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form className="space-y-5" onSubmit={handleSubmit}>
      <div>
        <label
          htmlFor="email"
          className="block text-[10px] uppercase tracking-[0.24em] text-white/48"
        >
          Email
        </label>

        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          aria-describedby={error ? "login-error" : undefined}
          className="mt-2.5 w-full rounded-2xl border border-white/12 bg-white/[0.045] px-4 py-3.5 text-sm text-white outline-none transition focus:border-violet-200/45 focus:bg-white/[0.07] focus:ring-2 focus:ring-violet-300/15"
        />
      </div>

      <div>
        <label
          htmlFor="password"
          className="block text-[10px] uppercase tracking-[0.24em] text-white/48"
        >
          Password
        </label>

        <input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          aria-describedby={error ? "login-error" : undefined}
          className="mt-2.5 w-full rounded-2xl border border-white/12 bg-white/[0.045] px-4 py-3.5 text-sm text-white outline-none transition focus:border-violet-200/45 focus:bg-white/[0.07] focus:ring-2 focus:ring-violet-300/15"
        />
      </div>

      {error ? (
        <p
          id="login-error"
          role="alert"
          className="rounded-2xl border border-red-300/15 bg-red-950/25 px-4 py-3 text-sm text-red-100/80"
        >
          {error}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={isSubmitting}
        aria-busy={isSubmitting}
        className="w-full rounded-full border border-violet-100/25 bg-violet-100/[0.11] px-5 py-3.5 text-[10px] uppercase tracking-[0.28em] text-violet-50 transition hover:border-violet-100/45 hover:bg-violet-100/[0.16] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-violet-200 disabled:cursor-wait disabled:opacity-55"
      >
        Sign in
      </button>
    </form>
  );
}