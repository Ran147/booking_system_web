import { FirebaseError } from "firebase/app";
import type { ReactElement } from "react";
import type { RouteObject } from "react-router";
import type { RecaptchaFieldProps } from "@/components/common";
import { ROUTE_PATH, SEARCH_PARAM } from "@/constants";
import { USER_ROLE } from "@/domain";
import {
  CUSTOMER_SESSION,
  renderRoutesWithProviders,
  SIGNED_OUT_SESSION,
  SUBSCRIBER_SESSION,
  SUPER_ADMIN_SESSION,
  testI18n,
} from "@/test-utils";
import { CurrentPathProbe } from "./CurrentPathProbe";
import { createSignInPage, type SignInPageObject } from "./SignInPage.page";
import { signInWithPassword } from "../api/signInWithPassword";
import { authRoutes } from "../auth.routes";
import { RequireRole } from "../components/RequireRole";
import type { Session } from "../models/Session.types";
import type { SignInResponse } from "../models/SignIn.mutation";

vi.mock("../api/signInWithPassword");

vi.mock("@/components/common/recaptcha-field", async () => {
  const { testI18n: doubleI18n } = await import("@/test-utils/testI18n");
  return {
    RecaptchaField: ({
      onTokenChange,
      resetSignal,
    }: Pick<
      RecaptchaFieldProps,
      "onTokenChange" | "resetSignal"
    >): ReactElement => (
      <button
        data-reset-signal={resetSignal}
        onClick={(): void => onTokenChange("recaptcha-token")}
        type="button"
      >
        {doubleI18n.t("auth.signIn.recaptchaLabel")}
      </button>
    ),
  };
});

const SUPER_ADMIN_EMAIL = "admin@demo.test";
const SUPER_ADMIN_PASSWORD = "Emulator-Only-123!";

const responseFor = (
  session: SignInResponse["session"],
  language: SignInResponse["language"] = null,
): SignInResponse => ({ language, session });

const signInPathWithRedirect = (redirectPath: string): string =>
  `${ROUTE_PATH.AUTH.SIGN_IN}?${SEARCH_PARAM.REDIRECT_TO}=${encodeURIComponent(redirectPath)}`;

const authProbeRoutes: RouteObject[] = [
  ...authRoutes,
  { element: <CurrentPathProbe />, path: ROUTE_PATH.NOT_FOUND },
];

const guardedAdminRoutes: RouteObject[] = [
  ...authRoutes,
  {
    children: [{ element: <CurrentPathProbe />, index: true }],
    element: <RequireRole allowedRoles={[USER_ROLE.SUPER_ADMIN]} />,
    path: ROUTE_PATH.ADMIN.ROOT,
  },
  { element: <CurrentPathProbe />, path: ROUTE_PATH.NOT_FOUND },
];

const renderSignInPage = async (
  initialPath: string = ROUTE_PATH.AUTH.SIGN_IN,
  routes: RouteObject[] = authProbeRoutes,
  session: Session = SIGNED_OUT_SESSION,
): Promise<SignInPageObject> => {
  renderRoutesWithProviders(routes, {
    initialPath,
    session,
  });
  const signInPage = createSignInPage();
  return signInPage;
};

const fillSuperAdminForm = async (
  signInPage: SignInPageObject,
): Promise<void> => {
  await signInPage.typeEmail(SUPER_ADMIN_EMAIL);
  await signInPage.typePassword(SUPER_ADMIN_PASSWORD);
  await signInPage.solveRecaptcha();
};

describe("SuperAdminSignIn (KAN-204)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(signInWithPassword).mockResolvedValue(
      responseFor(SUPER_ADMIN_SESSION),
    );
  });

  it("AC-KAN-204-01: inicia sesión exitosamente en el backoffice (/admin)", async () => {
    const signInPage = await renderSignInPage();
    await signInPage.findTitle();

    await fillSuperAdminForm(signInPage);
    await signInPage.submit();

    expect(await signInPage.findCurrentPath()).toBe(ROUTE_PATH.ADMIN.ROOT);
  });

  it("AC-KAN-204-02: redirige de vuelta a /admin tras login cuando llega con redirectTo", async () => {
    const signInPage = await renderSignInPage(
      signInPathWithRedirect(ROUTE_PATH.ADMIN.ROOT),
    );
    await signInPage.findTitle();

    await fillSuperAdminForm(signInPage);
    await signInPage.submit();

    expect(await signInPage.findCurrentPath()).toBe(ROUTE_PATH.ADMIN.ROOT);
  });

  it("AC-KAN-204-03: deniega acceso al backoffice (/admin) a un suscriptor", async () => {
    const signInPage = await renderSignInPage(
      ROUTE_PATH.ADMIN.ROOT,
      guardedAdminRoutes,
      SUBSCRIBER_SESSION,
    );

    expect(await signInPage.findCurrentPath()).toBe(ROUTE_PATH.BUSINESS.ROOT);
  });

  it("AC-KAN-204-03: deniega acceso al backoffice (/admin) a un cliente", async () => {
    const signInPage = await renderSignInPage(
      ROUTE_PATH.ADMIN.ROOT,
      guardedAdminRoutes,
      CUSTOMER_SESSION,
    );

    expect(await signInPage.findCurrentPath()).toBe(ROUTE_PATH.LANDING.HOME);
  });

  it("AC-KAN-204-04: redirige automáticamente a /admin si el super administrador ya tiene sesión activa", async () => {
    const signInPage = await renderSignInPage(
      ROUTE_PATH.AUTH.SIGN_IN,
      authProbeRoutes,
      SUPER_ADMIN_SESSION,
    );

    expect(await signInPage.findCurrentPath()).toBe(ROUTE_PATH.ADMIN.ROOT);
  });

  it("AC-KAN-204-05: muestra mensaje neutro de error ante credenciales inválidas y no da acceso", async () => {
    vi.mocked(signInWithPassword).mockRejectedValue(
      new FirebaseError("auth/invalid-credential", "auth/invalid-credential"),
    );

    const signInPage = await renderSignInPage();
    await signInPage.findTitle();

    await fillSuperAdminForm(signInPage);
    await signInPage.submit();

    const alert = await signInPage.findServerAlert();
    expect(alert).toHaveTextContent(
      testI18n.t("common:auth.signIn.invalidCredentials"),
    );
  });
});
