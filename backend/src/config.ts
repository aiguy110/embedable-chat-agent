import * as fs from 'fs';
import * as path from 'path';
import YAML from 'yaml';
import { AppConfig } from './types/config';

export class ConfigLoader {
  private config: AppConfig;

  constructor(configPath?: string) {
    const resolvedPath = configPath || process.env.CONFIG_PATH || path.join(__dirname, '../../config.yaml');
    this.config = this.loadConfig(resolvedPath);
    this.validateConfig();
  }

  private loadConfig(configPath: string): AppConfig {
    try {
      const fileContent = fs.readFileSync(configPath, 'utf8');

      // Support both YAML and JSON
      if (configPath.endsWith('.json')) {
        return JSON.parse(fileContent);
      } else {
        return YAML.parse(fileContent);
      }
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
        throw new Error(`Configuration file not found: ${configPath}`);
      }
      throw new Error(`Failed to parse configuration file: ${(error as Error).message}`);
    }
  }

  private validateConfig(): void {
    if (!this.config.llm) {
      throw new Error('LLM configuration is required');
    }

    if (!this.config.llm.model) {
      throw new Error('LLM model is required');
    }

    if (!this.config.systemPrompt) {
      throw new Error('System prompt is required');
    }

    // Validate API key (from config or environment)
    const apiKey = this.config.llm.apiKey || process.env.OPENAI_API_KEY;
    if (!apiKey && this.config.llm.provider === 'openai') {
      console.warn('Warning: No API key configured for OpenAI');
    }
  }

  public getConfig(): AppConfig {
    return this.config;
  }

  public getLLMConfig() {
    return this.config.llm;
  }

  public getSystemPrompt(): string {
    return this.config.systemPrompt;
  }

  public getMCPServers() {
    return this.config.mcpServers || [];
  }

  public getCORSConfig() {
    return this.config.cors || {};
  }
}
