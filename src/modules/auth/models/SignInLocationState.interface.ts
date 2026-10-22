/**
 * Router state that sign-in accepts. The subscriber sign-up sends the new
 * email (KAN-27, AC-KAN-27-01): sign-in fills it in and shows
 * landing:subscriberSignUp.success once.
 */
export interface SignInLocationState {
  readonly signUpEmail: string;
}
