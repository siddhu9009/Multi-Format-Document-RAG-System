# API Documentation

## 1. Overview

The Multi-Format Document RAG System provides a REST API built with **FastAPI**.

The API handles:

- User registration and authentication
- JWT-based authorization
- Conversation creation and management
- Document upload and processing
- Document listing
- RAG-based question answering
- Persistent chat messages
- User and conversation-level data isolation

The frontend communicates with the backend through HTTP requests.

---

# 2. Base URL

### Local Development

```text
http://127.0.0.1:8000


3. Authentication

The application uses JWT (JSON Web Token) authentication.

After successful login, the frontend stores the authentication token and sends it with protected API requests.

The typical authorization header is:

Authorization: Bearer <JWT_TOKEN>

Protected resources verify the authenticated user's identity before accessing conversations, documents, or messages.

4. Authentication Endpoints
4.1 Register User
Endpoint
POST /auth/register
Purpose

Creates a new user account.

Request

The frontend sends the required registration information to the backend.

Example:

{
  "username": "siddhu",
  "password": "your_password"
}
Response

A successful registration creates the user account.

The exact response structure is defined by the FastAPI route and Pydantic schema.

4.2 Login
Endpoint
POST /auth/login
Purpose

Authenticates an existing user and returns authentication information used for subsequent protected requests.

Request
{
  "username": "siddhu",
  "password": "your_password"
}
Authentication Flow
User enters credentials
        ↓
Frontend sends login request
        ↓
FastAPI validates credentials
        ↓
Password is verified
        ↓
JWT token is generated
        ↓
Frontend stores token
        ↓
Token is sent with protected requests
4.3 Get Current User
Endpoint
GET /auth/me
Purpose

Returns information about the currently authenticated user.

Authentication

Required.

Authorization: Bearer <JWT_TOKEN>
Usage

The frontend can use this endpoint to verify the current authentication session.

5. Conversation Endpoints

Conversations represent persistent chat sessions.

Each conversation belongs to a specific authenticated user.

A conversation can contain multiple uploaded documents.

5.1 Create Conversation
Endpoint
POST /conversations
Purpose

Creates a new conversation for the authenticated user.

Authentication

Required.

Flow
Authenticated User
        ↓
Create conversation
        ↓
Conversation ID generated
        ↓
Frontend opens new chat
        ↓
Documents and messages can be associated with the conversation
5.2 Get Conversations
Endpoint
GET /conversations
Purpose

Retrieves conversations belonging to the authenticated user.

Authentication

Required.

Usage

The frontend uses this endpoint to populate the conversation sidebar.

Example:

Conversation Sidebar

├── What is IoT?
├── Explain Python OOP
├── Database concepts
└── Machine Learning Notes

Only conversations owned by the authenticated user should be returned.

5.3 Delete Conversation
Endpoint
DELETE /conversations/{conversation_id}
Purpose

Deletes a conversation and its associated data.

Authentication

Required.

Data Cleanup

When a conversation is deleted, associated resources can also be removed:

Conversation
    │
    ├── Messages
    │
    └── Document Chunks

This prevents orphaned conversation and document data.

6. Document Endpoints

Documents are associated with conversations.

A conversation can contain multiple documents.

Example:

Chat 1
│
├── python.pdf
├── machine-learning.pdf
└── notes.docx

The RAG system can retrieve information from the documents associated with the current conversation.

6.1 Upload Document
Endpoint
POST /documents/upload
Purpose

Uploads a document and processes it for RAG retrieval.

Authentication

Required.

Request

The request uses multipart/form-data.

The uploaded document is associated with a conversation.

Supported formats include:

PDF
DOCX
TXT
MD
CSV
JSON
XLSX
PPTX
Processing Flow
Document Upload
      ↓
File Validation
      ↓
Save File
      ↓
Text Extraction
      ↓
Text Chunking
      ↓
Embedding Generation
      ↓
Store Chunks in MongoDB
      ↓
Ready for Vector Search

The uploaded document is not simply stored as a file. Its extracted text is converted into chunks and embeddings for semantic retrieval.

7. Document Processing

The backend processes uploaded files before they can be used by the RAG system.

Processing Pipeline
Uploaded File
      ↓
Format Detection
      ↓
Text Extraction
      ↓
Chunking
      ↓
Embedding Generation
      ↓
MongoDB Storage
      ↓
MongoDB Vector Search

Current chunk configuration:

Chunk Size: 500 characters
Chunk Overlap: 100 characters

Embedding model:

qdrant/bge-small-en-v1.5-onnx

Embedding dimension:

384
8. Get Documents
Endpoint
GET /documents
Purpose

Retrieves documents available to the authenticated user/conversation according to the application's access rules.

Authentication

Required.

The backend validates ownership before returning document information.

9. Chat Endpoint
9.1 Ask a Question
Endpoint
POST /chat
Purpose

Processes a user's question using the Retrieval-Augmented Generation pipeline.

Authentication

Required.

High-Level Flow
User Question
      ↓
Authentication
      ↓
Conversation Validation
      ↓
Vector Search
      ↓
Relevant Document Chunks
      ↓
Conversation Context
      ↓
Prompt Construction
      ↓
Groq LLM
      ↓
Generated Answer
      ↓
Message Persistence
      ↓
Response to Frontend
10. RAG Retrieval

The /chat endpoint performs semantic retrieval using MongoDB Atlas Vector Search.

The system generates an embedding for the user's question and searches the stored document embeddings.

Current configuration:

Vector Index: vector_index
Dimensions: 384
Similarity: Cosine
numCandidates: 50
Retrieved Results: 5

The search is restricted using:

user_id
conversation_id

This is important for preventing documents from another user's conversation from being included in the RAG context.

11. Conversation Context

The RAG system can use previous messages when handling follow-up questions.

Example:

User:
What is IoT?

Assistant:
IoT stands for Internet of Things...

User:
What are its applications?

The second question can use the previous conversation context to understand what "its" refers to.

However, conversation history is used for conversational continuity and is not treated as a replacement for document retrieval.

12. LLM Generation

After retrieving relevant document chunks, the backend creates a context for the language model.

The current Groq model is:

openai/gpt-oss-20b

Temperature:

0

The retrieved document context is supplied to the model so that the generated answer is grounded in the uploaded documents.

13. Source Information

The chat response can include source information associated with retrieved document chunks.

A source can contain information such as:

Document Name
Chunk Index
Document ID

This allows the frontend to indicate which uploaded document contributed information to an answer.

14. Missing Information Handling

If the vector search does not find relevant document content, the system returns:

I could not find the answer in the uploaded documents.

This prevents the application from presenting an unsupported answer when the required information is not available in the uploaded documents.

15. Message Persistence

Chat messages are stored in MongoDB.

A conversation therefore remains available after the user leaves the application.

Example:

Chat 1

User:
What is IoT?

Assistant:
IoT is...

User:
Explain its applications.

Assistant:
...

When the user opens the same conversation again, the previous messages can be loaded and the conversation can continue.

16. Message Endpoints

The project contains message-related backend functionality for storing and retrieving persistent conversation messages.

A conversation's messages are associated with its conversation ID and authenticated user context.

The frontend uses this functionality to restore previous chat sessions.

17. User Data Isolation

User isolation is a core security requirement of the application.

Example:

User A
│
├── Chat 1
│   ├── document-a.pdf
│   └── document-b.pdf
│
└── Chat 2
    └── document-c.pdf


User B
│
└── Chat 1
    └── document-x.pdf

User B must never retrieve User A's documents.

The backend therefore validates ownership before accessing protected resources.

18. Conversation-Level Data Isolation

Documents are also isolated by conversation.

For vector retrieval, the application uses both:

user_id
conversation_id

This ensures that a query from one conversation does not accidentally retrieve chunks from another conversation belonging to the same user.

Example:

User A
│
├── Chat 1 → Python.pdf
│
└── Chat 2 → IoT.pdf

A query in Chat 1 should search Chat 1's document chunks rather than Chat 2's chunks.

19. Frontend-Backend Communication

The React frontend communicates with the FastAPI backend through REST API calls.

High-level architecture:

React Frontend
      │
      │ HTTP Requests
      ↓
FastAPI Backend
      │
      ├── Authentication
      ├── Conversations
      ├── Documents
      ├── Chat
      └── Messages
      │
      ↓
MongoDB Atlas
      │
      └── Vector Search
      │
      ↓
Groq LLM
20. Authentication Request Flow
Login Page
    ↓
POST /auth/login
    ↓
FastAPI
    ↓
Validate Credentials
    ↓
Generate JWT
    ↓
Frontend Stores Token
    ↓
Protected API Requests
    ↓
Authorization: Bearer <token>
21. Document Upload Flow
React Upload UI
       ↓
POST /documents/upload
       ↓
FastAPI
       ↓
Validate User
       ↓
Validate Conversation
       ↓
Validate File
       ↓
Extract Text
       ↓
Create Chunks
       ↓
Generate Embeddings
       ↓
MongoDB
22. Chat Request Flow
React Chat UI
      ↓
POST /chat
      ↓
Authenticate User
      ↓
Validate Conversation
      ↓
Create Query Embedding
      ↓
MongoDB Vector Search
      ↓
Retrieve Relevant Chunks
      ↓
Build Context
      ↓
Add Conversation History
      ↓
Groq LLM
      ↓
Generate Answer
      ↓
Save Messages
      ↓
Return Response
      ↓
React Chat UI
23. API Security

The backend applies several protection mechanisms:

JWT Authentication

Protected endpoints require an authenticated user.

Password Hashing

Passwords are stored using password hashing rather than plaintext storage.

Ownership Validation

Users can access only resources they are authorized to access.

Conversation Validation

Document and chat operations validate the requested conversation.

Retrieval Filtering

Vector search uses user and conversation identifiers.

24. API Documentation with Swagger

FastAPI automatically provides interactive API documentation.

Run the backend:

uvicorn app.main:app --reload

Then open:

http://127.0.0.1:8000/docs

Swagger allows developers to:

View available endpoints
Inspect request schemas
Test API requests
Provide authentication tokens
Inspect API responses
Understand the backend contract
25. Main API Areas
Area	Endpoint	Purpose
Authentication	POST /auth/register	Register a user
Authentication	POST /auth/login	Authenticate user
Authentication	GET /auth/me	Get current user
Conversations	POST /conversations	Create conversation
Conversations	GET /conversations	List conversations
Conversations	DELETE /conversations/{conversation_id}	Delete conversation
Documents	POST /documents/upload	Upload and process document
Documents	GET /documents	Retrieve documents
Chat	POST /chat	Ask RAG question
Messages	Message API	Persistent chat messages
26. Error Handling

The FastAPI backend uses HTTP status codes to communicate request results.

Typical categories include:

2xx → Successful request

4xx → Client-side/request/authentication error

5xx → Server-side error

Examples of situations handled by the application include:

Invalid credentials
Unauthorized requests
Invalid conversation
Access to another user's resource
Unsupported document format
Invalid upload
Missing document information
RAG retrieval with no relevant results
Internal processing errors
27. API Design Principles

The API follows these principles:

REST-style HTTP endpoints
JWT-based authentication
User ownership validation
Conversation-level isolation
Persistent chat history
Modular FastAPI route structure
Service-layer separation
MongoDB-based persistence
Vector-based semantic retrieval
Clear failure handling
28. Complete System Flow

The complete application flow can be summarized as:

                 React Frontend
                       │
                       ↓
                FastAPI REST API
                       │
          ┌────────────┼────────────┐
          ↓            ↓            ↓
      Auth API    Conversation   Document API
                       │            │
                       │            ↓
                       │       Text Extraction
                       │            ↓
                       │         Chunking
                       │            ↓
                       │       Embeddings
                       │            ↓
                       └────→ MongoDB Atlas
                                    │
                                    ↓
                              Vector Search
                                    │
                                    ↓
                               RAG Context
                                    │
                                    ↓
                                Groq LLM
                                    │
                                    ↓
                              Generated Answer
                                    │
                                    ↓
                             Message Storage
                                    │
                                    ↓
                              React Frontend
29. Future API Improvements

Potential future improvements include:

Streaming LLM responses
Pagination for conversations
Pagination for messages
Document deletion endpoint
Document metadata endpoint
Rename conversation endpoint
Rename/delete individual documents
Improved API validation
Rate limiting
API versioning
Production logging
Centralized exception handling
Request tracing
Health-check endpoint
Automated API tests
OpenAPI schema customization
30. Summary

The API provides the backend interface for the complete document-based AI assistant.

It connects:

React
  ↓
FastAPI
  ↓
Authentication
  ↓
Conversation Management
  ↓
Document Processing
  ↓
MongoDB Atlas Vector Search
  ↓
RAG
  ↓
Groq LLM
  ↓
Persistent Chat History