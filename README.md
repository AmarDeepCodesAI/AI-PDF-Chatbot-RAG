# AI PDF Chatbot (RAG)

A Retrieval-Augmented Generation (RAG) chatbot that allows users to upload PDF documents and ask context-aware questions.

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