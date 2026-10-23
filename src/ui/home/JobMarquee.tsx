/** Fictitious GTM positions scrolling under the form (user story Home U7): small, faded, decorative. */
const JOBS = [
  "SDR · Milano · ibrido",
  "Account Executive SaaS · Roma",
  "Growth Marketer · remoto",
  "Customer Success Manager · Torino",
  "Event Manager · Bologna",
  "Content & Social Media Manager · Milano",
  "Partnership Manager · Milano · ibrido",
  "RevOps Specialist · remoto",
  "BDR · Padova",
  "Performance Marketing Specialist · remoto",
  "Marketing Manager · Firenze",
  "Account Manager · Verona · ibrido",
  "GTM Manager · Milano",
  "Growth Manager · Roma · ibrido",
  "Sales Manager · Bergamo",
  "Customer Success Manager · remoto",
] as const;

/** The list is doubled so the -50% translation loops seamlessly. */
const TRACK = [...JOBS, ...JOBS].map((label, index) => ({ key: `${index}-${label}`, label }));

export function JobMarquee() {
  return (
    <section aria-hidden="true" className="mt-10 w-full max-w-[900px] opacity-45">
      <div className="w-full overflow-hidden [mask-image:linear-gradient(90deg,transparent,#000_12%,#000_88%,transparent)]">
        <div className="flex w-max gap-7 motion-safe:animate-marquee">
          {TRACK.map((job) => (
            <span key={job.key} className="text-[13px] whitespace-nowrap text-muted-foreground">
              {job.label}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
