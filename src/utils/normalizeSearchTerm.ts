import { STRING } from "../constants";

const DIACRITIC_PATTERN = /\p{Diacritic}/gu;

export const normalizeSearchTerm = (searchTerm: string): string =>
  searchTerm
    .normalize("NFD")
    .replace(DIACRITIC_PATTERN, STRING.EMPTY)
    .trim()
    .toLowerCase();
