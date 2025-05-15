// Test script for OpenAI API
// Run with: node scripts/test-openai.js

require("dotenv").config()
const { OpenAI } = require("openai")

// Create OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

async function testOpenAI() {
  try {
    console.log("Testing OpenAI API...")
    console.log("API Key available:", !!process.env.OPENAI_API_KEY)

    if (!process.env.OPENAI_API_KEY) {
      console.error("ERROR: OPENAI_API_KEY is not set in environment variables")
      return
    }

    // Test a simple completion
    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        { role: "system", content: "You are a helpful assistant." },
        { role: "user", content: "Hello, how are you?" },
      ],
      max_tokens: 100,
    })

    console.log("OpenAI API response:")
    console.log(completion.choices[0].message.content)
    console.log("\nAPI test completed successfully")
  } catch (error) {
    console.error("Error testing OpenAI API:", error)
  }
}

testOpenAI()
