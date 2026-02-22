"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { usePathname, useRouter } from "next/navigation";
import {
  X,
  Send,
  Loader2,
  Bot,
  User,
  CheckCircle,
  XCircle,
  Sparkles,
  Zap,
  ChevronUp,
  ChevronDown,
  Trash2,
  RotateCcw,
  Link,
  AlertCircle,
  Coins,
  Mic,
  MicOff,
} from "lucide-react";

interface Message {
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  chainedActions?: ChainedAction[];
  tokensUsed?: number;
}

interface PendingAction {
  id: string;
  toolName: string;
  description: string;
}

interface ChainedAction {
  toolName: string;
  success: boolean;
  message: string;
  requiresApproval: boolean;
  actionId?: string;
}

interface QuickAction {
  label: string;
  prompt: string;
  icon?: string;
}

interface EntityContext {
  type: string;
  name: string;
  summary: string;
}

interface NavigationData {
  navigateTo?: string;
}

interface SpeechRecognitionEvent extends Event {
  resultIndex: number;
  results: SpeechRecognitionResultList;
}

interface SpeechRecognitionResultList {
  length: number;
  item(index: number): SpeechRecognitionResult;
  [index: number]: SpeechRecognitionResult;
}

interface SpeechRecognitionResult {
  isFinal: boolean;
  length: number;
  item(index: number): SpeechRecognitionAlternative;
  [index: number]: SpeechRecognitionAlternative;
}

interface SpeechRecognitionAlternative {
  transcript: string;
  confidence: number;
}

interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onerror: ((event: Event) => void) | null;
  onend: (() => void) | null;
  start(): void;
  stop(): void;
  abort(): void;
}

declare global {
  interface Window {
    SpeechRecognition: new () => SpeechRecognition;
    webkitSpeechRecognition: new () => SpeechRecognition;
  }
}

