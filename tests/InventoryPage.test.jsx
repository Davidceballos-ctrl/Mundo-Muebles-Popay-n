import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { AppContext } from "../src/context/AppContext.jsx";
import InventoryPage from "../src/pages/InventoryPage.jsx";

// Mock products for testing
const mockProducts = [
  {
    id: "p1",
    nombre: "Base Cama Sencilla",
    categoria: "Base Camas",
    activo: true,
    variantes: [
      { id: "v1", medida: "1.40 m", precio: 135000, stock: 5, colores: ["Beige"], kardex: [] },
      { id: "v2", medida: "1.60 m", precio: 135000, stock: 1, colores: ["Negro"], kardex: [] },
    ],
  },
  {
    id: "p2",
    nombre: "Colchón Semi Ortopédico",
    categoria: "Colchones",
    activo: true,
    variantes: [
      { id: "v3", medida: "1.20 m", precio: 280000, stock: 0, colores: [], kardex: [] },
    ],
  },
];

const mockContext = {
  products: mockProducts,
  setProducts: vi.fn(),
  toast: vi.fn(),
};

const renderWithCtx = (mode = "all") =>
  render(
    <AppContext.Provider value={mockContext}>
      <MemoryRouter>
        <InventoryPage mode={mode} />
      </MemoryRouter>
    </AppContext.Provider>
  );

describe("InventoryPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders table with product variants", () => {
    renderWithCtx();
    expect(screen.getByText("Base Cama Sencilla")).toBeInTheDocument();
    expect(screen.getByText("Colchón Semi Ortopédico")).toBeInTheDocument();
  });

  it("filters products by search term", () => {
    renderWithCtx();
    const searchInput = screen.getByPlaceholderText(/buscar producto/i);
    fireEvent.change(searchInput, { target: { value: "colchón" } });
    expect(screen.queryByText("Base Cama Sencilla")).not.toBeInTheDocument();
    expect(screen.getByText("Colchón Semi Ortopédico")).toBeInTheDocument();
  });

  it("shows stock badges correctly", () => {
    renderWithCtx();
    expect(screen.getByText(/sin stock/i)).toBeInTheDocument();
    // stock 1 is low (≤ 3)
    expect(screen.getByText(/1 uds/i)).toBeInTheDocument();
    // stock 5 is ok
    expect(screen.getByText(/5 uds/i)).toBeInTheDocument();
  });

  it("shows only low-stock items in low mode", () => {
    renderWithCtx("low");
    // Only variants with stock ≤ 3 should appear
    expect(screen.queryByText(/5 uds/i)).not.toBeInTheDocument();
  });

  it("shows summary row with totals", () => {
    renderWithCtx();
    expect(screen.getByText(/valor total/i)).toBeInTheDocument();
  });
});
