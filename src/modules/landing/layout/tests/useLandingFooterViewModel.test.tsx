import { renderHook } from "@testing-library/react";
import type { ReactElement, ReactNode } from "react";
import { I18nextProvider } from "react-i18next";
import { describe, expect, it } from "vitest";
import { testI18n } from "@/shared/test-utils/testI18n";
import { useLandingFooterViewModel } from "../hooks/useLandingFooterViewModel";

const wrapper = ({ children }: { children: ReactNode }): ReactElement => (
  <I18nextProvider i18n={testI18n}>{children}</I18nextProvider>
);

describe("useLandingFooterViewModel", () => {
  it("computes current year dynamically", () => {
    const { result } = renderHook(() => useLandingFooterViewModel(), {
      wrapper,
    });

    expect(result.current.currentYear).toBe(new Date().getFullYear());
  });

  it("provides default contact channels and filters out invalid social URLs", () => {
    const { result } = renderHook(() => useLandingFooterViewModel(), {
      wrapper,
    });

    expect(result.current.contactInfo.email).toBe("soporte@bookingsystem.com");
    expect(result.current.contactInfo.phone).toBe("+506 2222-0000");
    expect(result.current.hasContact).toBe(true);
    expect(result.current.hasSocial).toBe(true);
    expect(result.current.socialLinks.length).toBe(4);
  });

  it("omits empty or malformed URLs from social links", () => {
    const { result } = renderHook(
      () =>
        useLandingFooterViewModel({
          email: "   ",
          phone: "",
          socialUrls: {
            facebook: "invalid-url",
            instagram: "https://instagram.com/valid",
            linkedin: "",
            x: "ftp://not-supported.com",
          },
        }),
      { wrapper },
    );

    expect(result.current.contactInfo.email).toBeNull();
    expect(result.current.contactInfo.phone).toBeNull();
    expect(result.current.hasContact).toBe(false);
    expect(result.current.hasSocial).toBe(true);
    expect(result.current.socialLinks).toHaveLength(1);
    expect(result.current.socialLinks[0]?.network).toBe("instagram");
  });
});
