import { FirebaseError } from "firebase/app";
import {
  EmailAuthProvider,
  reauthenticateWithCredential,
  updatePassword,
} from "firebase/auth";
import { FIREBASE_ERROR_CODE } from "@/constants";
import { auth } from "@/services";
import { changeCurrentUserPassword } from "../api/changeCurrentUserPassword";

vi.mock("firebase/auth", () => ({
  EmailAuthProvider: { credential: vi.fn() },
  reauthenticateWithCredential: vi.fn(),
  updatePassword: vi.fn(),
}));

describe("changeCurrentUserPassword", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

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

  it("KAN-53: does not update the password when reauthentication is rejected", async () => {
    const currentUser = { email: "subscriber@example.com" };
    const firebaseError = new FirebaseError(
      FIREBASE_ERROR_CODE.INVALID_CREDENTIAL,
      "invalid credential",
    );
    Object.assign(auth, { currentUser });
    vi.mocked(EmailAuthProvider.credential).mockReturnValue({} as never);
    vi.mocked(reauthenticateWithCredential).mockRejectedValue(firebaseError);

    await expect(
      changeCurrentUserPassword({
        currentPassword: "WrongPassword1!",
        newPassword: "NewPassword1!",
      }),
    ).rejects.toBe(firebaseError);
    expect(updatePassword).not.toHaveBeenCalled();
  });

  it("KAN-53: rejects a missing authenticated user without calling Firebase Auth operations", async () => {
    Object.assign(auth, { currentUser: null });

    await expect(
      changeCurrentUserPassword({
        currentPassword: "CurrentPassword1!",
        newPassword: "NewPassword1!",
      }),
    ).rejects.toMatchObject({ code: FIREBASE_ERROR_CODE.USER_MISMATCH });
    expect(EmailAuthProvider.credential).not.toHaveBeenCalled();
    expect(reauthenticateWithCredential).not.toHaveBeenCalled();
    expect(updatePassword).not.toHaveBeenCalled();
  });

  it("KAN-53: rejects an authenticated user without email without calling Firebase Auth operations", async () => {
    Object.assign(auth, { currentUser: { email: null } });

    await expect(
      changeCurrentUserPassword({
        currentPassword: "CurrentPassword1!",
        newPassword: "NewPassword1!",
      }),
    ).rejects.toMatchObject({ code: FIREBASE_ERROR_CODE.USER_MISMATCH });
    expect(EmailAuthProvider.credential).not.toHaveBeenCalled();
    expect(reauthenticateWithCredential).not.toHaveBeenCalled();
    expect(updatePassword).not.toHaveBeenCalled();
  });

  it("KAN-53: propagates a Firebase reauthentication error unchanged", async () => {
    const currentUser = { email: "subscriber@example.com" };
    const firebaseError = new FirebaseError(
      FIREBASE_ERROR_CODE.USER_TOKEN_EXPIRED,
      "expired token",
    );
    Object.assign(auth, { currentUser });
    vi.mocked(EmailAuthProvider.credential).mockReturnValue({} as never);
    vi.mocked(reauthenticateWithCredential).mockRejectedValue(firebaseError);

    await expect(
      changeCurrentUserPassword({
        currentPassword: "CurrentPassword1!",
        newPassword: "NewPassword1!",
      }),
    ).rejects.toBe(firebaseError);
    expect(updatePassword).not.toHaveBeenCalled();
  });

  it("KAN-53: propagates a Firebase password-update error unchanged", async () => {
    const currentUser = { email: "subscriber@example.com" };
    const firebaseError = new FirebaseError(
      FIREBASE_ERROR_CODE.NETWORK_REQUEST_FAILED,
      "network failure",
    );
    Object.assign(auth, { currentUser });
    vi.mocked(EmailAuthProvider.credential).mockReturnValue({} as never);
    vi.mocked(reauthenticateWithCredential).mockResolvedValue(
      undefined as never,
    );
    vi.mocked(updatePassword).mockRejectedValue(firebaseError);

    await expect(
      changeCurrentUserPassword({
        currentPassword: "CurrentPassword1!",
        newPassword: "NewPassword1!",
      }),
    ).rejects.toBe(firebaseError);
    expect(reauthenticateWithCredential).toHaveBeenCalledOnce();
    expect(updatePassword).toHaveBeenCalledOnce();
  });
});
