# AI PDF Chatbot (RAG)

A Retrieval-Augmented Generation (RAG) chatbot that allows users to upload PDF documents and ask context-aware questions.

📸 Application Screenshots
<img width="1912" height="911" alt="image" src="https://github.com/user-attachments/assets/41954c0e-67c8-4eae-a67c-589b83f4c086" />
<img width="1912" height="912" alt="image" src="https://github.com/user-attachments/assets/3c5e35e4-046b-4f59-9125-ce2cfbd1519e" />
<img width="1912" height="917" alt="image" src="https://github.com/user-attachments/assets/ae71bc34-7756-47f3-8dbd-79ab63ae2e92" />


## Features

- PDF Upload
- PDF Parsing
- Text Chunking
- Embeddings
- ChromaDB Vector Storage
- Semantic Search
- Ollama Integration
- Source Citations
- Chat History
- Modern React UI

## Tech Stack

Frontend:
- React.js
- Tailwind CSS
- Axios

Backend:
- Node.js
- Express.js
- Ollama

AI Stack:
- ChromaDB
- Transformers Embeddings
- RAG Pipeline

## Architecture

PDF → Chunking → Embeddings → ChromaDB → Semantic Search → Ollama → Answer

## Run

Server:

npm install
npm run dev

Client:

npm install
npm run dev
