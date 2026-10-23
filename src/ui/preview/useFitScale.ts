"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Scale (≤ 1) that makes the content fit the container height: the preview never scrolls
 * (design/README.md), so a long posting is shown zoomed out like a page in a word processor.
 */
export function useFitScale<C extends HTMLElement, T extends HTMLElement>() {
  const containerRef = useRef<C>(null);
  const contentRef = useRef<T>(null);
  const [scale, setScale] = useState(1);

  useEffect(() => {
    const container = containerRef.current;
    const content = contentRef.current;
    if (!container || !content) return;
    const measure = () => {
      const style = getComputedStyle(container);
      const available = container.clientHeight - parseFloat(style.paddingTop) - parseFloat(style.paddingBottom);
      setScale(Math.min(1, available / content.offsetHeight));
    };
    const observer = new ResizeObserver(measure);
    observer.observe(container);
    observer.observe(content);
    return () => observer.disconnect();
  }, []);

  return { containerRef, contentRef, scale };
}
