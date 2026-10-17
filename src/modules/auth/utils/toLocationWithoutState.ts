import type { Location, To } from "react-router";

// The address of a location without its router state, hash included, so a
// notice carried in the state can be dropped without losing the #anchor.
export const toLocationWithoutState = (location: Location): To => ({
  hash: location.hash,
  pathname: location.pathname,
  search: location.search,
});
