import { useRef, useState } from "react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

/** One line, cut off with "…"; hovering shows the whole text, but only when it was cut off. */
export function TruncatedText({ text }: { text: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const [open, setOpen] = useState(false);

  // Measured when the tooltip would open, so resizing the window needs no listener.
  const isClipped = () => {
    const element = ref.current;
    return !!element && element.scrollWidth > element.clientWidth;
  };

  return (
    <Tooltip open={open} onOpenChange={(next) => setOpen(next && isClipped())}>
      <TooltipTrigger asChild>
        <span ref={ref} className="block truncate">
          {text}
        </span>
      </TooltipTrigger>
      <TooltipContent className="max-w-md whitespace-normal">{text}</TooltipContent>
    </Tooltip>
  );
}
