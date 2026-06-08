const express = require("express");
const cors = require("cors");
const multer = require("multer");
const fs = require("fs");
const pdfParse = require("pdf-parse");

const app = express();

app.use(cors());
app.use(express.json());

const upload = multer({ dest: "uploads/" });

let uploadedText = "";
let uploadedChunks = [];

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

function searchRelevantChunks(question, chunks) {
  const questionWords = question
    .toLowerCase()
    .split(/\s+/)
    .filter((word) => word.length > 2);

  return chunks
    .map((chunk) => {
      const text = chunk.text.toLowerCase();

      const score = questionWords.reduce((count, word) => {
        return text.includes(word) ? count + 1 : count;
      }, 0);

      return { ...chunk, score };
    })
    .filter((chunk) => chunk.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 4);
}

app.get("/", (req, res) => {
  res.json({ message: "RAG Chatbot Backend Running" });
});

console.log("Upload route loaded...");

app.post("/api/upload", upload.single("pdf"), async (req, res) => {
  try {
    console.log("File received:", req.file);

    if (!req.file) {
      return res.status(400).json({ message: "PDF file is required" });
    }

    const fileBuffer = fs.readFileSync(req.file.path);
    const pdfData = await pdfParse(fileBuffer);

    uploadedText = pdfData.text;
    uploadedChunks = splitTextIntoChunks(uploadedText);

    res.json({
      message: "PDF uploaded successfully",
      fileName: req.file.originalname,
      totalPages: pdfData.numpages,
      totalChunks: uploadedChunks.length,
      textPreview: pdfData.text.slice(0, 1000),
    });
  } catch (error) {
    console.error("Upload Error:", error);
    res.status(500).json({ message: "Something went wrong" });
  }
});

app.post("/api/chat", async (req, res) => {
  try {
    const { question } = req.body || {};

    if (!uploadedChunks.length) {
      return res.status(400).json({ message: "Please upload PDF first" });
    }

    if (!question) {
      return res.status(400).json({ message: "Question is required" });
    }

    let relevantChunks = searchRelevantChunks(question, uploadedChunks);

    if (!relevantChunks.length) {
      relevantChunks = uploadedChunks.slice(0, 3);
    }

    const context = relevantChunks.map((chunk) => chunk.text).join("\n\n");

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
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
    });

    res.json({
      answer: response.message.content,
      sources: relevantChunks.map((chunk) => ({
        chunkNo: chunk.chunkNo,
        preview: chunk.text.slice(0, 250),
      })),
    });
  } catch (error) {
    console.error("Chat Error:", error);
    res.status(500).json({ message: "Chat failed" });
  }
});

const PORT = 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log("Upload API => http://localhost:5000/api/upload");
  console.log("Chat API => http://localhost:5000/api/chat");
});