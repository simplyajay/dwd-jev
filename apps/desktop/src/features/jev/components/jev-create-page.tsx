import type { Jev } from "@dwd-jev/shared";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { PageToolbar } from "@/components/layout/page-toolbar";
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
import { auditLogQueries } from "@/features/audit-log/api/audit-log-queries";
import { useUnsavedChangesGuard } from "@/hooks/use-unsaved-changes-guard";
import { api, errorMessage, type JevBody } from "@/lib/api";
import { jevQueries } from "../api/jev-queries";
import { JevForm } from "../form/jev-form";
import {
  emptyJevForm,
  type JevFormValues,
  jevFormResolver,
  takenNumberField,
  toJevBody,
} from "../form/jev-form-values";
import { useRememberedJevListSearch } from "../jev-list-search";
import { BackToListButton } from "./jev-page-header";

export function JevCreatePage() {
  const queryClient = useQueryClient();
  const [submitError, setSubmitError] = useState<string | null>(null);
  // Kept after closing, so the dialog's text doesn't blank out as it fades.
  const [created, setCreated] = useState<Jev | null>(null);
  const [createdOpen, setCreatedOpen] = useState(false);

  const form = useForm<JevFormValues>({
    resolver: jevFormResolver,
    mode: "onSubmit",
    reValidateMode: "onSubmit",
    shouldFocusError: false, // see dismissOn
    defaultValues: emptyJevForm(),
  });
  const guard = useUnsavedChangesGuard(
    form.formState.isDirty,
    "This JEV hasn't been created, so what you've entered will be lost.",
  );
  const create = useMutation({
    mutationFn: (input: JevBody) => api.jevs.create(input),
    onSuccess: () =>
      Promise.all([
        queryClient.invalidateQueries({ queryKey: jevQueries.all }),
        queryClient.invalidateQueries({ queryKey: auditLogQueries.all }),
      ]),
  });

  const onSubmit = async (values: JevFormValues) => {
    setSubmitError(null);
    try {
      const jev = await create.mutateAsync(toJevBody(values));
      form.reset(emptyJevForm());
      setCreated(jev);
      setCreatedOpen(true);
    } catch (error) {
      const takenField = takenNumberField(error);
      if (takenField) {
        form.setError(takenField, { message: errorMessage(error) });
        return;
      }
      setSubmitError(errorMessage(error));
    }
  };

  return (
    <div className="space-y-3">
      <PageToolbar>
        <BackToListButton disabled={form.formState.isSubmitting} />
      </PageToolbar>

      <JevForm
        form={form}
        onSubmit={onSubmit}
        submitLabel="Create JEV"
        submitError={submitError}
        onDismissSubmitError={() => setSubmitError(null)}
      />

      <CreatedDialog jev={created} open={createdOpen} onOpenChange={setCreatedOpen} />
      {guard.dialog}
    </div>
  );
}

interface CreatedDialogProps {
  jev: Jev | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/** After a save: view the JEV, go back to the list, or create another. */
function CreatedDialog({ jev, open, onOpenChange }: CreatedDialogProps) {
  const listSearch = useRememberedJevListSearch();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>JEV created</DialogTitle>
          <DialogDescription>
            JEV <span className="font-medium text-foreground tabular-nums">{jev?.jevNumber}</span>{" "}
            was saved.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" asChild>
            <Link to="/jevs" search={listSearch}>
              Back to list
            </Link>
          </Button>
          {jev && (
            <Button variant="outline" asChild>
              <Link to="/jevs/$jevId" params={{ jevId: jev.id }}>
                View JEV
              </Link>
            </Button>
          )}
          <DialogClose asChild>
            <Button>Create another</Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
