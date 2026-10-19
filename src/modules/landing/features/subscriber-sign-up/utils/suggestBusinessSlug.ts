import { STRING } from "@/shared/constants";
import {
  BUSINESS_SLUG_SEPARATOR,
  SUBSCRIBER_SIGN_UP_FIELD_LIMIT,
} from "../constants/SubscriberSignUpForm.constants";

const DIACRITIC_PATTERN = /\p{Diacritic}/gu;
const NON_SLUG_CHARACTERS_PATTERN = /[^a-z0-9]+/g;
const EDGE_SEPARATORS_PATTERN = /^-+|-+$/g;

// "Peluquería Doña Ana" -> "peluqueria-dona-ana" (AC-KAN-25-15). The visitor
// can still edit the suggestion; the schema validates the final value.
export const suggestBusinessSlug = (businessName: string): string =>
  businessName
    .normalize("NFD")
    .replace(DIACRITIC_PATTERN, STRING.EMPTY)
    .toLowerCase()
    .replace(NON_SLUG_CHARACTERS_PATTERN, BUSINESS_SLUG_SEPARATOR)
    .replace(EDGE_SEPARATORS_PATTERN, STRING.EMPTY)
    .slice(0, SUBSCRIBER_SIGN_UP_FIELD_LIMIT.BUSINESS_SLUG_MAX_LENGTH)
    .replace(EDGE_SEPARATORS_PATTERN, STRING.EMPTY);
