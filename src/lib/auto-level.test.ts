import { describe, it, expect } from "vitest";
import { autoLevel } from "./stats";
import type { AttendanceRow } from "./store";
const V = ["Sabah", "Öğle", "İkindi", "Akşam", "Yatsı"];
const row = (date: string, n: number, ders: boolean): AttendanceRow => ({ id: date, studentId: "a", date, vakitler: V.slice(0, n), ders, durum: "normal", durumlar: {} } as AttendanceRow);
describe("autoLevel", () => {
  // Each row spans 6 cells (5 vakit + ders); came = n + (ders ? 1 : 0).
  it("29 of 30 (>=95%) is Çok İyi", () => expect(autoLevel([row("2026-01-01", 5, true), row("2026-01-02", 5, true), row("2026-01-03", 5, true), row("2026-01-04", 5, true), row("2026-01-05", 4, true)]).level).toBe("Çok İyi"));
  it("28 of 30 (93.3%) is İyi", () => expect(autoLevel([row("2026-01-01", 5, true), row("2026-01-02", 5, true), row("2026-01-03", 5, true), row("2026-01-04", 5, true), row("2026-01-05", 3, true)]).level).toBe("İyi"));
  it("20 of 24 (83.3%, >=80%) is Orta", () => expect(autoLevel([row("2026-01-01", 5, true), row("2026-01-02", 5, true), row("2026-01-03", 5, true), row("2026-01-04", 2, false)]).level).toBe("Orta"));
  it("19 of 24 (79.2%, <80%) is Zayıf", () => expect(autoLevel([row("2026-01-01", 5, true), row("2026-01-02", 5, true), row("2026-01-03", 5, true), row("2026-01-04", 1, false)]).level).toBe("Zayıf"));
  it("1 of 6 is Zayıf", () => expect(autoLevel([row("2026-01-01", 1, false)]).level).toBe("Zayıf"));
  it("no records is Yeni", () => expect(autoLevel([]).level).toBe("Yeni"));
});
