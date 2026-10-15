import {
  SUBSCRIBER_SIGN_UP_MESSAGE_KEY,
  type SubscriberSignUpMessageKey,
} from "../constants/SubscriberSignUpForm.constants";

export const isSubscriberSignUpMessageKey = (
  message: string,
): message is SubscriberSignUpMessageKey =>
  Object.values(SUBSCRIBER_SIGN_UP_MESSAGE_KEY).some(
    (messageKey) => messageKey === message,
  );
