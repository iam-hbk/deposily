import { AlertCircle, CheckCircle, MessageSquareTextIcon } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "./ui/alert";

export type Message =
  | { success: string }
  | { error: string }
  | { message: string };

export function FormMessage({ message }: { message: Message }) {
  return (
    <div className="flex flex-col gap-2 w-full max-w-md text-sm">
      {"success" in message && (
        <Alert>
          <CheckCircle className="h-4 w-4" />
          <AlertTitle>Heads up!</AlertTitle>
          <AlertDescription>{message.success}</AlertDescription>
        </Alert>
      )}
      {"error" in message && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{message.error}</AlertDescription>
        </Alert>
      )}
      {"message" in message && (
        <Alert>
          <MessageSquareTextIcon className="h-4 w-4" />
          <AlertTitle>Heads up!</AlertTitle>
          <AlertDescription>{message.message}</AlertDescription>
        </Alert>
      )}
    </div>
  );
}
