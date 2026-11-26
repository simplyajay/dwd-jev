import type { Jev } from "@dwd-jev/shared";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getRouteApi } from "@tanstack/react-router";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { PageToolbar } from "@/components/layout/page-toolbar";
import { auditLogQueries } from "@/features/audit-log/api/audit-log-queries";
import { SettingsLoadError } from "@/features/settings/components/settings-section";
import { useUnsavedChangesGuard } from "@/hooks/use-unsaved-changes-guard";
import { api, errorMessage, type JevBody } from "@/lib/api";
import { jevQueries } from "../api/jev-queries";
import { JevForm } from "../form/jev-form";
import {
  type JevFormValues,
  jevFormResolver,
  takenNumberField,
  toJevBody,
  toJevFormValues,
} from "../form/jev-form-values";
import { JOURNAL_LABELS } from "../labels";
import { BackToListButton, JevDetailsSkeleton } from "./jev-page-header";

const route = getRouteApi("/_app/jevs/$jevId/edit");

export function JevEditPage() {
  const { jevId } = route.useParams();
  const { data: jev, isPending, isError, error, refetch } = useQuery(jevQueries.detail(jevId));

  return (
    <div className="space-y-3">
      {isError ? (
        <>
          <PageToolbar>
            <BackToListButton />
          </PageToolbar>
          <SettingsLoadError error={error} onRetry={() => refetch()} />
        </>
      ) : isPending ? (
        <>
          <PageToolbar>
            <BackToListButton />
          </PageToolbar>
          <JevDetailsSkeleton />
        </>
      ) : (
        // Starts from the JEV as first loaded; later refetches don't reset the form.
        <JevEditForm jev={jev} />
      )}
    </div>
  );
}

function JevEditForm({ jev }: { jev: Jev }) {
  const navigate = route.useNavigate();
  const queryClient = useQueryClient();
  const [submitError, setSubmitError] = useState<string | null>(null);

  const form = useForm<JevFormValues>({
    resolver: jevFormResolver,
    mode: "onSubmit",
    reValidateMode: "onSubmit",
    shouldFocusError: false, // see dismissOn
    defaultValues: toJevFormValues(jev),
  });
  const { isDirty, isSubmitting } = form.formState;
  const guard = useUnsavedChangesGuard(isDirty, "Your changes to this JEV haven't been saved.");

  const update = useMutation({
    mutationFn: (input: JevBody) => api.jevs.update(jev.id, input),
    onSuccess: (saved) => {
      queryClient.setQueryData(jevQueries.detail(jev.id).queryKey, saved);
      return Promise.all([
        queryClient.invalidateQueries({ queryKey: jevQueries.all }),
        queryClient.invalidateQueries({ queryKey: auditLogQueries.all }),
      ]);
    },
  });

  const onSubmit = async (values: JevFormValues) => {
    setSubmitError(null);
    try {
      await update.mutateAsync(toJevBody(values));
      await guard.bypass(() => navigate({ to: "/jevs/$jevId", params: { jevId: jev.id } }));
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
    <>
      {/* Saved number and journal, so they don't change while edited. */}
      <PageToolbar>
        <BackToListButton disabled={isSubmitting} />
        <p className="truncate text-muted-foreground text-sm">
          Editing JEV{" "}
          <span className="font-medium text-foreground tabular-nums">{jev.jevNumber}</span> ·{" "}
          {JOURNAL_LABELS[jev.journalType]}
        </p>
      </PageToolbar>

      <JevForm
        form={form}
        onSubmit={onSubmit}
        submitLabel="Save changes"
        // Every save makes a revision, so an unchanged form can't be saved.
        submitDisabled={!isDirty}
        submitError={submitError}
        onDismissSubmitError={() => setSubmitError(null)}
      />

      {guard.dialog}
    </>
  );
}
