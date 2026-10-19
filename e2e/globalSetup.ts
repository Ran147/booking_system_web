import { seedEmulators } from "./seedEmulators";

// Loads the seed accounts once for the whole run. Spec files run at the same
// time, and seeding from each of them made two seeds write the same user at
// once ("uid already exists").
const globalSetup = (): void => {
  seedEmulators();
};

export default globalSetup;
