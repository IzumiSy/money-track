import { Link, useLocation } from "react-router";
import GroupSelector from "@/features/group/GroupSelector";
import { usePluginRegistry } from "@/core/plugin";
import { useMemo } from "react";

/**
 * シミュレータアイコン
 */
function SimulatorIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.5}
        d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
      />
    </svg>
  );
}

export default function Sidebar() {
  const location = useLocation();
  const registry = usePluginRegistry();

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  // プラグインからナビゲーションアイテムを動的に生成
  const pluginNavItems = useMemo(() => {
    return registry
      .getAllPlugins()
      .map((plugin) => ({
        href: plugin.pageInfo.path,
        label: plugin.pageInfo.label,
        order: plugin.pageInfo.order ?? 99,
        icon: plugin.pageInfo.icon,
      }))
      .sort((a, b) => a.order - b.order);
  }, [registry]);

  return (
    <aside className="w-64 bg-white dark:bg-gray-800 shadow-sm border-r border-gray-200 dark:border-gray-700 min-h-[calc(100vh-73px)]">
      <GroupSelector />
      <nav className="p-4">
        <ul className="space-y-2">
          {/* シミュレータ（常に最初） */}
          <li>
            <Link
              to="/dashboard/simulator"
              className={`w-full flex items-center px-4 py-2 text-left rounded-lg transition-colors duration-200 ${
                isActive("/dashboard/simulator")
                  ? "bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300"
                  : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
              }`}
            >
              <SimulatorIcon className="w-5 h-5 mr-3" />
              シミュレータ
            </Link>
          </li>

          {/* プラグインから動的に生成 */}
          {pluginNavItems.map((item) => (
            <li key={item.href}>
              <Link
                to={item.href}
                className={`w-full flex items-center px-4 py-2 text-left rounded-lg transition-colors duration-200 ${
                  isActive(item.href)
                    ? "bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300"
                    : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                }`}
              >
                {item.icon && <item.icon className="w-5 h-5 mr-3" />}
                {item.label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </aside>
  );
}
