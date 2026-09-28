// Developer-facing messages; never shown to end users.
export const PROVIDER_ERROR = {
  MISSING_AUTH_PROVIDER: "useSession must be used inside AuthProvider",
  MISSING_CURRENT_BUSINESS:
    "useCurrentBusiness requires a signed-in subscriber or collaborator",
  MISSING_THEME_PROVIDER: "useTheme must be used inside ThemeProvider",
} as const;
