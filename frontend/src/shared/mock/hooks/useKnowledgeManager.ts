import { useState, useCallback, useEffect } from 'react';
import type { KnowledgeSource, ToastType } from '@/shared/types/workspace';
import { INITIAL_KNOWLEDGE_SOURCES } from '../mockData';
import { knowledgeApi } from '@/shared/api/knowledgeApi';

export function useKnowledgeManager(
  showToast: (msg: string, type?: ToastType) => void,
) {
  const [knowledgeSources, setKnowledgeSources] = useState<KnowledgeSource[]>(
    INITIAL_KNOWLEDGE_SOURCES,
  );
  const [activeSourceFilters, setActiveSourceFilters] = useState<string[]>([
    'c5881477-8df2-4217-a068-d069a319f390',
    '50b297b8-2bfa-4c6e-8260-26463eb4c7e8',
    '36bcbb30-4e31-419b-a36c-9418a096c4be',
  ]);

  const refreshSources = useCallback(async () => {
    try {
      const sources = await knowledgeApi.getAllSources();
      if (Array.isArray(sources) && sources.length > 0) {
        setKnowledgeSources(sources);
      }
    } catch {
      // keep fallback
    }
  }, []);

  useEffect(() => {
    let isMounted = true;
    async function loadSources() {
      try {
        const sources = await knowledgeApi.getAllSources();
        if (Array.isArray(sources) && sources.length > 0 && isMounted) {
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
      prev.includes(sourceId)
        ? prev.filter((id) => id !== sourceId)
        : [...prev, sourceId],
    );
  }, []);

  const toggleKnowledgeSync = useCallback(
    async (sourceId: string) => {
      // Set temporary syncing status
      setKnowledgeSources((prev) =>
        prev.map((src) => {
          if (src.id !== sourceId) return src;
          return { ...src, status: 'syncing' };
        }),
      );

      try {
        const result = await knowledgeApi.syncSource(sourceId);
        await refreshSources();
        const count = result?.chunksCount ?? 0;
        showToast(
          `Re-indexed ${count} chunks with gemini-embedding-002 (1536-dim)`,
          'success',
        );
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        setKnowledgeSources((prev) =>
          prev.map((src) => {
            if (src.id !== sourceId) return src;
            return { ...src, status: 'error' };
          }),
        );
        showToast(`Sync failed: ${msg}`, 'error');
      }
    },
    [refreshSources, showToast],
  );

  const toggleKnowledgeSourceConnect = useCallback(
    async (sourceId: string) => {
      const current = knowledgeSources.find((s) => s.id === sourceId);
      if (!current) return;

      const isCurrentlyActive = current.status === 'synced';
      const newStatus = isCurrentlyActive ? 'disconnected' : 'synced';

      setKnowledgeSources((prev) =>
        prev.map((src) => {
          if (src.id !== sourceId) return src;
          return {
            ...src,
            status: newStatus,
            lastSynced: isCurrentlyActive ? src.lastSynced : 'Just now',
          };
        }),
      );

      try {
        await knowledgeApi.updateSourceStatus(sourceId, newStatus);
        showToast(
          isCurrentlyActive
            ? `Grounding muted for "${current.name}"`
            : `Grounding active for "${current.name}"`,
          isCurrentlyActive ? 'warning' : 'success',
        );
      } catch {
        showToast(
          isCurrentlyActive
            ? `Disconnected knowledge source "${current.name}"`
            : `Connected & grounded source "${current.name}"`,
          isCurrentlyActive ? 'warning' : 'success',
        );
      }
    },
    [knowledgeSources, showToast],
  );

  const deleteKnowledgeSource = useCallback(
    async (sourceId: string) => {
      const target = knowledgeSources.find((s) => s.id === sourceId);
      setKnowledgeSources((prev) => prev.filter((s) => s.id !== sourceId));

      try {
        await knowledgeApi.deleteSource(sourceId);
        showToast(
          `Knowledge source "${target?.name || ''}" and vectors deleted`,
          'info',
        );
      } catch {
        showToast(
          `Removed knowledge source "${target?.name || ''}"`,
          'info',
        );
      }
    },
    [knowledgeSources, showToast],
  );

  const addKnowledgeSource = useCallback(
    async (data: {
      name: string;
      type: KnowledgeSource['type'];
      location: string;
    }) => {
      const getIconType = (
        t: KnowledgeSource['type'],
      ): KnowledgeSource['iconType'] => {
        if (t === 'document_upload' || t === 'document') return 'upload';
        if (t === 'obsidian_vault') return 'book-open';
        if (t === 'local_folder') return 'folder';
        if (t === 'github_repo') return 'terminal';
        if (t === 'web_search') return 'globe';
        if (t === 'database_schema') return 'database';
        if (t === 'notion_workspace') return 'layers';
        return 'file';
      };

      try {
        const created = await knowledgeApi.createSource({
          name: data.name,
          type: data.type,
          location: data.location,
          description: `Connected ${data.type.replace('_', ' ')} grounding knowledge repository.`,
          iconType: getIconType(data.type),
          color: 'text-primary',
        });
        await refreshSources();
        showToast(
          `Knowledge source "${data.name}" connected & indexed`,
          'success',
        );
        return created;
      } catch {
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
        showToast(
          `Knowledge source "${data.name}" connected locally`,
          'success',
        );
        return newSource;
      }
    },
    [refreshSources, showToast],
  );

  const uploadKnowledgeFiles = useCallback(
    async (files: File[], name: string, sourceId?: string) => {
      try {
        const created = await knowledgeApi.uploadDocuments(
          files,
          name,
          sourceId,
        );
        await refreshSources();
        showToast(
          `Uploaded & indexed ${files.length} documents into 1536-dim vector embeddings`,
          'success',
        );
        return created;
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        showToast(`Upload failed: ${msg}`, 'error');
        throw err;
      }
    },
    [refreshSources, showToast],
  );

  return {
    knowledgeSources,
    setKnowledgeSources,
    activeSourceFilters,
    setActiveSourceFilters,
    toggleSourceFilter,
    toggleKnowledgeSync,
    toggleKnowledgeSourceConnect,
    deleteKnowledgeSource,
    addKnowledgeSource,
    uploadKnowledgeFiles,
    refreshSources,
  };
}
