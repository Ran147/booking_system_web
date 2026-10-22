/**
 * @file Type definitions and props for ServiceFeatureList component.
 */

/**
 * @typedef {Object} ServiceFeatureListProps
 * @property {boolean} canAddFeature - Whether the add feature button is enabled (under 10 items).
 * @property {boolean} [disabled] - Whether feature editing controls are disabled.
 * @property {readonly string[]} features - Current list of feature strings.
 * @property {() => void} onAddFeature - Callback to add a new empty feature item.
 * @property {(index: number, value: string) => void} onFeatureChange - Callback when a feature's text changes.
 * @property {(index: number) => void} onMoveDown - Callback to move a feature item down.
 * @property {(index: number) => void} onMoveUp - Callback to move a feature item up.
 * @property {(index: number) => void} onRemoveFeature - Callback to remove a feature item.
 */
export interface ServiceFeatureListProps {
  readonly canAddFeature: boolean;
  readonly disabled?: boolean;
  readonly features: readonly string[];
  readonly onAddFeature: () => void;
  readonly onFeatureChange: (index: number, value: string) => void;
  readonly onMoveDown: (index: number) => void;
  readonly onMoveUp: (index: number) => void;
  readonly onRemoveFeature: (index: number) => void;
}
