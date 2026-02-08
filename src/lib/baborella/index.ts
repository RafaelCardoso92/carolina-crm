// Main Baborella AI Agent module

// Export types
export * from "./types";

// Export registry
export { toolRegistry, registerTools } from "./registry";

// Export executor
export {
  createPendingAction,
  executeToolDirectly,
  approveAndExecuteAction,
  rejectAction,
  getPendingActions,
} from "./executor";

// Export prompts
export { buildSystemPrompt, TOOL_RESULT_PROMPT, APPROVAL_PROMPT } from "./prompts";

// Export context
export { buildEnhancedContext, getQuickActions, getEntityContext } from "./context";

// Export session
export {
  getOrCreateSession,
  addMessageToSession,
  clearSession,
  getRecentSessions,
  cleanupExpiredSessions,
} from "./session";

// Import and register all tools
import { registerTools } from "./registry";
import { vendasTools } from "./tools/vendas";
import { clientesTools } from "./tools/clientes";
import { globalTools } from "./tools/global";
import { tarefasTools } from "./tools/tarefas";
import { cobrancasTools } from "./tools/cobrancas";
import { prospectosTools } from "./tools/prospectos";
import { mapaTools } from "./tools/mapa";
import { rotasTools } from "./tools/rotas";

// Initialize all tools on module load
export function initializeBaborellaTools() {
  registerTools(vendasTools);
  registerTools(clientesTools);
  registerTools(globalTools);
  registerTools(tarefasTools);
  registerTools(cobrancasTools);
  registerTools(prospectosTools);
  registerTools(mapaTools);
  registerTools(rotasTools);
  
  console.log("[Baborella] All tools initialized");
}

// Auto-initialize
initializeBaborellaTools();
