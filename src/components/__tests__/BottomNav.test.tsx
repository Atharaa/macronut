import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { BottomNav } from "@/components/BottomNav";

vi.mock("next/navigation", () => ({ usePathname: () => "/" }));

describe("BottomNav", () => {
  it("affiche les 4 onglets", () => {
    render(<BottomNav />);
    expect(screen.getByText("Journée")).toBeInTheDocument();
    expect(screen.getByText("Poids")).toBeInTheDocument();
    expect(screen.getByText("Activité")).toBeInTheDocument();
    expect(screen.getByText("Objectif")).toBeInTheDocument();
  });
});
