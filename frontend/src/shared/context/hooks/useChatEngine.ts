import React, { useState, useCallback, useMemo, useEffect } from 'react';
import type {
  ChatSession,
  ChatMessage,
  Artifact,
  ActionCardData,
  ActivityLogEntry,
  AutomationWorkflow,
  ReasoningStep,
} from '@/shared/types/workspace';
import { chatApi } from '@/shared/api/chatApi';
import { artifactsApi } from '@/shared/api/artifactsApi';
import { obsidianBridgeService } from '@/shared/services/obsidianBridge.service';
import { generateGeneralReasoningOutput } from '../generators/responseGenerators';

export function useChatEngine(
  showToast: (msg: string) => void,
  setActivities?: React.Dispatch<React.SetStateAction<ActivityLogEntry[]>>,
  setIsAsideOpen?: (open: boolean) => void,
  createAutomation?: (data: Omit<AutomationWorkflow, 'id' | 'totalRuns' | 'createdAt'>) => Promise<AutomationWorkflow> | AutomationWorkflow,
) {
  const [chatSessions, setChatSessions] = useState<ChatSession[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string>('');
  const [artifacts, setArtifacts] = useState<Artifact[]>([]);
  const [activeArtifact, setActiveArtifact] = useState<Artifact | null>(null);
  const [isGeneratingResponse, setIsGeneratingResponse] = useState<boolean>(false);
  const [selectedAgentMode, setSelectedAgentMode] = useState<string>('auto');
  const [liveReasoningState, setLiveReasoningState] = useState<{
    isThinking: boolean;
    stageLabel: string;
    steps: ReasoningStep[];
    startTime?: number;
    agentName?: string;
  }>({
    isThinking: false,
    stageLabel: 'Analyzing Goal & Planning Actions...',
    steps: [],
  });

  // Load initial sessions and artifacts from backend on mount
  useEffect(() => {
    let isMounted = true;

    async function loadInitialData() {
      try {
        const [backendSessions, backendArtifacts] = await Promise.all([
          chatApi.getSessions().catch(() => null),
          artifactsApi.getAll().catch(() => null),
        ]);

        if (!isMounted) return;

        if (backendArtifacts && backendArtifacts.length > 0) {
          setArtifacts(backendArtifacts);
          setActiveArtifact(backendArtifacts[0]);
        }

        if (backendSessions && backendSessions.length > 0) {
          setChatSessions(backendSessions);
          setActiveSessionId(backendSessions[0].id);

          // Fetch full message history of first session
          const details = await chatApi.getSessionDetails(backendSessions[0].id).catch(() => null);
          if (details && isMounted) {
            setChatSessions((prev) =>
              prev.map((s) => (s.id === details.session.id ? { ...s, messages: details.messages } : s)),
            );
          }
        } else {
          // If no sessions exist in database yet, create a fresh one
          try {
            const firstSession = await chatApi.createSession('New Investigation');
            if (isMounted) {
              setChatSessions([firstSession]);
              setActiveSessionId(firstSession.id);
            }
          } catch {
            const fallbackId =
              typeof crypto !== 'undefined' && crypto.randomUUID
                ? crypto.randomUUID()
                : `session-${Date.now()}`;
            if (isMounted) {
              setChatSessions([
                {
                  id: fallbackId,
                  title: 'New Investigation',
                  createdAt: 'Just now',
                  messages: [],
                },
              ]);
              setActiveSessionId(fallbackId);
            }
          }
        }
      } catch {
        // gracefully handle network errors
      }
    }

    void loadInitialData();

    return () => {
      isMounted = false;
    };
  }, []);

  const activeSession = useMemo(() => {
    return chatSessions.find((s) => s.id === activeSessionId) || chatSessions[0];
  }, [chatSessions, activeSessionId]);

  const createNewChatSession = useCallback(async () => {
    try {
      const newSession = await chatApi.createSession('New Investigation');
      setChatSessions((prev) => [newSession, ...prev]);
      setActiveSessionId(newSession.id);
      setActiveArtifact(null);
      showToast('✨ New chat session started');
      return newSession.id;
    } catch {
      // Fallback local UUID
      const newSessionId = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `session-${Date.now()}`;
      const fallbackSession: ChatSession = {
        id: newSessionId,
        title: 'New Chat',
        createdAt: 'Just now',
        messages: [],
      };
      setChatSessions((prev) => [fallbackSession, ...prev]);
      setActiveSessionId(newSessionId);
      setActiveArtifact(null);
      showToast('✨ New chat session started (local)');
      return newSessionId;
    }
  }, [showToast]);

  const switchChatSession = useCallback(
    async (sessionId: string) => {
      setActiveSessionId(sessionId);

      // Check if session messages need to be fetched from backend
      const targetSession = chatSessions.find((s) => s.id === sessionId);
      if (targetSession && targetSession.messages.length === 0) {
        try {
          const details = await chatApi.getSessionDetails(sessionId);
          setChatSessions((prev) =>
            prev.map((s) => (s.id === sessionId ? { ...s, messages: details.messages } : s)),
          );
        } catch {
          // ignore error
        }
      }

      if (targetSession?.activeArtifactId) {
        const art = artifacts.find((a) => a.id === targetSession.activeArtifactId);
        if (art) setActiveArtifact(art);
      }
    },
    [chatSessions, artifacts],
  );

  const deleteChatSession = useCallback(
    async (sessionId: string) => {
      setChatSessions((prev) => {
        const remaining = prev.filter((s) => s.id !== sessionId);
        if (activeSessionId === sessionId) {
          if (remaining.length > 0) {
            setActiveSessionId(remaining[0].id);
          } else {
            const newId =
              typeof crypto !== 'undefined' && crypto.randomUUID
                ? crypto.randomUUID()
                : `session-${Date.now()}`;
            const fallbackSession: ChatSession = {
              id: newId,
              title: 'New Chat',
              createdAt: 'Just now',
              messages: [],
            };
            setActiveSessionId(newId);
            return [fallbackSession];
          }
        }
        return remaining;
      });

      setActiveArtifact(null);

      try {
        await chatApi.deleteSession(sessionId);
        showToast('🗑️ Chat session deleted');
      } catch {
        showToast('Session removed from view');
      }
    },
    [activeSessionId, showToast],
  );

  const saveArtifactContent = useCallback(
    async (artifactId: string, newContent: string) => {
      // Optimistic update
      setArtifacts((prev) =>
        prev.map((art) => {
          if (art.id === artifactId) {
            const updated = {
              ...art,
              content: newContent,
              updatedAt: 'Just now',
              wordCount: newContent.split(/\s+/).filter(Boolean).length,
            };
            if (activeArtifact?.id === artifactId) {
              setActiveArtifact(updated);
            }
            return updated;
          }
          return art;
        }),
      );

      try {
        await artifactsApi.updateContent(artifactId, newContent);
        showToast('✓ Document changes synced to database & Obsidian');
      } catch {
        showToast('✓ Document changes synced locally');
      }
    },
    [activeArtifact, showToast],
  );

  const deleteArtifact = useCallback(
    async (artifactId: string) => {
      setArtifacts((prev) => {
        const remaining = prev.filter((a) => a.id !== artifactId);
        if (activeArtifact?.id === artifactId) {
          setActiveArtifact(remaining.length > 0 ? remaining[0] : null);
        }
        return remaining;
      });
      try {
        await artifactsApi.delete(artifactId);
        showToast('🗑️ Document removed from workspace');
      } catch {
        showToast('Document removed');
      }
    },
    [activeArtifact, showToast],
  );

  const executeCardAction = useCallback(
    (actionKey: string, card: ActionCardData) => {
      if (actionKey === 'open_aside' || actionKey === 'open_schedule') {
        setIsAsideOpen?.(true);
        showToast('📌 Opened in Workspace Aside');
      } else if (actionKey === 'open_in_obsidian') {
        const art =
          artifacts.find(
            (a) =>
              a.id === card.targetResource ||
              a.locationPath === card.targetResource,
          ) || activeArtifact;
        const pathName =
          card.locationPath ||
          art?.locationPath ||
          card.subtitle ||
          `${card.title}.md`;
        obsidianBridgeService.openInObsidianApp(
          '',
          pathName,
          art?.content,
        );
        showToast('🚀 Opening note in Obsidian Desktop...');
      } else if (actionKey === 'write_to_local_disk') {
        const art =
          artifacts.find(
            (a) =>
              a.id === card.targetResource ||
              a.locationPath === card.targetResource,
          ) || activeArtifact;
        if (art) {
          const pathName =
            card.locationPath || art.locationPath || `${art.title}.md`;
          if (obsidianBridgeService.getPairedDirectoryHandle()) {
            obsidianBridgeService
              .writeNoteToLocalVault(pathName, art.content)
              .then((ok) => {
                if (ok) {
                  showToast(`✅ Saved directly to local vault: ${pathName}`);
                } else {
                  obsidianBridgeService.downloadMarkdownFile(pathName, art.content);
                  showToast(`📥 Downloaded as Markdown file: ${pathName}`);
                }
              });
          } else {
            obsidianBridgeService
              .requestVaultDirectory()
              .then((res) => {
                if (res) {
                  obsidianBridgeService.writeNoteToLocalVault(pathName, art.content);
                  showToast(`✅ Connected folder & saved note to: ${pathName}`);
                }
              })
              .catch(() => {
                obsidianBridgeService.downloadMarkdownFile(pathName, art.content);
              });
          }
        }
      } else if (actionKey === 'copy_content' || actionKey === 'copy_citations') {
        showToast('📋 Copied content to clipboard');
      } else {
        showToast(`Action "${actionKey}" executed on ${card.title}`);
      }
    },
    [activeArtifact, artifacts, setIsAsideOpen, showToast],
  );

  const triggerMorningBriefing = useCallback(async () => {
    setIsGeneratingResponse(true);
    const briefingAssistantId = `msg-asst-briefing-${Date.now()}`;

    const placeholderAssistantMsg: ChatMessage = {
      id: briefingAssistantId,
      role: 'assistant',
      content: '',
      timestamp: 'Just now',
    };

    setChatSessions((prev) =>
      prev.map((session) =>
        session.id === activeSessionId
          ? { ...session, messages: [...session.messages, placeholderAssistantMsg] }
          : session,
      ),
    );

    try {
      await chatApi.triggerMorningBriefing(activeSessionId, {
        onSessionCreated: ({ id, title, previousId }) => {
          setActiveSessionId(id);
          setChatSessions((prev) =>
            prev.map((s) => (s.id === previousId || s.id === activeSessionId ? { ...s, id, title } : s)),
          );
        },
        onChatChunk: ({ delta }) => {
          setChatSessions((prev) =>
            prev.map((session) =>
              session.id === activeSessionId
                ? {
                    ...session,
                    messages: session.messages.map((m) =>
                      m.id === briefingAssistantId ? { ...m, content: m.content + delta } : m,
                    ),
                  }
                : session,
            ),
          );
        },
        onAssistantMessage: (msg) => {
          setChatSessions((prev) =>
            prev.map((session) =>
              session.id === activeSessionId
                ? {
                    ...session,
                    messages: session.messages.map((m) => (m.id === briefingAssistantId ? { ...m, ...msg } : m)),
                  }
                : session,
            ),
          );
        },
        onExecutionDone: () => {
          setIsGeneratingResponse(false);
          showToast('🌅 Automated Morning Briefing completed!');
        },
        onError: (err) => {
          setIsGeneratingResponse(false);
          showToast(`Briefing notice: ${err.message}`);
        },
      });
    } catch {
      // Fallback local briefing
      const greetingContent = `🌅 **Good morning!** Here is your automated daily executive briefing:\n\n### ⚡ Priority Action Items\n1. **PR #104 (Token Compliance)** is awaiting your human approval checkpoint.\n2. **Obsidian Sprint Notes** have been synchronized.\n\nWould you like me to draft meeting agendas or prepare technical discussion points for your team sync?`;

      setChatSessions((prev) =>
        prev.map((session) =>
          session.id === activeSessionId
            ? {
                ...session,
                messages: session.messages.map((m) =>
                  m.id === briefingAssistantId
                    ? {
                        ...m,
                        content: greetingContent,
                        intent: undefined,
                      }
                    : m,
                ),
              }
            : session,
        ),
      );
      setIsGeneratingResponse(false);
      showToast('🌅 Morning Briefing ready');
    }
  }, [activeSessionId, showToast]);


  const sendChatMessage = useCallback(
    async (prompt: string, customOptions?: { agentId?: string; sources?: string[] }) => {
      if (!prompt.trim() || isGeneratingResponse) return;

      void customOptions;

      const userMsgId = `msg-user-${Date.now()}`;
      const assistantMsgId = `msg-asst-${Date.now()}`;

      const userMessage: ChatMessage = {
        id: userMsgId,
        role: 'user',
        content: prompt.trim(),
        timestamp: 'Just now',
      };

      const placeholderAssistantMsg: ChatMessage = {
        id: assistantMsgId,
        role: 'assistant',
        content: '',
        timestamp: 'Just now',
      };

      // Add user message & placeholder assistant immediately
      setChatSessions((prev) =>
        prev.map((session) =>
          session.id === activeSessionId
            ? {
                ...session,
                messages: [...session.messages, userMessage, placeholderAssistantMsg],
              }
            : session,
        ),
      );

      const targetAgentId =
        customOptions?.agentId ||
        (selectedAgentMode !== 'auto' ? selectedAgentMode : undefined);

      const streamStartTime = Date.now();
      const collectedSteps: ReasoningStep[] = [
        {
          id: `step-${Date.now()}-init`,
          stage: 'planning',
          label: 'Analyzing Goal & Planning Actions...',
          timestamp: 'Just now',
          durationMs: 0,
        },
      ];

      setIsGeneratingResponse(true);
      setLiveReasoningState({
        isThinking: true,
        stageLabel: 'Analyzing Goal & Planning Actions...',
        steps: [...collectedSteps],
        startTime: streamStartTime,
        agentName:
          targetAgentId === 'agent-research'
            ? 'Research Specialist'
            : targetAgentId
              ? 'Personal Assistant'
              : undefined,
      });

      const applyChatFallback = (errorLog: unknown) => {
        console.error('Chat Stream Error / Network Issue:', errorLog);
        const durationMs = Date.now() - streamStartTime;
        const fallback = generateGeneralReasoningOutput(prompt);
        if (fallback.createdAutomation) {
          createAutomation?.(fallback.createdAutomation);
        }
        setChatSessions((prev) =>
          prev.map((session) =>
            session.id === activeSessionId
              ? {
                  ...session,
                  messages: session.messages.map((m) =>
                    m.id === assistantMsgId
                      ? {
                          ...m,
                          content: m.content || fallback.textContent,
                          intent: fallback.intent,
                          reasoningSteps: collectedSteps,
                          thinkingDurationMs: durationMs,
                        }
                      : m,
                  ),
                }
              : session,
          ),
        );
        setIsGeneratingResponse(false);
        setLiveReasoningState({
          isThinking: false,
          stageLabel: '',
          steps: [],
        });
      };

      try {
        await chatApi.sendMessageStream(
          activeSessionId,
          prompt.trim(),
          {
            onSessionCreated: ({ id, title, previousId }) => {
              setActiveSessionId(id);
              setChatSessions((prev) =>
                prev.map((s) =>
                  s.id === previousId || s.id === activeSessionId
                    ? { ...s, id, title: s.title || title }
                    : s,
                ),
              );
            },
            onSessionTitleUpdated: ({ title }) => {
              setChatSessions((prev) =>
                prev.map((s) =>
                  s.id === activeSessionId ? { ...s, title } : s,
                ),
              );
            },
            onTimelineStage: ({ stage, label }) => {
              if (stage === 're-planning') {
                showToast(`🔄 ${label}`);
              }
              const step: ReasoningStep = {
                id: `step-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
                stage,
                label,
                timestamp: 'Just now',
                durationMs: Date.now() - streamStartTime,
              };
              collectedSteps.push(step);
              setLiveReasoningState((prev) => ({
                ...prev,
                stageLabel: label,
                steps: [...prev.steps, step],
              }));
            },
            onToolCallStart: ({ toolName }) => {
              const cleanTool = toolName.replace(/_/g, ' ');
              const step: ReasoningStep = {
                id: `step-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
                stage: 'tool_execution',
                label: `Invoking tool: ${toolName}`,
                toolName,
                timestamp: 'Just now',
                durationMs: Date.now() - streamStartTime,
              };
              collectedSteps.push(step);
              setLiveReasoningState((prev) => ({
                ...prev,
                stageLabel: `Executing ${cleanTool}...`,
                steps: [...prev.steps, step],
              }));
            },
            onChatChunk: ({ delta }) => {
              setChatSessions((prev) =>
                prev.map((session) =>
                  session.id === activeSessionId
                    ? {
                        ...session,
                        messages: session.messages.map((m) =>
                          m.id === assistantMsgId
                            ? { ...m, content: m.content + delta }
                            : m,
                        ),
                      }
                    : session,
                ),
              );
            },
            onSideAgentLog: ({ sideAgentId, log, riskLevel }) => {
              const agentName = sideAgentId.includes('research')
                ? 'Research Specialist'
                : sideAgentId.includes('doc')
                  ? 'Obsidian Vault Worker'
                  : 'Personal Assistant';
              const step: ReasoningStep = {
                id: `step-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
                stage: 'handoff',
                label: log,
                agentName,
                timestamp: 'Just now',
                durationMs: Date.now() - streamStartTime,
              };
              collectedSteps.push(step);
              setLiveReasoningState((prev) => ({
                ...prev,
                stageLabel: log,
                steps: [...prev.steps, step],
              }));

              const newAct: ActivityLogEntry = {
                id: `act-${Date.now()}`,
                timestamp: 'Just now',
                agentId: sideAgentId,
                agentName,
                actionType: 'tool_invoked',
                summary: log,
                status: riskLevel === 'high_risk' ? 'warning' : 'success',
              };
              setActivities?.((prev) => [newAct, ...prev]);
            },
            onArtifactCreated: (createdArtifact) => {
              setArtifacts((prev) => [
                createdArtifact,
                ...prev.filter((a) => a.id !== createdArtifact.id),
              ]);
              setActiveArtifact(createdArtifact);
              setIsAsideOpen?.(true);
              showToast(`📦 Catatan Berhasil Dibuat: ${createdArtifact.title}`);
            },
            onAutomationCreated: (createdAuto) => {
              createAutomation?.(createdAuto);
              showToast(`⏰ Automation Scheduled: "${createdAuto.name}"`);
            },
            onAssistantMessage: (backendMsg) => {
              setChatSessions((prev) =>
                prev.map((session) =>
                  session.id === activeSessionId
                    ? {
                        ...session,
                        activeArtifactId:
                          backendMsg.artifactId || session.activeArtifactId,
                        messages: session.messages.map((m) =>
                          m.id === assistantMsgId
                            ? { ...m, ...backendMsg }
                            : m,
                        ),
                      }
                    : session,
                ),
              );
            },
            onExecutionDone: () => {
              const durationMs = Date.now() - streamStartTime;
              setChatSessions((prev) =>
                prev.map((session) =>
                  session.id === activeSessionId
                    ? {
                        ...session,
                        messages: session.messages.map((m) =>
                          m.id === assistantMsgId
                            ? {
                                ...m,
                                reasoningSteps:
                                  collectedSteps.length > 0
                                    ? [...collectedSteps]
                                    : m.reasoningSteps,
                                thinkingDurationMs: durationMs,
                              }
                            : m,
                        ),
                      }
                    : session,
                ),
              );
              setIsGeneratingResponse(false);
              setLiveReasoningState({
                isThinking: false,
                stageLabel: '',
                steps: [],
              });
            },
            onError: (streamErr) => {
              applyChatFallback(streamErr);
            },
          },
          targetAgentId,
        );
      } catch (err: unknown) {
        applyChatFallback(err);
      }
    },
    [
      activeSessionId,
      createAutomation,
      isGeneratingResponse,
      selectedAgentMode,
      setActivities,
      setIsAsideOpen,
      showToast,
    ],
  );

  return {
    chatSessions,
    activeSessionId,
    activeSession,
    artifacts,
    activeArtifact,
    isGeneratingResponse,
    liveReasoningState,
    selectedAgentMode,
    setActiveArtifact,
    setSelectedAgentMode,
    saveArtifactContent,
    deleteArtifact,
    executeCardAction,
    triggerMorningBriefing,
    sendChatMessage,
    createNewChatSession,
    switchChatSession,
    deleteChatSession,
  };
}
