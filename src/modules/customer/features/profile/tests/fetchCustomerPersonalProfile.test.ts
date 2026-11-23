import { FirebaseError } from "firebase/app";
import { doc, getDoc } from "firebase/firestore";
import { FIREBASE_ERROR_CODE, FIRESTORE_COLLECTION } from "@/constants";
import { firestore } from "@/services";
import { fetchCustomerPersonalProfile } from "../api/fetchCustomerPersonalProfile";

vi.mock("firebase/firestore", () => ({ doc: vi.fn(), getDoc: vi.fn() }));
vi.mock("@/services", () => ({ firestore: {} }));

describe("KAN-169 own document read", () => {
  it("KAN-169 AC-01 AC-07: reads only the supplied session identity and returns its projection", async () => {
    vi.mocked(getDoc).mockResolvedValue({
      ["data"]: () => ({ email: "firestore@demo.test", role: "customer" }),
      exists: () => true,
    } as Awaited<ReturnType<typeof getDoc>>);

    expect(await fetchCustomerPersonalProfile("session-user")).toEqual({
      email: "firestore@demo.test",
      fullName: null,
      phone: null,
    });
    expect(doc).toHaveBeenCalledWith(
      firestore,
      FIRESTORE_COLLECTION.USERS,
      "session-user",
    );
  });

  it("KAN-169 AC-05: returns null only for a nonexistent document", async () => {
    const readFields = vi.fn();
    vi.mocked(getDoc).mockResolvedValue({
      ["data"]: readFields,
      exists: () => false,
    } as unknown as Awaited<ReturnType<typeof getDoc>>);
    expect(await fetchCustomerPersonalProfile("session-user")).toBeNull();
    expect(readFields).not.toHaveBeenCalled();
  });

  it("KAN-169 AC-04: propagates permission denied for safe presentation mapping", async () => {
    const error = new FirebaseError(
      FIREBASE_ERROR_CODE.PERMISSION_DENIED,
      "private",
    );
    vi.mocked(getDoc).mockRejectedValue(error);
    await expect(fetchCustomerPersonalProfile("session-user")).rejects.toBe(
      error,
    );
  });
});
