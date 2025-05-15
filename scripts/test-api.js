// Simple script to test the chat API
// Run with: node scripts/test-api.js

const fetch = require("node-fetch")

async function testChatAPI() {
  try {
    console.log("Testing chat API...")

    const response = await fetch("http://localhost:3000/api/chat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messages: [
          {
            role: "user",
            content: "Hello, what services does Swisscom offer?",
          },
        ],
        userId: "00000000-0000-0000-0000-000000000000",
        conversationId: null,
      }),
    })

    if (!response.ok) {
      throw new Error(`API request failed with status ${response.status}`)
    }

    console.log("API response status:", response.status)

    // Read the streaming response
    const reader = response.body.getReader()
    const decoder = new TextDecoder()

    console.log("Response content:")

    while (true) {
      const { done, value } = await reader.read()

      if (done) {
        break
      }

      const chunk = decoder.decode(value)
      console.log(chunk)
    }

    console.log("Test completed successfully")
  } catch (error) {
    console.error("Error testing API:", error)
  }
}

testChatAPI()
