"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { ApiClientError, login, safeNextPath } from "@/ui/api/client";
import { ErrorNotice } from "@/ui/ErrorNotice";

/** One shared password; on success the user goes back to `?next=` (or Home). */
export function LoginForm() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (pending || password === "") return;
    setPending(true);
    setError(null);
    try {
      await login(password);
      router.replace(safeNextPath(new URLSearchParams(window.location.search).get("next")));
    } catch (caught) {
      setPending(false);
      if (!(caught instanceof ApiClientError)) throw caught;
      setError(caught.message);
    }
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-3">
      <label htmlFor="password" className="text-sm font-medium text-body">
        Password
      </label>
      <input
        id="password"
        type="password"
        autoComplete="current-password"
        autoFocus
        value={password}
        onChange={(event) => setPassword(event.target.value)}
        className="min-h-11 rounded-lg border border-border px-3.5 text-base outline-none focus:border-primary"
      />
      {error && <ErrorNotice message={error} />}
      <button
        type="submit"
        disabled={pending || password === ""}
        className="mt-1 min-h-11 cursor-pointer rounded-lg bg-primary px-5 text-[15px] font-medium text-white hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-60"
      >
        {pending ? "Un attimo…" : "Entra"}
      </button>
    </form>
  );
}
