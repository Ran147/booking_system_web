// ESLint flat config. Each block names the skill whose rules it enforces.
// If a rule here and a skill disagree, this file wins and the skill is fixed.
import js from "@eslint/js";
import prettierConfig from "eslint-config-prettier";
import i18next from "eslint-plugin-i18next";
import { importX } from "eslint-plugin-import-x";
import jsxA11y from "eslint-plugin-jsx-a11y";
import react from "eslint-plugin-react";
import reactHooks from "eslint-plugin-react-hooks";
import globals from "globals";
import tseslint from "typescript-eslint";

const FORBIDDEN_ABBREVIATIONS = [
  "btn",
  "cb",
  "ctx",
  "data",
  "err",
  "errorInfo",
  "evt",
  "fn",
  "idx",
  "img",
  "msg",
  "req",
  "res",
  "temp",
  "tmp",
  "val",
  "vm",
];

// i18n-standards: only attributes a person can read are checked for literal text
const I18N_LITERAL_RULE = [
  "error",
  {
    "jsx-attributes": {
      include: ["^(alt|aria-description|aria-label|label|placeholder|title)$"],
    },
    mode: "jsx-only",
  },
];

const PALETTE_COLOR_PATTERN =
  "\\b(bg|text|border|ring|fill|stroke|outline|from|to|via)-(slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose)-\\d";

// code-style-standards + constants-standards + theming-standards
const sharedRestrictedSyntax = [
  {
    message:
      "Use Nullable / NullableRef / NullableUndefined from @/shared/types (code-style-standards).",
    selector: "TSUnionType > TSNullKeyword",
  },
  {
    message:
      "Use Nullable / NullableRef / NullableUndefined from @/shared/types (code-style-standards).",
    selector: "TSUnionType > TSUndefinedKeyword",
  },
  {
    message:
      "No TypeScript enums. Use a constant object and a derived type (constants-standards).",
    selector: "TSEnumDeclaration",
  },
  {
    message:
      "Compare against a constant, not a raw string (constants-standards).",
    selector:
      "BinaryExpression[operator=/^[!=]==$/]:not([left.type='UnaryExpression']) > Literal[value=/./]",
  },
  {
    message:
      "Use design tokens (bg-primary, text-muted-foreground…), not Tailwind palette colors (theming-standards).",
    selector: `Literal[value=/${PALETTE_COLOR_PATTERN}/]`,
  },
  {
    message:
      "Use design tokens (bg-primary, text-muted-foreground…), not Tailwind palette colors (theming-standards).",
    selector: `TemplateElement[value.raw=/${PALETTE_COLOR_PATTERN}/]`,
  },
  {
    message:
      "No hex colors in code. Add a token to src/styles/tokens.css (theming-standards).",
    selector: "Literal[value=/#[0-9a-fA-F]{3,8}\\b/]",
  },
  {
    message:
      "No dark: variants in components. Tokens switch automatically (theming-standards).",
    selector: "Literal[value=/(^|\\s)dark:/]",
  },
];

// component-architecture: logic hooks are not allowed in .tsx files of features
const logicHooksInTsx = [
  "useCallback",
  "useEffect",
  "useLayoutEffect",
  "useMemo",
  "useMutation",
  "useQuery",
  "useReducer",
  "useState",
].map((hookName) => ({
  message: `${hookName} belongs in the ViewModel hook, not in the .tsx (component-architecture).`,
  selector: `CallExpression[callee.name="${hookName}"]`,
}));

