"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function LogoutButton() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleLogout() {
    setError("");
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/auth/logout", {
        method: "POST",
      });

      if (!response.ok) {
        throw new Error("Logout failed");
      }

      router.replace("/login");
      router.refresh();
    } catch {
      setError("Could not sign out. Please try again.");
      setIsSubmitting(false);
    }
  }

  return (
    <div className="flex flex-col items-end gap-2">
      <button
        type="button"
        onClick={handleLogout}
        disabled={isSubmitting}
        aria-busy={isSubmitting}
        className="text-[10px] uppercase tracking-[0.22em] text-white/38 transition hover:text-white focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-violet-200 disabled:cursor-wait disabled:opacity-55"
      >
        Sign out
      </button>

      {error ? (
        <p role="alert" className="text-xs text-red-200/80">
          {error}
        </p>
      ) : null}
    </div>
  );
}