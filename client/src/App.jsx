import { useState } from "react";
import axios from "axios";
import "./index.css";

function App() {
  const [pdf, setPdf] = useState(null);
  const [question, setQuestion] = useState("");
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [pdfInfo, setPdfInfo] = useState(null);

  const uploadPdf = async () => {
    if (!pdf) return alert("Please select a PDF first");

    try {
      setUploading(true);

      const formData = new FormData();
      formData.append("pdf", pdf);

      const response = await axios.post(
        "http://localhost:5000/api/upload",
        formData
      );

      setPdfInfo({
        fileName: response.data.fileName,
        totalPages: response.data.totalPages,
        totalChunks: response.data.totalChunks,
      });

      setMessages([]);
      alert("PDF uploaded and indexed successfully");
    } catch (error) {
      console.error(error);
      alert("Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const askQuestion = async () => {
    if (!question.trim()) return alert("Please enter a question");

    const userQuestion = question;

    setMessages((prev) => [
      ...prev,
      {
        role: "user",
        text: userQuestion,
      },
    ]);

    setQuestion("");

    try {
      setLoading(true);

      const response = await axios.post("http://localhost:5000/api/chat", {
        question: userQuestion,
      });

      setMessages((prev) => [
        ...prev,
        {
          role: "ai",
          text: response.data.answer,
          sources: response.data.sources || [],
        },
      ]);
    } catch (error) {
      console.error(error);
      alert("Question failed");
    } finally {
      setLoading(false);
    }
  };

  const suggestedQuestions = [
    "What are the technical skills?",
    "What projects are mentioned?",
    "What is the education background?",
    "What experience does the candidate have?",
  ];

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white">
      <div className="mx-auto max-w-6xl px-6 py-10">
        <div className="mb-8 rounded-3xl border border-slate-800 bg-slate-900/80 p-8 shadow-2xl">
          <p className="mb-2 text-sm font-semibold uppercase tracking-widest text-cyan-400">
            Local RAG Assistant
          </p>
          <h1 className="text-4xl font-bold tracking-tight md:text-5xl">
            AI PDF Chatbot
          </h1>
          <p className="mt-4 max-w-3xl text-slate-400">
            Upload a PDF and ask questions from its content using React,
            Node.js, Ollama and a RAG-based retrieval flow.
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6 lg:col-span-1">
            <h2 className="mb-4 text-xl font-semibold">Upload PDF</h2>

            <label className="flex cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed border-slate-700 bg-slate-950 p-8 text-center transition hover:border-cyan-400">
              <span className="text-sm text-slate-400">
                Choose your PDF document
              </span>
              <span className="mt-2 break-all text-sm font-medium text-cyan-400">
                {pdf ? pdf.name : "No file selected"}
              </span>
              <input
                type="file"
                accept=".pdf"
                className="hidden"
                onChange={(e) => setPdf(e.target.files[0])}
              />
            </label>

            <button
              onClick={uploadPdf}
              disabled={uploading}
              className="mt-5 w-full rounded-xl bg-cyan-500 px-4 py-3 font-semibold text-slate-950 transition hover:bg-cyan-400 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {uploading ? "Uploading..." : "Upload PDF"}
            </button>

            {pdfInfo && (
              <div className="mt-5 rounded-xl border border-slate-800 bg-slate-950 p-4">
                <p className="mb-2 text-sm font-semibold text-cyan-400">
                  PDF Indexed ✅
                </p>
                <p className="break-all text-sm text-slate-300">
                  {pdfInfo.fileName}
                </p>
                <p className="mt-2 text-xs text-slate-500">
                  Pages: {pdfInfo.totalPages} | Chunks: {pdfInfo.totalChunks}
                </p>
              </div>
            )}

            <div className="mt-6">
              <h3 className="mb-3 text-sm font-semibold text-slate-300">
                Suggested Questions
              </h3>
              <div className="space-y-2">
                {suggestedQuestions.map((item) => (
                  <button
                    key={item}
                    onClick={() => setQuestion(item)}
                    className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-left text-sm text-slate-300 transition hover:border-cyan-400 hover:text-cyan-400"
                  >
                    {item}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6 lg:col-span-2">
            <h2 className="mb-4 text-xl font-semibold">Ask Question</h2>

            <textarea
              value={question}
              placeholder="Example: What are the technical skills?"
              onChange={(e) => setQuestion(e.target.value)}
              rows="5"
              className="w-full resize-none rounded-xl border border-slate-700 bg-slate-950 p-4 text-slate-100 outline-none transition placeholder:text-slate-500 focus:border-cyan-400"
            />

            <button
              onClick={askQuestion}
              disabled={loading}
              className="mt-5 w-full rounded-xl bg-indigo-500 px-4 py-3 font-semibold text-white transition hover:bg-indigo-400 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? "Thinking..." : "Ask AI"}
            </button>

            <div className="mt-6 rounded-2xl border border-slate-800 bg-slate-950 p-5">
              <button
  onClick={() => {
    if (window.confirm("Clear all chat history?")) {
      setMessages([]);
    }
  }}
  className="rounded-lg bg-red-500 px-3 py-2 text-sm font-medium text-white hover:bg-red-600"
>
  Clear Chat
</button>
              <h2 className="mb-4 text-xl font-semibold">Chat History</h2>

              {messages.length === 0 && !loading && (
                <p className="text-slate-500">
                  Your conversation will appear here.
                </p>
              )}

              <div className="space-y-5">
                {messages.map((msg, index) => (
                  <div
                    key={index}
                    className={`rounded-2xl p-4 ${
                      msg.role === "user"
                        ? "ml-auto max-w-2xl bg-cyan-500 text-slate-950"
                        : "mr-auto max-w-3xl border border-slate-800 bg-slate-900 text-slate-200"
                    }`}
                  >
                    <p className="mb-2 text-sm font-bold">
                      {msg.role === "user" ? "👨 User" : "🤖 AI"}
                    </p>

                    <p className="whitespace-pre-wrap leading-7">{msg.text}</p>

                    {msg.sources?.length > 0 && (
                      <div className="mt-4 space-y-2 border-t border-slate-800 pt-3">
                        <p className="text-sm font-semibold text-cyan-400">
                          Source Citations
                        </p>

                        {msg.sources.map((source) => (
                          <div
                            key={`${index}-${source.chunkNo}`}
                            className="rounded-xl border border-slate-800 bg-slate-950 p-3"
                          >
                            <p className="text-xs font-semibold text-cyan-400">
                              Chunk {source.chunkNo}
                            </p>
                            <p className="mt-1 text-xs text-slate-400">
                              {source.preview}
                            </p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}

                {loading && (
                  <div className="mr-auto max-w-3xl rounded-2xl border border-slate-800 bg-slate-900 p-4 text-cyan-400">
                    🤖 AI is reading the PDF and generating answer...
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        <p className="mt-8 text-center text-sm text-slate-500">
          Built with React, Node.js, Express, Ollama and PDF-based RAG.
        </p>
      </div>
    </div>
  );
}

export default App;