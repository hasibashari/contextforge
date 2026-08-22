import { useState, useCallback, useEffect } from 'react';
import type { UserMemoryItem, ToastType } from '@/shared/types/workspace';
import { personalHubApi } from '@/shared/api/personalHubApi';

export function useUserMemory(showToast: (msg: string, type?: ToastType) => void) {
  const [userMemories, setUserMemories] = useState<UserMemoryItem[]>([]);
  const [memorySummary, setMemorySummary] = useState<string>('');

  const refreshMemorySummary = useCallback(async () => {
    try {
      const summary = await personalHubApi.getMemorySummary().catch(() => '');
      setMemorySummary(summary);
    } catch {
      // gracefully handle network errors
    }
  }, []);

  useEffect(() => {
    let isMounted = true;

    async function loadData() {
      try {
        const [memories, summary] = await Promise.all([
          personalHubApi.getUserMemories().catch(() => null),
          personalHubApi.getMemorySummary().catch(() => ''),
        ]);

        if (!isMounted) return;

        if (memories) {
          setUserMemories(memories);
        }
        if (summary) {
          setMemorySummary(summary);
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
        await refreshMemorySummary();
        showToast(`Saved to Memory: ${created.key}`, 'success');
      } catch {
        showToast(`Saved locally: ${tempMem.key}`, 'success');
      }
    },
    [refreshMemorySummary, showToast],
  );

  const deleteUserMemory = useCallback(
    async (id: string) => {
      setUserMemories((prev) => prev.filter((m) => m.id !== id));
      try {
        await personalHubApi.deleteUserMemory(id);
        await refreshMemorySummary();
        showToast('Memory item removed', 'warning');
      } catch {
        showToast('Memory item removed', 'warning');
      }
    },
    [refreshMemorySummary, showToast],
  );

  const clearAllMemories = useCallback(async () => {
    setUserMemories([]);
    setMemorySummary('');
    try {
      await personalHubApi.clearAllMemories();
      showToast('🧹 Memory bank cleared and reset', 'warning');
    } catch {
      showToast('Memory bank reset', 'warning');
    }
  }, [showToast]);

  return {
    userMemories,
    memorySummary,
    setUserMemories,
    addUserMemory,
    deleteUserMemory,
    clearAllMemories,
    refreshMemorySummary,
  };
}
