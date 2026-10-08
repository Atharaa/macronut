import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { BottomNav } from "@/components/BottomNav";

vi.mock("next/navigation", () => ({
  usePathname: () => "/",
  useSearchParams: () => new URLSearchParams(),
}));

describe("BottomNav", () => {
  it("affiche les 6 onglets", () => {
    render(<BottomNav />);
    expect(screen.getByText("Journée")).toBeInTheDocument();
    expect(screen.getByText("Poids")).toBeInTheDocument();
    expect(screen.getByText("Activité")).toBeInTheDocument();
    expect(screen.getByText("Plats")).toBeInTheDocument();
    expect(screen.getByText("Aliments")).toBeInTheDocument();
    expect(screen.getByText("Objectif")).toBeInTheDocument();
  });
});
