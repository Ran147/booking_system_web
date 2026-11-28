import { applyActionCode } from "firebase/auth";
import { auth } from "@/services/firebase";
import { applyEmailVerificationCode } from "../api/applyEmailVerificationCode";

vi.mock("firebase/auth", () => ({
  applyActionCode: vi.fn(),
}));

vi.mock("@/services/firebase", () => ({
  auth: { currentUser: null },
}));

const OOB_CODE = "valid-oob-code";

const signInWithReload = (reload: () => Promise<void>): void => {
  Reflect.set(auth, "currentUser", { reload });
};

describe("applyEmailVerificationCode", () => {
  beforeEach(() => {
    vi.mocked(applyActionCode).mockResolvedValue();
  });

  afterEach(() => {
    Reflect.set(auth, "currentUser", null);
    vi.clearAllMocks();
  });

  it("AC-KAN-126-02: applies the code and reloads the signed-in account", async () => {
    const reload = vi.fn().mockResolvedValue(undefined);
    signInWithReload(reload);

    await applyEmailVerificationCode(OOB_CODE);

    expect(applyActionCode).toHaveBeenCalledWith(auth, OOB_CODE);
    expect(reload).toHaveBeenCalledTimes(1);
  });

  it("AC-KAN-126-02: a failed reload still counts as verified (the code is already used)", async () => {
    signInWithReload(vi.fn().mockRejectedValue(new Error("offline")));

    await expect(applyEmailVerificationCode(OOB_CODE)).resolves.toBeUndefined();
  });

  it("AC-KAN-126-03: a rejected code is reported and nothing is reloaded", async () => {
    const reload = vi.fn();
    signInWithReload(reload);
    vi.mocked(applyActionCode).mockRejectedValue(new Error("invalid"));

    await expect(applyEmailVerificationCode(OOB_CODE)).rejects.toThrow(
      "invalid",
    );
    expect(reload).not.toHaveBeenCalled();
  });
});
