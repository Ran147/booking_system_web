import { renderHook } from "@testing-library/react";
import type { ReactElement, ReactNode } from "react";
import { I18nextProvider } from "react-i18next";
import { testI18n } from "@/test-utils";
import { useCustomerFooterViewModel } from "../hooks/useCustomerFooterViewModel";

const wrapper = ({ children }: { children: ReactNode }): ReactElement => (
  <I18nextProvider i18n={testI18n}>{children}</I18nextProvider>
);

describe("useCustomerFooterViewModel", () => {
  it("KAN-118: trims contact data and builds contact protocols", () => {
    const { result } = renderHook(
      () =>
        useCustomerFooterViewModel({
          contactEmail: " contacto@negocio.test ",
          contactPhone: " +506 2222-3333 ",
          name: "Negocio",
        }),
      { wrapper },
    );

    expect(result.current.contactItems).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ href: "tel:+5062222-3333" }),
        expect.objectContaining({ href: "mailto:contacto@negocio.test" }),
      ]),
    );
    expect(result.current.hasContact).toBe(true);
  });

  it("KAN-120: preserves only non-empty HTTPS social links", () => {
    const { result } = renderHook(
      () =>
        useCustomerFooterViewModel({
          name: "Negocio",
          socialLinks: [
            { network: "Instagram", url: "https://instagram.com/negocio" },
            { network: "Facebook", url: "http://facebook.com/negocio" },
            { network: "TikTok", url: "not-a-url" },
            { network: " ", url: "https://example.test" },
          ],
        }),
      { wrapper },
    );

    expect(result.current.socialItems).toHaveLength(1);
    expect(result.current.socialItems[0]).toEqual(
      expect.objectContaining({
        network: "Instagram",
        url: "https://instagram.com/negocio",
      }),
    );
  });

  it("KAN-118: exposes no business sections without a profile", () => {
    const { result } = renderHook(() => useCustomerFooterViewModel(null), {
      wrapper,
    });

    expect(result.current.hasContact).toBe(false);
    expect(result.current.hasIdentity).toBe(false);
    expect(result.current.hasSocialLinks).toBe(false);
  });
});
