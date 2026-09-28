# Multi-Format-Document-RAG-System

An AI-powered document assistant that allows users to upload multiple document formats and ask questions about their own documents using **Retrieval-Augmented Generation (RAG)**.

multi-user RAG-based document assistant that enables users to upload PDF/DOCX documents and receive context-aware, source-cited answers through a FastAPI backend and React interface.



The system combines **FastAPI, React, MongoDB Atlas Vector Search, FastEmbed, and Groq LLMs** to retrieve relevant document content and generate grounded answers.

---

## 🚀 Key Features

- 📄 Upload multiple document formats
- 🔍 Semantic search using vector embeddings
- 🤖 AI-powered answers using Groq LLM
- 💬 Persistent conversations and chat history
- 👤 JWT-based user authentication
- 🔐 User-specific document and conversation isolation
- 📚 Multiple documents per conversation
- 🧠 Context-aware follow-up questions
- 📑 Source references for retrieved document content
- ⚡ FastAPI backend with React frontend
- 🗄️ MongoDB Atlas for persistent storage and vector search

### Supported Formats

`PDF` · `DOCX` · `TXT` · `MD` · `CSV` · `JSON` · `XLSX` · `PPTX`



## 🧠 How It Works

```text
User
 │
 ▼
React Frontend
 │
 ▼
FastAPI Backend
 │
 ├── Authentication
 │
 ├── Document Processing
 │      ├── Text Extraction
 │      └── Chunking
 │
 ├── Embedding Generation
 │      └── FastEmbed
 │
 ▼
MongoDB Atlas
 │
 └── Vector Search
 │
 ▼
Relevant Document Chunks
 │
 ▼
Groq LLM
 │
 ▼
Grounded Answer + Sources

---

| Layer               | Technologies                              |
| ------------------- | ----------------------------------------- |
| Frontend            | React, Vite                               |
| Backend             | FastAPI, Python                           |
| Database            | MongoDB Atlas                             |
| Vector Search       | MongoDB Atlas Vector Search               |
| Embeddings          | FastEmbed                                 |
| LLM                 | Groq                                      |
| Authentication      | JWT, bcrypt                               |
| Document Processing | pypdf, python-docx, openpyxl, python-pptx |
| API                 | REST                                      |
| Version Control     | Git, GitHub                               |


**## ⚙️ Local Setup #**

1. Clone the repository
git clone https://github.com/siddhu9009/multi-format-document-rag.git

cd multi-format-document-rag

2. Backend Setup
cd backend

python -m venv venv

Activate the virtual environment on Windows:

venv\Scripts\activate

Install dependencies:

pip install -r requirements.txt

Create a .env file:

MONGODB_URI=your_mongodb_connection_string
GROQ_API_KEY=your_groq_api_key

Run the backend:

uvicorn app.main:app --reload

Backend:

http://127.0.0.1:8000

API documentation:

http://127.0.0.1:8000/docs
3. Frontend Setup

Open another terminal:

cd frontend
npm install
npm run dev

The React application will be available at the URL shown by Vite, typically:

http://localhost:5173


👨‍💻 Author

Siddharth Khot

MCA | Generative AI & Python Backend Developer

GitHub:
https://github.com/siddhu9009
