import { useState } from "react";
import { useGroupManagement } from "./useGroupManagement";

export default function GroupSelector() {
  const { groups, addGroup, updateGroup, deleteGroup, toggleGroupActive } =
    useGroupManagement();

  const [showAddModal, setShowAddModal] = useState(false);
  const [newGroupName, setNewGroupName] = useState("");
  const [editingGroup, setEditingGroup] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");
  const [showAllGroups, setShowAllGroups] = useState(false);

  const handleAddGroup = () => {
    if (newGroupName.trim()) {
      addGroup({
        name: newGroupName.trim(),
        color: "", // 自動で色が割り当てられる
        isActive: true,
      });
      setNewGroupName("");
      setShowAddModal(false);
    }
  };

  const handleEditGroup = (groupId: string) => {
    const group = groups.find((g) => g.id === groupId);
    if (group) {
      setEditingGroup(groupId);
      setEditingName(group.name);
    }
  };

  const handleSaveEdit = () => {
    if (editingGroup && editingName.trim()) {
      updateGroup(editingGroup, { name: editingName.trim() });
      setEditingGroup(null);
      setEditingName("");
    }
  };

  const handleDeleteGroup = (groupId: string) => {
    if (
      confirm("このグループを削除しますか？関連する収入・支出も削除されます。")
    ) {
      deleteGroup(groupId);
    }
  };

  const handleToggleAllGroups = () => {
    const newState = !showAllGroups;
    setShowAllGroups(newState);

    // 全グループの表示状態を切り替え
    groups.forEach((group) => {
      updateGroup(group.id, { isActive: newState });
    });
  };

  return (
    <div className="p-4 border-b border-gray-200 dark:border-gray-700">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
          グループ
        </h3>
        <button
          onClick={() => setShowAddModal(true)}
          className="text-xs px-2 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded transition-colors duration-200"
        >
          + 追加
        </button>
      </div>

      {/* 全体を表示ボタン */}
      {groups.length > 0 && (
        <div className="mb-3">
          <button
            onClick={handleToggleAllGroups}
            className={`w-full px-3 py-2 text-sm font-medium rounded-lg transition-colors duration-200 ${
              showAllGroups
                ? "bg-blue-600 text-white hover:bg-blue-700"
                : "bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600"
            }`}
          >
            全体を表示
          </button>
        </div>
      )}

      <div className="space-y-2">
        {groups.map((group) => (
          <div
            key={group.id}
            className="flex items-center justify-between py-1 px-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200"
          >
            <div className="flex items-center flex-1">
              <input
                type="checkbox"
                checked={group.isActive}
                onChange={() => toggleGroupActive(group.id)}
                className="mr-3 h-4 w-4 text-blue-600 rounded focus:ring-blue-500"
              />

              <div
                className="w-3 h-3 rounded-full mr-2"
                style={{ backgroundColor: group.color }}
              />

              {editingGroup === group.id ? (
                <input
                  type="text"
                  value={editingName}
                  onChange={(e) => setEditingName(e.target.value)}
                  onBlur={handleSaveEdit}
                  onKeyPress={(e) => e.key === "Enter" && handleSaveEdit()}
                  className="flex-1 px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  autoFocus
                />
              ) : (
                <span className="flex-1 text-sm text-gray-700 dark:text-gray-300">
                  {group.name}
                </span>
              )}
            </div>

            {!editingGroup && (
              <div className="flex space-x-1">
                <button
                  onClick={() => handleEditGroup(group.id)}
                  className="p-1 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                  title="編集"
                >
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                    />
                  </svg>
                </button>
                <button
                  onClick={() => handleDeleteGroup(group.id)}
                  className="p-1 text-gray-500 hover:text-red-600 dark:text-gray-400 dark:hover:text-red-400"
                  title="削除"
                >
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                    />
                  </svg>
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* グループ追加モーダル */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              新しいグループを追加
            </h3>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                グループ名
              </label>
              <input
                type="text"
                value={newGroupName}
                onChange={(e) => setNewGroupName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                placeholder="例：夫、妻、子供"
                autoFocus
              />
            </div>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => {
                  setShowAddModal(false);
                  setNewGroupName("");
                }}
                className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors duration-200"
              >
                キャンセル
              </button>
              <button
                onClick={handleAddGroup}
                disabled={!newGroupName.trim()}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-md transition-colors duration-200"
              >
                追加
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
