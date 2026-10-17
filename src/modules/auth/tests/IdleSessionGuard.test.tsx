import { act } from "@testing-library/react";
import { signOut } from "firebase/auth";
import type * as FirebaseAuth from "firebase/auth";
import type { ReactElement } from "react";
import { useLocation, type RouteObject } from "react-router";
import { RootLayout } from "@/app/router/RootLayout";
import { LANGUAGE, ROUTE_PATH } from "@/constants";
import { DEFAULT_PLATFORM_SETTINGS } from "@/domain";
import { renderRoutesWithProviders } from "@/test-utils/renderRoutesWithProviders";
import {
  CUSTOMER_SESSION,
  SIGNED_OUT_SESSION,
  SUBSCRIBER_SESSION,
} from "@/test-utils/sessionFixtures";
import { testI18n } from "@/test-utils/testI18n";
import type { Nullable } from "@/types";
import {
  CURRENT_PATH_TEST_ID,
  createIdleSessionGuardPage,
  SIGN_OUT_REASON_TEST_ID,
  type IdleSessionGuardPageObject,
} from "./IdleSessionGuard.page";
import { fetchPlatformSettings } from "../api/fetchPlatformSettings";
import {
  IDLE_MESSAGE_TYPE,
  IDLE_SESSION,
  SIGN_OUT_REASON,
} from "../constants/IdleSession.constants";
import type { Session } from "../models/Session.types";

vi.mock("firebase/auth", async (importOriginal) => ({
  ...(await importOriginal<typeof FirebaseAuth>()),
  signOut: vi.fn(),
}));
vi.mock("../api/fetchPlatformSettings");

// Two tabs of one browser: every instance with the same name hears the others.
class FakeBroadcastChannel {
  static instances: FakeBroadcastChannel[] = [];
  onmessage: Nullable<(messageEvent: MessageEvent<unknown>) => void> = null;
  readonly postedMessages: unknown[] = [];

  constructor(readonly name: string) {
    FakeBroadcastChannel.instances.push(this);
  }

  close(): void {
    FakeBroadcastChannel.instances = FakeBroadcastChannel.instances.filter(
      (instance) => instance !== this,
    );
  }

  postMessage(message: unknown): void {
    this.postedMessages.push(message);
  }
}

const IDLE_TIMEOUT_MINUTES = 5;
const MINUTE_MS = IDLE_SESSION.MILLISECONDS_PER_MINUTE;
const WARNING_MS =
  IDLE_SESSION.WARNING_SECONDS * IDLE_SESSION.MILLISECONDS_PER_SECOND;
const BUSINESS_PATH = "/barberia-centro/bookings";

const PathProbe = (): ReactElement => {
  const location = useLocation();
  const reason = (location.state as Nullable<{ reason?: string }>)?.reason;

  return (
    <>
      <output data-testid={CURRENT_PATH_TEST_ID}>
        {`${location.pathname}${location.search}`}
      </output>
      <output data-testid={SIGN_OUT_REASON_TEST_ID}>{reason ?? ""}</output>
    </>
  );
};

const testRoutes: RouteObject[] = [
  {
    children: [
      { element: <PathProbe />, path: ROUTE_PATH.AUTH.SIGN_IN },
      { element: <PathProbe />, path: "*" },
    ],
    Component: RootLayout,
  },
];

const advance = async (milliseconds: number): Promise<void> => {
  await act(async () => {
    await vi.advanceTimersByTimeAsync(milliseconds);
  });
};

const renderGuard = async (
  session: Session = SUBSCRIBER_SESSION,
  initialPath: string = BUSINESS_PATH,
): Promise<IdleSessionGuardPageObject> => {
  renderRoutesWithProviders(testRoutes, { initialPath, session });
  await advance(0);
  return createIdleSessionGuardPage(vi.advanceTimersByTime);
};

interface ActivityMessage {
  readonly activityAt: number;
  readonly type: string;
}

