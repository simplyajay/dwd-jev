import { type ConfirmPasswordInput, ConfirmPasswordInputSchema } from "@dwd-jev/shared";
import { zodResolver } from "@hookform/resolvers/zod";
import { type ReactNode, useState } from "react";
import { useForm } from "react-hook-form";
import { dismissOn } from "@/components/form/dismiss-on";
import { FormAlert } from "@/components/form/form-alert";
import { TextField } from "@/components/form/text-field";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { FieldGroup } from "@/components/ui/field";
import { ApiError, errorMessage } from "@/lib/api";

interface PasswordConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: ReactNode;
  /** Shown above the password field, e.g. that the action can't be undone. */
  warning?: string;
  confirmLabel: string;
  /** Red confirm button, for actions that remove or revoke. */
  destructive?: boolean;
  /** Resolve to close the dialog; throw to keep it open with the error. */
  onConfirm: (password: string) => Promise<unknown>;
}

/** Asks for the signed-in user's password before an action that needs it. */
export function PasswordConfirmDialog({
  open,
  onOpenChange,
  ...props
}: PasswordConfirmDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        {/* The content unmounts on close, so each opening starts empty. */}
        <PasswordConfirmForm onDone={() => onOpenChange(false)} {...props} />
      </DialogContent>
    </Dialog>
  );
}

function PasswordConfirmForm({
  title,
  description,
  warning,
  confirmLabel,
  destructive,
  onConfirm,
  onDone,
}: Omit<PasswordConfirmDialogProps, "open" | "onOpenChange"> & { onDone: () => void }) {
  const [submitError, setSubmitError] = useState<string | null>(null);
  const form = useForm<ConfirmPasswordInput>({
    resolver: zodResolver(ConfirmPasswordInputSchema),
    mode: "onSubmit",
    reValidateMode: "onSubmit",
    shouldFocusError: false,
    defaultValues: { password: "" },
  });
  const { errors, isSubmitting } = form.formState;

  const onSubmit = form.handleSubmit(async ({ password }) => {
    setSubmitError(null);
    try {
      await onConfirm(password);
      onDone();
    } catch (error) {
      if (error instanceof ApiError && error.field === "password") {
        form.setError("password", { message: error.message });
        return;
      }
      setSubmitError(errorMessage(error));
    }
  });

  return (
    <form onSubmit={onSubmit} noValidate className="grid gap-4">
      <DialogHeader>
        <DialogTitle>{title}</DialogTitle>
        <DialogDescription>{description}</DialogDescription>
      </DialogHeader>

      <FieldGroup>
        <FormAlert message={submitError} />
        <FormAlert message={warning ?? null} tone="info" />
        <TextField
          label="Your password"
          type="password"
          autoFocus
          error={errors.password}
          {...form.register("password")}
          {...dismissOn(() => {
            form.clearErrors("password");
            setSubmitError(null);
          })}
        />
      </FieldGroup>

      <DialogFooter>
        <DialogClose asChild>
          <Button type="button" variant="outline" disabled={isSubmitting}>
            Cancel
          </Button>
        </DialogClose>
        <Button
          type="submit"
          variant={destructive ? "destructive" : "default"}
          disabled={isSubmitting}
        >
          {isSubmitting ? "Confirming…" : confirmLabel}
        </Button>
      </DialogFooter>
    </form>
  );
}
