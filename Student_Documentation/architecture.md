# System Architecture

## 1. Overview

The Multi-Format Document RAG System follows a client-server architecture.

The application consists of:

- React frontend
- FastAPI backend
- MongoDB Atlas database
- MongoDB Atlas Vector Search
- FastEmbed embedding model
- Groq LLM
- JWT-based authentication

The backend acts as the central layer responsible for authentication, document processing, retrieval, conversation management, and communication with external AI services.

---

## 2. High-Level Architecture

```text
                    ┌─────────────────────┐
                    │       User          │
                    └──────────┬──────────┘
                               │
                               ▼
                    ┌─────────────────────┐
                    │   React Frontend    │
                    │      + Vite         │
                    └──────────┬──────────┘
                               │ REST API
                               ▼
                    ┌─────────────────────┐
                    │   FastAPI Backend   │
                    ├─────────────────────┤
                    │ Authentication      │
                    │ Conversations       │
                    │ Documents           │
                    │ Chat / RAG          │
                    │ Messages            │
                    └───────┬─────┬───────┘
                            │     │
                 ┌──────────┘     └──────────┐
                 ▼                           ▼
       ┌───────────────────┐       ┌───────────────────┐
       │   MongoDB Atlas   │       │     Groq LLM      │
       │                   │       │                   │
       │ Users             │       │ Answer Generation │
       │ Conversations     │       └───────────────────┘
       │ Messages          │
       │ Documents         │
       │ Document Chunks   │
       │ Vector Embeddings │
       └─────────┬─────────┘
                 │
                 ▼
       ┌───────────────────┐
       │ MongoDB Vector    │
       │ Search            │
       └───────────────────┘


## 
## 3. Frontend Layer

The frontend is built using React and Vite.

Its responsibilities include:

User registration
User login
Authentication state management
Conversation sidebar
Creating and switching conversations
Document upload
Sending questions
Displaying AI responses
Displaying retrieved document sources
Loading persistent chat history

The frontend communicates with the backend through REST APIs.




# 4. Backend Layer

The backend is built using FastAPI.

The backend follows a route-service architecture where API handling and business logic are separated.

Routes
routes/
├── auth.py
├── chat.py
├── conversation.py
├── documents.py
├── message.py
└── upload.py

Routes are responsible for:

Receiving HTTP requests
Validating request data
Checking authentication
Calling the appropriate service
Returning API responses
Services
services/
├── access_service.py
├── auth_dependency.py
├── auth_service.py
├── chunk_service.py
├── conversation_service.py
├── document_processing_service.py
├── document_query_service.py
├── document_service.py
├── embedding_service.py
├── llm_service.py
├── message_service.py
├── rag_service.py
├── vector_search_service.py
└── vector_store.py

The service layer contains the application's core business logic.

Examples:

auth_service.py handles authentication-related operations.
conversation_service.py manages conversations.
message_service.py manages persistent messages.
document_processing_service.py handles document extraction and processing.
chunk_service.py handles text chunking.
embedding_service.py generates vector embeddings.
vector_search_service.py performs semantic retrieval.
rag_service.py coordinates the complete RAG workflow.
llm_service.py communicates with the Groq API.
vector_store.py handles vector-related database operations.




# 5. Document Processing Architecture

When a user uploads a document, the backend processes it through multiple stages.

Document Upload
      │
      ▼
Validate File
      │
      ▼
Extract Text
      │
      ▼
Split Text into Chunks
      │
      ▼
Generate Embeddings
      │
      ▼
Store Chunks + Embeddings
      │
      ▼
MongoDB Atlas

The application supports:

PDF
DOCX
TXT
MD
CSV
JSON
XLSX
PPTX

The extracted content is divided into smaller chunks before embedding.

The current chunking configuration is:

Chunk Size: 500 characters
Overlap:    100 characters

The overlap helps preserve contextual continuity between neighboring chunks.




# 6. Embedding Architecture

Each document chunk is converted into a numerical vector representation using FastEmbed.

The project uses:

qdrant/bge-small-en-v1.5-onnx

The embedding dimension is:

384

The generated embedding is stored together with the corresponding document chunk in MongoDB.

Conceptually:

Document Chunk
      │
      ▼
FastEmbed
      │
      ▼
384-Dimensional Vector
      │
      ▼
MongoDB Atlas

The same embedding model is used to convert user questions into vectors during retrieval.





# 7. RAG Query Architecture

When a user asks a question, the system follows the Retrieval-Augmented Generation workflow.

User Question
      │
      ▼
Authentication
      │
      ▼
Conversation Validation
      │
      ▼
Generate Query Embedding
      │
      ▼
MongoDB Vector Search
      │
      ▼
Retrieve Relevant Chunks
      │
      ▼
Build RAG Context
      │
      ├── Retrieved Document Chunks
      │
      └── Relevant Conversation History
      │
      ▼
Groq LLM
      │
      ▼
Generated Answer
      │
      ├── Answer
      └── Sources
      │
      ▼
Store Message
      │
      ▼
Return Response

The system does not send the entire document to the LLM.

Instead, it retrieves the most relevant chunks using semantic similarity and provides those chunks as context.




# 8. MongoDB Vector Search

MongoDB Atlas Vector Search is used to find document chunks that are semantically similar to the user's question.

The vector search uses the configured:

Index:       vector_index
Path:        embedding
Dimensions:  384
Similarity:  Cosine

The retrieval process can be represented as:

User Question
      │
      ▼
Query Embedding
      │
      ▼
MongoDB Vector Search
      │
      ▼
Similarity Matching
      │
      ▼
Top Relevant Chunks

The search is additionally restricted using the authenticated user's identity and conversation identity.



# 9. Data Isolation

The application supports multiple users and multiple conversations.

Each document chunk contains identifiers that associate it with its owner and conversation.

Conceptually:

User A
 │
 ├── Conversation 1
 │      ├── Document A
 │      └── Document B
 │
 └── Conversation 2
        └── Document C

Another user has a separate data scope:

User B
 │
 └── Conversation 1
        └── Document X

During vector retrieval, the system applies:

user_id
+
conversation_id

This prevents documents belonging to another user or another conversation from being included in the RAG context.



 
 # 10. Multiple Documents per Conversation

A conversation can contain multiple documents.

For example:

Conversation 1
│
├── Python Notes.pdf
├── Machine Learning.pdf
└── RAG Research.docx

When the user asks a question, the vector search can retrieve relevant chunks from any of the documents belonging to that conversation.

The system does not require the user to manually select a single document before asking a question.




# 11. Conversation and Message Architecture

Conversations and messages are stored persistently in MongoDB.

The relationship is:

User
 │
 └── Conversations
       │
       ├── Conversation 1
       │      ├── Message 1
       │      ├── Message 2
       │      └── Message 3
       │
       └── Conversation 2
              ├── Message 1
              └── Message 2

This allows users to:

Create multiple conversations
Switch between conversations
Continue previous conversations
Preserve chat history
Delete conversations

The conversation title can be generated from the user's initial question.



# 12. Conversation Context

For follow-up questions, previous conversation messages can be included as conversational context.

For example:

User:
What is IoT?

Assistant:
IoT stands for Internet of Things...

User:
What are its applications?

The second question can use the previous conversation context to understand what "its" refers to.

The system still relies on retrieved document content for document-grounded answers.

Conversation history is used for conversational continuity rather than replacing document retrieval.




# 13. Authentication Architecture

The application uses JWT-based authentication.

User
 │
 ▼
Register / Login
 │
 ▼
Validate Credentials
 │
 ▼
Generate JWT
 │
 ▼
Frontend Stores Token
 │
 ▼
Token Sent with Protected Requests
 │
 ▼
Backend Validates JWT
 │
 ▼
Identify Authenticated User

Protected operations require a valid authenticated user.

The authenticated user's identity is then used for authorization and data isolation.



# 14. Database Architecture

MongoDB Atlas stores the application's persistent data.

The main logical data areas are:

Users
Conversations
Messages
Documents
Document Chunks
Embeddings

Document chunks contain information such as:

user_id
conversation_id
document_id
document_name
chunk_index
text
embedding

This structure allows the system to associate each vector with its source document, conversation, and user.




# 15. External AI Services

FastEmbed

FastEmbed is used to generate vector embeddings for:

Document chunks
User queries

Model:

qdrant/bge-small-en-v1.5-onnx

Embedding dimension:

384
Groq

Groq is used for final answer generation.

Configured model:

openai/gpt-oss-20b

The LLM receives the retrieved document context and relevant conversation history before generating the response.





16. End-to-End Request Flow

The complete user workflow can be summarized as follows:

                    USER
                      │
                      ▼
              React Frontend
                      │
                      ▼
               FastAPI Backend
                      │
          ┌───────────┴───────────┐
          │                       │
          ▼                       ▼
   Authentication          Conversation
          │                   Validation
          │                       │
          └───────────┬───────────┘
                      │
                      ▼
                User Question
                      │
                      ▼
              Generate Embedding
                      │
                      ▼
           MongoDB Vector Search
                      │
                      ▼
             Relevant Chunks
                      │
                      ▼
              Build RAG Context
                      │
                      ▼
                  Groq LLM
                      │
                      ▼
              Generated Answer
                      │
                      ▼
              Save Chat Message
                      │
                      ▼
                React Frontend




17. Error Handling

The application handles several failure scenarios, including:

Invalid authentication
Unauthorized conversation access
Unsupported file formats
Invalid document uploads
Missing documents
Empty vector search results
External LLM/API failures

When no relevant document content is found, the application returns:

I could not find the answer in the uploaded documents.

This helps keep responses grounded in the uploaded documents.

18. Design Principles
Separation of Concerns

API routes, business logic, database operations, and AI services are separated into different modules.

Data Isolation

User and conversation identifiers are used to restrict document retrieval.

Persistent State

Conversations and messages are stored in MongoDB rather than relying only on frontend state.

Modular Services

Individual responsibilities are implemented as separate services, making the backend easier to maintain and extend.

Retrieval-Grounded Generation

The LLM receives retrieved document context so that responses can be grounded in the user's uploaded documents.

Lightweight AI Infrastructure

The project uses FastEmbed with an ONNX-based embedding model instead of requiring a large local generative model.

19. Future Architecture Improvements

Potential improvements include:

Streaming LLM responses
Retrieval reranking
Hybrid keyword + vector search
Background document processing
Improved document deletion and re-indexing
RAG evaluation and monitoring
Cloud deployment
More advanced agentic workflows
Improved observability and logging