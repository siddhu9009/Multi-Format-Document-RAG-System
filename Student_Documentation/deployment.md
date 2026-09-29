# Deployment Guide

This guide explains how to run, configure, and deploy the **Multi-Format Document RAG System** from local development to a production environment.

---

## 1. Overview

The Multi-Format Document RAG System consists of:

* **React + Vite** frontend
* **FastAPI** backend
* **MongoDB Atlas** database
* **MongoDB Atlas Vector Search**
* **Groq API**
* **FastEmbed** for document embeddings

For local development, the frontend and backend run separately.

For production, the frontend and backend can be deployed as cloud services so the application can remain available without running the project manually from a local computer.

---

# 2. Production Architecture

The recommended production architecture is:

```text
                        Internet
                           │
                           ↓
                   React Frontend
                  Cloud Deployment
                           │
                           │ HTTPS API Requests
                           ↓
                   FastAPI Backend
                  Cloud Deployment
                           │
              ┌────────────┼────────────┐
              ↓            ↓            ↓
       MongoDB Atlas    Groq API    File Processing
              │
              ↓
       MongoDB Vector Search
```

The local laptop is not required once the production services are deployed.

---

# 3. Local Development

During development, the application can be started using two terminals.

## Backend

Navigate to:

```text
backend/
```

Activate the virtual environment:

### Windows PowerShell

```powershell
.\venv\Scripts\Activate.ps1
```

Start FastAPI:

```bash
uvicorn app.main:app --reload
```

Backend:

```text
http://127.0.0.1:8000
```

Swagger:

```text
http://127.0.0.1:8000/docs
```

---

# 4. Frontend Development

Open another terminal and navigate to:

```text
frontend/
```

Install dependencies:

```bash
npm install
```

Start the Vite development server:

```bash
npm run dev
```

The frontend will normally be available at:

```text
http://localhost:5173
```

---

# 5. Why Two Servers Are Used Locally

The React frontend and FastAPI backend are separate applications.

```text
React/Vite
    │
    │ API requests
    ↓
FastAPI
    │
    ↓
MongoDB Atlas
```

Therefore, local development normally requires:

| Terminal   | Application |
| ---------- | ----------- |
| Terminal 1 | FastAPI     |
| Terminal 2 | React/Vite  |

This separation is useful because the frontend and backend can later be deployed independently.

---

# 6. Environment Variables

Sensitive configuration should not be hardcoded into the source code.

The backend uses environment variables for credentials and external services.

Example:

```env
MONGODB_URI=your_mongodb_connection_string
GROQ_API_KEY=your_groq_api_key
```

The `.env` file should **never** be committed to GitHub.

The repository should contain a `.gitignore` rule for:

```text
.env
```

---

# 7. MongoDB Atlas

The application uses **MongoDB Atlas** as its cloud database.

MongoDB Atlas stores:

* User information
* Conversations
* Messages
* Document chunks
* Embeddings

The application also uses **MongoDB Atlas Vector Search** for semantic document retrieval.

---

# 8. MongoDB Atlas Vector Search

The vector search configuration currently uses:

| Configuration   | Value                           |
| --------------- | ------------------------------- |
| Index           | `vector_index`                  |
| Embedding Model | `qdrant/bge-small-en-v1.5-onnx` |
| Dimensions      | `384`                           |
| Similarity      | `Cosine`                        |
| Vector Field    | `embedding`                     |

The vector field stored in document chunks is:

```text
embedding
```

---

# 9. MongoDB Atlas Network Access

During local development, MongoDB Atlas checks the IP address from which the backend connects.

If the current network IP is not allowed, the backend may fail to connect to MongoDB Atlas.

This can happen when switching between:

* Home Wi-Fi
* College Wi-Fi
* Mobile hotspot
* Different networks

---

# 10. Production Network Access

In production, the backend will run from a cloud server rather than the user's laptop.

Therefore, MongoDB Atlas will see the cloud backend's network connection instead of the developer's local connection.

The production setup should allow the deployed backend to connect to MongoDB Atlas according to the chosen hosting provider's networking model.

For development/testing, MongoDB Atlas may be configured with:

```text
0.0.0.0/0
```

This allows connections from any IP address.

However, this setting should be treated carefully because it broadens network access.

For production, a more restricted network configuration should be preferred whenever the deployment platform provides a stable outbound IP or another supported secure connectivity mechanism.

---

# 11. Important Deployment Principle

The React frontend should **not** connect directly to MongoDB Atlas.

The correct architecture is:

```text
React
  ↓
FastAPI Backend
  ↓
MongoDB Atlas
```

