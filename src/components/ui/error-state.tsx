import { AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "./button";
import { Card, CardContent } from "./card";
import { BlockingError } from "@/lib/error-messages";

interface ErrorStateProps {
  title?: string;
  errors: BlockingError[] | string[];
  action?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
}

export function ErrorState({
  title = "Erreur bloquante",
  errors,
  action,
  className,
}: ErrorStateProps) {
  const normalizedErrors: BlockingError[] = errors.map((error) =>
    typeof error === "string"
      ? { code: "ERROR", message: error, cause: error, source: "Validation" as const, action: "" }
      : error
  );

  return (
    <Card variant="error" className={cn("", className)}>
      <CardContent className="p-6">
        <div className="flex items-start gap-4">
          <div className="p-2 rounded-lg bg-destructive/20">
            <AlertTriangle className="h-6 w-6 text-destructive" />
          </div>
          <div className="flex-1">
            <p className="font-semibold text-destructive mb-3">{title}</p>
            <div className="space-y-3">
              {normalizedErrors.map((error, index) => (
                <div
                  key={index}
                  className="p-3 rounded-lg bg-destructive/5 border border-destructive/20"
                >
                  <p className="text-sm font-medium text-foreground mb-1">
                    [{error.code}] {error.cause}
                  </p>
                  {error.source && (
                    <p className="text-xs text-muted-foreground">
                      Source : {error.source}
                    </p>
                  )}
                  {error.action && (
                    <p className="text-xs text-destructive mt-1">
                      → {error.action}
                    </p>
                  )}
                </div>
              ))}
            </div>
            {action && (
              <Button
                variant="destructive"
                className="mt-4"
                onClick={action.onClick}
              >
                {action.label}
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
