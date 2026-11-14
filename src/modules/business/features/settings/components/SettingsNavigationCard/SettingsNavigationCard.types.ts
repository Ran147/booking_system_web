import type { LucideIcon } from "lucide-react";

/** Presentation contract for a navigable settings option. */
export interface SettingsNavigationCardProps {
  /** Short explanation of the destination. */
  readonly description: string;
  /** Decorative icon associated with the destination. */
  readonly icon: LucideIcon;
  /** Accessible label announced for the link. */
  readonly linkLabel: string;
  /** Visible destination name. */
  readonly title: string;
  /** Absolute application route opened by the option. */
  readonly to: string;
}
