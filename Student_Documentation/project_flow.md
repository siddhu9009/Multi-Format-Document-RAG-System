Complete Project Architecture
┌──────────────────────────────────────────────────────────────────────────────┐
│                         MULTI-FORMAT DOCUMENT RAG SYSTEM                     │
│                         Agentic AI Document Assistant                        │
└──────────────────────────────────────────────────────────────────────────────┘


                              ┌───────────────────┐
                              │       USER        │
                              │                   │
                              │ Register / Login  │
                              │ Upload Documents  │
                              │ Ask Questions     │
                              │ Continue Chats    │
                              └─────────┬─────────┘
                                        │
                                        │ HTTPS
                                        ▼
┌──────────────────────────────────────────────────────────────────────────────┐
│                           FRONTEND LAYER                                     │
│                         React + Vite                                         │
│                                                                              │
│   ┌─────────────┐   ┌──────────────┐   ┌────────────────────────────────┐   │
│   │    Login    │   │   Register   │   │           Dashboard             │   │
│   └─────────────┘   └──────────────┘   │                                │   │
│                                        │  ┌──────────┐  ┌─────────────┐ │   │
│                                        │  │ Sidebar  │  │ Chat Window │ │   │
│                                        │  │          │  │             │ │   │
│                                        │  │ Chats    │  │ Messages    │ │   │
│                                        │  │          │  │ Sources     │ │   │
│                                        │  │          │  │ Upload      │ │   │
│                                        │  └──────────┘  └─────────────┘ │   │
│                                        └────────────────────────────────┘   │
│                                                                              │
│                         API Service / Auth Context                           │
└──────────────────────────────────────┬───────────────────────────────────────┘
                                       │
                                       │ REST API
                                       │ JWT Bearer Token
                                       ▼
