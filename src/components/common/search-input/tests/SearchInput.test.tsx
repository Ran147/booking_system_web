import { act, render } from "@testing-library/react";
import { TIME_MS } from "@/shared/constants";
import { SearchInput } from "../SearchInput";
import { createSearchInputPage } from "./SearchInput.page";

const SEARCH_LABEL = "Search services";

describe("SearchInput", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("reports the typed term once after the search debounce", () => {
    const handleValueChange = vi.fn();
    render(
      <SearchInput
        label={SEARCH_LABEL}
        onValueChange={handleValueChange}
        value=""
      />,
    );
    const searchInputPage = createSearchInputPage();

    searchInputPage.changeSearchTerm(SEARCH_LABEL, "corte");
    expect(handleValueChange).not.toHaveBeenCalled();

    act(() => {
      vi.advanceTimersByTime(TIME_MS.DEBOUNCE.SEARCH);
    });

    expect(handleValueChange).toHaveBeenCalledTimes(1);
    expect(handleValueChange).toHaveBeenCalledWith("corte");
  });

  it("shows a new value that comes from outside", () => {
    const { rerender } = render(
      <SearchInput label={SEARCH_LABEL} onValueChange={vi.fn()} value="" />,
    );
    const searchInputPage = createSearchInputPage();

    rerender(
      <SearchInput label={SEARCH_LABEL} onValueChange={vi.fn()} value="uñas" />,
    );

    expect(searchInputPage.getSearchBox(SEARCH_LABEL)).toHaveValue("uñas");
  });
});
