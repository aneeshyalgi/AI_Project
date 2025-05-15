import { type NextRequest, NextResponse } from "next/server"

export async function POST(req: NextRequest) {
  try {
    console.log("Chat test API called")

    // Parse the request body
    const body = await req.json()
    console.log("Request body:", JSON.stringify(body))

    // Create a simple response
    const responseText =
      "Hello! This is a test response from the Swisscom AI Assistant. I'm here to help you with your questions about Swisscom products and services."

    // Create a readable stream for the response
    const encoder = new TextEncoder()
    const readable = new ReadableStream({
      async start(controller) {
        try {
          // Send the response in chunks to simulate streaming
          const chunks = responseText.split(". ")

          for (const chunk of chunks) {
            // Format as SSE
            const formattedChunk = `data: ${JSON.stringify({ text: chunk + ". " })}\n\n`
            controller.enqueue(encoder.encode(formattedChunk))

            // Add a small delay to simulate streaming
            await new Promise((resolve) => setTimeout(resolve, 100))
          }

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

    // Set headers for streaming response
    const headers = new Headers()
    headers.set("Content-Type", "text/event-stream")
    headers.set("Cache-Control", "no-cache")
    headers.set("Connection", "keep-alive")

    console.log("Sending response stream")
    return new NextResponse(readable, { headers })
  } catch (error) {
    console.error("Error in chat-test API:", error)
    return NextResponse.json({ error: "An error occurred while processing your request" }, { status: 500 })
  }
}
