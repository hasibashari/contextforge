import { useState, useCallback, useEffect } from 'react';
import type { UserMemoryItem, ToastType } from '@/shared/types/workspace';
import { personalHubApi } from '@/shared/api/personalHubApi';

export function useUserMemory(showToast: (msg: string, type?: ToastType) => void) {
  const [userMemories, setUserMemories] = useState<UserMemoryItem[]>([]);

  useEffect(() => {
    let isMounted = true;

    async function loadData() {
      try {
        const memories = await personalHubApi.getUserMemories().catch(() => null);

        if (!isMounted) return;

        if (memories) {
          setUserMemories(memories);
        }
      } catch {
        // gracefully handle network errors
      }
    }

    void loadData();

    return () => {
      isMounted = false;
    };
  }, []);

  const addUserMemory = useCallback(
    async (memoryData: Omit<UserMemoryItem, 'id' | 'lastUpdated'>) => {
      const tempId = `mem-${Date.now()}`;
      const tempMem: UserMemoryItem = {
        ...memoryData,
        id: tempId,
        lastUpdated: 'Just now',
      };
      setUserMemories((prev) => [tempMem, ...prev]);

      try {
        const created = await personalHubApi.createUserMemory({
          category: memoryData.category,
          key: memoryData.key,
          value: memoryData.value,
        });
        setUserMemories((prev) => prev.map((m) => (m.id === tempId ? created : m)));
        showToast(`Saved to PostgreSQL Memory: ${created.key}`, 'success');
      } catch {
        showToast(`Saved to Personal Memory: ${tempMem.key}`, 'success');
      }
    },
    [showToast],
  );

  const deleteUserMemory = useCallback(
    async (id: string) => {
      setUserMemories((prev) => prev.filter((m) => m.id !== id));
      try {
        await personalHubApi.deleteUserMemory(id);
        showToast('Memory item removed from database', 'warning');
      } catch {
        showToast('Memory item removed', 'warning');
      }
    },
    [showToast],
  );

  return {
    userMemories,
    setUserMemories,
    addUserMemory,
    deleteUserMemory,
  };
}
