const API_BASE_URL = "http://127.0.0.1:8000";

export async function registerUser(userData) {
  const response = await fetch(`${API_BASE_URL}/auth/register`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(userData),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.detail || "Registration failed");
  }

  return data;
}


export async function loginUser(userData) {
  const response = await fetch(`${API_BASE_URL}/auth/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(userData),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.detail || "Login failed");
  }

  return data;
}


export async function getCurrentUser() {
  const token = localStorage.getItem("access_token");

  if (!token) {
    throw new Error("No authentication token");
  }

  const response = await fetch(`${API_BASE_URL}/auth/me`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.detail || "Authentication failed");
  }

  return data;
}

export async function getConversations() {
  const token = localStorage.getItem("access_token");

  const response = await fetch(
    `${API_BASE_URL}/conversations`,
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      data.detail || "Failed to load conversations"
    );
  }

  return data;
}


export async function createConversation(title = "New Chat") {
  const token = localStorage.getItem("access_token");

  const response = await fetch(
    `${API_BASE_URL}/conversations`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        title,
      }),
    }
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      data.detail || "Failed to create conversation"
    );
  }

  return data;
}


export async function getMessages(conversationId) {
  const token = localStorage.getItem("access_token");

  const response = await fetch(
    `${API_BASE_URL}/conversations/${conversationId}/messages`,
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      data.detail || "Failed to load messages"
    );
  }

  return data;
}

export async function uploadDocument(
  conversationId,
  file
) {
  const token = localStorage.getItem("access_token");

  const formData = new FormData();

  formData.append("file", file);

  const response = await fetch(
    `${API_BASE_URL}/documents/upload?conversation_id=${encodeURIComponent(
      conversationId
    )}`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: formData,
    }
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      data.detail || "Document upload failed"
    );
  }

  return data;
}

 

export async function sendChatMessage(
  question,
  conversationId,
  documentId
) {
  const token = localStorage.getItem("access_token");

  const response = await fetch(
    `${API_BASE_URL}/chat`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        question,
        conversation_id: conversationId,
        document_id: documentId,
      }),
    }
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      data.detail || "Failed to get answer"
    );
  }

  return data;
}


export async function getDocuments() {
  const token = localStorage.getItem("access_token");

  const response = await fetch(
    `${API_BASE_URL}/documents`,
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      data.detail || "Failed to load documents"
    );
  }

  return data;
}

