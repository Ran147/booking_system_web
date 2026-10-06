import {
  EmailAuthProvider,
  reauthenticateWithCredential,
  updatePassword,
} from "firebase/auth";
import { auth } from "@/services";
import { changeCurrentUserPassword } from "../api/changeCurrentUserPassword";

vi.mock("firebase/auth", () => ({
  EmailAuthProvider: { credential: vi.fn() },
  reauthenticateWithCredential: vi.fn(),
  updatePassword: vi.fn(),
}));

describe("changeCurrentUserPassword", () => {
  it("KAN-53: reauthenticates before updating the Firebase password", async () => {
    const currentUser = { email: "subscriber@example.com" };
    const credential = { providerId: "password" };
    Object.assign(auth, { currentUser });
    vi.mocked(EmailAuthProvider.credential).mockReturnValue(
      credential as ReturnType<typeof EmailAuthProvider.credential>,
    );
    vi.mocked(reauthenticateWithCredential).mockResolvedValue(
      undefined as never,
    );
    vi.mocked(updatePassword).mockResolvedValue();

    await changeCurrentUserPassword({
      currentPassword: "CurrentPassword1!",
      newPassword: "NewPassword1!",
    });

    expect(EmailAuthProvider.credential).toHaveBeenCalledWith(
      currentUser.email,
      "CurrentPassword1!",
    );
    expect(reauthenticateWithCredential).toHaveBeenCalledWith(
      currentUser,
      credential,
    );
    expect(updatePassword).toHaveBeenCalledWith(currentUser, "NewPassword1!");
    expect(
      vi.mocked(reauthenticateWithCredential).mock.invocationCallOrder[0],
    ).toBeLessThan(vi.mocked(updatePassword).mock.invocationCallOrder[0] ?? 0);
  });
});
