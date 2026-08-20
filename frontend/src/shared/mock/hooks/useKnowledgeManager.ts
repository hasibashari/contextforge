import { useState, useCallback, useEffect } from 'react';
import type { KnowledgeSource, ToastType } from '@/shared/types/workspace';
import { knowledgeApi } from '@/shared/api/knowledgeApi';

export function useKnowledgeManager(
  showToast: (msg: string, type?: ToastType) => void,
) {
  const [knowledgeSources, setKnowledgeSources] = useState<KnowledgeSource[]>([]);
  const [activeSourceFilters, setActiveSourceFilters] = useState<string[]>([]);

  const refreshSources = useCallback(async () => {
    try {
      const sources = await knowledgeApi.getAllSources();
      if (Array.isArray(sources)) {
        setKnowledgeSources(sources);
      }
    } catch {
      // keep current
    }
  }, []);

  useEffect(() => {
    let isMounted = true;
    async function loadSources() {
      try {
        const sources = await knowledgeApi.getAllSources();
        if (Array.isArray(sources) && isMounted) {
          setKnowledgeSources(sources);
          if (sources.length > 0) {
            setActiveSourceFilters(sources.slice(0, 3).map((s) => s.id));
          }
        }
      } catch {
        // gracefully handle network errors
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
        setKnowledgeSources((prev) =>
          prev.map((src) => {
            if (src.id !== sourceId) return src;
            return { ...src, status: 'error' };
          }),
        );
        const errMsg = err instanceof Error ? err.message : 'Unknown error';
        showToast(`Sync failed: ${errMsg}`, 'error');
      }
    },
    [showToast, refreshSources],
  );

  const toggleKnowledgeSourceConnect = useCallback(
    (sourceId: string) => {
      setKnowledgeSources((prev) =>
        prev.map((src) => {
          if (src.id !== sourceId) return src;
          const nextStatus: KnowledgeSource['status'] =
            src.status === 'synced' ? 'disconnected' : 'synced';
          showToast(
            nextStatus === 'synced'
              ? `Grounding enabled for "${src.name}"`
              : `Grounding muted for "${src.name}"`,
            nextStatus === 'synced' ? 'success' : 'warning',
          );
          return {
            ...src,
            status: nextStatus,
          };
        }),
      );
    },
    [showToast],
  );

  const addKnowledgeSource = useCallback(
    async (sourceData: {
      name: string;
      type: KnowledgeSource['type'];
      location: string;
      subfolderScope?: string;
    }) => {
      const tempId = `source-${Date.now()}`;
      const tempSource: KnowledgeSource = {
        id: tempId,
        name: sourceData.name,
        type: sourceData.type,
        location: sourceData.location,
        subfolderScope: sourceData.subfolderScope,
        meta: sourceData.subfolderScope ? `Folder /${sourceData.subfolderScope}` : 'Local Source',
        filesCount: 0,
        chunksCount: 0,
        status: 'syncing',
        iconType: 'folder',
        color: 'text-primary',
        lastSynced: 'Indexing...',
        description: `Connected from ${sourceData.location}`,
      };

      setKnowledgeSources((prev) => [tempSource, ...prev]);

      try {
        const created = await knowledgeApi.createSource({
          name: sourceData.name,
          type: sourceData.type,
          location: sourceData.location,
          description: tempSource.description,
          meta: tempSource.meta,
          iconType: 'folder',
          color: 'text-primary',
        });

        await refreshSources();
        showToast(`Connected Knowledge Base: ${created.name}`, 'success');
        return created;
      } catch {
        showToast(`Registered local source: ${tempSource.name}`, 'info');
        return tempSource;
      }
    },
    [showToast, refreshSources],
  );

  const uploadKnowledgeFiles = useCallback(
    async (files: File[], name: string, sourceId?: string) => {
      showToast(
        `Uploading ${files.length} document(s) & generating 1536-dim vector embeddings...`,
        'info',
      );

      try {
        const result = await knowledgeApi.uploadDocuments(files, name, sourceId);
        await refreshSources();
        showToast(
          `Ingested ${result.chunksCount} chunks from ${result.filesCount} documents!`,
          'success',
        );
        return result;
      } catch (err: unknown) {
        const errMsg = err instanceof Error ? err.message : 'Upload failed';
        showToast(`Vector ingestion error: ${errMsg}`, 'error');
        throw err;
      }
    },
    [showToast, refreshSources],
  );

  const deleteKnowledgeSource = useCallback(
    async (sourceId: string) => {
      setKnowledgeSources((prev) => prev.filter((s) => s.id !== sourceId));
      setActiveSourceFilters((prev) => prev.filter((id) => id !== sourceId));

      try {
        await knowledgeApi.deleteSource(sourceId);
        showToast('Knowledge source and vector chunks purged', 'warning');
      } catch {
        showToast('Source unlinked locally', 'warning');
      }
    },
    [showToast],
  );

  return {
    knowledgeSources,
    activeSourceFilters,
    toggleSourceFilter,
    toggleKnowledgeSync,
    toggleKnowledgeSourceConnect,
    addKnowledgeSource,
    uploadKnowledgeFiles,
    deleteKnowledgeSource,
    refreshSources,
  };
}
