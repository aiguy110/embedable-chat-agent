import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import { MCPServerConfig } from '../types/config';
import { ChatCompletionTool } from 'openai/resources/chat/completions';

interface MCPTool {
  name: string;
  description?: string;
  inputSchema: any;
}

export class MCPManager {
  private clients: Map<string, Client> = new Map();
  private tools: Map<string, MCPTool> = new Map();
  private serverConfigs: MCPServerConfig[];

  constructor(serverConfigs: MCPServerConfig[]) {
    this.serverConfigs = serverConfigs;
  }

  async initialize(): Promise<void> {
    for (const config of this.serverConfigs) {
      try {
        await this.connectToServer(config);
      } catch (error) {
        console.error(`Failed to connect to MCP server ${config.name}:`, error);
      }
    }
  }

  private async connectToServer(config: MCPServerConfig): Promise<void> {
    // Filter out undefined values from process.env
    const cleanEnv: Record<string, string> = {};
    for (const [key, value] of Object.entries(process.env)) {
      if (value !== undefined) {
        cleanEnv[key] = value;
      }
    }

    const transport = new StdioClientTransport({
      command: config.command,
      args: config.args || [],
      env: { ...cleanEnv, ...config.env },
    });

    const client = new Client(
      {
        name: 'embedable-chat-agent',
        version: '1.0.0',
      },
      {
        capabilities: {},
      }
    );

    await client.connect(transport);

    // List available tools
    const toolsResult = await client.listTools();

    // Store tools with server prefix to avoid naming conflicts
    for (const tool of toolsResult.tools) {
      const toolName = `${config.name}__${tool.name}`;
      this.tools.set(toolName, {
        name: tool.name,
        description: tool.description,
        inputSchema: tool.inputSchema,
      });
    }

    this.clients.set(config.name, client);
    console.log(`Connected to MCP server: ${config.name} (${toolsResult.tools.length} tools)`);
  }

  getOpenAITools(): ChatCompletionTool[] {
    const tools: ChatCompletionTool[] = [];

    for (const [toolName, tool] of this.tools.entries()) {
      tools.push({
        type: 'function',
        function: {
          name: toolName,
          description: tool.description || '',
          parameters: tool.inputSchema,
        },
      });
    }

    return tools;
  }

  async executeTool(toolName: string, args: any): Promise<any> {
    // Parse server name and tool name
    const parts = toolName.split('__');
    if (parts.length !== 2) {
      throw new Error(`Invalid tool name format: ${toolName}`);
    }

    const [serverName, actualToolName] = parts;
    const client = this.clients.get(serverName);

    if (!client) {
      throw new Error(`MCP server not found: ${serverName}`);
    }

    try {
      const result = await client.callTool({
        name: actualToolName,
        arguments: args,
      });

      return result;
    } catch (error) {
      console.error(`Error executing tool ${toolName}:`, error);
      throw error;
    }
  }

  async cleanup(): Promise<void> {
    for (const [name, client] of this.clients.entries()) {
      try {
        await client.close();
        console.log(`Disconnected from MCP server: ${name}`);
      } catch (error) {
        console.error(`Error disconnecting from ${name}:`, error);
      }
    }
  }

  hasTools(): boolean {
    return this.tools.size > 0;
  }
}
