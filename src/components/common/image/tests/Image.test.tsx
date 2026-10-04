import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Image } from "../Image";

const ALT_LOGO = "Logo Empresa";
const SRC_LOGO = "/logo.png";

describe("Image", () => {
  it("renders image with alt text and src", () => {
    render(<Image alt={ALT_LOGO} src={SRC_LOGO} />);

    const image = screen.getByAltText(ALT_LOGO);
    expect(image).toBeInTheDocument();
    expect(image).toHaveAttribute("loading", "lazy");
  });
});