The MongoDB connection string remains on the backend.

This prevents database credentials from being exposed to frontend users.

---

# 12. Backend Deployment

The FastAPI application can be deployed to a cloud hosting provider that supports Python applications.

The production server should start the FastAPI application using a production-compatible ASGI server configuration.

Example:

```bash
uvicorn app.main:app --host 0.0.0.0 --port $PORT
```

The exact start command may vary depending on the hosting provider.

---

# 13. Backend Environment Configuration

The following variables should be configured in the backend hosting provider's environment-variable settings:

```env
MONGODB_URI=your_production_mongodb_uri
GROQ_API_KEY=your_groq_api_key
```

These values should be configured through the hosting platform rather than committed to GitHub.

---

# 14. Frontend Deployment

The React + Vite frontend is a static web application after building.

Build the frontend:

```bash
npm run build
```

This creates the production build:

```text
frontend/dist/
```

The `dist` directory can be deployed to a static hosting platform.

---

# 15. Frontend API Configuration

The production frontend must communicate with the deployed FastAPI backend rather than:

```text
http://127.0.0.1:8000
```

### Development

```text
React
  ↓
http://127.0.0.1:8000
```

### Production

```text
React
  ↓
https://your-backend-domain
```

The backend URL should therefore be configurable through the frontend environment configuration.

---

# 16. Recommended Production Environment

The final deployed architecture should look like:

```text
                         User
                          │
                          ↓
                 React Web Application
                          │
                          │ HTTPS
                          ↓
                  FastAPI Backend
                          │
              ┌───────────┴───────────┐
              ↓                       ↓
       MongoDB Atlas               Groq API
              │
              ↓
       MongoDB Vector Search
```

---

# 17. Deployment Sequence

A practical deployment sequence is:

```text
1. Verify backend locally
          ↓
2. Verify frontend locally
          ↓
3. Verify authentication
          ↓
4. Verify document upload
          ↓
5. Verify vector search
          ↓
6. Verify RAG responses
          ↓
7. Verify persistent conversations
          ↓
8. Push final code to GitHub
          ↓
9. Deploy FastAPI backend
          ↓
10. Configure backend environment variables
          ↓
11. Test MongoDB Atlas connection
          ↓
12. Deploy React frontend
          ↓
13. Configure production API URL
          ↓
14. Test frontend → backend communication
          ↓
15. Test complete production workflow
```

---

# 18. Production Testing Checklist

After deployment, verify the following.

## Authentication

* [ ] User registration works
* [ ] Login works
* [ ] JWT authentication works
* [ ] Logout works
* [ ] Unauthorized requests are rejected

## Conversations

* [ ] New conversation can be created
* [ ] Conversations appear in sidebar
* [ ] Existing conversation can be reopened
* [ ] Conversation deletion works

## Documents

* [ ] PDF upload works
* [ ] DOCX upload works
* [ ] TXT upload works
* [ ] Other supported formats work
* [ ] Invalid formats are rejected
* [ ] Multiple documents can be uploaded

## RAG

* [ ] Document text is extracted
* [ ] Chunks are created
* [ ] Embeddings are generated
* [ ] Embeddings are stored
* [ ] Vector search works
* [ ] Relevant chunks are retrieved
* [ ] Groq generates an answer
* [ ] Sources are returned

## Data Isolation

* [ ] User A cannot access User B's conversations
* [ ] User A cannot retrieve User B's documents
* [ ] Conversation 1 cannot retrieve Conversation 2's document chunks
* [ ] Chat history remains associated with the correct conversation

---

# 19. Production Security Checklist

Before making the application public:

* [ ] Never commit `.env`
* [ ] Never expose `GROQ_API_KEY`
* [ ] Never expose `MONGODB_URI`
* [ ] Use HTTPS
* [ ] Validate uploaded files
* [ ] Validate conversation ownership
* [ ] Validate user ownership
* [ ] Protect authenticated endpoints
* [ ] Restrict database access where possible
* [ ] Configure appropriate CORS
* [ ] Add production logging
* [ ] Avoid returning sensitive error details

---

# 20. CORS Configuration

Because the frontend and backend may be hosted on different domains, the FastAPI backend must allow requests from the production frontend origin.

Development may use:

```text
http://localhost:5173
```

Production should use the actual frontend domain.

For example:

```text
https://your-frontend-domain
```

Production CORS configuration should avoid allowing arbitrary origins unless there is a specific reason to do so.

---

# 21. File Upload Considerations

Document uploads are processed by the backend.

