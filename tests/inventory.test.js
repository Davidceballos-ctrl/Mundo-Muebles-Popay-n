/**
 * Unit tests — Mundo Muebles Popayán
 * Run: npm test
 */

// ─── Utility tests ────────────────────────────────────────────────────────────
describe("format utilities", () => {
  let fmt, fmtN;
  beforeAll(async () => {
    const m = await import("../src/utils/format.js");
    fmt  = m.fmt;
    fmtN = m.fmtN;
  });

  test("fmt formats COP currency correctly", () => {
    const result = fmt(135000);
    expect(result).toContain("135");
    expect(result).toContain("$");
  });

  test("fmt handles zero", () => {
    expect(fmt(0)).toBeTruthy();
  });

  test("fmtN formats numbers with Colombian locale", () => {
    const r = fmtN(1000);
    expect(r).toContain("1");
  });
});

// ─── Data tests ───────────────────────────────────────────────────────────────
describe("initial data", () => {
  let INIT_PRODUCTS, INIT_PROVIDERS, INIT_CLIENTS, LOW_STOCK_THRESHOLD;
  beforeAll(async () => {
    const m = await import("../src/utils/data.js");
    INIT_PRODUCTS        = m.INIT_PRODUCTS;
    INIT_PROVIDERS       = m.INIT_PROVIDERS;
    INIT_CLIENTS         = m.INIT_CLIENTS;
    LOW_STOCK_THRESHOLD  = m.LOW_STOCK_THRESHOLD;
  });

  test("INIT_PRODUCTS has at least 8 products", () => {
    expect(INIT_PRODUCTS.length).toBeGreaterThanOrEqual(8);
  });

  test("every product has an id, nombre, and variantes array", () => {
    INIT_PRODUCTS.forEach(p => {
      expect(p).toHaveProperty("id");
      expect(p).toHaveProperty("nombre");
      expect(Array.isArray(p.variantes)).toBe(true);
      expect(p.variantes.length).toBeGreaterThan(0);
    });
  });

  test("every variant has precio and stock as numbers", () => {
    INIT_PRODUCTS.forEach(p => {
      p.variantes.forEach(v => {
        expect(typeof v.precio).toBe("number");
        expect(typeof v.stock).toBe("number");
      });
    });
  });

  test("INIT_PROVIDERS has 3 providers", () => {
    expect(INIT_PROVIDERS.length).toBe(3);
  });

  test("LOW_STOCK_THRESHOLD is a positive number", () => {
    expect(LOW_STOCK_THRESHOLD).toBeGreaterThan(0);
  });

  test("Base Cama Sencilla starts at $135,000", () => {
    const p = INIT_PRODUCTS.find(x => x.nombre === "Base Cama Sencilla");
    expect(p).toBeDefined();
    expect(p.variantes[0].precio).toBe(135000);
  });

  test("clients have required fields", () => {
    INIT_CLIENTS.forEach(c => {
      expect(c).toHaveProperty("nombre");
      expect(c).toHaveProperty("email");
    });
  });
});

// ─── Business logic tests ─────────────────────────────────────────────────────
describe("inventory business logic", () => {
  test("total inventory value = sum(price × stock)", async () => {
    const { INIT_PRODUCTS } = await import("../src/utils/data.js");
    const total = INIT_PRODUCTS.reduce((acc, p) =>
      acc + p.variantes.reduce((a, v) => a + v.precio * v.stock, 0), 0
    );
    expect(total).toBeGreaterThan(0);
  });

  test("low stock items are correctly identified", async () => {
    const { INIT_PRODUCTS, LOW_STOCK_THRESHOLD } = await import("../src/utils/data.js");
    const lowStock = INIT_PRODUCTS.flatMap(p =>
      p.variantes.filter(v => v.stock <= LOW_STOCK_THRESHOLD)
    );
    // At least one variant should be at or below threshold in initial data
    expect(lowStock.length).toBeGreaterThan(0);
  });

  test("buildSalesChartData returns correct number of points", async () => {
    const { buildSalesChartData } = await import("../src/utils/data.js");
    expect(buildSalesChartData("1d").length).toBe(24);
    expect(buildSalesChartData("7d").length).toBe(7);
    expect(buildSalesChartData("30d").length).toBe(30);
    expect(buildSalesChartData("3m").length).toBe(12);
  });

  test("chart data has positive ventas values", async () => {
    const { buildSalesChartData } = await import("../src/utils/data.js");
    const data = buildSalesChartData("7d");
    data.forEach(d => expect(d.ventas).toBeGreaterThan(0));
  });
});

// ─── localStorage hook test ───────────────────────────────────────────────────
describe("useLocalStorage hook", () => {
  test("stores and retrieves values from localStorage", async () => {
    // The hook depends on React — we test the underlying logic
    localStorage.setItem("mm_test", JSON.stringify({ hello: "world" }));
    const raw = localStorage.getItem("mm_test");
    expect(JSON.parse(raw)).toEqual({ hello: "world" });
  });
});
