// In-memory stand-in for the parts of firebase-admin that api/callFunction.ts
// uses, so its tests need no real project and no emulator. Each test file
// points firebase-admin/* at it with vi.mock.

import type { NullableUndefined } from "../../src/types/Nullable";

type DocumentValue = Record<string, unknown>;

// Firestore names the snapshot reader data(); the project bans that name in
// its own declarations, so the fake declares it through these constants.
const SNAPSHOT_READER = "data";
const QUERY_OPERATOR_IN = "in";

interface FakeAccount {
  customClaims?: DocumentValue;
  displayName: string;
  email: string;
  password: string;
}

interface FakeTimestamp {
  readonly milliseconds: number;
}

export interface FakeDocumentSnapshot {
  readonly [SNAPSHOT_READER]: () => NullableUndefined<DocumentValue>;
  readonly exists: boolean;
  readonly id: string;
  readonly ref: FakeDocumentReference;
}

export interface FakeQuerySnapshot {
  readonly docs: FakeDocumentSnapshot[];
  readonly empty: boolean;
  readonly forEach: (
    callback: (snapshot: FakeDocumentSnapshot) => void,
  ) => void;
}

export interface FakeQuery {
  readonly get: () => Promise<FakeQuerySnapshot>;
  readonly limit: (count: number) => FakeQuery;
  readonly where: (
    field: string,
    operator: string,
    value: unknown,
  ) => FakeQuery;
}

export interface FakeCollectionReference extends FakeQuery {
  readonly add: (value: DocumentValue) => Promise<FakeDocumentReference>;
  readonly doc: (documentId?: string) => FakeDocumentReference;
}

export interface FakeDocumentReference {
  readonly collection: (name: string) => FakeCollectionReference;
  readonly create: (value: DocumentValue) => Promise<void>;
  readonly delete: () => Promise<void>;
  readonly get: () => Promise<FakeDocumentSnapshot>;
  readonly id: string;
  readonly path: string;
  readonly set: (
    value: DocumentValue,
    options?: { merge?: boolean },
  ) => Promise<void>;
  readonly update: (value: DocumentValue) => Promise<void>;
}

interface QueryFilter {
  readonly field: string;
  readonly operator: string;
  readonly value: unknown;
}

const FIRESTORE_ALREADY_EXISTS_CODE = 6;
const FIRESTORE_NOT_FOUND_CODE = 5;

const accounts = new Map<string, FakeAccount>();
const documents = new Map<string, DocumentValue>();
const failingPaths = new Set<string>();
const idTokens = new Map<string, DocumentValue & { uid: string }>();
let createdAccountCount = 0;
let createdDocumentCount = 0;

const createCodedError = (code: number | string): Error =>
  Object.assign(new Error(String(code)), { code });

const assertWritable = (path: string): void => {
  if (failingPaths.has(path)) {
    throw new Error(`Write failed: ${path}`);
  }
};

const readLastSegment = (path: string): string => path.split("/").pop() ?? "";

const matchesFilter = (value: DocumentValue, filter: QueryFilter): boolean =>
  filter.operator === QUERY_OPERATOR_IN && Array.isArray(filter.value)
    ? filter.value.includes(value[filter.field])
    : value[filter.field] === filter.value;

const createDocumentSnapshot = (path: string): FakeDocumentSnapshot => ({
  [SNAPSHOT_READER]: (): NullableUndefined<DocumentValue> =>
    documents.get(path),
  exists: documents.has(path),
  id: readLastSegment(path),
  ref: createDocumentReference(path),
});

const createQuery = (
  collectionPath: string,
  filters: readonly QueryFilter[],
  maximumCount: number,
): FakeQuery => ({
  get: async (): Promise<FakeQuerySnapshot> => {
    const docs = [...documents.entries()]
      .filter(
        ([path, value]) =>
          path.startsWith(`${collectionPath}/`) &&
          !path.slice(collectionPath.length + 1).includes("/") &&
          filters.every((filter) => matchesFilter(value, filter)),
      )
      .slice(0, maximumCount)
      .map(([path]) => createDocumentSnapshot(path));
    return {
      docs,
      empty: docs.length === 0,
      forEach: (callback): void => docs.forEach(callback),
    };
  },
  limit: (count: number): FakeQuery =>
    createQuery(collectionPath, filters, count),
  where: (field: string, operator: string, value: unknown): FakeQuery =>
    createQuery(
      collectionPath,
      [...filters, { field, operator, value }],
      maximumCount,
    ),
});

