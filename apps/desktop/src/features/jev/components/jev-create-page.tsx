import type { Jev } from "@dwd-jev/shared";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { useState } from "react";
import { useForm } from "react-hook-form";
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
import { ApiError, api, type CreateJevBody, errorMessage } from "@/lib/api";
import { jevQueries } from "../api/jev-queries";
import { JevForm } from "../form/jev-form";
import {
  emptyJevForm,
  type JevFormValues,
  jevFormResolver,
  toCreateJevBody,
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
  const create = useMutation({
    mutationFn: (input: CreateJevBody) => api.jevs.create(input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: jevQueries.all }),
  });

  const onSubmit = async (values: JevFormValues) => {
    setSubmitError(null);
    try {
      const jev = await create.mutateAsync(toCreateJevBody(values));
      form.reset(emptyJevForm());
      setCreated(jev);
      setCreatedOpen(true);
    } catch (error) {
      if (error instanceof ApiError && error.field === "jevNumber") {
        form.setError("jevNumber", { message: error.message });
        return;
      }
      setSubmitError(errorMessage(error));
    }
  };

  return (
    <div className="space-y-3">
      <BackToListButton disabled={form.formState.isSubmitting} />

      <JevForm
        form={form}
        onSubmit={onSubmit}
        submitLabel="Create JEV"
        submitError={submitError}
        onDismissSubmitError={() => setSubmitError(null)}
      />

      <CreatedDialog jev={created} open={createdOpen} onOpenChange={setCreatedOpen} />
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
