import { createRequire } from "node:module";
import type * as FirebaseAdminApp from "firebase-admin/app";
import type * as FirebaseAdminFirestore from "firebase-admin/firestore";

const DISPATCHER_APP_NAME = "vercel-dispatcher-copy";
const REPOSITORY_ROOT_PACKAGE_JSON = "../../../../package.json";

// The Vercel dispatcher loads firebase-admin from the repository root, while
// the handlers are built with the copy in functions/node_modules (Q8). This
// returns a Firestore of the root copy, connected to the same emulator, so a
// test can run a handler the way the dispatcher does.
export const readRepositoryRootFirestore = (
  projectId: string,
): FirebaseAdminFirestore.Firestore => {
  const requireFromRepositoryRoot = createRequire(
    new URL(REPOSITORY_ROOT_PACKAGE_JSON, import.meta.url),
  );
  const rootApp = requireFromRepositoryRoot(
    "firebase-admin/app",
  ) as typeof FirebaseAdminApp;
  const rootFirestore = requireFromRepositoryRoot(
    "firebase-admin/firestore",
  ) as typeof FirebaseAdminFirestore;
  const dispatcherApp =
    rootApp.getApps().find((app) => app.name === DISPATCHER_APP_NAME) ??
    rootApp.initializeApp({ projectId }, DISPATCHER_APP_NAME);
  return rootFirestore.getFirestore(dispatcherApp);
};
