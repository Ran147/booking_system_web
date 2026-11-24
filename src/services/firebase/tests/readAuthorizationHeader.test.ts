import { auth } from "../firebaseApp";
import { readAuthorizationHeader } from "../readAuthorizationHeader";

// firebaseApp is mocked in setupTests with an empty auth: each test sets the
// signed-in user it needs.
const setCurrentUser = (currentUser: unknown): void => {
  Object.assign(auth, { currentUser });
};

describe("readAuthorizationHeader (KAN-59)", () => {
  afterEach(() => {
    setCurrentUser(null);
  });

  it("KAN-59: a signed-in user sends their ID token as a Bearer token", async () => {
    setCurrentUser({ getIdToken: async (): Promise<string> => "id-token-1" });

    await expect(readAuthorizationHeader()).resolves.toEqual({
      Authorization: "Bearer id-token-1",
    });
  });

  it("KAN-59: a visitor sends no Authorization header", async () => {
    setCurrentUser(null);

    await expect(readAuthorizationHeader()).resolves.toEqual({});
  });
});