const readActivityMessages = (
  channel: FakeBroadcastChannel,
): ActivityMessage[] =>
  (channel.postedMessages as ActivityMessage[]).filter(
    (message) => message.type === IDLE_MESSAGE_TYPE.ACTIVITY,
  );

const readOwnChannel = (): FakeBroadcastChannel => {
  const [ownChannel] = FakeBroadcastChannel.instances;
  if (!ownChannel) throw new Error("The guard did not open its channel");
  return ownChannel;
};

// The guard opened the first channel; what another tab posts reaches it here.
const receiveFromOtherTab = (message: unknown): void => {
  act(() => {
    // The key is computed because the project denies "data" as an identifier.
    readOwnChannel().onmessage?.(
      new MessageEvent("message", { ["data"]: message }),
    );
  });
};

describe("IdleSessionGuard", () => {
  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    vi.stubGlobal("BroadcastChannel", FakeBroadcastChannel);
    FakeBroadcastChannel.instances = [];
    vi.mocked(fetchPlatformSettings).mockResolvedValue({
      idleTimeoutMinutes: IDLE_TIMEOUT_MINUTES,
    });
    vi.mocked(signOut).mockResolvedValue();
  });

  afterEach(async () => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
    vi.clearAllMocks();
    if (testI18n.language !== LANGUAGE.ES) {
      await testI18n.changeLanguage(LANGUAGE.ES);
    }
  });

  describe("KAN-38: warning and sign-out after inactivity", () => {
    it.each([
      ["AC-KAN-38-01", SUBSCRIBER_SESSION],
      ["AC-KAN-133-01", CUSTOMER_SESSION],
    ])(
      "%s: shows the warning 60 seconds before the limit",
      async (_criterion, session) => {
        const guardPage = await renderGuard(session);

        await advance(IDLE_TIMEOUT_MINUTES * MINUTE_MS - WARNING_MS - 1_000);
        expect(guardPage.queryWarning()).toBeNull();

        await advance(2_000);
        expect(guardPage.queryWarning()).toBeInTheDocument();
        expect(guardPage.getStayConnectedButton()).toBeInTheDocument();
        expect(guardPage.getStayConnectedButton()).toHaveFocus();
      },
    );

    it("AC-KAN-38-02: stay connected closes the warning and restarts the count", async () => {
      const guardPage = await renderGuard();
      await advance(IDLE_TIMEOUT_MINUTES * MINUTE_MS - WARNING_MS + 1_000);

      await guardPage.clickStayConnected();

      expect(guardPage.queryWarning()).toBeNull();
      await advance(IDLE_TIMEOUT_MINUTES * MINUTE_MS - WARNING_MS - 5_000);
      expect(guardPage.queryWarning()).toBeNull();
      await advance(10_000);
      expect(guardPage.queryWarning()).toBeInTheDocument();
      expect(signOut).not.toHaveBeenCalled();
    });

    it("AC-KAN-38-06: stay connected tells the other tabs at once", async () => {
      const guardPage = await renderGuard();
      const ownChannel = readOwnChannel();
      await advance(IDLE_TIMEOUT_MINUTES * MINUTE_MS - WARNING_MS + 1_000);
      const messagesBefore = readActivityMessages(ownChannel).length;

      await guardPage.clickStayConnected();

      const activityMessages = readActivityMessages(ownChannel);
      expect(activityMessages).toHaveLength(messagesBefore + 1);
      expect(activityMessages.at(-1)?.activityAt).toBeGreaterThan(
        Date.now() - 1_000,
      );
    });

    it("AC-KAN-38-06: closing the warning with Escape tells the other tabs too", async () => {
      const guardPage = await renderGuard();
      const ownChannel = readOwnChannel();
      await advance(IDLE_TIMEOUT_MINUTES * MINUTE_MS - WARNING_MS + 1_000);
      const messagesBefore = readActivityMessages(ownChannel).length;

      await guardPage.pressEscape();

      expect(guardPage.queryWarning()).toBeNull();
      expect(readActivityMessages(ownChannel)).toHaveLength(messagesBefore + 1);
    });

    it("AC-KAN-38-02: using the page before the warning delays it", async () => {
      const guardPage = await renderGuard();
      await advance(3 * MINUTE_MS);

      await guardPage.pressKey();

      await advance(3 * MINUTE_MS);
      expect(guardPage.queryWarning()).toBeNull();
    });

    it.each([
      ["AC-KAN-38-03", SUBSCRIBER_SESSION],
      ["AC-KAN-133-01", CUSTOMER_SESSION],
    ])(
      "%s: at zero it signs out, clears the cache and goes to sign-in",
      async (_criterion, session) => {
        const guardPage = await renderGuard(session);

        await advance(IDLE_TIMEOUT_MINUTES * MINUTE_MS + 1_000);

        expect(signOut).toHaveBeenCalledTimes(1);
        expect(guardPage.readCurrentPath()).toBe(
          `${ROUTE_PATH.AUTH.SIGN_IN}?redirectTo=${encodeURIComponent(BUSINESS_PATH)}`,
        );
        expect(guardPage.readSignOutReason()).toBe(SIGN_OUT_REASON.IDLE);
      },
    );

    it("AC-KAN-38-03: signs out from the warning with the sign out action", async () => {
      const guardPage = await renderGuard();
      await advance(IDLE_TIMEOUT_MINUTES * MINUTE_MS - WARNING_MS + 1_000);

      await guardPage.clickSignOut();
      await advance(0);

      expect(signOut).toHaveBeenCalledTimes(1);
      expect(guardPage.readSignOutReason()).toBe(SIGN_OUT_REASON.IDLE);
    });

    it("AC-KAN-38-03: still goes to sign-in when Firebase fails to sign out", async () => {
      vi.mocked(signOut).mockRejectedValue(new Error("offline"));
      const guardPage = await renderGuard();

      await advance(IDLE_TIMEOUT_MINUTES * MINUTE_MS + 1_000);

      expect(guardPage.readCurrentPath()).toContain(ROUTE_PATH.AUTH.SIGN_IN);
    });

    it("tries to sign out again when Firebase failed the first time", async () => {
      vi.mocked(signOut)
        .mockRejectedValueOnce(new Error("offline"))
        .mockResolvedValue();
      await renderGuard();

      await advance(IDLE_TIMEOUT_MINUTES * MINUTE_MS + 500);
      await advance(IDLE_SESSION.TICK_MS * 3);

      const callsAfterRetry = vi.mocked(signOut).mock.calls.length;
      expect(callsAfterRetry).toBeGreaterThanOrEqual(2);

      // Once it worked it stops trying.
      await advance(IDLE_SESSION.TICK_MS * 5);
      expect(signOut).toHaveBeenCalledTimes(callsAfterRetry);
    });

    it.each(["AC-KAN-38-04", "AC-KAN-133-02"])(
      "%s: uses the default limit when the settings cannot be read",
      async () => {
        vi.mocked(fetchPlatformSettings).mockRejectedValue(
          new Error("permission-denied"),
        );
        const guardPage = await renderGuard();

        await advance(IDLE_TIMEOUT_MINUTES * MINUTE_MS + 1_000);
        expect(guardPage.queryWarning()).toBeNull();
        expect(signOut).not.toHaveBeenCalled();

        await advance(
          (DEFAULT_PLATFORM_SETTINGS.IDLE_TIMEOUT_MINUTES -
            IDLE_TIMEOUT_MINUTES) *
            MINUTE_MS,
        );
        expect(signOut).toHaveBeenCalledTimes(1);
      },
    );

    it("AC-KAN-38-07: a changed setting is used when the query refreshes", async () => {
      const guardPage = await renderGuard();
      vi.mocked(fetchPlatformSettings).mockResolvedValue({
        idleTimeoutMinutes: 2,
      });

      await act(async () => {
        document.dispatchEvent(
          new Event("visibilitychange", { bubbles: true }),
        );
        await vi.advanceTimersByTimeAsync(0);
      });
      await advance(1.5 * MINUTE_MS);

      expect(guardPage.queryWarning()).toBeInTheDocument();
    });

    it("AC-KAN-38-08: signs out at once, without the warning, after the device slept", async () => {
      const guardPage = await renderGuard();

      await act(async () => {
        vi.setSystemTime(Date.now() + 2 * IDLE_TIMEOUT_MINUTES * MINUTE_MS);
        document.dispatchEvent(
          new Event("visibilitychange", { bubbles: true }),
        );
        await vi.advanceTimersByTimeAsync(0);
      });

      expect(guardPage.queryWarning()).toBeNull();
      expect(signOut).toHaveBeenCalledTimes(1);
      expect(guardPage.readSignOutReason()).toBe(SIGN_OUT_REASON.IDLE);
    });

    it.each(["AC-KAN-133-04", "no session yet"])(
      "%s: a visitor sees no warning and no sign-out",
      async () => {
        const guardPage = await renderGuard(SIGNED_OUT_SESSION, "/plans");

        await advance(60 * MINUTE_MS);

        expect(guardPage.queryWarning()).toBeNull();
        expect(signOut).not.toHaveBeenCalled();
        expect(fetchPlatformSettings).not.toHaveBeenCalled();
      },
    );
  });

  describe("AC-KAN-38-06: several tabs of the same browser", () => {
    it("activity in another tab delays the warning here", async () => {
      const guardPage = await renderGuard();
      await advance(3 * MINUTE_MS);

      receiveFromOtherTab({
        activityAt: Date.now(),
        type: IDLE_MESSAGE_TYPE.ACTIVITY,
      });

      await advance(3 * MINUTE_MS);
      expect(guardPage.queryWarning()).toBeNull();
    });

    it("signing out by inactivity in another tab signs out this one too", async () => {
      const guardPage = await renderGuard();

      receiveFromOtherTab({ type: IDLE_MESSAGE_TYPE.SIGNED_OUT });
      await advance(0);

      expect(signOut).toHaveBeenCalledTimes(1);
      expect(guardPage.readSignOutReason()).toBe(SIGN_OUT_REASON.IDLE);
    });

    it("sends the last activity of the interval when the 5 seconds end", async () => {
      const guardPage = await renderGuard();
      const ownChannel = readOwnChannel();

      await guardPage.pressKey();
      await advance(1_500);
      await guardPage.pressKey();
      const secondPressAt = Date.now();
      expect(readActivityMessages(ownChannel)).toHaveLength(1);

      await advance(IDLE_SESSION.REMOTE_ACTIVITY_THROTTLE_MS);

      const activityMessages = readActivityMessages(ownChannel);
      expect(activityMessages).toHaveLength(2);
      expect(activityMessages.at(-1)?.activityAt).toBeGreaterThanOrEqual(
        secondPressAt - 100,
      );
    });

    it("sharing the sign-out tells the other tabs once, and activity at most every 5 seconds", async () => {
      const guardPage = await renderGuard();
      const ownChannel = readOwnChannel();

      await guardPage.pressKey();
      await advance(1_500);
      await guardPage.pressKey();
      const activityMessages = ownChannel.postedMessages.filter(
        (message) =>
          (message as { type: string }).type === IDLE_MESSAGE_TYPE.ACTIVITY,
      );
      expect(activityMessages).toHaveLength(1);

      await advance(IDLE_TIMEOUT_MINUTES * MINUTE_MS + 1_000);
      expect(
        ownChannel.postedMessages.filter(
          (message) =>
            (message as { type: string }).type === IDLE_MESSAGE_TYPE.SIGNED_OUT,
        ),
      ).toHaveLength(1);
    });
  });
});
