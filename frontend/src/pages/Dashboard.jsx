
import { useEffect, useState } from "react";

import { useAuth } from "../context/AuthContext";

import {
  getConversations,
  createConversation,
  getMessages,
  uploadDocument,
  sendChatMessage,
  getDocuments,
} from "../services/api";

function Dashboard() {
  const { user, logout } = useAuth();

  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] =
    useState(null);

  const [messages, setMessages] = useState([]);
  const [documents, setDocuments] = useState([]);

  const [selectedFile, setSelectedFile] = useState(null);
  const [documentId, setDocumentId] = useState(null);

  const [loading, setLoading] = useState(true);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [sending, setSending] = useState(false);

  const [error, setError] = useState("");
  const [uploadMessage, setUploadMessage] = useState("");
  const [question, setQuestion] = useState("");

  useEffect(() => {
    async function loadConversations() {
      try {
        setError("");

        const data = await getConversations();

        setConversations(data);
      } catch (error) {
        setError(error.message);
      } finally {
        setLoading(false);
      }
    }

    async function loadDocuments() {
      try {
        const data = await getDocuments();

        setDocuments(data);
      } catch (error) {
        setError(error.message);
      }
    }

    loadConversations();
    loadDocuments();
  }, []);

  async function handleNewChat() {
    try {
      setError("");
      setUploadMessage("");
      setDocumentId(null);
      setSelectedFile(null);
      setMessages([]);
      setQuestion("");

      const data = await createConversation("New Chat");

      setConversations((previous) => [
        data,
        ...previous,
      ]);

      setSelectedConversation(data);
    } catch (error) {
      setError(error.message);
    }
  }

  async function handleSelectConversation(conversation) {
    try {
      setError("");
      setUploadMessage("");
      setSelectedFile(null);
      setQuestion("");

      const conversationDocument = documents.find(
        (document) =>
          document.conversation_id ===
          conversation.conversation_id
      );

      if (conversationDocument) {
        setDocumentId(
          conversationDocument.document_id
        );
      } else {
        setDocumentId(null);
      }

      setSelectedConversation(conversation);
      setMessagesLoading(true);

      const data = await getMessages(
        conversation.conversation_id
      );

      setMessages(data);
    } catch (error) {
      setError(error.message);
      setMessages([]);
    } finally {
      setMessagesLoading(false);
    }
  }

  function handleFileChange(event) {
    const file = event.target.files[0];

    if (!file) {
      return;
    }

    setSelectedFile(file);
    setUploadMessage("");
    setError("");
  }

  async function handleUpload() {
    if (!selectedConversation) {
      setError(
        "Please select or create a conversation first."
      );
      return;
    }

    if (!selectedFile) {
      setError("Please select a PDF or DOCX file.");
      return;
    }

    try {
      setError("");
      setUploadMessage("");
      setUploading(true);

      const data = await uploadDocument(
        selectedConversation.conversation_id,
        selectedFile
      );

      setDocumentId(data.document_id);

      setDocuments((previous) => [
        ...previous,
        {
          document_id: data.document_id,
          document_name: data.filename,
          conversation_id:
            selectedConversation.conversation_id,
        },
      ]);

      setUploadMessage(
        `${data.filename} uploaded successfully.`
      );

      setSelectedFile(null);
    } catch (error) {
      setError(error.message);
    } finally {
      setUploading(false);
    }
  }

  async function handleSendMessage() {
    if (!selectedConversation) {
      setError(
        "Please select or create a conversation first."
      );
      return;
    }

    if (!documentId) {
      setError("Please upload a document first.");
      return;
    }

    if (!question.trim()) {
      setError("Please enter a question.");
      return;
    }

    try {
      setError("");
      setSending(true);

      await sendChatMessage(
        question,
        selectedConversation.conversation_id,
        documentId
      );

      const data = await getMessages(
        selectedConversation.conversation_id
      );

      setMessages(data);
      setQuestion("");
    } catch (error) {
      setError(error.message);
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="dashboard">

      {/* Header */}
      <header className="dashboard-header">
        <h1>AI Document Assistant</h1>

        <div className="user-section">
          <span className="user-name">
            Welcome, {user.username}
          </span>

          <button
            className="logout-button"
            onClick={logout}
          >
            Logout
          </button>
        </div>
      </header>

      {/* Main Layout */}
      <main className="dashboard-main">

        {/* Sidebar */}
        <aside className="conversation-sidebar">

          <h2 className="sidebar-title">
            Conversations
          </h2>

          <button
            className="new-chat-button"
            onClick={handleNewChat}
          >
            + New Chat
          </button>

          <div className="conversation-list">

            {loading && (
              <p className="empty-state">
                Loading conversations...
              </p>
            )}

            {!loading &&
              conversations.length === 0 && (
                <p className="empty-state">
                  No conversations yet.
                </p>
              )}

            {conversations.map((conversation) => (
              <div
                key={conversation.conversation_id}
                className={`conversation-item ${
                  selectedConversation?.conversation_id ===
                  conversation.conversation_id
                    ? "active"
                    : ""
                }`}
                onClick={() =>
                  handleSelectConversation(conversation)
                }
              >
                <p>{conversation.title}</p>
              </div>
            ))}

          </div>
        </aside>

        {/* Chat Area */}
        <section className="chat-section">

          {!selectedConversation ? (
            <>
              <div className="chat-header">
                <h2>Chat</h2>
              </div>

              <div className="empty-state">
                <p>
                  Select a conversation or create a new chat.
                </p>
              </div>
            </>
          ) : (
            <>
              {/* Chat Header */}
              <div className="chat-header">
                <h2>
                  {selectedConversation.title}
                </h2>
              </div>

              {/* Error */}
              {error && (
                <p className="error-message">
                  {error}
                </p>
              )}

              {/* Messages */}
              <div className="messages-container">

                {messagesLoading && (
                  <p className="empty-state">
                    Loading messages...
                  </p>
                )}

                {!messagesLoading &&
                  messages.length === 0 && (
                    <p className="empty-state">
                      No messages in this conversation yet.
                    </p>
                  )}

                {!messagesLoading &&
                  messages.map((message) => (
                    <div
                      key={message.message_id}
                      className={`message ${
                        message.role === "user"
                          ? "message-user"
                          : "message-assistant"
                      }`}
                    >
                      <div className="message-role">
                        {message.role === "user"
                          ? "You"
                          : "AI Assistant"}
                      </div>

                      <p className="message-content">
                        {message.content}
                      </p>
                    </div>
                  ))}

              </div>

              {/* Document Upload */}
              <div className="document-section">

                <div className="document-header">
                  <div>
                    <h3>Upload Document</h3>

                    <p>
                      Upload a PDF or DOCX to start asking
                      questions.
                    </p>
                  </div>
                </div>

                <div className="document-upload-card">

                  <label className="file-drop-area">

                    <input
                      type="file"
                      accept=".pdf,.docx"
                      onChange={handleFileChange}
                    />

                    <div className="upload-icon">
                      📄
                    </div>

                    <div className="upload-text">

                      <span className="upload-title">
                        {selectedFile
                          ? selectedFile.name
                          : "Choose a document"}
                      </span>

                      <span className="upload-subtitle">
                        {selectedFile
                          ? "Ready to upload"
                          : "PDF or DOCX files supported"}
                      </span>

                    </div>

                    <span className="browse-button">
                      Browse
                    </span>

                  </label>

                  <button
                    className="upload-button"
                    onClick={handleUpload}
                    disabled={uploading}
                  >
                    {uploading
                      ? "Uploading..."
                      : "Upload Document"}
                  </button>

                </div>

                {uploadMessage && (
                  <p className="document-status success-document">
                    ✓ {uploadMessage}
                  </p>
                )}

                {documentId && (
                  <p className="document-status ready-document">
                    ✓ Document ready for chat
                  </p>
                )}

              </div>

              {/* Chat Input */}
              <div className="chat-input-area">

                <input
                  className="chat-input"
                  type="text"
                  placeholder="Ask a question about your document..."
                  value={question}
                  onChange={(event) =>
                    setQuestion(event.target.value)
                  }
                  onKeyDown={(event) => {
                    if (
                      event.key === "Enter" &&
                      !sending
                    ) {
                      handleSendMessage();
                    }
                  }}
                  disabled={
                    sending || !documentId
                  }
                />

                <button
                  className="send-button"
                  onClick={handleSendMessage}
                  disabled={
                    sending ||
                    !documentId ||
                    !question.trim()
                  }
                >
                  {sending
                    ? "Thinking..."
                    : "Send"}
                </button>

              </div>
            </>
          )}

        </section>

      </main>
    </div>
  );
}

export default Dashboard;
