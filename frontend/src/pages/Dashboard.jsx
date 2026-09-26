
import { useEffect, useState, useRef } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

import { useAuth } from "../context/AuthContext";

import {
  getConversations,
  createConversation,
  getMessages,
  uploadDocument,
  sendChatMessage,
  getDocuments,
  deleteConversation,
} from "../services/api";

/* ── helpers ──────────────────────────────────────────── */

function fileExt(name) {
  if (!name) return "";
  const dot = name.lastIndexOf(".");
  return dot === -1 ? "" : name.slice(dot + 1).toUpperCase();
}

function formatFileSize(bytes) {
  if (bytes == null) return "—";
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1048576) return (bytes / 1024).toFixed(1) + " KB";
  return (bytes / 1048576).toFixed(1) + " MB";
}

function formatDate(dateStr) {
  if (!dateStr) return "—";
  const d = new Date(dateStr);
  if (isNaN(d)) return "—";
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

function formatTime(dateStr) {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  if (isNaN(d)) return "";
  return d.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
}

function groupByDate(list) {
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterdayStart = new Date(todayStart);
  yesterdayStart.setDate(yesterdayStart.getDate() - 1);
  const weekStart = new Date(todayStart);
  weekStart.setDate(weekStart.getDate() - 7);

  const groups = { Today: [], Yesterday: [], "Previous 7 days": [], Older: [] };

  list.forEach((c) => {
    const d = c.updated_at ? new Date(c.updated_at) : null;
    if (!d || isNaN(d)) {
      groups["Older"].push(c);
    } else if (d >= todayStart) {
      groups["Today"].push(c);
    } else if (d >= yesterdayStart) {
      groups["Yesterday"].push(c);
    } else if (d >= weekStart) {
      groups["Previous 7 days"].push(c);
    } else {
      groups["Older"].push(c);
    }
  });
  return groups;
}

function relativeTime(dateStr) {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  if (isNaN(d)) return "";
  const diff = (Date.now() - d.getTime()) / 1000;
  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

/* small SVG icons used inline */

function DocPageIcon({ size = 16 }) {
  return (
    <svg width={size} height={size * 1.22} viewBox="0 0 16 20" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round">
      <path d="M1.5 3A1.5 1.5 0 013 1.5h6.5L14.5 6v11A1.5 1.5 0 0113 18.5H3A1.5 1.5 0 011.5 17V3z" />
      <path d="M9.5 1.5V6h5" strokeLinecap="round" />
      <line x1="4.5" y1="10.5" x2="11" y2="10.5" strokeWidth="1" opacity=".45" strokeLinecap="round" />
      <line x1="4.5" y1="13.5" x2="9" y2="13.5" strokeWidth="1" opacity=".45" strokeLinecap="round" />
    </svg>
  );
}

/* ══════════════════════════════════════════════════════ */

function Dashboard() {
  const { user, logout } = useAuth();

  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);

  const [messages, setMessages] = useState([]);
  const [documents, setDocuments] = useState([]);

  const [selectedFile, setSelectedFile] = useState(null);
  const [isDragging, setIsDragging] = useState(false);

  const [loading, setLoading] = useState(true);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [sending, setSending] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const [error, setError] = useState("");
  const [uploadMessage, setUploadMessage] = useState("");
  const [question, setQuestion] = useState("");

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [profileOpen, setProfileOpen] = useState(false);
  const [expandedSources, setExpandedSources] = useState({});
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [settingsTab, setSettingsTab] = useState("general");

  const [workspaceName, setWorkspaceName] = useState(
    () => localStorage.getItem("documind_workspace_name") || "DocuMind"
  );
  const [aiPersona, setAiPersona] = useState(
    () => localStorage.getItem("documind_ai_persona") || "balanced"
  );
  const [customInstructions, setCustomInstructions] = useState(
    () => localStorage.getItem("documind_custom_instructions") || ""
  );
  const [topKChunks, setTopKChunks] = useState(
    () => localStorage.getItem("documind_top_k") || "5"
  );
  const [autoExpandSources, setAutoExpandSources] = useState(
    () => localStorage.getItem("documind_auto_sources") === "true"
  );
  const [layoutDensity, setLayoutDensity] = useState(
    () => localStorage.getItem("documind_density") || "comfortable"
  );
  const [chatFontSize, setChatFontSize] = useState(
    () => localStorage.getItem("documind_font_size") || "standard"
  );
  const [showTimestamps, setShowTimestamps] = useState(
    () => localStorage.getItem("documind_show_timestamps") !== "false"
  );
  const [settingsSavedToast, setSettingsSavedToast] = useState(false);

  const fileInputRef = useRef(null);
  const messagesEndRef = useRef(null);
  const profileRef = useRef(null);

  /* ── data fetching ────────────────────────────────── */

  useEffect(() => {
    async function loadConversations() {
      try {
        setError("");
        const data = await getConversations();
        setConversations(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    async function loadDocuments() {
      try {
        const data = await getDocuments();
        setDocuments(data.map((d) => ({ ...d, status: "Ready" })));
      } catch (err) {
        setError(err.message);
      }
    }

    loadConversations();
    loadDocuments();
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    function handleOutside(e) {
      if (profileRef.current && !profileRef.current.contains(e.target)) {
        setProfileOpen(false);
      }
    }
    document.addEventListener("mousedown", handleOutside);
    return () => document.removeEventListener("mousedown", handleOutside);
  }, []);

  /* ── handlers ─────────────────────────────────────── */

  async function handleNewChat() {
    try {
      setError("");
      setUploadMessage("");
      setSelectedFile(null);
      setMessages([]);
      setQuestion("");
      setSidebarOpen(false);

      const data = await createConversation("New Chat");
      setConversations((prev) => [data, ...prev]);
      setSelectedConversation(data);
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleSelectConversation(conversation) {
    try {
      setError("");
      setUploadMessage("");
      setSelectedFile(null);
      setQuestion("");
      setSelectedConversation(conversation);
      setSidebarOpen(false);
      setMessagesLoading(true);

      const data = await getMessages(conversation.conversation_id);
      setMessages(data);
    } catch (err) {
      setError(err.message);
      setMessages([]);
    } finally {
      setMessagesLoading(false);
    }
  }

  async function handleDeleteConversation(conversationId) {
    if (!window.confirm("Delete this conversation?")) return;

    try {
      setError("");
      setDeleting(true);

      await deleteConversation(conversationId);

      setConversations((prev) =>
        prev.filter((c) => c.conversation_id !== conversationId)
      );
      setDocuments((prev) =>
        prev.filter((d) => d.conversation_id !== conversationId)
      );

      if (selectedConversation?.conversation_id === conversationId) {
        setSelectedConversation(null);
        setMessages([]);
        setQuestion("");
        setSelectedFile(null);
        setUploadMessage("");
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setDeleting(false);
    }
  }

  function handleFileChange(event) {
    const file = event.target.files[0];
    if (!file) return;
    setSelectedFile(file);
    setUploadMessage("");
    setError("");
  }

  function handleDragOver(event) {
    event.preventDefault();
    setIsDragging(true);
  }

  function handleDragLeave() {
    setIsDragging(false);
  }

  function handleDrop(event) {
    event.preventDefault();
    setIsDragging(false);
    if (event.dataTransfer.files && event.dataTransfer.files[0]) {
      setSelectedFile(event.dataTransfer.files[0]);
      setUploadMessage("");
      setError("");
    }
  }

  async function handleUpload() {
    if (!selectedFile) {
      setError("Please select a document first.");
      return;
    }

    let conversation = selectedConversation;

    /* auto-create conversation when uploading from the documents page */
    if (!conversation) {
      try {
        conversation = await createConversation("New Chat");
        setConversations((prev) => [conversation, ...prev]);
        setSelectedConversation(conversation);
      } catch (err) {
        setError(err.message);
        return;
      }
    }

    try {
      setError("");
      setUploadMessage("");
      setUploading(true);

      const fileSize = selectedFile.size;
      const data = await uploadDocument(
        conversation.conversation_id,
        selectedFile
      );

      setDocuments((prev) => [
        ...prev,
        {
          document_id: data.document_id,
          document_name: data.filename,
          conversation_id: conversation.conversation_id,
          uploaded_at: new Date().toISOString(),
          file_size: fileSize,
          status: "Ready",
        },
      ]);

      setUploadMessage(`${data.filename} uploaded.`);

      /* rename conversation if still "New Chat" */
      if (conversation.title === "New Chat") {
        const baseName = data.filename.replace(/\.[^/.]+$/, "");
        const updated = { ...conversation, title: baseName };
        setSelectedConversation(updated);
        setConversations((prev) =>
          prev.map((c) =>
            c.conversation_id === conversation.conversation_id ? updated : c
          )
        );
      }

      setSelectedFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
    } catch (err) {
      setError(err.message);
    } finally {
      setUploading(false);
    }
  }

  async function handleSendMessage() {
    if (!selectedConversation) {
      setError("Please select or create a conversation first.");
      return;
    }

    const conversationDocuments = documents.filter(
      (d) => d.conversation_id === selectedConversation.conversation_id
    );

    if (conversationDocuments.length === 0) {
      setError("Please upload at least one document first.");
      return;
    }

    if (!question.trim()) {
      setError("Please enter a question.");
      return;
    }

    try {
      setError("");
      setSending(true);

      const chatResult = await sendChatMessage(
        question,
        selectedConversation.conversation_id
      );

      if (chatResult.conversation_title) {
        const updatedConversation = {
          ...selectedConversation,
          title: chatResult.conversation_title,
        };
        setSelectedConversation(updatedConversation);
        setConversations((prev) =>
          prev.map((c) =>
            c.conversation_id === selectedConversation.conversation_id
              ? updatedConversation
              : c
          )
        );
      }

      const data = await getMessages(
        selectedConversation.conversation_id
      );
      setMessages(data);
      setQuestion("");
    } catch (err) {
      setError(err.message);
    } finally {
      setSending(false);
    }
  }

  function handleQuestionKeyDown(event) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      if (!sending) handleSendMessage();
    }
  }

  function toggleSources(id) {
    setExpandedSources((prev) => ({ ...prev, [id]: !prev[id] }));
  }

  function handleSaveSettings(e) {
    if (e) e.preventDefault();
    localStorage.setItem("documind_workspace_name", workspaceName);
    localStorage.setItem("documind_ai_persona", aiPersona);
    localStorage.setItem("documind_custom_instructions", customInstructions);
    localStorage.setItem("documind_top_k", topKChunks);
    localStorage.setItem("documind_auto_sources", autoExpandSources.toString());
    localStorage.setItem("documind_density", layoutDensity);
    localStorage.setItem("documind_font_size", chatFontSize);
    localStorage.setItem("documind_show_timestamps", showTimestamps.toString());
    setSettingsSavedToast(true);
    setTimeout(() => setSettingsSavedToast(false), 2500);
  }

  function handleResetSettings() {
    setWorkspaceName("DocuMind");
    setAiPersona("balanced");
    setCustomInstructions("");
    setTopKChunks("5");
    setAutoExpandSources(false);
    setLayoutDensity("comfortable");
    setChatFontSize("standard");
    setShowTimestamps(true);
    localStorage.removeItem("documind_workspace_name");
    localStorage.removeItem("documind_ai_persona");
    localStorage.removeItem("documind_custom_instructions");
    localStorage.removeItem("documind_top_k");
    localStorage.removeItem("documind_auto_sources");
    localStorage.removeItem("documind_density");
    localStorage.removeItem("documind_font_size");
    localStorage.removeItem("documind_show_timestamps");
    setSettingsSavedToast(true);
    setTimeout(() => setSettingsSavedToast(false), 2500);
  }

  function handleExportAllData() {
    const exportData = {
      workspace: workspaceName,
      exported_at: new Date().toISOString(),
      user: {
        username: user?.username,
        email: user?.email,
      },
      stats: {
        total_conversations: conversations.length,
        total_documents: documents.length,
      },
      settings: {
        ai_persona: aiPersona,
        top_k: topKChunks,
        custom_instructions: customInstructions,
      },
      conversations: conversations,
      documents: documents,
    };
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    const safeName = (workspaceName || "documind").toLowerCase().replace(/[^a-z0-9]/gi, "-");
    a.download = `${safeName}-backup-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  function handleExportCurrentChat() {
    if (!selectedConversation) return;
    let md = `# ${selectedConversation.title}\n\n`;
    md += `**Workspace:** ${workspaceName}  \n`;
    md += `**Date:** ${new Date().toLocaleString()}  \n`;
    const docNames = selectedConversationDocuments.map((d) => d.document_name).join(", ");
    md += `**Attached Documents:** ${docNames || "None"}\n\n`;
    md += `---\n\n`;
    if (messages.length === 0) {
      md += `*No messages in this conversation yet.*\n`;
    } else {
      messages.forEach((m) => {
        const sender = m.role === "user" ? user?.username || "You" : "DocuMind";
        const time = m.created_at ? new Date(m.created_at).toLocaleTimeString() : "";
        md += `### ${sender} ${time ? `· ${time}` : ""}\n\n${m.content}\n\n`;
        if (m.sources && m.sources.length > 0) {
          md += `**Sources cited:**\n`;
          m.sources.forEach((s, idx) => {
            md += `${idx + 1}. ${s.document_name}\n`;
          });
          md += `\n`;
        }
        md += `---\n\n`;
      });
    }
    const blob = new Blob([md], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    const safeTitle = selectedConversation.title.toLowerCase().replace(/[^a-z0-9]/gi, "-");
    a.download = `${safeTitle || "conversation"}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  /* ── derived data ────────────────────────────────── */

  const selectedConversationDocuments = selectedConversation
    ? documents.filter(
        (d) => d.conversation_id === selectedConversation.conversation_id
      )
    : [];

  const userInitial = user?.username
    ? user.username.charAt(0).toUpperCase()
    : "U";

  const filteredConversations = searchQuery.trim()
    ? conversations.filter((c) =>
        c.title.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : conversations;

  const grouped = groupByDate(filteredConversations);

  /* ═══════════════════════════════════════════════════ */
  /*                       RENDER                       */
  /* ═══════════════════════════════════════════════════ */

  return (
    <div className={`app-shell density-${layoutDensity} font-size-${chatFontSize}`}>
      {sidebarOpen && (
        <div className="mobile-overlay" onClick={() => setSidebarOpen(false)} />
      )}

      {/* ═══════════ SIDEBAR ═══════════ */}

      <aside className={`app-sidebar ${sidebarOpen ? "sidebar-open" : ""}`}>
        <div className="sidebar-brand">
          <span className="brand-wordmark">{workspaceName || "DocuMind"}</span>
          <button
            className="mobile-close-button"
            onClick={() => setSidebarOpen(false)}
            aria-label="Close sidebar"
          >
            ×
          </button>
        </div>

        <div className="sidebar-search">
          <svg className="search-icon" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
            <circle cx="7" cy="7" r="4.5" />
            <line x1="10.2" y1="10.2" x2="14" y2="14" />
          </svg>
          <input
            type="text"
            placeholder="Search conversations…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <button className="new-chat-button" onClick={handleNewChat}>
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
            <line x1="7" y1="2" x2="7" y2="12" />
            <line x1="2" y1="7" x2="12" y2="7" />
          </svg>
          New conversation
        </button>

        <div className="conversation-list">
          {loading && (
            <div className="sidebar-loading">
              <span className="loading-dot" />
              Loading…
            </div>
          )}

          {!loading && conversations.length === 0 && (
            <div className="sidebar-empty">
              <p>No conversations yet</p>
              <span>Create one to get started.</span>
            </div>
          )}

          {!loading &&
            Object.entries(grouped).map(
              ([label, items]) =>
                items.length > 0 && (
                  <div key={label} className="conv-group">
                    <div className="conv-group-label">{label}</div>
                    {items.map((conversation) => {
                      const isActive =
                        selectedConversation?.conversation_id ===
                        conversation.conversation_id;
                      const convDoc = documents.find(
                        (d) => d.conversation_id === conversation.conversation_id
                      );
                      return (
                        <div
                          key={conversation.conversation_id}
                          className={`conversation-item ${isActive ? "active" : ""}`}
                        >
                          <button
                            className="conversation-content"
                            onClick={() => handleSelectConversation(conversation)}
                          >
                            <div className="conv-text">
                              <span className="conversation-title">
                                {conversation.title}
                              </span>
                              <span className="conv-meta">
                                {relativeTime(conversation.updated_at)}
                                {convDoc && (
                                   <span className="conv-file-badge">
                                    {fileExt(convDoc.document_name)}
                                  </span>
                                )}
                              </span>
                            </div>
                          </button>
                          <button
                            className="delete-chat-button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteConversation(conversation.conversation_id);
                            }}
                            disabled={deleting}
                            title="Delete"
                            aria-label="Delete conversation"
                          >
                            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                              <line x1="2.5" y1="4" x2="11.5" y2="4" />
                              <path d="M5 4V2.5h4V4" />
                              <path d="M3.5 4l.7 7.5a1 1 0 001 .9h3.6a1 1 0 001-.9L10.5 4" />
                            </svg>
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )
            )}
        </div>

        <div className="sidebar-footer">
          <button
            className="sidebar-user-button"
            onClick={() => { setSidebarOpen(false); setSettingsOpen(true); }}
            title="Open Workspace Settings"
          >
            <div className="user-avatar">{userInitial}</div>
            <div className="sidebar-user-info">
              <strong>{user?.username}</strong>
              <span>{workspaceName || "Personal workspace"}</span>
            </div>
            <svg className="settings-gear-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="3" />
              <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z" />
            </svg>
          </button>
          <button className="logout-button" onClick={logout} title="Sign out">
            Sign out
          </button>
        </div>
      </aside>

      {/* ═══════════ MAIN ═══════════ */}

      <main className="workspace">
        <header className="workspace-header">
          <div className="workspace-header-left">
            <button
              className="mobile-menu-button"
              onClick={() => setSidebarOpen(true)}
              aria-label="Open sidebar"
            >
              <span /><span /><span />
            </button>

            <nav className="header-breadcrumb">
              <span
                className="breadcrumb-root"
                onClick={() => setSelectedConversation(null)}
                style={{ cursor: "pointer" }}
                title="View documents"
              >
                {workspaceName || "DocuMind"}
              </span>
              {selectedConversation && (
                <>
                  <span className="breadcrumb-sep">/</span>
                  <span className="breadcrumb-current">
                    {selectedConversation.title}
                  </span>
                </>
              )}
            </nav>

            {selectedConversation && (
              <span className="header-status-badge">
                <span className="status-dot" />
                Active
              </span>
            )}
          </div>

          <div className="workspace-header-right" ref={profileRef}>
            <button
              className="header-profile-trigger"
              onClick={() => setProfileOpen((p) => !p)}
              aria-label="Profile menu"
            >
              <span className="header-user-avatar">{userInitial}</span>
              <span className="header-user-name">{user?.username}</span>
              <svg width="10" height="6" viewBox="0 0 10 6" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="1,1 5,5 9,1" />
              </svg>
            </button>

            {profileOpen && (
              <div className="profile-dropdown">
                <div className="profile-dropdown-header">
                  <div className="user-avatar">{userInitial}</div>
                  <div>
                    <strong>{user?.username}</strong>
                    <span>{user?.email || ""}</span>
                  </div>
                </div>
                <div className="profile-dropdown-divider" />
                <button className="profile-dropdown-item" onClick={() => { setProfileOpen(false); setSettingsOpen(true); }}>
                  Workspace settings
                </button>
                <button
                  className="profile-dropdown-item profile-dropdown-danger"
                  onClick={() => { setProfileOpen(false); logout(); }}
                >
                  Sign out
                </button>
              </div>
            )}
          </div>
        </header>

        {!selectedConversation ? (
          /* ═══════════ DOCUMENTS PAGE (empty state) ═══════════ */

          <section className="empty-workspace">
            <div className="empty-workspace-inner">
              {error && (
                <div className="error-message">
                  <span>{error}</span>
                  <button onClick={() => setError("")} aria-label="Dismiss">×</button>
                </div>
              )}

              <h2 className="empty-heading">Documents</h2>
              <p className="empty-subtext">
                Upload documents to create a knowledge base you can query with natural language.
              </p>

              {/* upload dropzone */}
              <div
                className={`docs-dropzone ${isDragging ? "dragging" : ""}`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  id="docs-file-input"
                  accept=".pdf,.docx,.txt,.md,.csv,.json,.xlsx,.pptx"
                  onChange={handleFileChange}
                />

                {!selectedFile ? (
                  <div className="dropzone-inner">
                    <DocPageIcon size={22} />
                    <p>Drag and drop a file here, or <label htmlFor="docs-file-input" className="dropzone-browse">browse</label></p>
                    <span className="dropzone-hint">PDF, DOCX, TXT, MD, CSV, JSON, XLSX, PPTX</span>
                  </div>
                ) : (
                  <div className="dropzone-staged">
                    <span className="staged-file-name" title={selectedFile.name}>
                      {selectedFile.name}
                    </span>
                    <span className="staged-file-size">{formatFileSize(selectedFile.size)}</span>
                    <button className="upload-file-button" onClick={handleUpload} disabled={uploading}>
                      {uploading ? "Uploading…" : "Upload"}
                    </button>
                    <button
                      className="cancel-file-button"
                      onClick={() => { setSelectedFile(null); if (fileInputRef.current) fileInputRef.current.value = ""; }}
                      disabled={uploading}
                    >
                      ×
                    </button>
                  </div>
                )}
              </div>

              {uploadMessage && (
                <div className="upload-success">
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3,7 6,10 11,4" /></svg>
                  {uploadMessage}
                </div>
              )}

              {/* documents table */}
              {documents.length > 0 && (
                <div className="doc-table-wrap">
                  <table className="doc-table">
                    <thead>
                      <tr>
                        <th>Name</th>
                        <th>Type</th>
                        <th>Date</th>
                        <th>Size</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {documents.map((doc) => {
                        const ext = fileExt(doc.document_name);
                        const conv = conversations.find(
                          (c) => c.conversation_id === doc.conversation_id
                        );
                        return (
                          <tr
                            key={doc.document_id}
                            className="doc-table-row-clickable"
                            onClick={() => {
                              if (conv) handleSelectConversation(conv);
                            }}
                          >
                            <td className="doc-table-name">
                              <span className="file-icon">{ext || "—"}</span>
                              {doc.document_name}
                            </td>
                            <td className="doc-table-type">{ext || "—"}</td>
                            <td className="doc-table-date">{formatDate(doc.uploaded_at || conv?.created_at)}</td>
                            <td className="doc-table-size">{formatFileSize(doc.file_size)}</td>
                            <td>
                              <span className={`status-pill status-${(doc.status || "ready").toLowerCase()}`}>
                                {doc.status || "Ready"}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}

              {documents.length === 0 && !selectedFile && (
                <div className="empty-docs-placeholder">
                  <p>No documents uploaded yet.</p>
                </div>
              )}
            </div>
          </section>
        ) : (
          /* ═══════════ CHAT WORKSPACE ═══════════ */

          <section className="chat-workspace">
            {error && (
              <div className="error-message">
                <span>{error}</span>
                <button onClick={() => setError("")} aria-label="Dismiss">×</button>
              </div>
            )}

            <div className="messages-container">
              {messagesLoading && (
                <div className="chat-loading">
                  <div className="typing-indicator">
                    <span /><span /><span />
                  </div>
                </div>
              )}

              {!messagesLoading && messages.length === 0 && (
                <div className="empty-chat-state">
                  <DocPageIcon size={28} />
                  <p className="empty-chat-heading">Start a conversation</p>
                  <p className="empty-chat-sub">
                    Upload a document below, then ask a question about its contents.
                  </p>
                  <div className="suggestion-grid">
                    <button onClick={() => setQuestion("What is this document about?")}>
                      What is this document about?
                    </button>
                    <button onClick={() => setQuestion("Summarize the key points")}>
                      Summarize the key points
                    </button>
                    <button onClick={() => setQuestion("What are the most important topics?")}>
                      Find important topics
                    </button>
                  </div>
                </div>
              )}

              {!messagesLoading &&
                messages.map((message) => {
                  const isUser = message.role === "user";
                  const uniqueSources = message.sources
                    ? Array.from(
                        new Map(
                          message.sources.map((s) => [s.document_id, s])
                        ).values()
                      )
                    : [];
                  const sourcesOpen =
                    expandedSources[message.message_id] !== undefined
                      ? expandedSources[message.message_id]
                      : autoExpandSources;

                  return (
                    <div
                      key={message.message_id}
                      className={`message-row ${isUser ? "message-row-user" : "message-row-assistant"}`}
                    >
                      {!isUser && (
                        <div className="assistant-avatar">D</div>
                      )}

                      <div className={`message-card ${isUser ? "message-card-user" : "message-card-assistant"}`}>
                        <div className="message-header">
                          <span className="message-meta">
                            {isUser ? "You" : "DocuMind"}
                          </span>
                          {showTimestamps && (
                            <span className="message-time">
                              {formatTime(message.created_at)}
                            </span>
                          )}
                        </div>

                        {isUser ? (
                          <p className="message-content">{message.content}</p>
                        ) : (
                          <div className="message-content markdown-body">
                            <ReactMarkdown remarkPlugins={[remarkGfm]}>
                              {message.content}
                            </ReactMarkdown>
                          </div>
                        )}

                        {!isUser && uniqueSources.length > 0 && (
                          <div className="message-sources">
                            <button
                              className="sources-toggle"
                              onClick={() => toggleSources(message.message_id)}
                            >
                              <span>
                                {uniqueSources.length} source{uniqueSources.length !== 1 ? "s" : ""}
                              </span>
                              <svg
                                className={`sources-chevron ${sourcesOpen ? "open" : ""}`}
                                width="12" height="7" viewBox="0 0 12 7" fill="none"
                                stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"
                              >
                                <polyline points="1,1 6,6 11,1" />
                              </svg>
                            </button>

                            {sourcesOpen && (
                              <div className="sources-list">
                                {uniqueSources.map((source, index) => (
                                  <div key={source.document_id} className="source-item">
                                    <span className="source-number">{index + 1}</span>
                                    <span className="source-name">{source.document_name}</span>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        )}
                      </div>

                      {isUser && (
                        <div className="user-message-avatar">{userInitial}</div>
                      )}
                    </div>
                  );
                })}

              <div ref={messagesEndRef} />
            </div>

            {/* knowledge bar */}
            <div className="knowledge-bar">
              <div className="knowledge-left">
                <span className="knowledge-label">Documents</span>
                <span className="knowledge-count">
                  {selectedConversationDocuments.length}
                </span>
              </div>

              <div className="knowledge-documents">
                {selectedConversationDocuments.map((doc) => (
                  <div key={doc.document_id} className="document-pill" title={doc.document_name}>
                    <span className="document-pill-ext">{fileExt(doc.document_name)}</span>
                    <span>{doc.document_name}</span>
                  </div>
                ))}
                {selectedConversationDocuments.length === 0 && (
                  <span className="no-documents">No documents attached</span>
                )}
              </div>

              <div
                className={`document-upload-zone ${isDragging ? "dragging" : ""}`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  id="document-file-input"
                  accept=".pdf,.docx,.txt,.md,.csv,.json,.xlsx,.pptx"
                  onChange={handleFileChange}
                />

                {!selectedFile ? (
                  <label htmlFor="document-file-input" className="attach-button">
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
                      <line x1="7" y1="2" x2="7" y2="12" /><line x1="2" y1="7" x2="12" y2="7" />
                    </svg>
                    Attach
                  </label>
                ) : (
                  <div className="staged-file">
                    <span className="staged-file-name" title={selectedFile.name}>{selectedFile.name}</span>
                    <button className="upload-file-button" onClick={handleUpload} disabled={uploading}>
                      {uploading ? "Uploading…" : "Upload"}
                    </button>
                    <button
                      className="cancel-file-button"
                      onClick={() => { setSelectedFile(null); if (fileInputRef.current) fileInputRef.current.value = ""; }}
                      disabled={uploading}
                      aria-label="Cancel"
                    >
                      ×
                    </button>
                  </div>
                )}
              </div>
            </div>

            {uploadMessage && (
              <div className="upload-success">
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3,7 6,10 11,4" /></svg>
                {uploadMessage}
              </div>
            )}

            {/* input */}
            <div className="chat-input-wrapper">
              <div className="chat-input-container">
                <textarea
                  className="chat-input"
                  placeholder={
                    selectedConversationDocuments.length > 0
                      ? "Ask something about your documents…"
                      : "Attach a document to start asking questions…"
                  }
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  onKeyDown={handleQuestionKeyDown}
                  disabled={sending}
                  rows={1}
                />
                <div className="chat-input-footer">
                  <span className="input-hint">Enter to send · Shift+Enter for new line</span>
                  <button
                    className="send-button"
                    onClick={handleSendMessage}
                    disabled={
                      sending ||
                      selectedConversationDocuments.length === 0 ||
                      !question.trim()
                    }
                  >
                    {sending ? (
                      <><span className="send-spinner" /> Thinking</>
                    ) : (
                      "Send"
                    )}
                  </button>
                </div>
              </div>
            </div>
          </section>
        )}
      </main>
      {/* ═══════════ SETTINGS MODAL ═══════════ */}

      {settingsOpen && (
        <div className="settings-overlay" onClick={() => setSettingsOpen(false)}>
          <div className="settings-modal" onClick={(e) => e.stopPropagation()}>
            <div className="settings-header">
              <h2>Workspace settings</h2>
              <button className="settings-close" onClick={() => setSettingsOpen(false)} aria-label="Close">×</button>
            </div>

            {/* Tab navigation */}
            <div className="settings-tabs">
              <button
                className={`settings-tab-btn ${settingsTab === "general" ? "active" : ""}`}
                onClick={() => setSettingsTab("general")}
              >
                General
              </button>
              <button
                className={`settings-tab-btn ${settingsTab === "retrieval" ? "active" : ""}`}
                onClick={() => setSettingsTab("retrieval")}
              >
                Retrieval (RAG)
              </button>
              <button
                className={`settings-tab-btn ${settingsTab === "appearance" ? "active" : ""}`}
                onClick={() => setSettingsTab("appearance")}
              >
                Appearance
              </button>
              <button
                className={`settings-tab-btn ${settingsTab === "data" ? "active" : ""}`}
                onClick={() => setSettingsTab("data")}
              >
                Data & Export
              </button>
              <button
                className={`settings-tab-btn ${settingsTab === "account" ? "active" : ""}`}
                onClick={() => setSettingsTab("account")}
              >
                Account
              </button>
            </div>

            <div className="settings-body">
              {/* ── GENERAL TAB ── */}
              {settingsTab === "general" && (
                <form onSubmit={handleSaveSettings}>
                  <div className="settings-section">
                    <h3 className="settings-section-label">Workspace Details</h3>
                    <div className="settings-field">
                      <label htmlFor="ws-name">Workspace Name</label>
                      <input
                        id="ws-name"
                        type="text"
                        className="settings-input"
                        value={workspaceName}
                        onChange={(e) => setWorkspaceName(e.target.value)}
                        placeholder="e.g. Acme Research Lab"
                      />
                      <span className="settings-hint">Displayed in the header and conversation exports.</span>
                    </div>
                  </div>

                  <div className="settings-section">
                    <h3 className="settings-section-label">AI Response Persona</h3>
                    <div className="settings-option-grid">
                      <div
                        className={`settings-option-card ${aiPersona === "balanced" ? "active" : ""}`}
                        onClick={() => setAiPersona("balanced")}
                      >
                        <strong>Balanced</strong>
                        <span>Concise, grounded answers with citations.</span>
                      </div>
                      <div
                        className={`settings-option-card ${aiPersona === "concise" ? "active" : ""}`}
                        onClick={() => setAiPersona("concise")}
                      >
                        <strong>Executive</strong>
                        <span>Fast, bulleted takeaways and summary points.</span>
                      </div>
                      <div
                        className={`settings-option-card ${aiPersona === "detailed" ? "active" : ""}`}
                        onClick={() => setAiPersona("detailed")}
                      >
                        <strong>Analytical</strong>
                        <span>Thorough explanations with in-depth context.</span>
                      </div>
                    </div>
                  </div>

                  <div className="settings-section">
                    <h3 className="settings-section-label">Custom System Instructions</h3>
                    <div className="settings-field">
                      <textarea
                        className="settings-textarea"
                        value={customInstructions}
                        onChange={(e) => setCustomInstructions(e.target.value)}
                        placeholder="e.g. Always format responses in clear bullet points, cite specific document names, and highlight key quantitative data."
                      />
                      <span className="settings-hint">Custom guidelines to steer document question answering.</span>
                    </div>
                  </div>

                  <div className="settings-footer-actions">
                    <button type="button" className="settings-secondary-btn" onClick={handleResetSettings}>
                      Reset defaults
                    </button>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      {settingsSavedToast && (
                        <span className="settings-toast">
                          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3,7 6,10 11,4" /></svg>
                          Saved!
                        </span>
                      )}
                      <button type="submit" className="settings-primary-btn">
                        Save changes
                      </button>
                    </div>
                  </div>
                </form>
              )}

              {/* ── RETRIEVAL (RAG) TAB ── */}
              {settingsTab === "retrieval" && (
                <div>
                  <div className="settings-section">
                    <h3 className="settings-section-label">Retrieval Depth (Top-K Chunks)</h3>
                    <div className="settings-option-grid">
                      <div
                        className={`settings-option-card ${topKChunks === "3" ? "active" : ""}`}
                        onClick={() => { setTopKChunks("3"); localStorage.setItem("documind_top_k", "3"); }}
                      >
                        <strong>3 Chunks</strong>
                        <span>Fastest retrieval for simple factual queries.</span>
                      </div>
                      <div
                        className={`settings-option-card ${topKChunks === "5" ? "active" : ""}`}
                        onClick={() => { setTopKChunks("5"); localStorage.setItem("documind_top_k", "5"); }}
                      >
                        <strong>5 Chunks</strong>
                        <span>Recommended balance of speed and context.</span>
                      </div>
                      <div
                        className={`settings-option-card ${topKChunks === "8" ? "active" : ""}`}
                        onClick={() => { setTopKChunks("8"); localStorage.setItem("documind_top_k", "8"); }}
                      >
                        <strong>8 Chunks</strong>
                        <span>Maximum context coverage for complex docs.</span>
                      </div>
                    </div>
                  </div>

                  <div className="settings-section">
                    <h3 className="settings-section-label">Source Citation Behavior</h3>
                    <div className="settings-toggle-row">
                      <div className="settings-toggle-info">
                        <strong>Auto-expand sources</strong>
                        <span>Always display cited document references under assistant answers</span>
                      </div>
                      <label className="settings-switch">
                        <input
                          type="checkbox"
                          checked={autoExpandSources}
                          onChange={(e) => {
                            setAutoExpandSources(e.target.checked);
                            localStorage.setItem("documind_auto_sources", e.target.checked.toString());
                          }}
                        />
                        <span className="settings-switch-slider" />
                      </label>
                    </div>
                  </div>

                  <div className="settings-section">
                    <h3 className="settings-section-label">Knowledge Pipeline Details</h3>
                    <div className="settings-info-card">
                      <div className="settings-info-card-header">
                        <strong>Vector Indexing</strong>
                        <span className="format-tag">Cosine Sim</span>
                      </div>
                      <p>Embeddings are indexed locally with chunk overlap for high-fidelity document retrieval.</p>
                    </div>
                    <div className="settings-info-card">
                      <div className="settings-info-card-header">
                        <strong>Supported Document Types</strong>
                        <span className="stat-label">Max 25 MB</span>
                      </div>
                      <div className="settings-formats" style={{ marginTop: 6 }}>
                        {["PDF", "DOCX", "TXT", "MD", "CSV", "JSON", "XLSX", "PPTX"].map((f) => (
                          <span key={f} className="format-tag">{f}</span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* ── APPEARANCE TAB ── */}
              {settingsTab === "appearance" && (
                <div>
                  <div className="settings-section">
                    <h3 className="settings-section-label">Layout Density</h3>
                    <div className="settings-option-grid">
                      <div
                        className={`settings-option-card ${layoutDensity === "comfortable" ? "active" : ""}`}
                        onClick={() => {
                          setLayoutDensity("comfortable");
                          localStorage.setItem("documind_density", "comfortable");
                        }}
                      >
                        <strong>Comfortable</strong>
                        <span>Spacious layout optimized for reading.</span>
                      </div>
                      <div
                        className={`settings-option-card ${layoutDensity === "compact" ? "active" : ""}`}
                        onClick={() => {
                          setLayoutDensity("compact");
                          localStorage.setItem("documind_density", "compact");
                        }}
                      >
                        <strong>Compact</strong>
                        <span>Higher information density with reduced padding.</span>
                      </div>
                    </div>
                  </div>

                  <div className="settings-section">
                    <h3 className="settings-section-label">Chat Typography Size</h3>
                    <div className="settings-option-grid">
                      <div
                        className={`settings-option-card ${chatFontSize === "small" ? "active" : ""}`}
                        onClick={() => {
                          setChatFontSize("small");
                          localStorage.setItem("documind_font_size", "small");
                        }}
                      >
                        <strong>Small (12.5px)</strong>
                        <span>Denser reading experience.</span>
                      </div>
                      <div
                        className={`settings-option-card ${chatFontSize === "standard" ? "active" : ""}`}
                        onClick={() => {
                          setChatFontSize("standard");
                          localStorage.setItem("documind_font_size", "standard");
                        }}
                      >
                        <strong>Standard (13.5px)</strong>
                        <span>Default typography hierarchy.</span>
                      </div>
                      <div
                        className={`settings-option-card ${chatFontSize === "large" ? "active" : ""}`}
                        onClick={() => {
                          setChatFontSize("large");
                          localStorage.setItem("documind_font_size", "large");
                        }}
                      >
                        <strong>Large (15px)</strong>
                        <span>Enhanced legibility and line height.</span>
                      </div>
                    </div>
                  </div>

                  <div className="settings-section">
                    <h3 className="settings-section-label">Interface Options</h3>
                    <div className="settings-toggle-row">
                      <div className="settings-toggle-info">
                        <strong>Show Message Timestamps</strong>
                        <span>Display time sent on individual chat messages</span>
                      </div>
                      <label className="settings-switch">
                        <input
                          type="checkbox"
                          checked={showTimestamps}
                          onChange={(e) => {
                            setShowTimestamps(e.target.checked);
                            localStorage.setItem("documind_show_timestamps", e.target.checked.toString());
                          }}
                        />
                        <span className="settings-switch-slider" />
                      </label>
                    </div>
                  </div>
                </div>
              )}

              {/* ── DATA & EXPORT TAB ── */}
              {settingsTab === "data" && (
                <div>
                  <div className="settings-section">
                    <h3 className="settings-section-label">Export & Backups</h3>
                    <div className="settings-action-row">
                      <div className="settings-action-text">
                        <strong>Export Entire Workspace</strong>
                        <span>Download all conversations and documents metadata as JSON</span>
                      </div>
                      <button className="settings-secondary-btn" onClick={handleExportAllData}>
                        Download JSON
                      </button>
                    </div>
                    {selectedConversation && (
                      <div className="settings-action-row">
                        <div className="settings-action-text">
                          <strong>Export Active Conversation</strong>
                          <span>Download &quot;{selectedConversation.title}&quot; as Markdown (.md)</span>
                        </div>
                        <button className="settings-secondary-btn" onClick={handleExportCurrentChat}>
                          Download .md
                        </button>
                      </div>
                    )}
                  </div>

                  <div className="settings-section">
                    <h3 className="settings-section-label">Storage Overview</h3>
                    <div className="settings-stats">
                      <div className="settings-stat">
                        <span className="stat-value">{conversations.length}</span>
                        <span className="stat-label">Conversations</span>
                      </div>
                      <div className="settings-stat">
                        <span className="stat-value">{documents.length}</span>
                        <span className="stat-label">Indexed Documents</span>
                      </div>
                    </div>
                  </div>

                  <div className="settings-section">
                    <h3 className="settings-section-label">Danger Zone</h3>
                    <div className="settings-danger-card">
                      <div>
                        <strong>Delete all conversations & documents</strong>
                        <p>Permanently remove all conversations, indexed chunks, and message histories.</p>
                      </div>
                      <button
                        className="danger-action-button"
                        disabled={conversations.length === 0 || deleting}
                        onClick={async () => {
                          if (!window.confirm("Are you sure you want to delete ALL conversations and documents? This cannot be undone.")) return;
                          try {
                            setDeleting(true);
                            for (const conv of conversations) {
                              await deleteConversation(conv.conversation_id);
                            }
                            setConversations([]);
                            setDocuments([]);
                            setSelectedConversation(null);
                            setMessages([]);
                            setQuestion("");
                            setSelectedFile(null);
                            setUploadMessage("");
                          } catch (err) {
                            setError(err.message);
                          } finally {
                            setDeleting(false);
                          }
                        }}
                      >
                        {deleting ? "Deleting…" : "Delete all"}
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* ── ACCOUNT TAB ── */}
              {settingsTab === "account" && (
                <div>
                  <div className="settings-section">
                    <h3 className="settings-section-label">User Profile</h3>
                    <div className="settings-profile-card">
                      <div className="user-avatar">{userInitial}</div>
                      <div className="settings-profile-info">
                        <strong>{user?.username}</strong>
                        <span>{user?.email || "Personal account"}</span>
                      </div>
                      <span className="format-tag">Active</span>
                    </div>
                  </div>

                  <div className="settings-section">
                    <h3 className="settings-section-label">System Architecture</h3>
                    <div className="settings-info-card">
                      <div className="settings-info-card-header">
                        <strong>FastAPI Backend</strong>
                        <span className="status-pill status-ready">Online</span>
                      </div>
                      <p>Document ingestion, vector embeddings, and LangChain RAG pipeline active.</p>
                    </div>
                    <div className="settings-info-card">
                      <div className="settings-info-card-header">
                        <strong>Client Session</strong>
                        <span className="format-tag">JWT Authenticated</span>
                      </div>
                      <p>Secure token storage with automatic session validation.</p>
                    </div>
                  </div>

                  <div className="settings-footer-actions">
                    <button className="settings-secondary-btn" onClick={() => { setSettingsOpen(false); logout(); }}>
                      Sign out of DocuMind
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Dashboard;
