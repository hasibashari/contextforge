import { useState, useCallback, useEffect } from 'react';
import type { KnowledgeSource, ToastType } from '@/shared/types/workspace';
import { INITIAL_KNOWLEDGE_SOURCES } from '../mockData';
import { knowledgeApi } from '@/shared/api/knowledgeApi';

export function useKnowledgeManager(showToast: (msg: string, type?: ToastType) => void) {
  const [knowledgeSources, setKnowledgeSources] = useState<KnowledgeSource[]>(
    INITIAL_KNOWLEDGE_SOURCES,
  );
  const [activeSourceFilters, setActiveSourceFilters] = useState<string[]>([
    'source-obsidian-vault',
    'source-web-search',
    'source-github-core',
  ]);

  useEffect(() => {
    let isMounted = true;
    async function loadSources() {
      try {
        const sources = await knowledgeApi.getAllSources();
        if (sources && sources.length > 0 && isMounted) {
          setKnowledgeSources(sources);
        }
      } catch {
        // keep fallback
      }
    }
    void loadSources();
    return () => {
      isMounted = false;
    };
  }, []);

  const toggleSourceFilter = useCallback((sourceId: string) => {
    setActiveSourceFilters((prev) =>
      prev.includes(sourceId) ? prev.filter((id) => id !== sourceId) : [...prev, sourceId],
    );
  }, []);

  const toggleKnowledgeSync = useCallback(
    (sourceId: string) => {
      setKnowledgeSources((prev) =>
        prev.map((src) => {
          if (src.id !== sourceId) return src;
          const newStatus = src.status === 'synced' ? 'syncing' : 'synced';
          return { ...src, status: newStatus, lastSynced: 'Just now' };
        }),
      );
      showToast(`Data source status updated`, 'info');
    },
    [showToast],
  );

  const toggleKnowledgeSourceConnect = useCallback(
    (sourceId: string) => {
      setKnowledgeSources((prev) =>
        prev.map((src) => {
          if (src.id !== sourceId) return src;
          const isSynced = src.status === 'synced';
          const newStatus = isSynced ? 'error' : 'synced';
          showToast(
            isSynced
              ? `Disconnected knowledge source "${src.name}"`
              : `Connected & grounded source "${src.name}"`,
            isSynced ? 'warning' : 'success',
          );
          return { ...src, status: newStatus, lastSynced: isSynced ? src.lastSynced : 'Just now' };
        }),
      );
    },
    [showToast],
  );

  const addKnowledgeSource = useCallback(
    async (data: { name: string; type: KnowledgeSource['type']; location: string }) => {
      const getIconType = (t: KnowledgeSource['type']): KnowledgeSource['iconType'] => {
        if (t === 'github_repo') return 'terminal';
        if (t === 'obsidian_vault') return 'book-open';
        if (t === 'web_search') return 'globe';
        if (t === 'database_schema') return 'database';
        if (t === 'notion_workspace') return 'layers';
        return 'file';
      };

      const tempId = `source-custom-${Date.now()}`;
      const newSource: KnowledgeSource = {
        id: tempId,
        name: data.name,
        type: data.type,
        location: data.location,
        description: `Connected ${data.type.replace('_', ' ')} grounding knowledge repository.`,
        meta: '0 files indexed · Just connected',
        filesCount: 1,
        chunksCount: 24,
        lastSynced: 'Just now',
        status: 'synced',
        iconType: getIconType(data.type),
        color: 'text-primary',
      };

      setKnowledgeSources((prev) => [newSource, ...prev]);

      try {
        const created = await knowledgeApi.createSource({
          name: data.name,
          type: data.type,
          location: data.location,
          description: newSource.description,
          iconType: newSource.iconType,
          color: newSource.color,
        });
        setKnowledgeSources((prev) => prev.map((s) => (s.id === tempId ? created : s)));
        showToast(`Knowledge source "${data.name}" saved to database`, 'success');
      } catch {
        showToast(`Knowledge source "${data.name}" connected locally`, 'success');
      }
    },
    [showToast],
  );

  return {
    knowledgeSources,
    setKnowledgeSources,
    activeSourceFilters,
    setActiveSourceFilters,
    toggleSourceFilter,
    toggleKnowledgeSync,
    toggleKnowledgeSourceConnect,
    addKnowledgeSource,
  };
}
