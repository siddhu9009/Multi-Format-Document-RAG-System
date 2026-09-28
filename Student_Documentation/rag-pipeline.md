# RAG Pipeline

## 1. Overview

The Multi-Format Document RAG System uses Retrieval-Augmented Generation (RAG) to answer questions based on documents uploaded by the user.

Instead of sending an entire document to the Large Language Model (LLM), the system:

1. Extracts text from the uploaded document.
2. Splits the text into smaller chunks.
3. Generates vector embeddings for each chunk.
4. Stores the chunks and embeddings in MongoDB Atlas.
5. Converts the user's question into an embedding.
6. Searches MongoDB Atlas Vector Search for relevant chunks.
7. Builds a context from the retrieved chunks.
8. Sends the context and conversation information to the Groq LLM.
9. Returns the generated answer along with source information.
10. Stores the conversation message for future follow-up questions.

---

## 2. RAG Pipeline Overview

```text
                 DOCUMENT INGESTION
                        │
                        ▼
                 Upload Document
                        │
                        ▼
                  Text Extraction
                        │
                        ▼
                     Chunking
                        │
                        ▼
                   Embeddings
                        │
                        ▼
                 MongoDB Storage
                        │
                        ▼
               MongoDB Vector Index


                 QUERY PIPELINE
                        │
                        ▼
                  User Question
                        │
                        ▼
                  Query Embedding
                        │
                        ▼
              MongoDB Vector Search
                        │
                        ▼
              Relevant Document Chunks
                        │
                        ▼
                  RAG Context
                        │
                        ▼
                    Groq LLM
                        │
                        ▼
                Generated Answer
                        │
                        ▼
                  Sources + Answer

3. Document Ingestion Pipeline

Document ingestion is the process of converting an uploaded document into searchable vector data.

Upload
  ↓
Validation
  ↓
Text Extraction
  ↓
Chunking
  ↓
Embedding Generation
  ↓
MongoDB Storage
3.1 Document Upload

The user uploads a supported document through the React frontend.

Supported formats include:

PDF
DOCX
TXT
MD
CSV
JSON
XLSX
PPTX

The frontend sends the document to the FastAPI backend.

The backend validates the uploaded file before processing it.

3.2 File Validation

Before processing, the backend checks whether the uploaded file has a supported extension.

This prevents unsupported files from entering the document-processing pipeline.

The system also associates the uploaded document with:

user_id
conversation_id
document_id
document_name

These identifiers are important for document ownership and retrieval isolation.

4. Text Extraction

After validation, the system extracts readable text from the document.

Different file formats require different extraction mechanisms.

Conceptually:

PDF
 │
 └── PDF Text Extraction

DOCX
 │
 └── DOCX Text Extraction

TXT / MD
 │
 └── Plain Text Reading

CSV / JSON
 │
 └── Structured Data → Text

XLSX
 │
 └── Spreadsheet Data → Text

PPTX
 │
 └── Slide Text Extraction

The goal is to convert different document formats into a common text representation that can be processed by the same RAG pipeline.

5. Text Chunking

Large documents cannot efficiently be passed directly to the LLM.

Therefore, extracted text is divided into smaller chunks.

The current configuration is:

Chunk Size: 500 characters
Overlap:    100 characters

Example:

Original Document
        │
        ▼
┌──────────────────────┐
│ Chunk 1              │
│ 500 characters       │
└──────────────────────┘
          │
          │ 100 character overlap
          ▼
┌──────────────────────┐
│ Chunk 2              │
│ 500 characters       │
└──────────────────────┘
          │
          │ 100 character overlap
          ▼
┌──────────────────────┐
│ Chunk 3              │
│ 500 characters       │
└──────────────────────┘
Why use overlap?

Without overlap, important information near a chunk boundary could be separated from the surrounding context.

For example:

Chunk 1:
"The main advantage of IoT is its ability to..."

Chunk 2:
"...connect physical devices and exchange data."

With overlap, the second chunk can retain some context from the first chunk.

6. Chunk Metadata

Each chunk is stored with metadata.

Conceptually, a chunk document contains:

{
    user_id,
    conversation_id,
    document_id,
    document_name,
    chunk_index,
    text,
    embedding
}

This metadata allows the system to determine:

Which user owns the chunk
Which conversation it belongs to
Which document it came from
The position of the chunk
The original text
The vector representation
7. Embedding Generation

After chunking, every chunk is converted into a vector representation.

The project uses FastEmbed with:

qdrant/bge-small-en-v1.5-onnx

The generated vectors contain:

384 dimensions

The process is:

Text Chunk
    │
    ▼
FastEmbed
    │
    ▼
384-Dimensional Vector
    │
    ▼
MongoDB

An embedding represents the semantic meaning of the text numerically.

This allows the system to compare the meaning of a user question with the meaning of document chunks.

8. Vector Storage

The generated embeddings are stored in MongoDB Atlas together with their corresponding text chunks.

MongoDB Atlas Vector Search is configured with:

Index:      vector_index
Path:       embedding
Dimensions: 384
Similarity: Cosine

The vector index allows MongoDB to perform semantic similarity searches over the stored document embeddings.

9. Query Processing

When the user asks a question, the question goes through a similar embedding process.

User Question
      │
      ▼
FastEmbed
      │
      ▼
Query Vector
      │
      ▼
MongoDB Vector Search

The important point is that both:

Document chunks

and

User questions

are represented in the same vector space.

This makes semantic similarity search possible.

10. Vector Retrieval

The query embedding is used to search the MongoDB Vector Search index.

The system searches for document chunks that are semantically similar to the user's question.

Conceptually:

User Question
      │
      ▼
Query Embedding
      │
      ▼
MongoDB Vector Search
      │
      ▼
Similarity Comparison
      │
      ▼
Most Relevant Chunks

The current retrieval configuration uses:

numCandidates: 50
limit:         5
similarity:    Cosine

The search first considers candidate vectors and then returns the most relevant chunks.

11. Data Isolation During Retrieval

Retrieval is not performed across every document stored in the database.

The search is restricted using:

user_id
conversation_id

Conceptually:

                 MongoDB
                    │
        ┌───────────┼───────────┐
        ▼           ▼           ▼
      User A      User B      User C
        │           │           │
        ▼           ▼           ▼
   Conversations Conversations Conversations
        │
        ▼
 Current Conversation
        │
        ▼
 Relevant Document Chunks

This prevents the system from retrieving another user's documents or documents belonging to another conversation.

12. Building the RAG Context

After retrieval, the relevant chunks are combined into a context.

Conceptually:

Retrieved Chunk 1
Retrieved Chunk 2
Retrieved Chunk 3
Retrieved Chunk 4
Retrieved Chunk 5
        │
        ▼
   RAG Context

The context includes information such as:

Document Name
Chunk Index
Chunk Text

This gives the LLM information about where the retrieved content originated.

13. Conversation History

The system also supports persistent conversations.

For follow-up questions, relevant previous messages can be included as conversational context.

Example:

User:
What is IoT?

Assistant:
IoT stands for Internet of Things...

User:
What are its applications?

The previous conversation helps the system understand references such as:

"its"

However, conversation history does not replace document retrieval.

The RAG pipeline still retrieves relevant document content before generating the answer.

14. Prompt Construction

The retrieved document context and conversation information are provided to the LLM.

Conceptually:

System Instructions
        +
Retrieved Document Context
        +
Conversation History
        +
Current User Question
        │
        ▼
     LLM Prompt

The purpose of the prompt is to guide the model to answer using the retrieved document information.

This reduces the possibility of generating an answer unrelated to the uploaded documents.

15. LLM Generation

The project uses Groq for LLM inference.

Configured model:

openai/gpt-oss-20b

The LLM receives:

Retrieved Context
+
Conversation Context
+
User Question

and generates:

Answer
+
Source Information

The LLM is responsible for generating a natural-language response, while MongoDB Vector Search is responsible for finding relevant document information.

16. Source Information

Retrieved chunks are associated with their original document metadata.

This allows the response to provide source information such as:

Document Name
Chunk Index

Conceptually:

Answer
  │
  ├── Source: Python Notes.pdf
  │           Chunk: 3
  │
  └── Source: RAG Research.docx
              Chunk: 7

This makes the response more transparent and helps the user identify where the information came from.

17. Handling Missing Information

If the vector search does not return relevant document content, the system does not attempt to invent a document-based answer.

Instead, it returns:

I could not find the answer in the uploaded documents.

This provides a simple grounding mechanism for document-based questions.

18. Message Persistence

After the response is generated, the conversation messages are stored in MongoDB.

Conceptually:

User Question
      │
      ▼
RAG Pipeline
      │
      ▼
AI Answer
      │
      ▼
Save User Message
      │
      ▼
Save Assistant Message
      │
      ▼
Conversation History

This allows the user to close the application and later continue the same conversation.

19. Complete RAG Flow

The complete workflow can be summarized as:

                    DOCUMENT INGESTION

Uploaded Document
       │
       ▼
File Validation
       │
       ▼
Text Extraction
       │
       ▼
Text Chunking
       │
       ▼
FastEmbed
       │
       ▼
Vector Embeddings
       │
       ▼
MongoDB Atlas
       │
       ▼
MongoDB Vector Index


                    USER QUERY

User Question
       │
       ▼
Authentication
       │
       ▼
Conversation Validation
       │
       ▼
FastEmbed
       │
       ▼
Query Embedding
       │
       ▼
MongoDB Vector Search
       │
       ▼
User + Conversation Filtering
       │
       ▼
Top Relevant Chunks
       │
       ▼
Build RAG Context
       │
       ├── Document Chunks
       └── Conversation History
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
Store Messages
       │
       ▼
Return Response
20. Why RAG?

A general-purpose LLM may not have access to a user's private documents.

RAG provides a way to connect an LLM with external knowledge.

Instead of:

User Question
      ↓
LLM
      ↓
Answer

this system uses:

User Question
      ↓
Retrieve Relevant Information
      ↓
Provide Retrieved Context
      ↓
LLM
      ↓
Grounded Answer

This approach is useful for applications such as:

Personal document assistants
Company knowledge bases
Research assistants
Internal documentation systems
Educational document assistants
Enterprise knowledge search
21. Current RAG Configuration
Component	Configuration
Chunk Size	500 characters
Chunk Overlap	100 characters
Embedding Model	qdrant/bge-small-en-v1.5-onnx
Embedding Dimensions	384
Vector Database	MongoDB Atlas
Vector Index	vector_index
Similarity	Cosine
Candidate Vectors	50
Retrieved Chunks	5
LLM Provider	Groq
LLM Model	openai/gpt-oss-20b
Temperature	0
22. Future RAG Improvements

Potential improvements to the current RAG pipeline include:

Semantic chunking
Recursive text splitting
Metadata-aware retrieval
Hybrid keyword + vector search
Retrieval reranking
Query rewriting
Multi-query retrieval
Context compression
RAG evaluation metrics
Citation quality evaluation
Streaming responses
Background document processing
Document-level access controls
RAG observability and monitoring