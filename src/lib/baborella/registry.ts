import { ActionCategory } from "@prisma/client";
import { BaborellaTool, toolToOpenAIFunction } from "./types";

class ToolRegistry {
  private tools: Map<string, BaborellaTool> = new Map();

  register(tool: BaborellaTool): void {
    if (this.tools.has(tool.name)) {
      console.warn("Tool " + tool.name + " is already registered. Overwriting.");
    }
    this.tools.set(tool.name, tool);
  }

  get(name: string): BaborellaTool | undefined {
    return this.tools.get(name);
  }

  getAll(): BaborellaTool[] {
    return Array.from(this.tools.values());
  }

  getByCategory(category: ActionCategory): BaborellaTool[] {
    return this.getAll().filter((tool) => tool.category === category);
  }

  getContextualTools(context: {
    page?: string;
    entityType?: string;
  }): BaborellaTool[] {
    const allTools = this.getAll();
    
    // Global tools are always available
    const globalTools = allTools.filter((t) => t.category === ActionCategory.GLOBAL);
    
    const contextTools: BaborellaTool[] = [];
    
    switch (context.page) {
      case "vendas":
        contextTools.push(...allTools.filter((t) => 
          t.category === ActionCategory.VENDAS || 
          t.category === ActionCategory.CLIENTES ||
          t.category === ActionCategory.COBRANCAS
        ));
        break;
      case "mapa":
        contextTools.push(...allTools.filter((t) => 
          t.category === ActionCategory.MAPA || 
          t.category === ActionCategory.ROTAS ||
          t.category === ActionCategory.CLIENTES ||
          t.category === ActionCategory.PROSPECTOS
        ));
        break;
      case "clientes":
        contextTools.push(...allTools.filter((t) => 
          t.category === ActionCategory.CLIENTES ||
          t.category === ActionCategory.VENDAS ||
          t.category === ActionCategory.COBRANCAS ||
          t.category === ActionCategory.TAREFAS
        ));
        break;
      case "prospectos":
        contextTools.push(...allTools.filter((t) => 
          t.category === ActionCategory.PROSPECTOS ||
          t.category === ActionCategory.MAPA ||
          t.category === ActionCategory.TAREFAS
        ));
        break;
      case "cobrancas":
        contextTools.push(...allTools.filter((t) => 
          t.category === ActionCategory.COBRANCAS ||
          t.category === ActionCategory.CLIENTES
        ));
        break;
      case "tarefas":
        contextTools.push(...allTools.filter((t) => 
          t.category === ActionCategory.TAREFAS ||
          t.category === ActionCategory.CLIENTES ||
          t.category === ActionCategory.PROSPECTOS
        ));
        break;
      case "rotas":
        contextTools.push(...allTools.filter((t) => 
          t.category === ActionCategory.ROTAS ||
          t.category === ActionCategory.MAPA ||
          t.category === ActionCategory.CLIENTES
        ));
        break;
      case "dashboard":
      default:
        // On dashboard, include all common tools for general queries
        contextTools.push(...allTools.filter((t) => 
          t.category === ActionCategory.VENDAS ||
          t.category === ActionCategory.CLIENTES ||
          t.category === ActionCategory.COBRANCAS ||
          t.category === ActionCategory.TAREFAS ||
          t.category === ActionCategory.PROSPECTOS
        ));
    }

    const toolSet = new Set([...globalTools, ...contextTools]);
    return Array.from(toolSet);
  }

  toOpenAIFunctions(tools?: BaborellaTool[]): ReturnType<typeof toolToOpenAIFunction>[] {
    const toolList = tools || this.getAll();
    return toolList.map(toolToOpenAIFunction);
  }

  getToolNames(): string[] {
    return Array.from(this.tools.keys());
  }
}

export const toolRegistry = new ToolRegistry();

export function registerTools(tools: BaborellaTool[]): void {
  tools.forEach((tool) => toolRegistry.register(tool));
}
