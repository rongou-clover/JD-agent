import { BuiltByBadge, LogoLockup } from "@/ui/brand";
import { Headline } from "@/ui/home/Headline";
import { HistoryMenu } from "@/ui/home/HistoryMenu";
import { JobMarquee } from "@/ui/home/JobMarquee";
import { StartForm } from "@/ui/home/StartForm";
import { SparkleIcon } from "@/ui/icons";

export default function HomePage() {
  return (
    <div className="flex h-screen flex-col overflow-hidden bg-white">
      <div className="flex flex-wrap items-center justify-center gap-3 bg-accent-tint px-6 py-2.5 text-center text-sm text-accent-foreground">
        <span className="inline-flex items-center gap-2 font-semibold">
          <SparkleIcon />
          Agent dimostrativo
        </span>
        <span>
          Scegli il ruolo e descrivi la persona: l&apos;agent ti segue e scrive la job description.
        </span>
      </div>

      <header className="flex items-center justify-between gap-4 px-8 py-4">
        <LogoLockup />
        <HistoryMenu />
      </header>

      <main className="flex min-h-0 flex-1 flex-col items-center justify-center px-6 py-2">
        <div className="flex w-full max-w-[760px] flex-col gap-4">
          <p className="m-0 text-[13px] font-semibold tracking-[0.08em] text-[#007a9b] uppercase">
            Scrivi la tua job description
          </p>
          <Headline />
          <StartForm />
        </div>
        <JobMarquee />
      </main>

      <footer className="flex justify-end px-6 py-3">
        <BuiltByBadge />
      </footer>
    </div>
  );
}
