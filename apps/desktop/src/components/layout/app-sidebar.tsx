import { Link, type LinkProps, useMatchRoute } from "@tanstack/react-router";
import {
  BookOpenIcon,
  ChevronsUpDownIcon,
  FileTextIcon,
  LogOutIcon,
  type LucideIcon,
  PanelLeftCloseIcon,
  ScaleIcon,
  SettingsIcon,
} from "lucide-react";
import { JevMark, JevWordmark } from "@/components/brand/jev-logo";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useAuth, useCurrentUser } from "@/features/auth/auth-context";
import { useSettingsDialog } from "@/features/settings/use-settings-dialog";
import { initials, ROLE_LABELS } from "@/features/users/user-labels";

interface NavItem {
  label: string;
  to: LinkProps["to"];
  icon: LucideIcon;
}

const NAV_ITEMS: NavItem[] = [
  { label: "Journal Entry Vouchers", to: "/jevs", icon: FileTextIcon },
  { label: "Journals", to: "/journals", icon: BookOpenIcon },
  { label: "Trial Balance", to: "/trial-balance", icon: ScaleIcon },
];

// Palette: the active item is an amber block with dark ink.
const ACTIVE_ITEM =
  "data-active:bg-sidebar-primary data-active:text-sidebar-primary-foreground data-active:hover:bg-sidebar-primary data-active:hover:text-sidebar-primary-foreground";

export function AppSidebar() {
  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <SidebarBrand />
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <MainNav />
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
          <UserMenu />
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}

/** Wordmark + collapse button when expanded; the "j" mark (click to expand) when collapsed. */
function SidebarBrand() {
  const { state, toggleSidebar } = useSidebar();

  if (state === "collapsed") {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            type="button"
            onClick={toggleSidebar}
            aria-label="Expand sidebar"
            className="flex size-8 items-center justify-center rounded-md text-sidebar-accent-foreground outline-none ring-sidebar-ring hover:bg-sidebar-accent focus-visible:ring-2"
          >
            <JevMark className="size-7" />
          </button>
        </TooltipTrigger>
        <TooltipContent side="right">Expand sidebar (Ctrl+B)</TooltipContent>
      </Tooltip>
    );
  }

  return (
    <div className="flex h-8 items-center justify-between pl-2">
      <JevWordmark className="h-7 w-auto text-sidebar-accent-foreground" />
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            type="button"
            onClick={toggleSidebar}
            aria-label="Collapse sidebar"
            className="flex size-8 items-center justify-center rounded-md outline-none ring-sidebar-ring hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus-visible:ring-2"
          >
            <PanelLeftCloseIcon className="size-4" />
          </button>
        </TooltipTrigger>
        <TooltipContent side="right">Collapse sidebar (Ctrl+B)</TooltipContent>
      </Tooltip>
    </div>
  );
}

function MainNav() {
  const matchRoute = useMatchRoute();

  return (
    <SidebarMenu>
      {NAV_ITEMS.map(({ label, to, icon: Icon }) => (
        <SidebarMenuItem key={label}>
          <SidebarMenuButton
            asChild
            tooltip={label}
            isActive={!!matchRoute({ to, fuzzy: true })}
            className={ACTIVE_ITEM}
          >
            <Link to={to}>
              <Icon />
              <span>{label}</span>
            </Link>
          </SidebarMenuButton>
        </SidebarMenuItem>
      ))}
    </SidebarMenu>
  );
}

function UserMenu() {
  const user = useCurrentUser();
  const { logout } = useAuth();
  const { open: openSettings } = useSettingsDialog();
  const { isMobile, state } = useSidebar();

  const fullName = `${user.firstName} ${user.lastName}`;

  return (
    <SidebarMenuItem>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <SidebarMenuButton
            size="lg"
            tooltip={fullName}
            aria-label={`Account menu for ${fullName}`}
          >
            <Avatar className="size-8 rounded-md">
              <AvatarFallback className="rounded-md bg-sidebar-primary font-medium text-sidebar-primary-foreground text-xs">
                {initials(user)}
              </AvatarFallback>
            </Avatar>
            <div className="grid flex-1 text-left leading-tight">
              <span className="truncate font-medium text-sidebar-accent-foreground">
                {fullName}
              </span>
              <span className="truncate text-xs">{ROLE_LABELS[user.role]}</span>
            </div>
            <ChevronsUpDownIcon className="ml-auto" />
          </SidebarMenuButton>
        </DropdownMenuTrigger>

        <DropdownMenuContent
          side={isMobile || state === "expanded" ? "top" : "right"}
          align="end"
          className="min-w-56"
        >
          <DropdownMenuLabel className="font-normal">
            <div className="truncate font-medium text-foreground">{fullName}</div>
            <div className="truncate text-muted-foreground text-xs">
              @{user.username} · {user.position}
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem onSelect={() => openSettings()}>
            <SettingsIcon />
            Settings
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={() => logout()}>
            <LogOutIcon />
            Log out
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </SidebarMenuItem>
  );
}
