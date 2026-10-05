import {
  EmailAuthProvider,
  reauthenticateWithCredential,
  updatePassword,
} from "firebase/auth";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { auth } from "@/services/firebase";
import { changeCurrentUserPassword } from "../api/changeCurrentUserPassword";

vi.mock("firebase/auth", () => ({
  EmailAuthProvider: { credential: vi.fn() },
  reauthenticateWithCredential: vi.fn(),
  updatePassword: vi.fn(),
}));

vi.mock("@/services/firebase", () => ({
  auth: {
    currentUser: { email: "customer@example.com" },
  },
}));

describe("changeCurrentUserPassword (KAN-171)", () => {
  beforeEach(() => vi.clearAllMocks());

  it("AC-KAN-171-01: reauthenticates before updating the password", async () => {
    const credential = { providerId: "password" };
    vi.mocked(EmailAuthProvider.credential).mockReturnValue(
      credential as ReturnType<typeof EmailAuthProvider.credential>,
    );
    const operationOrder: string[] = [];
    vi.mocked(reauthenticateWithCredential).mockImplementation(async () => {
      operationOrder.push("reauthenticate");
      return {} as Awaited<ReturnType<typeof reauthenticateWithCredential>>;
    });
    vi.mocked(updatePassword).mockImplementation(async () => {
      operationOrder.push("update");
    });

    await changeCurrentUserPassword({
      currentPassword: "Current1!",
      newPassword: "NewSecure2@",
    });

    expect(EmailAuthProvider.credential).toHaveBeenCalledWith(
      "customer@example.com",
      "Current1!",
    );
    expect(reauthenticateWithCredential).toHaveBeenCalledWith(
      auth.currentUser,
      credential,
    );
    expect(updatePassword).toHaveBeenCalledWith(
      auth.currentUser,
      "NewSecure2@",
    );
    expect(operationOrder).toEqual(["reauthenticate", "update"]);
  });
});
