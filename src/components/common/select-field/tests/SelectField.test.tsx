import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { SelectField } from "../SelectField";

const LABEL_ROLE = "Rol";
const VALUE_OWNER = "owner";
const VALUE_COLLABORATOR = "collaborator";
const LABEL_OWNER = "Dueño";
const LABEL_COLLABORATOR = "Colaborador";

describe("SelectField", () => {
  const options = [
    { label: LABEL_COLLABORATOR, value: VALUE_COLLABORATOR },
    { label: LABEL_OWNER, value: VALUE_OWNER },
  ];

  it("renders with options and triggers change", () => {
    const handleChange = vi.fn();
    render(
      <SelectField
        label={LABEL_ROLE}
        name="role"
        onChange={handleChange}
        options={options}
      />,
    );

    const select = screen.getByLabelText(LABEL_ROLE);
    expect(select).toBeInTheDocument();

    fireEvent.change(select, { target: { value: VALUE_OWNER } });
    expect(handleChange).toHaveBeenCalled();
  });
});
