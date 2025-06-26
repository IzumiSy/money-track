import React from "react";
import { CycleSetting, defaultCycleSetting } from "@/types/CycleSetting";

interface CycleSettingFieldProps {
  id: string;
  cycleSetting?: CycleSetting;
  onChange: (cycleSetting: CycleSetting) => void;
}

export default function CycleSettingField({
  id,
  cycleSetting,
  onChange,
}: CycleSettingFieldProps) {
  return (
    <div className="mt-4 border-t border-gray-200 dark:border-gray-600 pt-4">
      <div className="flex items-center space-x-2 mb-3">
        <input
          type="checkbox"
          id={`cycle-enabled-${id}`}
          checked={cycleSetting?.enabled || false}
          onChange={(e) =>
            onChange({
              enabled: e.target.checked,
              interval: cycleSetting?.interval || defaultCycleSetting.interval,
              unit: cycleSetting?.unit || defaultCycleSetting.unit,
            })
          }
          className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
        />
        <label
          htmlFor={`cycle-enabled-${id}`}
          className="text-sm font-medium text-gray-700 dark:text-gray-300"
        >
          定期的な周期を設定
        </label>
      </div>

      {cycleSetting?.enabled && (
        <div className="grid grid-cols-2 gap-4 ml-6">
          <div>
            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
              間隔
            </label>
            <input
              type="number"
              value={cycleSetting?.interval || 1}
              onChange={(e) =>
                onChange({
                  enabled: cycleSetting?.enabled || false,
                  interval: Math.max(1, Number(e.target.value) || 1),
                  unit: cycleSetting?.unit || defaultCycleSetting.unit,
                })
              }
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-600 dark:text-white text-sm"
              min="1"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
              単位
            </label>
            <select
              value={cycleSetting?.unit || "month"}
              onChange={(e) =>
                onChange({
                  enabled: cycleSetting?.enabled || false,
                  interval:
                    cycleSetting?.interval || defaultCycleSetting.interval,
                  unit: e.target.value as "month" | "year",
                })
              }
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-600 dark:text-white text-sm"
            >
              <option value="month">ヶ月ごと</option>
              <option value="year">年ごと</option>
            </select>
          </div>
        </div>
      )}
    </div>
  );
}
