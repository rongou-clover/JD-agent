export type TextSpan = { text: string; bold: boolean };

/**
 * Splits agent text into plain and **bold** spans (the only markup the contract allows).
 * An unmatched `**` is kept as literal text.
 */
export function parseBold(input: string): TextSpan[] {
  const spans: TextSpan[] = [];
  const push = (text: string, bold: boolean) => {
    if (text === "") return;
    const last = spans.at(-1);
    if (last && last.bold === bold) last.text += text;
    else spans.push({ text, bold });
  };

  let rest = input;
  while (rest !== "") {
    const open = rest.indexOf("**");
    const close = open === -1 ? -1 : rest.indexOf("**", open + 2);
    if (open === -1 || close === -1) {
      push(rest, false);
      break;
    }
    push(rest.slice(0, open), false);
    const inner = rest.slice(open + 2, close);
    if (inner === "") push("****", false);
    else push(inner, true);
    rest = rest.slice(close + 2);
  }
  return spans;
}

