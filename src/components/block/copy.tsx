import { Check, Clipboard } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

type Props = {
  text: string;
  className?: string;
};

export default function Copy({ text, className }: Props) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => {
      setCopied(false);
    }, 2000);
  };

  return (
    <div
      className={cn(
        "text-sm text-muted-foreground flex items-center gap-2 cursor-pointer",
        className,
      )}
      onClick={handleCopy}
    >
      {copied ? (
        <Check className="w-4 h-4 text-green-500" />
      ) : (
        <Clipboard className="w-4 h-4" />
      )}
      <p>{text}</p>
    </div>
  );
}
