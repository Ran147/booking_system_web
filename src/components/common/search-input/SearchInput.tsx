import type { ReactElement } from "react";
import { useSearchInput } from "./useSearchInput";
import { Input } from "../ui/input";

export interface SearchInputProps {
  label: string;
  onValueChange: (nextValue: string) => void;
  value: string;
}

export const SearchInput = ({
  label,
  onValueChange,
  value,
}: SearchInputProps): ReactElement => {
  const { draftValue, handleDraftChange } = useSearchInput(
    value,
    onValueChange,
  );

  return (
    <Input
      aria-label={label}
      className="max-w-sm"
      onChange={handleDraftChange}
      type="search"
      value={draftValue}
    />
  );
};
