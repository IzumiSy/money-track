import { useState, useMemo } from "react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  Brush,
} from "recharts";
import { useSimulation } from "@/features/simulator/context";
import { useGroupManagement } from "@/features/group/hooks";
import { usePluginRegistry } from "@/core/plugin/usePluginRegistry";
import { generateChartBars, SourceDataInfo } from "@/core/plugin/chartHelpers";
import { PluginDataTypeMap } from "@/core/plugin/types";
import { runFinancialSimulation } from "./financialSimulation";

export default function SimulatorPage() {
  const [simulationYears, setSimulationYears] = useState(30);
  const { state } = useSimulation();
  const { getActiveGroups } = useGroupManagement();
  const registry = usePluginRegistry();

  // プラグインデータを取得
  const pluginData = state.currentData.pluginData;

  // アクティブなグループのIDを取得
  const activeGroups = getActiveGroups();
  const activeGroupIds = activeGroups.map((g) => g.id);

  // ファイナンシャルシミュレーションを実行
  const { simulationData, hasData } = useMemo(
    () => runFinancialSimulation(pluginData, simulationYears, activeGroupIds),
    [pluginData, simulationYears, activeGroupIds],
  );

  // プラグインレジストリとプラグインデータから動的にソースデータマップを構築
  const sourceDataMap = useMemo(() => {
    const map = new Map<string, SourceDataInfo>();

    // 全プラグインのデータを走査
    registry.getAllPlugins().forEach((plugin) => {
      const dataArray = pluginData[plugin.type as keyof PluginDataTypeMap];
      if (!dataArray) return;

      dataArray.forEach((item) => {
        // 全プラグインデータは id, name, color, groupId を持つ前提
        const typedItem = item as {
          id: string;
          name: string;
          color: string;
          groupId: string;
        };
        map.set(typedItem.id, {
          id: typedItem.id,
          name: typedItem.name,
          color: typedItem.color,
          groupId: typedItem.groupId,
        });
      });
    });

    return map;
  }, [registry, pluginData]);

  // プラグインからチャートバー定義を生成
  const chartBars = useMemo(() => {
    return generateChartBars(
      registry,
      simulationData as Record<string, unknown>[],
      sourceDataMap,
      activeGroupIds,
    );
  }, [registry, simulationData, sourceDataMap, activeGroupIds]);

  // データが0の場合の処理
  if (!hasData || activeGroupIds.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
          キャッシュフローシミュレータ
        </h2>
        <div className="text-center py-12">
          <div className="mb-4">
            <svg
              className="w-16 h-16 mx-auto text-gray-400 dark:text-gray-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1}
                d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
              />
            </svg>
          </div>
          <p className="text-gray-600 dark:text-gray-400">
            グループを選択して、資産情報を入力すると、キャッシュフローシミュレーションが表示されます
          </p>
        </div>
      </div>
    );
  }

  const formatNumber = (value: number) => {
    return new Intl.NumberFormat("ja-JP").format(value);
  };

  const formatTooltip = (value: number, name: string) => {
    return [`${formatNumber(value)}円`, name];
  };

  return (
    <div className="space-y-6">
      {/* 資産推移シミュレーション */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              資産推移シミュレーション
            </h3>
            {activeGroups.length > 0 && (
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                表示グループ: {activeGroups.map((g) => g.name).join(", ")}
              </p>
            )}
          </div>
          <div className="flex items-center space-x-2">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              期間:
            </label>
            <select
              value={simulationYears}
              onChange={(e) => setSimulationYears(Number(e.target.value))}
              className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white text-sm"
            >
              <option value={15}>15年</option>
              <option value={30}>30年</option>
              <option value={50}>50年</option>
            </select>
          </div>
        </div>
        <div className="h-96">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={simulationData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="year"
                interval={4}
                angle={-45}
                textAnchor="end"
                height={80}
              />
              <YAxis
                tickFormatter={(value) => `${formatNumber(value / 1000000)}M`}
              />
              <Tooltip
                formatter={formatTooltip}
                labelFormatter={(label) => `${label}`}
              />
              <Legend />
              <Brush dataKey="year" height={30} stroke="#8884d8" />
              {chartBars.map((bar) => (
                <Bar
                  key={bar.key}
                  dataKey={bar.dataKey}
                  stackId={bar.stackId}
                  fill={bar.fill}
                  name={bar.name}
                  opacity={bar.opacity}
                />
              ))}
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