export default function BaborellaGlobal() {
  const [isOpen, setIsOpen] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("baborella_open") === "true";
    }
    return false;
  });
  const [messages, setMessages] = useState<Message[]>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("baborella_messages");
      if (saved) {
        try {
          return JSON.parse(saved).map((m: any) => ({
            ...m,
            timestamp: new Date(m.timestamp)
          }));
        } catch (e) {}
      }
    }
    return [];
  });
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("baborella_session");
    }
    return null;
  });
  const [pendingActions, setPendingActions] = useState<PendingAction[]>([]);
  const [processingAction, setProcessingAction] = useState<string | null>(null);
  const [quickActions, setQuickActions] = useState<QuickAction[]>([]);
  const [entityContext, setEntityContext] = useState<EntityContext | null>(null);
  const [showQuickActions, setShowQuickActions] = useState(true);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [tokensRemaining, setTokensRemaining] = useState<number | null>(null);
  const [isListening, setIsListening] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (typeof window !== "undefined") {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      setSpeechSupported(!!SpeechRecognition);
    }
  }, []);

  // Persist chat state to localStorage
  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("baborella_open", String(isOpen));
    }
  }, [isOpen]);

  useEffect(() => {
    if (typeof window !== "undefined" && messages.length > 0) {
      localStorage.setItem("baborella_messages", JSON.stringify(messages));
    }
  }, [messages]);

  useEffect(() => {
    if (typeof window !== "undefined" && sessionId) {
      localStorage.setItem("baborella_session", sessionId);
    }
  }, [sessionId]);

  const getCurrentContext = useCallback(() => {
    const path = pathname.split("/").filter(Boolean);
    const page = path[0] || "dashboard";
    
    let entityType: string | undefined;
    let entityId: string | undefined;
    
    if (path.length >= 2) {
      if (path[0] === "clientes" && path[1] && path[1] !== "novo" && path[1] !== "editar") {
        entityType = "cliente";
        entityId = path[1];
      } else if (path[0] === "prospectos" && path[1] && path[1] !== "novo" && path[1] !== "editar") {
        entityType = "prospecto";
        entityId = path[1];
      }
    }

    return { page, entityType, entityId };
  }, [pathname]);

  useEffect(() => {
    if (isOpen) {
      const context = getCurrentContext();
      const params = new URLSearchParams();
      params.set("context", context.page);
      if (context.entityType) params.set("entityType", context.entityType);
      if (context.entityId) params.set("entityId", context.entityId);

      // Only fetch session from backend if we dont have one cached
      if (!sessionId && messages.length === 0) {
        setIsLoadingHistory(true);
        fetch("/api/ai/agent/session?" + params.toString())
          .then(res => res.json())
          .then(data => {
            if (data.id) {
              setSessionId(data.id);
              if (data.messages && data.messages.length > 0) {
                setMessages(data.messages.map((m: { role: string; content: string; timestamp: string }) => ({
                  role: m.role as "user" | "assistant",
                  content: m.content,
                  timestamp: new Date(m.timestamp),
                })));
                setShowQuickActions(false);
              }
            }
          })
          .catch(err => console.error("Session fetch error:", err))
          .finally(() => setIsLoadingHistory(false));
      }

      fetch("/api/ai/agent/context?" + params.toString())
        .then(res => res.json())
        .then(data => {
          setQuickActions(data.quickActions || []);
          if (data.entity) {
            setEntityContext({
              type: data.entity.type,
              name: data.entity.name,
              summary: data.entity.summary,
            });
          } else {
            setEntityContext(null);
          }
        })
        .catch(err => console.error("Context fetch error:", err));

      fetch("/api/tokens")
        .then(res => res.json())
        .then(data => {
          if (data.balance?.remaining !== undefined) {
            setTokensRemaining(data.balance.remaining);
          }
        })
        .catch(err => console.error("Token fetch error:", err));
    }
  }, [isOpen, getCurrentContext]); // Removed pathname to keep session stable

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (isOpen && !isLoadingHistory) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen, isLoadingHistory]);

  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
    };
  }, []);

  const startListening = () => {
    if (!speechSupported) return;

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = "pt-PT";

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let finalTranscript = "";
      let interimTranscript = "";

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscript += transcript;
        } else {
          interimTranscript += transcript;
        }
      }

      if (interimTranscript) {
        setInput(interimTranscript);
      }
      
      if (finalTranscript) {
        setInput(finalTranscript);
      }
    };

    recognition.onerror = () => {
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognitionRef.current = recognition;
    recognition.start();
    setIsListening(true);
  };

  const stopListening = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    setIsListening(false);
  };

  const toggleListening = () => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  };

  const clearHistory = async () => {
    if (!sessionId) return;
    
    try {
      await fetch("/api/ai/agent/session?sessionId=" + sessionId, {
        method: "DELETE",
      });
      setMessages([]);
      setShowQuickActions(true);
    } catch (err) {
      console.error("Clear history error:", err);
    }
  };

  const formatTokens = (tokens: number): string => {
    return tokens.toLocaleString();
  };

  const sendMessage = async (text: string) => {
    const userMessage = text.trim();
    if (!userMessage || isLoading) return;

    setInput("");
    setShowQuickActions(false);
    
    setMessages((prev) => [
      ...prev,
      { role: "user", content: userMessage, timestamp: new Date() },
    ]);
    
    setIsLoading(true);

    try {
      const context = getCurrentContext();
      
      const response = await fetch("/api/ai/agent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: userMessage,
          context,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Erro ao processar");
      }

      if (data.sessionId) {
        setSessionId(data.sessionId);
      }

      if (data.tokensRemaining !== undefined) {
        setTokensRemaining(data.tokensRemaining);
      }

      setMessages((prev) => [
        ...prev,
        { 
          role: "assistant", 
          content: data.message, 
          timestamp: new Date(),
          chainedActions: data.chainedActions,
          tokensUsed: data.tokensUsed,
        },
      ]);

      if (data.pendingActions && data.pendingActions.length > 0) {
        setPendingActions(data.pendingActions);
      }

      if (data.executedActions) {
        for (const action of data.executedActions) {
          const result = action.result as { data?: NavigationData };
          if (result?.data?.navigateTo) {
            setTimeout(() => {
              router.push(result.data!.navigateTo!);
            }, 500);
          }
        }
      }
    } catch (error) {
      console.error("Error:", error);
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "Desculpe, ocorreu um erro. Por favor tente novamente.",
          timestamp: new Date(),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(input);
  };

  const handleQuickAction = (action: QuickAction) => {
    sendMessage(action.prompt);
  };

  const handleAction = async (actionId: string, approve: boolean) => {
    setProcessingAction(actionId);
    
    try {
      const response = await fetch("/api/ai/agent/action", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ actionId, approve }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Erro ao processar acao");
      }

      setPendingActions((prev) => prev.filter((a) => a.id !== actionId));

      const feedbackMessage = approve
        ? "Acao executada: " + (data.result?.message || "Sucesso")
        : "Acao cancelada";
      
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: feedbackMessage, timestamp: new Date() },
      ]);
    } catch (error) {
      console.error("Action error:", error);
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "Erro ao processar acao. Por favor tente novamente.",
          timestamp: new Date(),
        },
      ]);
    } finally {
      setProcessingAction(null);
    }
  };

  const getToolDisplayName = (toolName: string): string => {
    const names: Record<string, string> = {
      pesquisar_vendas: "Pesquisar vendas",
      resumo_vendas: "Resumo vendas",
      registar_venda: "Registar venda",
      pesquisar_clientes: "Pesquisar clientes",
      criar_cliente: "Criar cliente",
      criar_tarefa: "Criar tarefa",
      listar_tarefas: "Listar tarefas",
      cobrancas_pendentes: "Cobrancas pendentes",
      registar_pagamento: "Registar pagamento",
    };
    return names[toolName] || toolName;
  };

  return (
    <>
      <AnimatePresence>
        {!isOpen && (
          <motion.button
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            onClick={() => setIsOpen(true)}
            className="fixed bottom-6 right-6 z-50 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-full p-4 shadow-lg hover:shadow-xl transition-shadow group"
          >
            <Sparkles className="w-6 h-6 group-hover:animate-pulse" />
            <span className="absolute -top-1 -right-1 bg-green-500 w-3 h-3 rounded-full animate-pulse" />
          </motion.button>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="fixed bottom-6 right-6 z-50 w-[95vw] sm:w-96 md:w-[480px] lg:w-[520px] h-[80vh] sm:h-[560px] md:h-[640px] lg:h-[700px] max-h-[800px] bg-white dark:bg-gray-900 rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-gray-200 dark:border-gray-700"
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                    <Bot className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-semibold" style={{ color: "white" }}>Baborella</h3>
                    <p className="text-xs text-white/70">Assistente IA</p>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  {tokensRemaining !== null && (
                    <div className="flex items-center gap-1 bg-white/20 rounded-full px-2 py-1 mr-1" title={tokensRemaining.toLocaleString() + " tokens"}>
                      <Coins className="w-3 h-3" />
                      <span className="text-xs font-medium">{formatTokens(tokensRemaining)} tokens</span>
                    </div>
                  )}
                  {messages.length > 0 && (
                    <button
                      onClick={clearHistory}
                      className="p-1.5 hover:bg-white/20 rounded-full transition-colors"
                      title="Limpar historico"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                  <button
                    onClick={() => setIsOpen(false)}
                    className="p-1.5 hover:bg-white/20 rounded-full transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>
              
              {entityContext && (
                <div className="mt-3 bg-white/10 rounded-lg px-3 py-2">
                  <p className="text-xs text-white/80">
                    <span className="font-medium">{entityContext.type === "cliente" ? "Cliente" : "Prospecto"}:</span> {entityContext.name}
                  </p>
                  <p className="text-xs text-white/60 truncate">{entityContext.summary}</p>
                </div>
              )}
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {isLoadingHistory ? (
                <div className="flex items-center justify-center h-full">
                  <Loader2 className="w-6 h-6 animate-spin text-indigo-500" />
                </div>
              ) : messages.length === 0 ? (
                <div className="text-center text-gray-500 dark:text-gray-400 mt-8">
                  <Bot className="w-16 h-16 mx-auto mb-4 text-indigo-300" />
                  <p className="text-base font-medium">Ola! Sou a Baborella.</p>
                  <p className="text-sm mt-1">Posso ajudar com vendas, clientes, rotas e mais!</p>
                  {speechSupported && (
                    <p className="text-sm mt-3 text-indigo-400">
                      <Mic className="w-4 h-4 inline mr-1" />
                      Clique no microfone para falar
                    </p>
                  )}
                </div>
              ) : (
                <>
                  {messages.length > 0 && messages[0].timestamp && (
                    <div className="flex items-center justify-center">
                      <span className="text-xs text-gray-400 bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded-full">
                        <RotateCcw className="w-3 h-3 inline mr-1" />
                        Conversa anterior
                      </span>
                    </div>
                  )}
                  {messages.map((msg, idx) => (
                    <motion.div
                      key={idx}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                    >
                      <div className={"flex gap-3 " + (msg.role === "user" ? "flex-row-reverse" : "flex-row")}>
                        <div
                          className={"w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 " +
                            (msg.role === "user"
                              ? "bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-400"
                              : "bg-purple-100 dark:bg-purple-900 text-purple-600 dark:text-purple-400")}
                        >
                          {msg.role === "user" ? (
                            <User className="w-5 h-5" />
                          ) : (
                            <Bot className="w-5 h-5" />
                          )}
                        </div>
                        <div
                          className={"max-w-[80%] rounded-2xl px-4 py-3 " +
                            (msg.role === "user"
                              ? "bg-indigo-600 text-white"
                              : "bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-100")}
                        >
                          <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                          {msg.role === "assistant" && msg.tokensUsed && (
                            <p className="text-xs text-gray-400 mt-2 flex items-center gap-1">
                              <Coins className="w-3 h-3" />
                              {msg.tokensUsed.toLocaleString()} tokens
                            </p>
                          )}
                        </div>
                      </div>
                      
                      {msg.chainedActions && msg.chainedActions.length > 1 && (
                        <div className="ml-12 mt-2 bg-indigo-50 dark:bg-indigo-950 rounded-lg p-3 border border-indigo-100 dark:border-indigo-800">
                          <div className="flex items-center gap-1 text-xs text-indigo-600 dark:text-indigo-400 mb-2">
                            <Link className="w-3 h-3" />
                            <span className="font-medium">Acoes executadas:</span>
                          </div>
                          <div className="space-y-1">
                            {msg.chainedActions.map((action, i) => (
                              <div key={i} className="flex items-center gap-2 text-xs">
                                {action.success ? (
                                  <CheckCircle className="w-3 h-3 text-green-500" />
                                ) : action.requiresApproval ? (
                                  <AlertCircle className="w-3 h-3 text-amber-500" />
                                ) : (
                                  <XCircle className="w-3 h-3 text-red-500" />
                                )}
                                <span className={action.success ? "text-gray-600 dark:text-gray-300" : "text-red-600 dark:text-red-400"}>
                                  {getToolDisplayName(action.toolName)}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </motion.div>
                  ))}
                </>
              )}

              {pendingActions.length > 0 && (
                <div className="bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 rounded-xl p-4 space-y-3">
                  <p className="text-sm font-medium text-amber-800">
                    {pendingActions.length > 1 ? "Acoes pendentes:" : "Acao pendente:"}
                  </p>
                  {pendingActions.map((action) => (
                    <div
                      key={action.id}
                      className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-amber-200 dark:border-amber-700"
                    >
                      <p className="text-sm text-gray-700 mb-3">
                        {action.description}
                      </p>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleAction(action.id, true)}
                          disabled={processingAction === action.id}
                          className="flex-1 bg-green-500 hover:bg-green-600 text-white text-sm py-2 px-4 rounded-lg flex items-center justify-center gap-2 disabled:opacity-50"
                        >
                          {processingAction === action.id ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <>
                              <CheckCircle className="w-4 h-4" />
                              Aprovar
                            </>
                          )}
                        </button>
                        <button
                          onClick={() => handleAction(action.id, false)}
                          disabled={processingAction === action.id}
                          className="flex-1 bg-red-500 hover:bg-red-600 text-white text-sm py-2 px-4 rounded-lg flex items-center justify-center gap-2 disabled:opacity-50"
                        >
                          <XCircle className="w-4 h-4" />
                          Rejeitar
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {isLoading && (
                <div className="flex gap-3">
                  <div className="w-9 h-9 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center">
                    <Bot className="w-5 h-5" />
                  </div>
                  <div className="bg-gray-100 rounded-2xl px-4 py-3">
                    <Loader2 className="w-5 h-5 animate-spin text-gray-500" />
                  </div>
                </div>
              )}
              
              <div ref={messagesEndRef} />
            </div>

            {quickActions.length > 0 && messages.length === 0 && !isLoadingHistory && (
              <div className="px-4 pb-3">
                <button
                  onClick={() => setShowQuickActions(!showQuickActions)}
                  className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700 mb-2"
                >
                  <Zap className="w-3 h-3" />
                  Acoes rapidas
                  {showQuickActions ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                </button>
                {showQuickActions && (
                  <div className="flex flex-wrap gap-2">
                    {quickActions.slice(0, 6).map((action, idx) => (
                      <button
                        key={idx}
                        onClick={() => handleQuickAction(action)}
                        className="px-3 py-2 text-sm bg-gray-100 hover:bg-indigo-100 text-gray-700 hover:text-indigo-700 rounded-full transition-colors"
                      >
                        {action.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Input */}
            <form onSubmit={handleSubmit} className="p-4 border-t border-gray-200">
              <div className="flex gap-2">
                <input
                  ref={inputRef}
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder={isListening ? "A ouvir..." : "Escreva ou fale..."}
                  disabled={isLoading || isLoadingHistory}
                  className={"flex-1 border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent disabled:bg-gray-50 " + 
                    (isListening ? "border-red-400 bg-red-50" : "border-gray-300")}
                />
                {speechSupported && (
                  <button
                    type="button"
                    onClick={toggleListening}
                    disabled={isLoading || isLoadingHistory}
                    className={"rounded-xl px-4 py-3 transition-colors disabled:opacity-50 " +
                      (isListening 
                        ? "bg-red-500 text-white hover:bg-red-600 animate-pulse" 
                        : "bg-gray-100 text-gray-600 hover:bg-gray-200")}
                    title={isListening ? "Parar de ouvir" : "Falar"}
                  >
                    {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
                  </button>
                )}
                <button
                  type="submit"
                  disabled={!input.trim() || isLoading || isLoadingHistory}
                  className="bg-indigo-600 text-white rounded-xl px-5 py-3 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <Send className="w-5 h-5" />
                </button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
