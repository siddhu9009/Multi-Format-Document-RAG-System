# Project Architecture

## Multi-Format Document RAG System

**Agentic AI Document Assistant**

---

## 1. High-Level System Architecture

The complete application follows a frontend → backend → database/AI-services architecture.

```text
┌─────────────────────┐
│        USER         │
│                     │
│ • Register / Login  │
│ • Upload Documents │
│ • Ask Questions     │
│ • Continue Chats    │
└──────────┬──────────┘
           │
           │ HTTPS
           ▼
┌─────────────────────────────────────┐
│         REACT + VITE FRONTEND       │
│                                     │
│  Login  │  Register  │  Dashboard  │
│                         │           │
│                    ┌────┴─────┐     │
│                    │          │     │
│                 Sidebar   Chat Window
│                  Chats     Messages │
│                            Sources  │
│                            Upload   │
└──────────────────┬──────────────────┘
                   │
                   │ REST API
                   │ JWT Bearer Token
                   ▼
┌─────────────────────────────────────┐
│          FASTAPI BACKEND            │
│                                     │
│  Authentication                     │
│  Conversations                      │
│  Documents                          │
│  Messages                           │
│  RAG Pipeline                       │
└──────────────┬──────────────┬───────┘
               │              │
               │              │
               ▼              ▼
┌──────────────────────┐  ┌─────────────────────┐
│    MONGODB ATLAS     │  │      GROQ API       │
│                      │  │                     │
│ • Users              │  │ openai/gpt-oss-20b │
│ • Conversations      │  │                     │
│ • Messages           │  │ Temperature: 0      │
│ • Document Chunks    │  └─────────────────────┘
│ • Embeddings         │
│                      │
│ MongoDB Vector Search│
└──────────────────────┘
```

---

# 2. Backend Architecture

The FastAPI backend contains authentication, conversation management, document processing, messaging, and the RAG pipeline.

```text
                         FASTAPI BACKEND
                               │
              ┌────────────────┼────────────────┐
              │                │                │
              ▼                ▼                ▼
      ┌──────────────┐ ┌──────────────┐ ┌──────────────┐
      │     AUTH     │ │ CONVERSATION │ │   DOCUMENT   │
      │              │ │    SERVICE   │ │    SERVICE   │
      │ • JWT        │ │              │ │ • Upload     │
      │ • Password   │ │ • Create     │ │ • Validation │
      │   Hashing    │ │ • Retrieve   │ │ • Extraction │
      │ • User       │ │ • Delete     │ │ • Chunking   │
      │   Verify     │ │              │ │ • Embedding  │
      │ • Ownership  │ │              │ │              │
      └──────────────┘ └──────────────┘ └──────┬───────┘
                                               │
                                               ▼
                                      ┌─────────────────┐
                                      │  VECTOR STORE   │
                                      │                 │
                                      │ MongoDB Atlas   │
                                      │ Vector Search   │
                                      └─────────────────┘
```

### API Routes

```text
/auth/register
/auth/login
/auth/me

/conversations
/messages

/documents
/documents/upload

/chat
```

---

# 3. Document Processing Pipeline

When a user uploads a document, the backend processes it through the following pipeline:

```text
                 DOCUMENT UPLOAD
                        │
                        ▼
              ┌───────────────────┐
              │ File Validation   │
              └─────────┬─────────┘
                        │
                        ▼
              ┌───────────────────┐
              │ Supported Formats │
              │                   │
              │ PDF / DOCX / TXT  │
              │ MD / CSV / JSON   │
              │ XLSX / PPTX      │
              └─────────┬─────────┘
                        │
                        ▼
              ┌───────────────────┐
              │ Text Extraction   │
              └─────────┬─────────┘
                        │
                        ▼
              ┌───────────────────┐
              │     Chunking      │
              │                   │
              │ 500 characters    │
              │ 100 overlap       │
              └─────────┬─────────┘
                        │
                        ▼
              ┌───────────────────┐
              │ Embedding Service │
              │                   │
              │ FastEmbed         │
              │ bge-small-en-v1.5 │
              │ 384 dimensions    │
              └─────────┬─────────┘
                        │
                        ▼
              ┌───────────────────┐
              │   MongoDB Atlas   │
              │                   │
              │ Document Chunks   │
              │ + Embeddings      │
              └───────────────────┘
```

