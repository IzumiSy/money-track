import { ReactNode } from "react";
import { render, RenderOptions } from "@testing-library/react";
import { SimulationProvider } from "@/features/simulator/context";

interface CustomRenderOptions extends Omit<RenderOptions, "wrapper"> {
  // 必要に応じてプロバイダーの初期値などを追加
}

/**
 * SimulationProviderでラップしたカスタムrender関数
 */
export function renderWithProviders(
  ui: ReactNode,
  options?: CustomRenderOptions,
) {
  function Wrapper({ children }: { children: ReactNode }) {
    return <SimulationProvider>{children}</SimulationProvider>;
  }

  return render(ui, { wrapper: Wrapper, ...options });
}

export * from "@testing-library/react";
export { renderWithProviders as render };
