import { useForm } from "react-hook-form";
import { TextField } from "@/components/form/text-field";
import { Button } from "@/components/ui/button";
import { FieldGroup } from "@/components/ui/field";
import { useCurrentUser } from "@/features/auth/auth-context";
import { SettingsSection } from "@/features/settings/components/settings-section";

/*
 * Layout only for now: the forms are prefilled and editable but saving is not
 * wired. There is no update-user schema in @dwd-jev/shared yet -- when there
 * is, add it as the resolver and replace `notWiredYet` with the mutation.
 */
const notWiredYet = (event: { preventDefault: () => void }) => event.preventDefault();

export function AccountSettings() {
  return (
    <>
      <PersonalInformationForm />
      <AccountInformationForm />
    </>
  );
}

function PersonalInformationForm() {
  const user = useCurrentUser();
  const form = useForm({
    defaultValues: {
      firstName: user.firstName,
      middleName: user.middleName ?? "",
      lastName: user.lastName,
      position: user.position,
    },
  });

  return (
    <SettingsSection title="Personal information" description="Your name and position.">
      <form onSubmit={notWiredYet} noValidate>
        <FieldGroup>
          <div className="grid grid-cols-2 gap-4">
            <TextField label="First name" {...form.register("firstName")} />
            <TextField label="Middle name" optional {...form.register("middleName")} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <TextField label="Last name" {...form.register("lastName")} />
            <TextField label="Position" {...form.register("position")} />
          </div>
          <Button type="submit" className="w-fit" disabled={!form.formState.isDirty}>
            Save changes
          </Button>
        </FieldGroup>
      </form>
    </SettingsSection>
  );
}

function AccountInformationForm() {
  const user = useCurrentUser();
  const form = useForm({
    defaultValues: {
      email: user.email ?? "",
      username: user.username,
      newPassword: "",
      confirmPassword: "",
    },
  });

  return (
    <SettingsSection
      title="Account information"
      description="How you sign in. Leave the password fields empty to keep your current password."
    >
      <form onSubmit={notWiredYet} noValidate>
        <FieldGroup>
          <div className="grid grid-cols-2 gap-4">
            <TextField label="Username" {...form.register("username")} />
            <TextField label="Email" type="email" optional {...form.register("email")} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <TextField label="New password" type="password" {...form.register("newPassword")} />
            <TextField
              label="Confirm new password"
              type="password"
              {...form.register("confirmPassword")}
            />
          </div>
          <Button type="submit" className="w-fit" disabled={!form.formState.isDirty}>
            Save changes
          </Button>
        </FieldGroup>
      </form>
    </SettingsSection>
  );
}