---

# 4. RAG Query Flow

When the user asks a question, the RAG pipeline retrieves relevant information from the uploaded documents before generating the answer.

```text
                    USER QUESTION
                          │
                          ▼
                 ┌─────────────────┐
                 │ Query Embedding │
                 └────────┬────────┘
                          │
                          ▼
              ┌────────────────────────┐
              │ MongoDB Vector Search  │
              │                        │
              │ Index: vector_index    │
              │ Similarity: Cosine     │
              └───────────┬────────────┘
                          │
                          │ Filter
                          │
                  ┌───────┴────────┐
                  │                │
                  ▼                ▼
               user_id      conversation_id
                  │                │
                  └───────┬────────┘
                          │
                          ▼
                ┌──────────────────┐
                │ Relevant Chunks  │
                └────────┬─────────┘
                         │
                         ▼
                ┌──────────────────┐
                │ Build RAG Context│
                │                  │
                │ + Chat History   │
                └────────┬─────────┘
                         │
                         ▼
                ┌──────────────────┐
                │ Prompt           │
                │ Construction     │
                └────────┬─────────┘
                         │
                         ▼
                ┌──────────────────┐
                │     Groq API     │
                │                  │
                │ openai/gpt-oss-20b
                └────────┬─────────┘
                         │
                         ▼
                ┌──────────────────┐
                │ Generated Answer │
                │                  │
                │ • Answer         │
                │ • Sources        │
                │ • Document Name  │
                │ • Chunk Info     │
                └────────┬─────────┘
                         │
                         ▼
                ┌──────────────────┐
                │ Message Service  │
                │                  │
                │ Save User Msg    │
                │ Save AI Msg      │
                └────────┬─────────┘
                         │
                         ▼
                ┌──────────────────┐
                │   MongoDB Atlas  │
                │     messages     │
                └────────┬─────────┘
                         │
                         ▼
                ┌──────────────────┐
                │ React Dashboard  │
                │                  │
                │ Display Answer   │
                │ Display Sources  │
                └──────────────────┘
```

---

# 5. MongoDB Atlas Data Architecture

MongoDB Atlas stores the application's persistent data.

```text
                    MONGODB ATLAS
                          │
          ┌───────────────┼────────────────┐
          │               │                │
          ▼               ▼                ▼
      ┌────────┐    ┌──────────────┐   ┌─────────────────┐
      │ Users  │    │Conversations │   │    Messages     │
      └────────┘    └──────────────┘   └─────────────────┘
                                             
                          │
                          ▼
                ┌─────────────────────┐
                │  document_chunks    │
                │                     │
                │ • user_id           │
                │ • conversation_id   │
                │ • document_id       │
                │ • document_name     │
                │ • chunk_index       │
                │ • text              │
                │ • embedding         │
                └──────────┬──────────┘
                           │
                           ▼
                ┌─────────────────────┐
                │ MongoDB Vector      │
                │ Search              │
                │                     │
                │ Index: vector_index │
                │ Dimensions: 384     │
                │ Similarity: Cosine  │
                └─────────────────────┘
```

---

# 6. End-to-End Application Flow

The entire system can be understood through two major flows.

## Document Ingestion

```text
User
 │
 ▼
Upload Document
 │
 ▼
FastAPI
 │
 ├── File Validation
 │
 ├── Text Extraction
 │
 ├── Chunking
 │
 ├── FastEmbed
 │
 ▼
MongoDB Atlas
 │
 └── Document Chunks + Embeddings
```

## Question Answering

```text
User
 │
 ▼
Ask Question
 │
 ▼
FastAPI
 │
 ├── Query Embedding
 │
 ├── MongoDB Vector Search
 │
 ├── User + Conversation Filter
 │
 ├── Relevant Chunks
 │
 ├── Conversation History
 │
 ├── RAG Context
 │
 └── Prompt Construction
 │
 ▼
Groq API
 │
 ▼
Generated Answer + Sources
 │
 ▼
Save Messages
 │
 ▼
MongoDB Atlas
 │
 ▼
React Dashboard
```

---

# 7. Simple Interview-Level Architecture

If an interviewer asks:

> **"Can you explain your project architecture?"**

