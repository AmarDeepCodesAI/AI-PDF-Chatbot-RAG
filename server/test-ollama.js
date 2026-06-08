const ollama = require("ollama").default;

async function test() {
  const response = await ollama.chat({
    model: "llama3.2:3b",
    messages: [
      {
        role: "user",
        content: "What is Node.js?",
      },
    ],
  });

  console.log(response.message.content);
}

test();