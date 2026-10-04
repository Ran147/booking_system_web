import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { Tabs } from "../Tabs";

describe("Tabs", () => {
  const mockTabs = [
    { id: "all", label: "Todos" },
    { id: "active", label: "Activos" },
  ];

  it("renders tab buttons and triggers onTabChange", () => {
    const handleTabChange = vi.fn();
    render(
      <Tabs activeTabId="all" onTabChange={handleTabChange} tabs={mockTabs} />,
    );

    const activeTab = screen.getByRole("tab", { name: "Activos" });
    expect(activeTab).toHaveAttribute("aria-selected", "false");

    fireEvent.click(activeTab);
    expect(handleTabChange).toHaveBeenCalledWith("active");
  });
});
