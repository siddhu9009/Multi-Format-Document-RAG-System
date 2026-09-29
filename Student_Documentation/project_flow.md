# Complete Project Architecture

## Multi-Format Document RAG System

**Agentic AI Document Assistant**

```text
┌─────────────────────────────────────────────────────────────┐
│                         USER                                │
│                                                             │
│  Register / Login  •  Upload Documents  •  Ask Questions  │
│  Continue Chats                                             │
└──────────────────────────────┬──────────────────────────────┘
                               │
                               │ HTTPS
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                    FRONTEND LAYER                           │
│                     React + Vite                            │
│                                                             │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐ │
│  │    Login    │  │   Register  │  │     Dashboard       │ │
│  └─────────────┘  └─────────────┘  │                     │ │
│                                    │  ┌─────────┐         │ │
│                                    │  │ Sidebar │         │ │
│                                    │  │  Chats  │         │ │
│                                    │  └─────────┘         │ │
│                                    │  ┌───────────────┐   │ │
│                                    │  │  Chat Window  │   │ │
│                                    │  │ Messages      │   │ │
│                                    │  │ Sources       │   │ │
│                                    │  │ Upload        │   │ │
│                                    │  └───────────────┘   │ │
│                                    └─────────────────────┘ │
│                                                             │
│                 API Service / Auth Context                  │
└──────────────────────────────┬──────────────────────────────┘
                               │
                               │ REST API
                               │ JWT Bearer Token
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                    BACKEND LAYER                            │
│                  FastAPI + Python                           │
│                                                             │
│  API ROUTES                                                 │
│  ─────────────────────────────────────────────────────────  │
│  /auth/register    /auth/login    /auth/me                 │
│  /conversations    /documents     /documents/upload        │
│  /chat             /messages                               │
│                                                             │
│  AUTHENTICATION                                             │
│  ─────────────────────────────────────────────────────────  │
│  • JWT Authentication                                       │
│  • Password Hashing                                         │
│  • User Verification                                        │
│  • Ownership Validation                                     │
│                                                             │
│              ┌─────────────────┴─────────────────┐           │
│              │                                   │           │
│              ▼                                   ▼           │
│     ┌──────────────────┐               ┌──────────────────┐ │
│     │ CONVERSATION     │               │ DOCUMENT         │ │
│     │ FLOW             │               │ FLOW             │ │
│     │                  │               │                  │ │
│     │ Conversation     │               │ Document Service │ │
│     │ Service          │               │                  │ │
│     └────────┬─────────┘               └────────┬─────────┘ │
│                                              │              │
│                                              ▼              │
│                                     ┌──────────────────┐    │
│                                     │ File Validation  │    │
│                                     │                  │    │
│                                     │ PDF / DOCX / TXT │    │
│                                     │ MD / CSV / JSON  │    │
│                                     │ XLSX / PPTX      │    │
│                                     └────────┬─────────┘    │
│                                              │              │
│                                              ▼              │
│                                     ┌──────────────────┐    │
│                                     │ Text Extraction  │    │
│                                     └────────┬─────────┘    │
│                                              │              │
│                                              ▼              │
│                                     ┌──────────────────┐    │
│                                     │ Chunking         │    │
│                                     │                  │    │
│                                     │ 500 chars        │    │
│                                     │ 100 overlap      │    │
│                                     └────────┬─────────┘    │
│                                              │              │
│                                              ▼              │
│                                     ┌──────────────────┐    │
│                                     │ Embedding        │    │
│                                     │ Service          │    │
│                                     │                  │    │
│                                     │ FastEmbed        │    │
│                                     │ bge-small-en-v1.5│    │
│                                     │ 384 dimensions   │    │
│                                     └────────┬─────────┘    │
│                                              │              │
│                                              ▼              │
│                                     ┌──────────────────┐    │
│                                     │ Vector Store     │    │
│                                     └────────┬─────────┘    │
│                                              │              │
└──────────────────────────────────────────────┼──────────────┘
                                               │
                                               ▼
┌─────────────────────────────────────────────────────────────┐
│                     MONGODB ATLAS                           │
│                                                             │
│  Collections                                               │
│  ─────────────────────────────────────────────────────────  │
│  • conversations                                           │
│  • messages                                                │
│  • document_chunks                                         │
│                                                             │
│  ┌───────────────────────────────────────────────────────┐  │
│  │              MongoDB Vector Search                    │  │
│  │                                                       │  │
│  │  Index:      vector_index                             │  │
│  │  Dimensions: 384                                      │  │
│  │  Similarity: Cosine                                   │  │
│  └───────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

---

# RAG Query Flow

The RAG pipeline handles the user's question and retrieves relevant information from uploaded documents.

```text
┌─────────────────────┐
│   USER QUESTION     │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│  Query Embedding    │
└──────────┬──────────┘
           │
           ▼
