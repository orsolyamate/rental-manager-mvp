import { Clock } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

export function ComingSoon({ text }: { text: string }) {
  return (
    <Card>
      <CardContent className="flex flex-col items-start gap-3 p-6 sm:flex-row sm:items-center">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-secondary text-secondary-foreground">
          <Clock className="h-5 w-5" aria-hidden="true" />
        </span>
        <p className="text-sm text-muted-foreground sm:text-base">{text}</p>
      </CardContent>
    </Card>
  );
}
