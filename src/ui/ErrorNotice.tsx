import type { ReactNode } from "react";

/** Inline error: the Italian ApiError message, shown as is. */
export function ErrorNotice({ message, children }: { message: string; children?: ReactNode }) {
  return (
    <p role="alert" className="m-0 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-[13px] leading-normal text-red-800">
      {message}
      {children}
    </p>
  );
}