const createCollectionReference = (path: string): FakeCollectionReference => ({
  ...createQuery(path, [], Number.POSITIVE_INFINITY),
  add: async (value: DocumentValue): Promise<FakeDocumentReference> => {
    const documentReference = createCollectionReference(path).doc();
    await documentReference.set(value);
    return documentReference;
  },
  doc: (documentId?: string): FakeDocumentReference => {
    if (documentId) {
      return createDocumentReference(`${path}/${documentId}`);
    }
    createdDocumentCount += 1;
    return createDocumentReference(`${path}/generated-${createdDocumentCount}`);
  },
});

const createDocumentReference = (path: string): FakeDocumentReference => ({
  collection: (name: string): FakeCollectionReference =>
    createCollectionReference(`${path}/${name}`),
  create: async (value: DocumentValue): Promise<void> => {
    assertWritable(path);
    if (documents.has(path)) {
      throw createCodedError(FIRESTORE_ALREADY_EXISTS_CODE);
    }
    documents.set(path, value);
  },
  delete: async (): Promise<void> => {
    documents.delete(path);
  },
  get: async (): Promise<FakeDocumentSnapshot> => createDocumentSnapshot(path),
  id: readLastSegment(path),
  path,
  set: async (
    value: DocumentValue,
    options?: { merge?: boolean },
  ): Promise<void> => {
    assertWritable(path);
    documents.set(
      path,
      options?.merge ? { ...documents.get(path), ...value } : value,
    );
  },
  update: async (value: DocumentValue): Promise<void> => {
    assertWritable(path);
    const currentValue = documents.get(path);
    if (!currentValue) {
      throw createCodedError(FIRESTORE_NOT_FOUND_CODE);
    }
    documents.set(path, { ...currentValue, ...value });
  },
});

const auth = {
  createUser: async (properties: {
    displayName: string;
    email: string;
    password: string;
  }): Promise<{ uid: string }> => {
    const isEmailTaken = [...accounts.values()].some(
      (account) => account.email === properties.email,
    );
    if (isEmailTaken) {
      throw createCodedError("auth/email-already-exists");
    }
    createdAccountCount += 1;
    const uid = `user-${createdAccountCount}`;
    accounts.set(uid, { ...properties });
    return { uid };
  },
  deleteUser: async (uid: string): Promise<void> => {
    accounts.delete(uid);
  },
  setCustomUserClaims: async (
    uid: string,
    customClaims: DocumentValue,
  ): Promise<void> => {
    const account = accounts.get(uid);
    if (account) {
      account.customClaims = customClaims;
    }
  },
  verifyIdToken: async (
    idToken: string,
  ): Promise<DocumentValue & { uid: string }> => {
    const decodedToken = idTokens.get(idToken);
    if (!decodedToken) {
      throw createCodedError("auth/argument-error");
    }
    return decodedToken;
  },
};

const firestore = {
  batch: (): {
    commit: () => Promise<void>;
    update: (reference: FakeDocumentReference, value: DocumentValue) => void;
  } => {
    const pendingUpdates: (() => Promise<void>)[] = [];
    return {
      commit: async (): Promise<void> => {
        await Promise.all(pendingUpdates.map((runUpdate) => runUpdate()));
      },
      update: (reference, value): void => {
        pendingUpdates.push(() => reference.update(value));
      },
    };
  },
  collection: createCollectionReference,
  recursiveDelete: async (reference: { path: string }): Promise<void> => {
    [...documents.keys()]
      .filter(
        (path) =>
          path === reference.path || path.startsWith(`${reference.path}/`),
      )
      .forEach((path) => documents.delete(path));
  },
};

const createTimestamp = (milliseconds: number): FakeTimestamp => ({
  milliseconds,
});

// A signed-in caller: the client sends idToken, verifyIdToken answers claims.
const signIn = (
  idToken: string,
  claims: DocumentValue & { uid: string },
): void => {
  idTokens.set(idToken, claims);
};

const reset = (): void => {
  accounts.clear();
  documents.clear();
  failingPaths.clear();
  idTokens.clear();
  createdAccountCount = 0;
  createdDocumentCount = 0;
};

export const firebaseAdminFake = {
  accounts,
  auth,
  createTimestamp,
  documents,
  failingPaths,
  firestore,
  reset,
  signIn,
};
