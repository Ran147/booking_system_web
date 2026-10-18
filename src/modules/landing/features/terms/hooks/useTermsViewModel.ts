import { useCallback, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router";
import { I18N_NAMESPACE, ROUTE_PATH } from "@/shared/constants";
import { TERMS_CONSTANTS } from "../constants/Terms.constants";
import type {
  TermsLegalClause,
  TermsViewModel,
} from "../models/TermsViewModel.interface";

export const useTermsViewModel = (): TermsViewModel => {
  const { t } = useTranslation(I18N_NAMESPACE.LANDING);
  const navigate = useNavigate();

  const title = t(TERMS_CONSTANTS.TITLE_KEY);
  const lastUpdated = t(TERMS_CONSTANTS.LAST_UPDATED_KEY);
  const backToHomeLabel = t(TERMS_CONSTANTS.BACK_TO_HOME_KEY);

  const handleBackToHome = useCallback((): void => {
    navigate(ROUTE_PATH.LANDING.HOME);
  }, [navigate]);

  const clauses = useMemo((): readonly TermsLegalClause[] => {
    return TERMS_CONSTANTS.CLAUSES.map((clause): TermsLegalClause => ({
      body: t(clause.BODY_KEY),
      id: clause.ID,
      title: t(clause.TITLE_KEY),
    }));
  }, [t]);

  return {
    backToHomeLabel,
    clauses,
    handleBackToHome,
    lastUpdated,
    title,
  };
};