export default tseslint.config(
  {
    ignores: [
      "dist/**",
      "coverage/**",
      "functions/lib/**",
      "node_modules/**",
      "src/shared/components/ui/**", // vendored shadcn/ui (component-standards §3)
    ],
  },

  js.configs.recommended,
  ...tseslint.configs.recommended,
  importX.flatConfigs.recommended,
  importX.flatConfigs.typescript,

  {
    files: ["**/*.{ts,tsx}"],
    languageOptions: {
      ecmaVersion: 2022,
      globals: { ...globals.browser },
      parserOptions: { ecmaFeatures: { jsx: true } },
    },
    plugins: {
      "jsx-a11y": jsxA11y,
      react,
      "react-hooks": reactHooks,
    },
    settings: {
      "import-x/resolver": { typescript: true },
      react: { version: "detect" },
    },
    rules: {
      ...react.configs.flat.recommended.rules,
      ...react.configs.flat["jsx-runtime"].rules,
      ...reactHooks.configs.recommended.rules,
      ...jsxA11y.flatConfigs.recommended.rules,

      // code-style-standards
      "@typescript-eslint/consistent-type-imports": [
        "error",
        { fixStyle: "inline-type-imports" },
      ],
      "@typescript-eslint/explicit-function-return-type": [
        "error",
        { allowExpressions: false, allowTypedFunctionExpressions: true },
      ],
      "@typescript-eslint/no-explicit-any": "error",
      "@typescript-eslint/no-unused-vars": [
        "error",
        { argsIgnorePattern: "^_" },
      ],
      "func-style": ["error", "expression"],
      "id-denylist": ["error", ...FORBIDDEN_ABBREVIATIONS],
      "id-length": [
        "error",
        { exceptions: ["_", "i", "j", "t"], min: 2, properties: "never" },
      ],
      "import-x/no-default-export": "error",
      "import-x/no-duplicates": "error",
      "import-x/order": [
        "error",
        {
          alphabetize: { order: "asc" },
          groups: [
            "builtin",
            "external",
            "internal",
            ["parent", "sibling", "index"],
          ],
          pathGroups: [{ group: "internal", pattern: "@/**" }],
        },
      ],
      "no-console": "error",
      "no-restricted-imports": [
        "error",
        {
          paths: [
            {
              message: "No global stores (state-management).",
              name: "zustand",
            },
            {
              message: "No global stores (state-management).",
              name: "@reduxjs/toolkit",
            },
            {
              message: "No global stores (state-management).",
              name: "react-redux",
            },
          ],
          patterns: [
            {
              group: ["../../*"],
              message: "Use the @/ alias (code-style-standards).",
            },
            {
              group: ["@/shared/components/ui/*"],
              message: "Import from @/shared/components (component-standards).",
            },
            {
              group: ["@/portals/*/features/*/*"],
              message:
                "Import another feature only through its index.ts (component-architecture).",
            },
          ],
        },
      ],
      "no-restricted-syntax": ["error", ...sharedRestrictedSyntax],
      "prefer-arrow-callback": "error",

      // api-mutation-standards
      "no-alert": "error",

      // unit-testing-standards
      "no-restricted-properties": [
        "error",
        {
          message: "No snapshot tests (unit-testing-standards).",
          property: "toMatchSnapshot",
        },
      ],

      // domain-glossary: forbidden synonyms
      "id-match": [
        "error",
        "^(?![\\s\\S]*([Aa]ppointment|[Rr]eservation|[Tt]enant))[\\s\\S]*$",
        { onlyDeclarations: true, properties: false },
      ],

      "react/prop-types": "off",
    },
  },

  // constants-standards: magic numbers outside constants files and tests
  {
    files: ["src/**/*.{ts,tsx}", "functions/src/**/*.ts"],
    ignores: ["**/*.constants.ts", "**/tests/**", "**/*.test.{ts,tsx}"],
    rules: {
      "@typescript-eslint/no-magic-numbers": [
        "error",
        {
          ignore: [-1, 0, 1],
          ignoreArrayIndexes: true,
          ignoreDefaultValues: true,
        },
      ],
    },
  },

  // constants-standards: sorted keys and SCREAMING_SNAKE_CASE objects in constants files
  {
    files: ["**/*.constants.ts"],
    rules: {
      "@typescript-eslint/naming-convention": [
        "error",
        {
          format: ["UPPER_CASE"],
          modifiers: ["const", "global"],
          selector: "variable",
        },
        { format: ["PascalCase"], selector: "typeLike" },
      ],
      "sort-keys": ["error", "asc", { natural: true }],
    },
  },

  // code-style-standards: Nullable.ts is the only place allowed to spell | null / | undefined
  {
    files: ["src/shared/types/Nullable.ts"],
    rules: { "no-restricted-syntax": "off" },
  },

  // i18n-standards + component-architecture + component-standards: feature UI files
  {
    files: ["src/portals/**/*.tsx", "src/features/**/*.tsx"],
    ignores: ["**/tests/**", "**/*.test.tsx"],
    plugins: { i18next },
    rules: {
      "i18next/no-literal-string": I18N_LITERAL_RULE,
      "no-restricted-syntax": [
        "error",
        ...sharedRestrictedSyntax,
        ...logicHooksInTsx,
      ],
      "react/forbid-dom-props": ["error", { forbid: ["style"] }],
      "react/forbid-elements": [
        "error",
        {
          forbid: [
            "a",
            "button",
            "dialog",
            "img",
            "input",
            "select",
            "table",
            "textarea",
          ].map((element) => ({
            element,
            message: "Use the shared component (component-standards).",
          })),
        },
      ],
    },
  },

  // i18n-standards: no visible text in shared components either
  {
    files: ["src/shared/components/**/*.tsx"],
    plugins: { i18next },
    rules: { "i18next/no-literal-string": I18N_LITERAL_RULE },
  },

  // unit-testing-standards: Page Objects have no assertions
  {
    files: ["**/*.page.ts"],
    rules: {
      "no-restricted-syntax": [
        "error",
        ...sharedRestrictedSyntax,
        {
          message: "Page Objects have no expect (unit-testing-standards).",
          selector: 'CallExpression[callee.name="expect"]',
        },
      ],
    },
  },

  // Tests: vitest globals
  {
    files: ["**/*.test.{ts,tsx}", "**/tests/**", "src/shared/test-utils/**"],
    languageOptions: { globals: { ...globals.vitest } },
  },

  // Local tooling (npm run seed): Node globals; console output is the
  // script's only interface, so no-console is off here and nowhere else
  {
    files: ["scripts/**/*.ts"],
    languageOptions: { globals: { ...globals.node } },
    rules: { "no-console": "off" },
  },

  // Tool config files must use export default; typescript-eslint documents
  // its default import (`tseslint.configs`), which import-x warns about
  {
    files: ["*.config.{js,ts}"],
    rules: {
      "import-x/no-default-export": "off",
      "import-x/no-named-as-default-member": "off",
    },
  },

  prettierConfig,
);
