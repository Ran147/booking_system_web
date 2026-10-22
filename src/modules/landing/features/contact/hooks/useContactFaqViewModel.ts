import { useState } from "react";
import type { Nullable } from "@/types";
import type { ContactFaqItem } from "../models/contact.model";

export interface ContactFaqViewModel {
  readonly openFaqId: Nullable<string>;
  readonly toggleFaq: (id: string) => void;
}

export const useContactFaqViewModel = (
  faqItems: readonly ContactFaqItem[],
): ContactFaqViewModel => {
  const [openFaqId, setOpenFaqId] = useState<Nullable<string>>(
    faqItems[0]?.id ?? null,
  );

  const toggleFaq = (id: string): void => {
    setOpenFaqId((previousId) => (previousId === id ? null : id));
  };

  return {
    openFaqId,
    toggleFaq,
  };
};
