let uploadedText = "";

function splitTextIntoChunks(text, chunkSize = 1000) {
  const chunks = [];
  for (let i = 0; i < text.length; i += chunkSize) {
    chunks.push(text.slice(i, i + chunkSize));
  }
  return chunks;
}

app.post("/api/chat", async (req, res) => {
  try {
    const { question } = req.body;

    if (!uploadedText) {
      return res.status(400).json({ message: "Please upload PDF first" });
    }

    if (!question) {
      return res.status(400).json({ message: "Question is required" });
    }

    const chunks = splitTextIntoChunks(uploadedText);

    const context = chunks.slice(0, 4).join("\n\n");

    const prompt = `
You are a helpful AI assistant. Answer only from the given PDF context.

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
    });
  } catch (error) {
    console.error("Chat Error:", error);
    res.status(500).json({ message: "Chat failed" });
  }
});