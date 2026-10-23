import type { Metadata } from "next";
import { BuiltByBadge, LogoLockup } from "@/ui/brand";
import { LockIcon } from "@/ui/icons";
import { LoginForm } from "@/ui/login/LoginForm";

export const metadata: Metadata = { title: "Accesso · JD Agent" };

export default function LoginPage() {
  return (
    <div className="flex h-screen flex-col overflow-hidden bg-surface">
      <header className="px-8 py-4">
        <LogoLockup />
      </header>
      <main className="flex min-h-0 flex-1 items-center justify-center px-6">
        <div className="flex w-full max-w-[400px] flex-col gap-5 rounded-xl border border-border bg-white p-8 shadow-[0_1px_2px_#1118270f,0_12px_32px_-16px_#062e3a38]">
          <div className="flex flex-col gap-2">
            <span className="inline-flex size-10 items-center justify-center rounded-lg bg-accent-tint text-accent-foreground">
              <LockIcon size={18} />
            </span>
            <h1 className="m-0 text-2xl font-semibold text-foreground">Accedi alla demo</h1>
            <p className="m-0 text-sm leading-relaxed text-body-soft">
              L&apos;agent è riservato a chi ha ricevuto la password. Inseriscila per continuare.
            </p>
          </div>
          <LoginForm />
        </div>
      </main>
      <footer className="flex justify-end px-6 py-3">
        <BuiltByBadge />
      </footer>
    </div>
  );
}
