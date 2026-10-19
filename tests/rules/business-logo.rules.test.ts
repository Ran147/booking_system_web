// @vitest-environment node
import { readFileSync } from "node:fs";
import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
  type RulesTestEnvironment,
} from "@firebase/rules-unit-testing";

const PROJECT_ID = "demo-booking-system";
const LOGO_PATH = "businesses/business-a/profile/logo";
const FORBIDDEN_PATH = "businesses/business-a/profile/banner";
const MAX_LOGO_BYTES = 2 * 1_024 * 1_024;

let testEnvironment: RulesTestEnvironment;

const uploadLogo = (
  context: ReturnType<RulesTestEnvironment["authenticatedContext"]>,
  contentType: string,
  bytes = new Uint8Array([1, 2, 3]),
  path = LOGO_PATH,
): Promise<unknown> =>
  new Promise((resolve, reject) => {
    context
      .storage()
      .ref(path)
      .put(bytes, { contentType })
      .then(resolve, reject);
  });

const ownerContext = (): ReturnType<
  RulesTestEnvironment["authenticatedContext"]
> =>
  testEnvironment.authenticatedContext("subscriber-a", {
    businessId: "business-a",
    role: "subscriber",
  });

describe("storage.rules: business logo", () => {
  beforeAll(async () => {
    testEnvironment = await initializeTestEnvironment({
      firestore: { rules: readFileSync("firestore.rules", "utf8") },
      projectId: PROJECT_ID,
      storage: { rules: readFileSync("storage.rules", "utf8") },
    });
  });

  beforeEach(async () => {
    await testEnvironment.clearFirestore();
    await testEnvironment.clearStorage();
    await testEnvironment.withSecurityRulesDisabled(async (context) => {
      await context
        .firestore()
        .doc("businesses/business-a")
        .set({ ownerUserId: "subscriber-a", status: "active" });
    });
  });

  afterAll(async () => {
    await testEnvironment.cleanup();
  });

  it("KAN-199: lets the owner upload a valid image", async () => {
    await assertSucceeds(uploadLogo(ownerContext(), "image/png"));
  });

  it("KAN-199: lets a visitor read a public business logo", async () => {
    await assertSucceeds(uploadLogo(ownerContext(), "image/png"));

    const visitor = testEnvironment.unauthenticatedContext();

    await assertSucceeds(visitor.storage().ref(LOGO_PATH).getDownloadURL());
  });

  it("KAN-199: lets the owner replace the logo", async () => {
    const subscriber = ownerContext();
    await assertSucceeds(uploadLogo(subscriber, "image/png"));

    await assertSucceeds(
      uploadLogo(subscriber, "image/jpeg", new Uint8Array([4, 5, 6])),
    );
  });

  it("KAN-199: lets the owner delete the logo", async () => {
    const subscriber = ownerContext();
    await assertSucceeds(uploadLogo(subscriber, "image/png"));

    await assertSucceeds(subscriber.storage().ref(LOGO_PATH).delete());
  });

  it("KAN-199: denies another subscriber uploading the logo", async () => {
    const subscriber = testEnvironment.authenticatedContext("subscriber-b", {
      businessId: "business-b",
      role: "subscriber",
    });

    await assertFails(uploadLogo(subscriber, "image/png"));
  });

  it("KAN-199: denies unsupported logo types", async () => {
    await assertFails(uploadLogo(ownerContext(), "image/svg+xml"));
  });

  it("KAN-199: denies logos larger than two MiB", async () => {
    await assertFails(
      uploadLogo(
        ownerContext(),
        "image/png",
        new Uint8Array(MAX_LOGO_BYTES + 1),
      ),
    );
  });

  it("KAN-199: denies writes when the authenticated UID is not the owner", async () => {
    const nonOwner = testEnvironment.authenticatedContext("subscriber-b", {
      businessId: "business-a",
      role: "subscriber",
    });

    await assertFails(uploadLogo(nonOwner, "image/png"));
  });

  it("KAN-199: denies writes for a non-active business", async () => {
    await testEnvironment.withSecurityRulesDisabled(async (context) => {
      await context
        .firestore()
        .doc("businesses/business-a")
        .update({ status: "inactive" });
    });

    await assertFails(uploadLogo(ownerContext(), "image/png"));
  });

  it("KAN-199: denies writes outside the exact logo path", async () => {
    await assertFails(
      uploadLogo(ownerContext(), "image/png", undefined, FORBIDDEN_PATH),
    );
  });
});
