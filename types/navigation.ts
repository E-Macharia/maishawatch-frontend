import { ReactNode } from "react";

export interface NavItem {
  title: string;
  href: string;
  iconName: string;
  badge?: string | number;
  badgeVariant?: "default" | "destructive" | "outline" | "secondary";
  disabled?: boolean;
}

export interface NavGroup {
  groupLabel?: string;
  items: NavItem[];
}

export interface UserProfile {
  name: string;
  email: string;
  avatarUrl?: string;
  role?: string;
}

export interface DashboardShellProps {
  children: ReactNode;
  navGroups?: NavGroup[];
  user?: UserProfile;
}