┌──────────────────────────────────────────────────────────────────────────────┐
│                            BACKEND LAYER                                     │
│                         FastAPI + Python                                     │
│                                                                              │
│  ┌────────────────────────────────────────────────────────────────────────┐  │
│  │                           API ROUTES                                    │  │
│  │                                                                        │  │
│  │  /auth/register     /auth/login      /auth/me                         │  │
│  │  /conversations     /documents       /documents/upload                │  │
│  │  /chat              /messages                                          │  │
│  └────────────────────────────────────┬───────────────────────────────────┘  │
│                                       │                                      │
│                                       ▼                                      │
│  ┌────────────────────────────────────────────────────────────────────────┐  │
│  │                       AUTHENTICATION                                    │  │
│  │                                                                        │  │
│  │  JWT Authentication                                                    │  │
│  │  Password Hashing                                                      │  │
│  │  User Verification                                                     │  │
│  │  Ownership Validation                                                  │  │
│  └────────────────────────────────────┬───────────────────────────────────┘  │
│                                       │                                      │
│                     ┌─────────────────┴──────────────────┐                   │
│                     │                                    │                   │
│                     ▼                                    ▼                   │
│          ┌──────────────────────┐             ┌────────────────────────┐     │
│          │  CONVERSATION FLOW  │             │   DOCUMENT FLOW        │     │
│          └──────────┬───────────┘             └────────────┬───────────┘     │
│                     │                                      │                 │
│                     ▼                                      ▼                 │
│          ┌──────────────────────┐             ┌────────────────────────┐     │
│          │ Conversation Service │             │ Document Service       │     │
│          └──────────┬───────────┘             └────────────┬───────────┘     │
│                     │                                      │                 │
│                     │                                      ▼                 │
│                     │                         ┌────────────────────────┐     │
│                     │                         │ File Validation        │     │
│                     │                         │ PDF / DOCX / TXT       │     │
│                     │                         │ MD / CSV / JSON        │     │
│                     │                         │ XLSX / PPTX            │     │
│                     │                         └────────────┬───────────┘     │
│                     │                                      │                 │
│                     │                                      ▼                 │
│                     │                         ┌────────────────────────┐     │
│                     │                         │ Text Extraction        │     │
│                     │                         └────────────┬───────────┘     │
│                     │                                      │                 │
│                     │                                      ▼                 │
│                     │                         ┌────────────────────────┐     │
│                     │                         │ Chunking               │     │
│                     │                         │ 500 chars              │     │
│                     │                         │ 100 overlap             │     │
│                     │                         └────────────┬───────────┘     │
│                     │                                      │                 │
│                     │                                      ▼                 │
│                     │                         ┌────────────────────────┐     │
│                     │                         │ Embedding Service      │     │
│                     │                         │ FastEmbed               │     │
│                     │                         │ bge-small-en-v1.5      │     │
│                     │                         │ 384 dimensions          │     │
│                     │                         └────────────┬───────────┘     │
│                     │                                      │                 │
│                     │                                      ▼                 │
│                     │                         ┌────────────────────────┐     │
│                     │                         │ Vector Store           │     │
│                     │                         └────────────┬───────────┘     │
│                     │                                      │                 │
│                     └──────────────────────┐               │                 │
│                                            │               │                 │
│                                            ▼               ▼                 │
│                                  ┌────────────────────────────────────┐      │
│                                  │          MONGODB ATLAS              │      │
│                                  │                                    │      │
│                                  │  conversations                      │      │
│                                  │  messages                           │      │
│                                  │  document_chunks                    │      │
│                                  │                                    │      │
│                                  │  ┌──────────────────────────────┐  │      │
│                                  │  │ MongoDB Vector Search        │  │      │
│                                  │  │                              │  │      │
│                                  │  │ Index: vector_index          │  │      │
│                                  │  │ Dimensions: 384              │  │      │
│                                  │  │ Similarity: Cosine           │  │      │
│                                  │  └──────────────────────────────┘  │      │
│                                  └────────────────┬───────────────────┘      │
│                                                   │                          │
│                                                   │                          │
│  ┌──────────────────────────────────────────────────────────────────────┐    │
│  │                         RAG QUERY FLOW                               │    │
│  │                                                                      │    │
│  │  User Question                                                       │    │
│  │       │                                                              │    │
│  │       ▼                                                              │    │
│  │  Query Embedding                                                     │    │
│  │       │                                                              │
│  │       ▼                                                              │    │
│  │  MongoDB Vector Search                                               │    │
│  │       │                                                              │    │
│  │       │  Filter: user_id + conversation_id                           │    │
│  │       ▼                                                              │    │
│  │  Top Relevant Chunks                                                 │    │
│  │       │                                                              │
│  │       ▼                                                              │    │
│  │  Build RAG Context                                                   │    │
│  │       │                                                              │
│  │       ├─────────────── Conversation History                          │    │
│  │       │                                                              │
│  │       ▼                                                              │    │
│  │  Prompt Construction                                                  │    │
│  │       │                                                              │    │
│  │       ▼                                                              │    │
│  │  LLM Service                                                         │    │
│  └──────────────────────┬───────────────────────────────────────────────┘    │
│                         │                                                    │
└─────────────────────────┼────────────────────────────────────────────────────┘
                          │
                          │ API
                          ▼
              ┌───────────────────────────────┐
              │           GROQ API             │
              │                               │
              │     openai/gpt-oss-20b        │
              │                               │
              │     Temperature: 0            │
              └───────────────┬───────────────┘
                              │
                              │ Generated Answer
                              ▼
              ┌───────────────────────────────┐
              │        RAG RESPONSE           │
              │                               │
              │  Answer                      │
              │  Sources                     │
              │  Document Name                │
              │  Chunk Information            │
              └───────────────┬───────────────┘
                              │
                              ▼
                     ┌─────────────────┐
                     │ Message Service │
                     │                 │
                     │ Save User Msg   │
                     │ Save AI Msg     │
                     └────────┬────────┘
                              │
                              ▼
                     ┌─────────────────┐
                     │ MongoDB Atlas   │
                     │ messages        │
                     └────────┬────────┘
                              │
                              ▼
                     ┌─────────────────┐
                     │ React Dashboard │
                     │                 │
                     │ Display Answer  │
                     │ Display Sources │
                     └─────────────────┘
The architecture in one simple flow

Your interviewer can understand the entire system from this:

USER
  │
  ▼
REACT FRONTEND
  │
  │ JWT + REST API
  ▼
FASTAPI BACKEND
  │
  ├── Authentication
  │
  ├── Conversations
  │
  ├── Documents
  │
  ├── Messages
  │
  └── RAG
       │
       ├── Document Upload
       │      ↓
       │   Text Extraction
       │      ↓
       │   Chunking
       │      ↓
       │   FastEmbed
       │      ↓
       │   MongoDB
       │
       └── User Question
              ↓
          Query Embedding
              ↓
          Vector Search
              ↓
          Relevant Chunks
              ↓
          Context + Chat History
              ↓
          Groq LLM
              ↓
          Answer + Sources
              ↓
          Save Messages
              ↓
          React UI

DATABASE
MongoDB Atlas
 ├── Users
 ├── Conversations
 ├── Messages
 └── Document Chunks + Embeddings
              │
              └── MongoDB Vector Search
Most important design decision

The strongest architectural point to explain in an interview is the two-level isolation:

                 MongoDB Vector Search
                         │
             ┌───────────┴───────────┐
             │                       │
          user_id             conversation_id
             │                       │
             └───────────┬───────────┘
                         ↓
                 Relevant chunks
                         ↓
                    RAG Context