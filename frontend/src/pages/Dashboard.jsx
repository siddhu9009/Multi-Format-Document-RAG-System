
import { useEffect, useState } from "react";

import { useAuth } from "../context/AuthContext";

import {
  getConversations,
  createConversation,
  getMessages,
  uploadDocument,
  sendChatMessage,
} from "../services/api";

function Dashboard() {
  const { user, logout } = useAuth();

  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] =
    useState(null);

  const [messages, setMessages] = useState([]);

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

    loadConversations();
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
      setDocumentId(null);
      setSelectedFile(null);
      setQuestion("");

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
    <div>
      <header>
        <h1>AI Document Assistant</h1>

        <div>
          <span>
            Welcome, {user.username}
          </span>

          <button onClick={logout}>
            Logout
          </button>
        </div>
      </header>

      <main>
        <aside>
          <h2>Conversations</h2>

          <button onClick={handleNewChat}>
            + New Chat
          </button>

          {loading && (
            <p>Loading conversations...</p>
          )}

          {!loading &&
            conversations.length === 0 && (
              <p>No conversations yet.</p>
            )}

          {conversations.map((conversation) => (
            <div
              key={conversation.conversation_id}
              onClick={() =>
                handleSelectConversation(conversation)
              }
            >
              <p>{conversation.title}</p>
            </div>
          ))}
        </aside>

        <section>
          <h2>Chat</h2>

          {error && (
            <p>{error}</p>
          )}

          {!selectedConversation && (
            <p>
              Select a conversation or create a new chat.
            </p>
          )}

          {selectedConversation && (
            <>
              <h3>
                {selectedConversation.title}
              </h3>

              <div>
                <h4>Document</h4>

                <input
                  type="file"
                  accept=".pdf,.docx"
                  onChange={handleFileChange}
                />

                {selectedFile && (
                  <p>
                    Selected: {selectedFile.name}
                  </p>
                )}

                <button
                  onClick={handleUpload}
                  disabled={uploading}
                >
                  {uploading
                    ? "Uploading..."
                    : "Upload Document"}
                </button>

                {uploadMessage && (
                  <p>{uploadMessage}</p>
                )}

                {documentId && (
                  <p>
                    Document ready for chat.
                  </p>
                )}
              </div>

              <hr />

              {messagesLoading && (
                <p>Loading messages...</p>
              )}

              {!messagesLoading &&
                messages.length === 0 && (
                  <p>
                    No messages in this conversation yet.
                  </p>
                )}

              {!messagesLoading &&
                messages.map((message) => (
                  <div
                    key={message.message_id}
                  >
                    <strong>
                      {message.role}:
                    </strong>

                    <p>
                      {message.content}
                    </p>
                  </div>
                ))}

              <hr />

              <div>
                <input
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
                  disabled={sending || !documentId}
                />

                <button
                  onClick={handleSendMessage}
                  disabled={
                    sending ||
                    !documentId ||
                    !question.trim()
                  }
                >
                  {sending ? "Thinking..." : "Send"}
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