The entire system can be explained using this simplified flow:

```text
                         USER
                           │
                           ▼
                  REACT + VITE
                           │
                     JWT + REST API
                           │
                           ▼
                    FASTAPI BACKEND
                           │
          ┌────────────────┼────────────────┐
          │                │                │
          ▼                ▼                ▼
    Authentication   Conversations     Documents
                                           │
                                           ▼
                                    Text Extraction
                                           │
                                           ▼
                                       Chunking
                                           │
                                           ▼
                                       FastEmbed
                                           │
                                           ▼
                                  MongoDB Vector Search
                                           │
                                           │
USER QUESTION ─────────────────────────────┘
      │
      ▼
 Query Embedding
      │
      ▼
 Relevant Chunks
      │
      ▼
 Context + Chat History
      │
      ▼
   Groq LLM
      │
      ▼
 Answer + Sources
      │
      ▼
 Save Messages
      │
      ▼
 MongoDB Atlas
      │
      ▼
 React Dashboard
```

---

# 8. Most Important Design Decision — Data Isolation

One of the important architectural points is **two-level isolation** during vector retrieval.

The vector search uses:

```text
              MongoDB Vector Search
                       │
             ┌─────────┴─────────┐
             │                   │
          user_id         conversation_id
             │                   │
             └─────────┬─────────┘
                       │
                       ▼
                Relevant Chunks
                       │
                       ▼
                  RAG Context
```

This ensures that retrieved document chunks are filtered using both:

* `user_id`
* `conversation_id`

Therefore, the RAG retrieval flow is associated with the correct user and conversation.

---

# 9. Complete Technology Stack

| Layer                  | Technology                                       |
| ---------------------- | ------------------------------------------------ |
| Frontend               | React + Vite                                     |
| Backend                | FastAPI + Python                                 |
| Authentication         | JWT                                              |
| Password Security      | Password Hashing                                 |
| Database               | MongoDB Atlas                                    |
| Vector Database/Search | MongoDB Atlas Vector Search                      |
| Embeddings             | FastEmbed                                        |
| Embedding Model        | `qdrant/bge-small-en-v1.5-onnx`                  |
| Embedding Dimensions   | 384                                              |
| LLM API                | Groq                                             |
| LLM Model              | `openai/gpt-oss-20b`                             |
| API Style              | REST API                                         |
| Document Processing    | PDF / DOCX / TXT / MD / CSV / JSON / XLSX / PPTX |

---

# 10. Architecture Summary

```text
┌──────────────────────────────────────────────────────┐
│                     USER                             │
└────────────────────────┬─────────────────────────────┘
                         │
                         ▼
┌──────────────────────────────────────────────────────┐
│                 REACT + VITE                         │
│              Frontend Application                    │
└────────────────────────┬─────────────────────────────┘
                         │
                    REST + JWT
                         │
                         ▼
┌──────────────────────────────────────────────────────┐
│                  FASTAPI                             │
│              Backend Application                     │
│                                                      │
│ Authentication │ Documents │ Conversations │ RAG     │
└──────────────┬───────────────────────────┬───────────┘
               │                           │
               ▼                           ▼
┌──────────────────────────┐    ┌──────────────────────┐
│      MONGODB ATLAS       │    │       GROQ API       │
│                          │    │                      │
│ Users                    │    │ LLM Generation       │
│ Conversations            │    │                      │
│ Messages                 │    │ gpt-oss-20b          │
│ Document Chunks          │    └──────────────────────┘
│ Embeddings               │
│                          │
│ MongoDB Vector Search    │
└──────────────────────────┘
```

---

## Interview Explanation

A short explanation of the architecture:

> **The system uses React and Vite for the frontend and FastAPI for the backend. Users authenticate using JWT and can create conversations and upload documents. The backend validates and extracts text from supported documents, splits the text into chunks, generates embeddings using FastEmbed, and stores the chunks and embeddings in MongoDB Atlas. When a user asks a question, the system generates a query embedding and performs MongoDB Vector Search using both user and conversation filters to retrieve relevant chunks. These chunks, along with conversation history, are used to construct the RAG context and prompt. The prompt is sent to the Groq LLM, which generates the answer and sources. The messages are then stored in MongoDB and displayed through the React dashboard.**