Production deployment should consider:

* Maximum upload size
* Allowed file extensions
* Temporary file cleanup
* Processing time
* Memory usage
* Concurrent uploads
* Malformed documents
* Storage strategy

The current application processes supported documents and stores their extracted chunks and embeddings in MongoDB.

---

# 22. Temporary File Handling

Uploaded files may be temporarily stored during processing.

The production system should ensure that temporary files do not accumulate indefinitely.

A future production improvement can include:

```text
Upload
  ↓
Process
  ↓
Extract text
  ↓
Generate chunks
  ↓
Generate embeddings
  ↓
Store in MongoDB
  ↓
Delete temporary file
```

---

# 23. Scaling Considerations

The current project is designed as a practical portfolio application.

If usage increases significantly, the architecture can be extended with:

```text
Load Balancer
      ↓
Multiple FastAPI Instances
      ↓
Background Job Queue
      ↓
MongoDB Atlas
```

Document processing can also be moved to background workers for large files or high upload volumes.

---

# 24. Monitoring

A production version should eventually include monitoring for:

* API errors
* Request latency
* Failed document processing
* MongoDB connection failures
* LLM API failures
* Vector search failures
* Authentication failures
* Upload failures

Useful production additions include:

* Application Logs
* Health Checks
* Error Tracking
* Performance Monitoring
* Database Monitoring

---

# 25. Health Check

A future improvement can provide a simple health endpoint:

```http
GET /health
```

Example response:

```json
{
  "status": "ok"
}
```

This allows a hosting platform or monitoring service to determine whether the backend is running.

---

# 26. GitHub and Deployment

The source code is maintained in GitHub.

Recommended workflow:

```text
Local Development
       ↓
Test
       ↓
Git Commit
       ↓
Git Push
       ↓
GitHub
       ↓
Automatic Deployment
```

With continuous deployment configured, pushing changes to the production branch can trigger a new deployment.

---

# 27. Deployment Environment Separation

A more advanced setup can use separate environments:

```text
Development
    ↓
Testing
    ↓
Production
```

Each environment can have separate:

* Environment variables
* Database configuration
* API keys
* Frontend API URLs

This reduces the risk of development changes affecting production.

---

# 28. Final Production Architecture

The intended production system is:

```text
                    ┌──────────────────────┐
                    │        User          │
                    └──────────┬───────────┘
                               │
                               ↓
                    ┌──────────────────────┐
                    │   React + Vite UI    │
                    │   Static Hosting     │
                    └──────────┬───────────┘
                               │
                         HTTPS REST API
                               │
                               ↓
                    ┌──────────────────────┐
                    │   FastAPI Backend    │
                    │   Cloud Hosting      │
                    └───────┬───────┬──────┘
                            │       │
                  ┌─────────┘       └──────────┐
                  ↓                            ↓
        ┌────────────────────┐       ┌────────────────┐
        │   MongoDB Atlas    │       │    Groq API    │
        │                    │       │                │
        │ Users              │       │ LLM Generation │
        │ Conversations      │       └────────────────┘
        │ Messages           │
        │ Document Chunks    │
        │ Embeddings         │
        │ Vector Search      │
        └────────────────────┘
```

---

# 29. Final Deployment Goal

The final application should allow a user to:

```text
Open public website
       ↓
Register / Login
       ↓
Create conversation
       ↓
Upload documents
       ↓
Ask questions
       ↓
Receive RAG answers
       ↓
Continue previous conversations
       ↓
Return later and access chat history
```

The developer should not need to:

* Start FastAPI manually
* Start React manually
* Upload documents manually
* Configure MongoDB every time
* Change the user's IP address manually

The goal is a publicly accessible application where the cloud infrastructure handles the backend, frontend, database connectivity, and AI services.

---

# 30. Future Deployment Improvements

Potential future improvements include:

* Custom domain
* HTTPS enforcement
* Automated CI/CD
* Docker deployment
* Production logging
* Health checks
* Monitoring
* Background document processing
* Object storage for uploaded files
* Rate limiting
* API versioning
* Automated tests
* More restrictive MongoDB network access
* Secret management
* Database backups
* Production error tracking

---

# 31. Summary

The application can be deployed using a separated frontend/backend architecture:

```text
React
  ↓
Cloud Static Hosting
  ↓
FastAPI
  ↓
MongoDB Atlas + Vector Search
  ↓
Groq
```

This architecture keeps database credentials and AI API keys on the backend while allowing users to access the application through a public web interface.

The local development environment remains useful for development, while the production deployment provides the always-available version of the application.
