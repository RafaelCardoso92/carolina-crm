import { ActionCategory, ActionStatus } from "@prisma/client";

// Tool parameter definition for OpenAI function calling
export interface ToolParameter {
  type: "string" | "number" | "boolean" | "object" | "array";
  description: string;
  required?: boolean;
  enum?: string[];
  items?: ToolParameter;
  properties?: Record<string, ToolParameter>;
}

// Tool definition
export interface BaborellaTool {
  name: string;
  category: ActionCategory;
  description: string;
  descriptionPt: string; // Portuguese description for user display
  parameters: Record<string, ToolParameter>;
  requiresApproval: boolean;
  // Function to generate human-readable description of what the action will do
  getActionDescription: (params: Record<string, unknown>) => string;
  // The actual execution function
  execute: (params: Record<string, unknown>, context: ToolContext) => Promise<ToolResult>;
}

// Context passed to tools during execution
export interface ToolContext {
  userId: string;
  sessionId: string;
  currentPage?: string;
  entityType?: string;
  entityId?: string;
  userData?: {
    name: string;
    email: string;
    role: string;
  };
}

// Result from tool execution
export interface ToolResult {
  success: boolean;
  message: string;
  data?: unknown;
  error?: string;
}

// Message format for chat
export interface BaborellaMessage {
  role: "user" | "assistant" | "system" | "tool";
  content: string;
  timestamp: Date;
  toolCalls?: ToolCall[];
  toolResults?: ToolCallResult[];
}

// OpenAI-style tool call
export interface ToolCall {
  id: string;
  name: string;
  arguments: Record<string, unknown>;
}

// Tool call result
export interface ToolCallResult {
  toolCallId: string;
  status: ActionStatus;
  result?: ToolResult;
  requiresApproval: boolean;
  actionId?: string; // Reference to BaborellaAction if created
}

// Pending action for user approval
export interface PendingAction {
  id: string;
  toolName: string;
  description: string;
  parameters: Record<string, unknown>;
}

// Agent response after processing
export interface AgentResponse {
  message: string;
  pendingActions?: PendingAction[];
  executedActions?: {
    id: string;
    toolName: string;
    result: ToolResult;
  }[];
}

// Convert our tools to OpenAI function format
export function toolToOpenAIFunction(tool: BaborellaTool) {
  const properties: Record<string, unknown> = {};
  const required: string[] = [];

  for (const [key, param] of Object.entries(tool.parameters)) {
    properties[key] = {
      type: param.type,
      description: param.description,
      ...(param.enum && { enum: param.enum }),
      ...(param.items && { items: param.items }),
      ...(param.properties && { properties: param.properties }),
    };
    if (param.required) {
      required.push(key);
    }
  }

  return {
    type: "function" as const,
    function: {
      name: tool.name,
      description: tool.description,
      parameters: {
        type: "object",
        properties,
        required,
      },
    },
  };
}
