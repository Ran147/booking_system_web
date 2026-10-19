import type { ReactElement } from "react";
import { useLocation } from "react-router";

export const CURRENT_PATH_TEST_ID = "current-path";

// Test-only route element: shows where the router ended up after a redirect.
export const CurrentPathProbe = (): ReactElement => {
  const location = useLocation();

  return (
    <output data-testid={CURRENT_PATH_TEST_ID}>
      {`${location.pathname}${location.search}`}
    </output>
  );
};
