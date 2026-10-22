export const KEYBOARD_KEY = Object.freeze({
  ENTER: "Enter",
  SPACE: " ",
});

export const SERVICE_FEATURE_LIMIT = Object.freeze({
  ITEM_MAX_LENGTH: 80,
  MAX_ITEMS: 10,
});

export const SERVICE_FIELD_LIMIT = Object.freeze({
  DESCRIPTION_MAX_LENGTH: 1000,
  DURATION_MAX_MINUTES: 480,
  DURATION_MIN_MINUTES: 5,
  DURATION_STEP_MINUTES: 5,
  NAME_MAX_LENGTH: 80,
  NAME_MIN_LENGTH: 2,
  PRICE_MIN: 0,
});

export const SERVICE_IMAGE_LIMIT = Object.freeze({
  ALLOWED_EXTENSIONS: Object.freeze([".jpg", ".jpeg", ".png", ".webp"]),
  ALLOWED_MIME_TYPES: Object.freeze(["image/jpeg", "image/png", "image/webp"]),
  MAX_BYTES: 2097152,
});
