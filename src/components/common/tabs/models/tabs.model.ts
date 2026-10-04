export interface TabItem {
  readonly id: string;
  readonly label: string;
}

/**
 * Propiedades del atomo Tabs.
 */
export interface TabsProps {
  readonly activeTabId: string;
  readonly ariaLabel?: string;
  readonly className?: string;
  readonly onTabChange: (tabId: string) => void;
  readonly tabs: readonly TabItem[];
}
