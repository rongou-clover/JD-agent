import { parseBold } from "./bold";

/** Renders text with its **bold** spans. */
export function RichText({ text }: { text: string }) {
  return parseBold(text).map((span, index) =>
    span.bold ? (
      <strong key={index} className="font-semibold">
        {span.text}
      </strong>
    ) : (
      <span key={index}>{span.text}</span>
    ),
  );
}
