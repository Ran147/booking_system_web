import { fireEvent, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { Nullable } from "@/types";

export interface ServiceFormPageObject {
  readonly changeDescription: (description: string) => Promise<void>;
  readonly changeDuration: (duration: string | number) => Promise<void>;
  readonly changeFeature: (index: number, featureText: string) => Promise<void>;
  readonly changeName: (name: string) => Promise<void>;
  readonly changePrice: (price: string | number) => Promise<void>;
  readonly clickAddFeature: () => Promise<void>;
  readonly clickMoveDownFeature: (index: number) => Promise<void>;
  readonly clickMoveUpFeature: (index: number) => Promise<void>;
  readonly clickRemoveFeature: (index: number) => Promise<void>;
  readonly clickRemoveImage: () => Promise<void>;
  readonly clickSubmit: () => Promise<void>;
  readonly getDescriptionInput: () => HTMLTextAreaElement;
  readonly getDurationInput: () => HTMLInputElement;
  readonly getFeatureInputs: () => HTMLInputElement[];
  readonly getNameInput: () => HTMLInputElement;
  readonly getPriceInput: () => HTMLInputElement;
  readonly getReadOnlyAlert: () => Nullable<HTMLElement>;
  readonly getSubmitButton: () => HTMLButtonElement;
  readonly queryErrorText: (text: string | RegExp) => Nullable<HTMLElement>;
  readonly uploadImage: (file: File) => Promise<void>;
}

export const createServiceFormPage = (): ServiceFormPageObject => {
  const user = userEvent.setup();

  return {
    changeDescription: async (description: string): Promise<void> => {
      const input = screen.getByRole("textbox", {
        name: /descripción/i,
      }) as HTMLTextAreaElement;
      await user.clear(input);
      if (description) {
        await user.type(input, description);
      }
    },
    changeDuration: async (duration: string | number): Promise<void> => {
      const input = screen.getByRole("spinbutton", {
        name: /duración/i,
      }) as HTMLInputElement;
      await user.clear(input);
      if (duration !== "") {
        await user.type(input, String(duration));
      }
    },
    changeFeature: async (
      index: number,
      featureText: string,
    ): Promise<void> => {
      const inputs = screen.queryAllByRole("textbox", {
        name: /característica \d+/i,
      }) as HTMLInputElement[];
      const input = inputs[index];
      if (input) {
        await user.clear(input);
        if (featureText) {
          await user.type(input, featureText);
        }
      }
    },
    changeName: async (name: string): Promise<void> => {
      const input = screen.getByRole("textbox", {
        name: /nombre del servicio/i,
      }) as HTMLInputElement;
      await user.clear(input);
      if (name) {
        await user.type(input, name);
      }
    },
    changePrice: async (price: string | number): Promise<void> => {
      const input = screen.getByRole("spinbutton", {
        name: /precio/i,
      }) as HTMLInputElement;
      await user.clear(input);
      if (price !== "") {
        await user.type(input, String(price));
      }
    },
    clickAddFeature: async (): Promise<void> => {
      const button = screen.getByRole("button", {
        name: /agregar característica/i,
      });
      await user.click(button);
    },
    clickMoveDownFeature: async (index: number): Promise<void> => {
      const buttons = screen.queryAllByRole("button", {
        name: /mover hacia abajo/i,
      });
      const button = buttons[index];
      if (button) {
        await user.click(button);
      }
    },
    clickMoveUpFeature: async (index: number): Promise<void> => {
      const buttons = screen.queryAllByRole("button", {
        name: /mover hacia arriba/i,
      });
      const button = buttons[index];
      if (button) {
        await user.click(button);
      }
    },
    clickRemoveFeature: async (index: number): Promise<void> => {
      const buttons = screen.queryAllByRole("button", {
        name: /eliminar característica/i,
      });
      const button = buttons[index];
      if (button) {
        await user.click(button);
      }
    },
    clickRemoveImage: async (): Promise<void> => {
      const button = screen.getByRole("button", {
        name: /eliminar imagen/i,
      });
      await user.click(button);
    },
    clickSubmit: async (): Promise<void> => {
      const button = screen.getByRole("button", {
        name: /guardar servicio/i,
      });
      await user.click(button);
    },
    getDescriptionInput: (): HTMLTextAreaElement =>
      screen.getByRole("textbox", {
        name: /descripción/i,
      }) as HTMLTextAreaElement,
    getDurationInput: (): HTMLInputElement =>
      screen.getByRole("spinbutton", {
        name: /duración/i,
      }) as HTMLInputElement,
    getFeatureInputs: (): HTMLInputElement[] =>
      screen.queryAllByRole("textbox", {
        name: /característica \d+/i,
      }) as HTMLInputElement[],
    getNameInput: (): HTMLInputElement =>
      screen.getByRole("textbox", {
        name: /nombre del servicio/i,
      }) as HTMLInputElement,
    getPriceInput: (): HTMLInputElement =>
      screen.getByRole("spinbutton", {
        name: /precio/i,
      }) as HTMLInputElement,
    getReadOnlyAlert: (): Nullable<HTMLElement> => screen.queryByRole("alert"),
    getSubmitButton: (): HTMLButtonElement =>
      screen.getByRole("button", {
        name: /guardar servicio/i,
      }) as HTMLButtonElement,
    queryErrorText: (text: string | RegExp): Nullable<HTMLElement> =>
      screen.queryByText(text),
    uploadImage: async (file: File): Promise<void> => {
      const input = document.querySelector(
        'input[type="file"]',
      ) as Nullable<HTMLInputElement>;
      if (input) {
        fireEvent.change(input, { target: { files: [file] } });
      }
    },
  };
};
