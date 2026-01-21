import "@testing-library/jest-dom/vitest";
import { vi } from "vitest";

// window.confirm / window.alert のモック
vi.stubGlobal(
  "confirm",
  vi.fn(() => true),
);
vi.stubGlobal("alert", vi.fn());

// ResizeObserver のモック（recharts等で必要）
class ResizeObserverMock {
  observe = vi.fn();
  unobserve = vi.fn();
  disconnect = vi.fn();
}
vi.stubGlobal("ResizeObserver", ResizeObserverMock);