┌────────────────────────────────┐
│    MongoDB Vector Search       │
│                                │
│  Filter:                       │
│  • user_id                     │
│  • conversation_id             │
└───────────────┬────────────────┘
                │
                ▼
┌─────────────────────┐
│ Top Relevant Chunks │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────────────┐
│     Build RAG Context       │
│                             │
│  + Conversation History     │
└──────────┬──────────────────┘
           │
           ▼
┌─────────────────────┐
│ Prompt Construction │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────────────┐
│         GROQ API            │
│                             │
│    openai/gpt-oss-20b       │
│    Temperature: 0           │
└──────────┬──────────────────┘
           │
           │ Generated Answer
           ▼
┌─────────────────────────────┐
│       RAG RESPONSE          │
│                             │
│  • Answer                   │
│  • Sources                  │
│  • Document Name            │
│  • Chunk Information        │
└──────────┬──────────────────┘
           │
           ▼
┌─────────────────────────────┐
│      Message Service        │
│                             │
│  Save User Message          │
│  Save AI Message            │
└──────────┬──────────────────┘
           │
           ▼
┌─────────────────────┐
│    MongoDB Atlas    │
│      messages       │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│   React Dashboard   │
│                     │
│  Display Answer     │
│  Display Sources    │
└─────────────────────┘
```

---

# Complete Application Flow

The complete system can be understood through this simple flow:

```text
                         USER
                           │
                           ▼
                   REACT FRONTEND
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
                                  MongoDB Atlas
                                           │
                                           ▼
                              MongoDB Vector Search


                    USER QUESTION
                           │
                           ▼
                    Query Embedding
                           │
                           ▼
                    Vector Search
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
                       React UI
```

---

# Database Architecture

```text
                         MONGODB ATLAS
                               │
             ┌─────────────────┼─────────────────┐
             │                 │                 │
             ▼                 ▼                 ▼
        ┌─────────┐     ┌──────────────┐   ┌──────────┐
        │  Users  │     │Conversations │   │ Messages │
        └─────────┘     └──────────────┘   └──────────┘
                              
                               │
                               ▼
                    ┌─────────────────────┐
                    │   document_chunks   │
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

# Most Important Design Decision: Data Isolation

A key architectural decision is the **two-level isolation** used during vector retrieval.

```text
                 MongoDB Vector Search
                          │
                 ┌────────┴────────┐
                 │                 │
              user_id       conversation_id
                 │                 │
                 └────────┬────────┘
                          │
                          ▼
                  Relevant Chunks
                          │
                          ▼
                     RAG Context
```

The vector search uses both:

* `user_id`
* `conversation_id`

This ensures that the retrieved document chunks are associated with the correct user and conversation.

---

# Technology Stack

| Layer                | Technology                                       |
| -------------------- | ------------------------------------------------ |
| Frontend             | React + Vite                                     |
| Backend              | FastAPI + Python                                 |
| Authentication       | JWT                                              |
| Password Security    | Password Hashing                                 |
| Database             | MongoDB Atlas                                    |
| Vector Search        | MongoDB Atlas Vector Search                      |
| Embeddings           | FastEmbed                                        |
| Embedding Model      | `qdrant/bge-small-en-v1.5-onnx`                  |
| Embedding Dimensions | 384                                              |
| LLM API              | Groq API                                         |
| LLM Model            | `openai/gpt-oss-20b`                             |
| API                  | REST API                                         |
| Supported Documents  | PDF / DOCX / TXT / MD / CSV / JSON / XLSX / PPTX |

---

# Interview-Level Explanation

The complete architecture can be explained in a simple way:

> The system uses React and Vite for the frontend and FastAPI for the backend. Users authenticate using JWT and can create conversations and upload documents. The backend validates and extracts text from supported documents, splits the text into chunks, generates embeddings using FastEmbed, and stores the chunks and embeddings in MongoDB Atlas. When a user asks a question, the system generates a query embedding and performs MongoDB Vector Search using both user and conversation filters to retrieve relevant chunks. These chunks, along with conversation history, are used to build the RAG context and prompt. The prompt is sent to the Groq LLM, which generates the answer and sources. The messages are then stored in MongoDB and displayed in the React dashboard.

`````

