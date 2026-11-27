import { MonitorIcon, MoonIcon, SunIcon } from "lucide-react";
import { Field, FieldDescription, FieldLabel } from "@/components/ui/field";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import type { ThemePreference } from "../theme";
import { useTheme } from "../theme-context";

const OPTIONS: { value: ThemePreference; label: string; icon: typeof SunIcon }[] = [
  { value: "light", label: "Light", icon: SunIcon },
  { value: "dark", label: "Dark", icon: MoonIcon },
  { value: "system", label: "System", icon: MonitorIcon },
];

export function ThemeSettings() {
  const { preference, setPreference } = useTheme();

  return (
    <Field>
      <FieldLabel id="theme-label">Theme</FieldLabel>
      <FieldDescription>System follows your Windows light or dark setting.</FieldDescription>
      <ToggleGroup
        type="single"
        variant="outline"
        aria-labelledby="theme-label"
        value={preference}
        onValueChange={(value) => {
          if (value) setPreference(value as ThemePreference);
        }}
        className="w-fit"
      >
        {OPTIONS.map(({ value, label, icon: Icon }) => (
          <ToggleGroupItem
            key={value}
            value={value}
            className="px-4 data-[state=on]:bg-primary data-[state=on]:text-primary-foreground"
          >
            <Icon />
            {label}
          </ToggleGroupItem>
        ))}
      </ToggleGroup>
    </Field>
  );
}
