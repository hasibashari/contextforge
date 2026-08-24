import { ObsidianMcpServer } from './obsidian-mcp.server';
import { ObsidianVaultService } from './obsidian-vault.service';
import { ObsidianBridgeGatewayService } from './obsidian-bridge.gateway';

describe('ObsidianMcpServer & Browser Bridge Integration', () => {
  let mcpServer: ObsidianMcpServer;
  let vaultService: ObsidianVaultService;
  let bridgeGateway: ObsidianBridgeGatewayService;

  beforeEach(() => {
    bridgeGateway = new ObsidianBridgeGatewayService();
    vaultService = new ObsidianVaultService(bridgeGateway);
    mcpServer = new ObsidianMcpServer(vaultService);
  });

  describe('Tool Definitions', () => {
    it('should expose all 12 core Obsidian MCP tools with schemas', () => {
      const tools = mcpServer.getTools();
      expect(tools.length).toBe(12);

      const toolNames = tools.map((t) => t.name);
      expect(toolNames).toContain('obsidian_get_vault_info');
      expect(toolNames).toContain('obsidian_list_folders');
      expect(toolNames).toContain('obsidian_find_folder');
      expect(toolNames).toContain('obsidian_create_folder');
      expect(toolNames).toContain('obsidian_list_files');
      expect(toolNames).toContain('obsidian_search_files');
      expect(toolNames).toContain('obsidian_read_note');
      expect(toolNames).toContain('obsidian_write_note');
      expect(toolNames).toContain('obsidian_create_daily_note');
      expect(toolNames).toContain('obsidian_delete_file');
      expect(toolNames).toContain('obsidian_move_file');
      expect(toolNames).toContain('obsidian_search_backlinks');
    });

    it('should recognize all obsidian_* tool names via hasTool', () => {
      expect(mcpServer.hasTool('obsidian_list_folders')).toBe(true);
      expect(mcpServer.hasTool('obsidian_write_note')).toBe(true);
      expect(mcpServer.hasTool('obsidian_find_folder')).toBe(true);
      expect(mcpServer.hasTool('notion_get_tasks')).toBe(false);
    });
  });

  describe('Tool Execution Routing via Browser Bridge', () => {
    it('should route obsidian_list_folders to bridge gateway', async () => {
      const dispatchSpy = jest
        .spyOn(bridgeGateway, 'dispatchBridgeRequest')
        .mockResolvedValue({
          folders: ['Projects', 'Projects/Active', 'DailyNotes'],
        });

      const result = await mcpServer.executeTool('obsidian_list_folders', {
        path: 'Projects',
      });

      expect(result.success).toBe(true);
      expect(result.data).toEqual({
        path: 'Projects',
        folders: ['Projects', 'Projects/Active', 'DailyNotes'],
        count: 3,
      });
      expect(dispatchSpy).toHaveBeenCalledWith('list_folders', {
        path: 'Projects',
        recursive: false,
      });
    });

    it('should route obsidian_write_note and generate YAML frontmatter without direct fs bypass', async () => {
      const dispatchSpy = jest
        .spyOn(bridgeGateway, 'dispatchBridgeRequest')
        .mockResolvedValue({
          success: true,
          path: 'Projects/Active/architecture.md',
        });

      const result = await mcpServer.executeTool('obsidian_write_note', {
        title: 'Core Architecture',
        path: 'Projects/Active/architecture.md',
        content: '## Overview\n\nContextForge core architecture details.',
        createMissingFolders: true,
      });

      expect(result.success).toBe(true);
      const data = result.data as Record<string, unknown>;
      expect(data.relativePath).toBe('Projects/Active/architecture.md');
      expect(data.isBridgeWrite).toBe(true);
      expect(typeof data.formattedContent).toBe('string');
      expect((data.formattedContent as string).startsWith('---')).toBe(true);
      expect(dispatchSpy).toHaveBeenCalledWith(
        'write_note',
        expect.objectContaining({
          path: 'Projects/Active/architecture.md',
          title: 'Core Architecture',
          createMissingFolders: true,
        }),
      );
    });

    it('should route obsidian_read_note and return content', async () => {
      jest.spyOn(bridgeGateway, 'dispatchBridgeRequest').mockResolvedValue({
        path: 'Projects/Active/architecture.md',
        content: '# Architecture Overview\n\nContent body',
      });

      const result = await mcpServer.executeTool('obsidian_read_note', {
        path: 'Projects/Active/architecture.md',
      });

      expect(result.success).toBe(true);
      const data = result.data as Record<string, unknown>;
      expect(data.content).toBe('# Architecture Overview\n\nContent body');
      expect(data.found).toBe(true);
    });

    it('should route obsidian_find_folder and return matching folders', async () => {
      jest.spyOn(bridgeGateway, 'dispatchBridgeRequest').mockResolvedValue({
        folders: ['Projects/Active', 'Projects/Archive'],
      });

      const result = await mcpServer.executeTool('obsidian_find_folder', {
        query: 'Project',
      });

      expect(result.success).toBe(true);
      const data = result.data as Record<string, unknown>;
      expect(data.matchingFolders).toEqual([
        'Projects/Active',
        'Projects/Archive',
      ]);
    });

    it('should route obsidian_search_backlinks and return real references', async () => {
      jest.spyOn(bridgeGateway, 'dispatchBridgeRequest').mockResolvedValue([
        {
          notePath: 'DailyNotes/2026-08-24.md',
          lineSnippet: 'Reviewed [[Core Architecture]] in team sync',
        },
      ]);

      const result = await mcpServer.executeTool('obsidian_search_backlinks', {
        targetNote: 'Core Architecture',
      });

      expect(result.success).toBe(true);
      const data = result.data as Record<string, unknown>;
      expect(data.count).toBe(1);
    });

    it('should handle ping and report disconnected when bridge is not live', async () => {
      jest.spyOn(bridgeGateway, 'isBridgeConnected').mockReturnValue(false);

      const ping = await mcpServer.ping();
      expect(ping.status).toBe('disconnected');
      expect(ping.message).toContain('Obsidian Browser Bridge disconnected');
    });
  });
});
