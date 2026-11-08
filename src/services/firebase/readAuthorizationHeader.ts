import { HTTP_AUTHORIZATION } from "@/constants";
import { auth } from "./firebaseApp";

// The signed-in user's ID token for the Vercel backend, which checks who is
// calling before any action (KAN-59 spec §3). Visitors send no header.
export const readAuthorizationHeader = async (): Promise<
  Record<string, string>
> => {
  const idToken = await auth.currentUser?.getIdToken();
  return idToken
    ? {
        [HTTP_AUTHORIZATION.HEADER]: `${HTTP_AUTHORIZATION.BEARER_PREFIX}${idToken}`,
      }
    : {};
};
