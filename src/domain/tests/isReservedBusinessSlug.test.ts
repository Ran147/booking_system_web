import { ROUTE_PATH, STRING } from "@/shared/constants";
import {
  isReservedBusinessSlug,
  RESERVED_BUSINESS_SLUG,
} from "@/shared/domain";

const PATH_SEPARATOR = "/";
const ROUTE_PARAM_PREFIX = ":";

const collectPaths = (routeTree: object): string[] =>
  Object.values(routeTree).flatMap((routeValue: unknown) =>
    typeof routeValue === "string"
      ? [routeValue]
      : collectPaths(routeValue as object),
  );

// Static absolute paths such as "/admin" or "/sign-in"; the landing home ("/"),
// the not-found wildcard and the dynamic "/:businessSlug" are not segments.
const staticTopLevelSegments = collectPaths(ROUTE_PATH)
  .filter((routePath) => routePath.startsWith(PATH_SEPARATOR))
  .map((routePath) => routePath.split(PATH_SEPARATOR)[1] ?? STRING.EMPTY)
  .filter(
    (segment) =>
      segment !== STRING.EMPTY && !segment.startsWith(ROUTE_PARAM_PREFIX),
  );

describe("isReservedBusinessSlug", () => {
  it.each(Object.values(RESERVED_BUSINESS_SLUG))(
    "rejects the reserved slug %s",
    (reservedSlug) => {
      expect(isReservedBusinessSlug(reservedSlug)).toBe(true);
    },
  );

  it("rejects a reserved slug written with capital letters or spaces", () => {
    expect(isReservedBusinessSlug(" Admin ")).toBe(true);
  });

  it("accepts a regular business slug", () => {
    expect(isReservedBusinessSlug("barberia-centro")).toBe(false);
  });

  it("reserves every static top-level route segment", () => {
    expect(staticTopLevelSegments.length).toBeGreaterThan(0);
    staticTopLevelSegments.forEach((segment) => {
      expect(isReservedBusinessSlug(segment)).toBe(true);
    });
  });
});
