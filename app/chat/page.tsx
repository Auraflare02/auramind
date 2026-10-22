"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  sources?: { title: string; url: string }[];
  model?: string;
  timestamp: string;
  isError?: boolean;
}

interface Conversation {
  id: string;
  title: string;
  createdAt: string;
  messages: ChatMessage[];
  linkedGoalCode?: string;
}

const STARTER_SUGGESTIONS = [
  { label: "Explain something to me", prompt: "Explain how photosynthesis works, including light-dependent reactions and the Calvin cycle, in simple terms." },
  { label: "Help me solve a problem", prompt: "I'm struggling to solve quadratic equations. Can you walk me through the quadratic formula step by step with an example?" },
  { label: "Teach me a new skill", prompt: "Teach me how Python decorators work with practical code examples and when to use them." },
  { label: "Help me with my goal", prompt: "I fell behind on my study schedule yesterday. How should I recover without feeling overwhelmed?" },
];

export default function ChatPage() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConvId, setActiveConvId] = useState<string>("");
  const [inputMessage, setInputMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [webSearchEnabled, setWebSearchEnabled] = useState(false);
  const [goalCodeInput, setGoalCodeInput] = useState("");
  const [linkedGoalCode, setLinkedGoalCode] = useState("");
  const [showSidebar, setShowSidebar] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Load conversations from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem("auramind_conversations_v2");
      if (saved) {
        const parsed: Conversation[] = JSON.parse(saved);
        if (parsed.length > 0) {
          setConversations(parsed);
          setActiveConvId(parsed[0].id);
          if (parsed[0].linkedGoalCode) {
            setLinkedGoalCode(parsed[0].linkedGoalCode);
          }
          return;
        }
      }
    } catch {
      // Local storage empty or corrupt
    }

    // Initialize with a default new conversation
    createNewChat();
  }, []);

  // Save conversations to localStorage
  useEffect(() => {
    if (conversations.length > 0) {
      try {
        localStorage.setItem("auramind_conversations_v2", JSON.stringify(conversations));
      } catch {
        // Local storage quota exceeded or disabled
      }
    }
  }, [conversations]);

  // Scroll to bottom when messages update
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [conversations, activeConvId, isLoading]);

  const activeConversation = conversations.find((c) => c.id === activeConvId);

  const createNewChat = () => {
    const newConv: Conversation = {
      id: "conv_" + Date.now().toString(36) + "_" + Math.random().toString(36).slice(2, 6),
      title: "New Conversation",
      createdAt: new Date().toISOString(),
      messages: [],
      linkedGoalCode: linkedGoalCode || undefined,
    };
    setConversations((prev) => [newConv, ...prev]);
    setActiveConvId(newConv.id);
    setInputMessage("");
    setShowSidebar(false);
  };

  const deleteConversation = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const remaining = conversations.filter((c) => c.id !== id);
    setConversations(remaining);
    if (activeConvId === id) {
      if (remaining.length > 0) {
        setActiveConvId(remaining[0].id);
      } else {
        createNewChat();
      }
    }
  };

  const clearAllConversations = () => {
    if (confirm("Are you sure you want to clear your conversation history?")) {
      localStorage.removeItem("auramind_conversations_v2");
      setConversations([]);
      createNewChat();
    }
  };

  const handleCopyMessage = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const sendMessage = async (overrideText?: string, isRetry = false) => {
    const textToSend = (overrideText !== undefined ? overrideText : inputMessage).trim();
    if (!textToSend || isLoading) return;

    if (!overrideText) {
      setInputMessage("");
    }

    let currentMessages = activeConversation?.messages || [];
    let userMsgId = "msg_user_" + Date.now();

    if (!isRetry) {
      const userMessage: ChatMessage = {
        id: userMsgId,
        role: "user",
        content: textToSend,
        timestamp: new Date().toISOString(),
      };
      currentMessages = [...currentMessages, userMessage];

      // Update conversation state with user message
      setConversations((prev) =>
        prev.map((c) => {
          if (c.id === activeConvId) {
            const isFirst = c.messages.length === 0;
            return {
              ...c,
              title: isFirst ? textToSend.slice(0, 36) + (textToSend.length > 36 ? "..." : "") : c.title,
              messages: currentMessages,
            };
          }
          return c;
        })
      );
    }

    setIsLoading(true);

    // Prepare payload
    const historyPayload = currentMessages
      .filter((m) => !m.isError)
      .slice(-10)
      .map((m) => ({
        role: m.role as "user" | "assistant",
        content: m.content,
      }));

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          message: textToSend,
          history: historyPayload,
          request_id: linkedGoalCode ? linkedGoalCode : undefined,
          enable_search: webSearchEnabled,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.ok) {
        throw new Error(data.error || "Failed to reach Gemini AI engine.");
      }

      const assistantMessage: ChatMessage = {
        id: "msg_ast_" + Date.now(),
        role: "assistant",
        content: data.reply,
        sources: data.sources,
        model: data.model,
        timestamp: new Date().toISOString(),
      };

      setConversations((prev) =>
        prev.map((c) => {
          if (c.id === activeConvId) {
            return {
              ...c,
              messages: [...c.messages.filter((m) => !m.isError), assistantMessage],
            };
          }
          return c;
        })
      );
    } catch (err: any) {
      const errorMessage: ChatMessage = {
        id: "msg_err_" + Date.now(),
        role: "assistant",
        content: err.message || "Failed to generate AI response. Please retry.",
        isError: true,
        timestamp: new Date().toISOString(),
      };

      setConversations((prev) =>
        prev.map((c) => {
          if (c.id === activeConvId) {
            return {
              ...c,
              messages: [...c.messages, errorMessage],
            };
          }
          return c;
        })
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegenerateLast = () => {
    if (!activeConversation || activeConversation.messages.length === 0 || isLoading) return;
    const lastUserMsg = [...activeConversation.messages].reverse().find((m) => m.role === "user");
    if (lastUserMsg) {
      sendMessage(lastUserMsg.content, true);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const renderFormattedContent = (content: string) => {
    // Basic Markdown-like rendering (code blocks, bold, headers)
    const codeBlockRegex = /```([a-zA-Z0-9]*)\n([\s\S]*?)```/g;
    const parts = [];
    let lastIndex = 0;
    let match;

    while ((match = codeBlockRegex.exec(content)) !== null) {
      if (match.index > lastIndex) {
        parts.push({
          type: "text",
          content: content.slice(lastIndex, match.index),
        });
      }
      parts.push({
        type: "code",
        language: match[1] || "code",
        code: match[2].trim(),
      });
      lastIndex = match.index + match[0].length;
    }

    if (lastIndex < content.length) {
      parts.push({
        type: "text",
        content: content.slice(lastIndex),
      });
    }

    return (
      <div>
        {parts.map((p, idx) => {
          if (p.type === "code") {
            return (
              <div
                key={idx}
                style={{
                  margin: "12px 0",
                  backgroundColor: "#0d0d0d",
                  borderRadius: "var(--radius-xs)",
                  border: "1px solid var(--border-subtle)",
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: "6px 12px",
                    backgroundColor: "var(--bg-elevated)",
                    borderBottom: "1px solid var(--border-subtle)",
                    fontSize: "0.75rem",
                    color: "var(--text-muted)",
                    fontFamily: "monospace",
                  }}
                >
                  <span>{p.language || "code"}</span>
                  <button
                    type="button"
                    onClick={() => handleCopyMessage(p.code || "", `code_${idx}`)}
                    style={{
                      background: "none",
                      border: "none",
                      color: copiedId === `code_${idx}` ? "var(--accent-primary)" : "var(--text-muted)",
                      cursor: "pointer",
                      fontSize: "0.75rem",
                    }}
                  >
                    {copiedId === `code_${idx}` ? "✓ Copied" : "Copy Code"}
                  </button>
                </div>
                <pre
                  style={{
                    margin: 0,
                    padding: "12px",
                    overflowX: "auto",
                    fontFamily: "ui-monospace, monospace",
                    fontSize: "0.85rem",
                    lineHeight: 1.5,
                    color: "#F5F5F5",
                  }}
                >
                  <code>{p.code}</code>
                </pre>
              </div>
            );
          }

          // Plain text rendering with line breaks and bold
          const lines = p.content?.split("\n") || [];
          return (
            <div key={idx} style={{ lineHeight: 1.6 }}>
              {lines.map((line, li) => {
                // Headers
                if (line.startsWith("### ")) {
                  return (
                    <h3 key={li} style={{ fontSize: "1.1rem", margin: "10px 0 4px", color: "var(--accent-primary)" }}>
                      {line.replace("### ", "")}
                    </h3>
                  );
                }
                if (line.startsWith("## ")) {
                  return (
                    <h2 key={li} style={{ fontSize: "1.25rem", margin: "14px 0 6px", color: "var(--text-primary)" }}>
                      {line.replace("## ", "")}
                    </h2>
                  );
                }
                if (line.startsWith("# ")) {
                  return (
                    <h1 key={li} style={{ fontSize: "1.4rem", margin: "16px 0 8px", color: "var(--text-primary)" }}>
                      {line.replace("# ", "")}
                    </h1>
                  );
                }
                // Bullet points
                if (line.startsWith("- ") || line.startsWith("* ")) {
                  return (
                    <div key={li} style={{ paddingLeft: "16px", textIndent: "-12px", margin: "3px 0" }}>
                      &bull; {line.slice(2)}
                    </div>
                  );
                }
                return (
                  <p key={li} style={{ margin: line.trim() ? "4px 0" : "8px 0" }}>
                    {line}
                  </p>
                );
              })}
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="container-wide" style={{ paddingTop: "20px", paddingBottom: "40px" }}>
      {/* HEADER */}
      <div
        className="card"
        style={{
          padding: "14px 20px",
          marginBottom: "16px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "12px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={() => setShowSidebar(!showSidebar)}
            style={{ display: "inline-flex" }}
          >
            &#9776; History
          </button>
          <div
            style={{
              width: "32px",
              height: "32px",
              borderRadius: "var(--radius-xs)",
              backgroundColor: "var(--accent-primary)",
              color: "#0A0A0A",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontWeight: 900,
            }}
          >
            A
          </div>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <h1 style={{ fontSize: "1.2rem", margin: 0, fontWeight: 700 }}>AuraMind AI</h1>
              <span className="badge badge-yellow" style={{ fontSize: "0.65rem", padding: "1px 6px" }}>
                Gemini 3.8 Flash
              </span>
            </div>
            <div className="text-xs text-muted">
              Intelligent problem-solving, learning, and accountability assistant
            </div>
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
          {/* WEB SEARCH TOGGLE */}
          <button
            type="button"
            onClick={() => setWebSearchEnabled(!webSearchEnabled)}
            className={`btn btn-sm ${webSearchEnabled ? "btn-primary" : "btn-secondary"}`}
            style={{ fontSize: "0.75rem", padding: "5px 10px" }}
            title="Enable Tavily live web research for current data"
          >
            {webSearchEnabled ? "🌐 Web Search: Active" : "🌐 Web Search: Auto"}
          </button>

          {/* LINK GOAL CODE POPUP */}
          {linkedGoalCode ? (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "6px",
                padding: "4px 8px",
                borderRadius: "var(--radius-xs)",
                backgroundColor: "var(--bg-elevated)",
                border: "1px solid var(--accent-border)",
                fontSize: "0.75rem",
              }}
            >
              <span className="font-mono text-yellow">{linkedGoalCode}</span>
              <button
                type="button"
                onClick={() => setLinkedGoalCode("")}
                style={{ background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer", fontSize: "0.8rem" }}
                title="Unlink goal"
              >
                &times;
              </button>
            </div>
          ) : (
            <div style={{ display: "flex", gap: "4px" }}>
              <input
                type="text"
                placeholder="Link Goal Code..."
                value={goalCodeInput}
                onChange={(e) => setGoalCodeInput(e.target.value.toUpperCase())}
                style={{ width: "130px", padding: "4px 8px", fontSize: "0.75rem", minHeight: "30px", fontFamily: "monospace" }}
              />
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                style={{ fontSize: "0.75rem", padding: "4px 8px" }}
                onClick={() => {
                  if (goalCodeInput.trim()) {
                    setLinkedGoalCode(goalCodeInput.trim());
                    setGoalCodeInput("");
                  }
                }}
              >
                Link
              </button>
            </div>
          )}

          <button
            type="button"
            className="btn btn-primary btn-sm"
            onClick={createNewChat}
          >
            + New Chat
          </button>
        </div>
      </div>

      {/* CHAT WORKSPACE LAYOUT */}
      <div style={{ display: "grid", gridTemplateColumns: showSidebar ? "260px 1fr" : "1fr", gap: "20px", alignItems: "start" }}>
        {/* SIDEBAR CONVERSATIONS */}
        {showSidebar && (
          <aside className="workspace-sidebar" style={{ maxHeight: "calc(100vh - 180px)", overflowY: "auto" }}>
            <div className="flex-between" style={{ paddingBottom: "8px", borderBottom: "1px solid var(--border-subtle)", marginBottom: "8px" }}>
              <span className="text-xs text-muted" style={{ fontWeight: 700, textTransform: "uppercase" }}>
                Chats ({conversations.length})
              </span>
              <button
                type="button"
                onClick={clearAllConversations}
                style={{ background: "none", border: "none", color: "var(--error-text)", fontSize: "0.75rem", cursor: "pointer" }}
              >
                Clear All
              </button>
            </div>

            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={createNewChat}
              style={{ width: "100%", justifyContent: "center", marginBottom: "8px" }}
            >
              + Start New Chat
            </button>

            <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
              {conversations.map((c) => {
                const isActive = c.id === activeConvId;
                return (
                  <div
                    key={c.id}
                    onClick={() => setActiveConvId(c.id)}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      padding: "8px 10px",
                      borderRadius: "var(--radius-xs)",
                      backgroundColor: isActive ? "var(--bg-elevated)" : "transparent",
                      border: isActive ? "1px solid var(--accent-border)" : "1px solid transparent",
                      color: isActive ? "var(--accent-primary)" : "var(--text-secondary)",
                      fontSize: "0.85rem",
                      cursor: "pointer",
                      transition: "all var(--transition-fast)",
                    }}
                  >
                    <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", flex: 1 }}>
                      {c.title}
                    </span>
                    <button
                      type="button"
                      onClick={(e) => deleteConversation(c.id, e)}
                      style={{
                        background: "none",
                        border: "none",
                        color: "var(--text-muted)",
                        cursor: "pointer",
                        padding: "0 4px",
                        fontSize: "0.9rem",
                      }}
                      title="Delete chat"
                    >
                      &times;
                    </button>
                  </div>
                );
              })}
            </div>
          </aside>
        )}

        {/* MAIN CHAT STAGE */}
        <main
          className="card"
          style={{
            display: "flex",
            flexDirection: "column",
            height: "calc(100vh - 200px)",
            minHeight: "560px",
            padding: 0,
            overflow: "hidden",
          }}
        >
          {/* MESSAGES SCROLL CONTAINER */}
          <div
            style={{
              flex: 1,
              overflowY: "auto",
              padding: "24px",
              display: "flex",
              flexDirection: "column",
              gap: "18px",
            }}
          >
            {/* WELCOME / EMPTY STATE */}
            {(!activeConversation || activeConversation.messages.length === 0) && (
              <div style={{ margin: "auto", maxWidth: "580px", textAlign: "center", padding: "40px 16px" }}>
                <div
                  style={{
                    width: "48px",
                    height: "48px",
                    borderRadius: "var(--radius-xs)",
                    backgroundColor: "var(--accent-primary)",
                    color: "#0A0A0A",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontWeight: 900,
                    fontSize: "1.5rem",
                    margin: "0 auto 16px",
                  }}
                >
                  A
                </div>
                <h2 style={{ fontSize: "1.5rem", marginBottom: "8px", fontWeight: 700 }}>
                  Hey! I'm AuraMind AI.
                </h2>
                <p className="text-secondary text-sm" style={{ marginBottom: "28px", lineHeight: 1.6 }}>
                  Ask me anything &mdash; whether you're learning something new, solving a complex problem, writing code, or working toward your 30-day mastery goals.
                </p>

                <div className="grid-2" style={{ gap: "10px", textAlign: "left" }}>
                  {STARTER_SUGGESTIONS.map((s, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => sendMessage(s.prompt)}
                      style={{
                        padding: "12px 14px",
                        borderRadius: "var(--radius-xs)",
                        backgroundColor: "var(--bg-secondary)",
                        border: "1px solid var(--border-subtle)",
                        color: "var(--text-primary)",
                        cursor: "pointer",
                        fontSize: "0.85rem",
                        textAlign: "left",
                        transition: "all var(--transition-fast)",
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.borderColor = "var(--accent-primary)";
                        e.currentTarget.style.backgroundColor = "var(--bg-elevated)";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.borderColor = "var(--border-subtle)";
                        e.currentTarget.style.backgroundColor = "var(--bg-secondary)";
                      }}
                    >
                      <strong style={{ display: "block", color: "var(--accent-primary)", marginBottom: "2px", fontSize: "0.8rem" }}>
                        {s.label}
                      </strong>
                      <span className="text-muted text-xs" style={{ display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                        {s.prompt}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* MESSAGE BUBBLES */}
            {activeConversation?.messages.map((msg) => {
              const isUser = msg.role === "user";

              if (isUser) {
                return (
                  <div
                    key={msg.id}
                    style={{
                      alignSelf: "flex-end",
                      maxWidth: "80%",
                      padding: "12px 18px",
                      borderRadius: "var(--radius-sm)",
                      backgroundColor: "var(--accent-primary)",
                      color: "#0A0A0A",
                      fontWeight: 500,
                      fontSize: "0.95rem",
                      lineHeight: 1.5,
                      whiteSpace: "pre-wrap",
                      boxShadow: "0 2px 8px rgba(0,0,0,0.25)",
                    }}
                  >
                    {msg.content}
                  </div>
                );
              }

              // Assistant / AI Message
              if (msg.isError) {
                return (
                  <div
                    key={msg.id}
                    style={{
                      alignSelf: "flex-start",
                      maxWidth: "85%",
                      padding: "14px 18px",
                      borderRadius: "var(--radius-sm)",
                      backgroundColor: "var(--error-bg)",
                      border: "1px solid var(--error-border)",
                      color: "var(--error-text)",
                      fontSize: "0.9rem",
                    }}
                  >
                    <div style={{ fontWeight: 600, marginBottom: "4px" }}>Engine Notice:</div>
                    <p style={{ margin: "0 0 10px" }}>{msg.content}</p>
                    <button
                      type="button"
                      className="btn btn-secondary btn-sm"
                      onClick={() => handleRegenerateLast()}
                    >
                      &#x21bb; Retry Question
                    </button>
                  </div>
                );
              }

              return (
                <div
                  key={msg.id}
                  style={{
                    alignSelf: "flex-start",
                    maxWidth: "88%",
                    padding: "16px 20px",
                    borderRadius: "var(--radius-sm)",
                    backgroundColor: "var(--bg-surface)",
                    border: "1px solid var(--border-subtle)",
                    color: "var(--text-primary)",
                    fontSize: "0.95rem",
                  }}
                >
                  <div className="flex-between" style={{ marginBottom: "10px", borderBottom: "1px solid var(--border-subtle)", paddingBottom: "6px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                      <span className="badge badge-yellow" style={{ fontSize: "0.65rem", padding: "1px 6px" }}>
                        AuraMind
                      </span>
                      {msg.model && (
                        <span className="text-xs font-mono text-muted">{msg.model}</span>
                      )}
                    </div>

                    <div style={{ display: "flex", gap: "8px" }}>
                      <button
                        type="button"
                        onClick={() => handleCopyMessage(msg.content, msg.id)}
                        style={{
                          background: "none",
                          border: "none",
                          color: copiedId === msg.id ? "var(--accent-primary)" : "var(--text-muted)",
                          cursor: "pointer",
                          fontSize: "0.75rem",
                        }}
                      >
                        {copiedId === msg.id ? "✓ Copied" : "Copy"}
                      </button>
                    </div>
                  </div>

                  {renderFormattedContent(msg.content)}

                  {/* CITATIONS */}
                  {msg.sources && msg.sources.length > 0 && (
                    <div
                      style={{
                        marginTop: "14px",
                        paddingTop: "10px",
                        borderTop: "1px solid var(--border-subtle)",
                        fontSize: "0.75rem",
                        color: "var(--text-muted)",
                      }}
                    >
                      <strong style={{ color: "var(--accent-primary)" }}>Verified Web Sources:</strong>
                      <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginTop: "4px" }}>
                        {msg.sources.map((s, si) => (
                          <a
                            key={si}
                            href={s.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{
                              color: "var(--accent-primary)",
                              textDecoration: "underline",
                              fontSize: "0.75rem",
                            }}
                          >
                            [{si + 1}] {s.title || s.url}
                          </a>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}

            {/* LOADING TYPING INDICATOR */}
            {isLoading && (
              <div
                style={{
                  alignSelf: "flex-start",
                  padding: "12px 18px",
                  borderRadius: "var(--radius-sm)",
                  backgroundColor: "var(--bg-surface)",
                  border: "1px solid var(--accent-border)",
                  color: "var(--accent-primary)",
                  fontSize: "0.85rem",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                }}
              >
                <div className="pulse">&#9679;</div>
                <span>AuraMind is synthesizing response with Google Gemini...</span>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* COMPOSER BAR */}
          <div
            style={{
              padding: "16px 20px",
              backgroundColor: "var(--bg-secondary)",
              borderTop: "1px solid var(--border-subtle)",
            }}
          >
            <div style={{ display: "flex", gap: "10px", alignItems: "flex-end" }}>
              <textarea
                ref={textareaRef}
                rows={2}
                placeholder="Ask AuraMind anything... (Shift+Enter for newline, Enter to send)"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyDown={handleKeyDown}
                disabled={isLoading}
                style={{
                  flex: 1,
                  resize: "none",
                  fontFamily: "inherit",
                  fontSize: "0.95rem",
                  padding: "10px 14px",
                  backgroundColor: "var(--bg-surface)",
                  border: "1px solid var(--border-subtle)",
                  borderRadius: "var(--radius-xs)",
                  color: "var(--text-primary)",
                }}
              />

              <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() => sendMessage()}
                  disabled={isLoading || !inputMessage.trim()}
                  style={{ minWidth: "90px", justifyContent: "center" }}
                >
                  {isLoading ? "Thinking..." : "Send \u2192"}
                </button>

                {activeConversation && activeConversation.messages.length > 1 && (
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    onClick={handleRegenerateLast}
                    disabled={isLoading}
                    style={{ fontSize: "0.7rem", padding: "4px 8px" }}
                  >
                    &#x21bb; Regenerate
                  </button>
                )}
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
