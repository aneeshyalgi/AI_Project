import { type NextRequest, NextResponse } from "next/server"
import openai from "@/lib/openai"

export async function POST(req: NextRequest) {
  try {
    console.log("Chat API called")

    const { messages, userId, conversationId, settings } = await req.json()
    console.log("Request received with", messages.length, "messages")
    console.log("User settings:", settings)

    // Get the latest user message
    const latestMessage = messages[messages.length - 1]
    console.log("Latest message:", latestMessage.content)

    // System message with instructions
    const systemMessage = {
      role: "system",
      content: `You are a helpful customer service assistant for Swisscom, a Swiss telecommunications provider.
      Answer the user's questions about Swisscom products, services, and support.
      Be friendly, concise, and helpful. If you don't know the answer, say so and offer to connect the user with a human agent.
      Use a conversational tone and respond in the same language as the user's query (German, French, Italian, or English).`,
    }

    // Use settings if provided, otherwise use defaults
    const model = settings?.model || "gpt-3.5-turbo"
    const temperature = settings?.temperature || 0.7

    // Generate response using OpenAI directly
    console.log(`Calling OpenAI API with model: ${model}, temperature: ${temperature}`)
    const stream = await openai.chat.completions.create({
      model,
      messages: [systemMessage, ...messages],
      temperature,
      max_tokens: 1000,
      stream: true,
    })

    // Set headers for streaming response
    const headers = new Headers()
    headers.set("Content-Type", "text/event-stream")
    headers.set("Cache-Control", "no-cache")
    headers.set("Connection", "keep-alive")

    if (conversationId) {
      headers.set("X-Conversation-Id", conversationId)
    }

    // Create a readable stream
    const encoder = new TextEncoder()
    const readable = new ReadableStream({
      async start(controller) {
        try {
          console.log("Starting stream processing")
          for await (const chunk of stream) {
            const content = chunk.choices[0]?.delta?.content || ""
            if (content) {
              // Format as SSE
              const formattedChunk = `data: ${JSON.stringify({ text: content })}\n\n`
              controller.enqueue(encoder.encode(formattedChunk))
            }
          }
          console.log("Stream processing complete")
          controller.enqueue(encoder.encode("data: [DONE]\n\n"))
          controller.close()
        } catch (error) {
          console.error("Error in stream processing:", error)
          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({ text: " Sorry, there was an error processing your request." })}\n\n`,
            ),
          )
          controller.enqueue(encoder.encode("data: [DONE]\n\n"))
          controller.close()
        }
      },
    })

    console.log("Sending response stream")
    return new NextResponse(readable, { headers })
  } catch (error) {
    console.error("Error in chat API:", error)
    return NextResponse.json({ error: "An error occurred while processing your request" }, { status: 500 })
  }
}
