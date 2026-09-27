import { resources } from "../resources";

const collectKeys = (translationTree: object, keyPrefix: string): string[] =>
  Object.entries(translationTree).flatMap(([key, value]) => {
    const fullKey = keyPrefix ? `${keyPrefix}.${key}` : key;
    return typeof value === "object" && value !== null
      ? collectKeys(value, fullKey)
      : [fullKey];
  });

describe("locale parity", () => {
  it.each(Object.keys(resources.es))(
    "namespace %s has the same keys in es and en",
    (namespace) => {
      const namespaceName = namespace as keyof typeof resources.es;

      expect(collectKeys(resources.en[namespaceName], "").sort()).toEqual(
        collectKeys(resources.es[namespaceName], "").sort(),
      );
    },
  );
});
