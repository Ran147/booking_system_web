/**
 * Router state sent to sign-in after a sign-up (KAN-27, AS-6): sign-in fills
 * in this email and shows landing:subscriberSignUp.success once.
 */
export interface SignUpCompletedLocationState {
  readonly signUpEmail: string;
}
