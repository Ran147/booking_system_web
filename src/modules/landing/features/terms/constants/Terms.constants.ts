export const TERMS_CONSTANTS = Object.freeze({
  BACK_TO_HOME_KEY: "terms.backToHome",
  CLAUSES: Object.freeze([
    Object.freeze({
      BODY_KEY: "terms.clauses.acceptance.body",
      ID: "acceptance",
      TITLE_KEY: "terms.clauses.acceptance.title",
    }),
    Object.freeze({
      BODY_KEY: "terms.clauses.services.body",
      ID: "services",
      TITLE_KEY: "terms.clauses.services.title",
    }),
    Object.freeze({
      BODY_KEY: "terms.clauses.subscriptions.body",
      ID: "subscriptions",
      TITLE_KEY: "terms.clauses.subscriptions.title",
    }),
    Object.freeze({
      BODY_KEY: "terms.clauses.cancellations.body",
      ID: "cancellations",
      TITLE_KEY: "terms.clauses.cancellations.title",
    }),
    Object.freeze({
      BODY_KEY: "terms.clauses.liability.body",
      ID: "liability",
      TITLE_KEY: "terms.clauses.liability.title",
    }),
  ]),
  CONTAINER_ID: "terms-page-container",
  HEADING_ID: "terms-heading",
  LAST_UPDATED_KEY: "terms.lastUpdated",
  TITLE_KEY: "terms.title",
} as const);
