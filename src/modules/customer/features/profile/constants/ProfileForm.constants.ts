export const PROFILE_FIELD_LIMIT = Object.freeze({
  FULL_NAME_MAX_LENGTH: 80,
  FULL_NAME_MIN_LENGTH: 2,
  PHONE_MAX_DIGITS: 15,
  PHONE_MAX_LENGTH: 20,
  PHONE_MIN_DIGITS: 7,
});

export const PROFILE_PHONE_PATTERN = /^[0-9+() -]+$/;
export const PROFILE_PHONE_DIGIT_PATTERN = /\d/g;
export const PROFILE_PHONE_INVALID_MESSAGE_KEY = "phoneInvalidError";
