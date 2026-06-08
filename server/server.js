const express = require("express");
const cors = require("cors");
const multer = require("multer");
const fs = require("fs");
const pdfParse = require("pdf-parse");
const { ChromaClient } = require("chromadb");

const app = express();

app.use(cors());
app.use(express.json());

const upload = multer({ dest: "uploads/" });

const chroma = new ChromaClient({
  path: "http://localhost:8000",
});

const COLLECTION_NAME = "rag_pdf_collection";

let collection = null;
let embeddingPipeline = null;

async function getEmbeddingPipeline() {
  if (!embeddingPipeline) {
    const { pipeline } = await import("@xenova/transformers");

    embeddingPipeline = await pipeline(
      "feature-extraction",
      "Xenova/all-MiniLM-L6-v2"
    );
  }

  return embeddingPipeline;
}

async function generateEmbedding(text) {
  const extractor = await getEmbeddingPipeline();

  const output = await extractor(text, {
    pooling: "mean",
    normalize: true,
  });

  return Array.from(output.data);
}

function splitTextIntoChunks(text, chunkSize = 1000) {
  const chunks = [];

  for (let i = 0; i < text.length; i += chunkSize) {
    chunks.push({
      chunkNo: chunks.length + 1,
      text: text.slice(i, i + chunkSize),
    });
  }

  return chunks;
}

app.get("/", (req, res) => {
  res.json({ message: "RAG Chatbot Backend Running with ChromaDB" });
});

app.post("/api/upload", upload.single("pdf"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "PDF file is required" });
    }

    const fileBuffer = fs.readFileSync(req.file.path);
    const pdfData = await pdfParse(fileBuffer);

    const chunks = splitTextIntoChunks(pdfData.text);

    await chroma.deleteCollection({ name: COLLECTION_NAME }).catch(() => { });

    collection = await chroma.getOrCreateCollection({
      name: COLLECTION_NAME,
      embeddingFunction: null,
    });

    const ids = [];
    const documents = [];
    const embeddings = [];
    const metadatas = [];

    for (const chunk of chunks) {
      const embedding = await generateEmbedding(chunk.text);

      ids.push(`chunk-${chunk.chunkNo}`);
      documents.push(chunk.text);
      embeddings.push(embedding);
      metadatas.push({
        chunkNo: chunk.chunkNo,
        fileName: req.file.originalname,
      });
    }

    await collection.add({
      ids,
      documents,
      embeddings,
      metadatas,
    });

    res.json({
      message: "PDF uploaded, chunked, embedded and stored in ChromaDB",
      fileName: req.file.originalname,
      totalPages: pdfData.numpages,
      totalChunks: chunks.length,
    });
  } catch (error) {
    console.error("Upload Error:", error);
    res.status(500).json({ message: "Upload failed", error: error.message });
  }
});

app.post("/api/chat", async (req, res) => {
  try {
    const { question } = req.body || {};

    if (!question) {
      return res.status(400).json({ message: "Question is required" });
    }

    if (!collection) {
      collection = await chroma.getOrCreateCollection({
        name: COLLECTION_NAME,
      });
    }

    const questionEmbedding = await generateEmbedding(question);

    const searchResult = await collection.query({
      queryEmbeddings: [questionEmbedding],
      nResults: 4,
    });

    const relevantChunks = searchResult.documents[0] || [];
    const metadatas = searchResult.metadatas[0] || [];

    const context = relevantChunks.join("\n\n");

    const prompt = `
You are a helpful AI assistant.
Answer only from the given PDF context.
If the answer is not available in the context, say:
"I don't know from the uploaded PDF."

PDF Context:
${context}

User Question:
${question}

Answer:
`;

    const ollama = require("ollama").default;

    const response = await ollama.chat({
      model: "llama3.2:3b",
      messages: [{ role: "user", content: prompt }],
    });

    res.json({
      answer: response.message.content,
      sources: relevantChunks.map((chunk, index) => ({
        chunkNo: metadatas[index]?.chunkNo || index + 1,
        preview: chunk.slice(0, 250),
      })),
    });
  } catch (error) {
    console.error("Chat Error:", error);
    res.status(500).json({ message: "Chat failed", error: error.message });
  }
});

const PORT = 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log("Upload API => http://localhost:5000/api/upload");
  console.log("Chat API => http://localhost:5000/api/chat");
});