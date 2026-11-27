import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useAuth } from "../auth-context";

/** Shown when the server ends the session. The only way on is back to login. */
export function SessionEndedDialog() {
  const { state, leaveEndedSession } = useAuth();
  const open = state.status === "signed-in" && state.sessionEnded === true;

  return (
    <Dialog open={open}>
      <DialogContent
        showCloseButton={false}
        onEscapeKeyDown={(event) => event.preventDefault()}
        onInteractOutside={(event) => event.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle>Your session has ended</DialogTitle>
          <DialogDescription>Please sign in again to continue.</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button autoFocus onClick={leaveEndedSession}>
            Go to login
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
