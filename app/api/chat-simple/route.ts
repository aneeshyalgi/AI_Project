import { NextResponse } from "next/server"
import OpenAI from "openai"

export const runtime = "edge"

// Initialize the OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || "",
})

export async function POST(req: Request) {
  try {
    const { messages } = await req.json()

    // Mock Swisscom data for context
    const mockSwisscomData = [
      {
        title: "Swisscom Mobile Subscriptions",
        content:
          "Swisscom offers a range of mobile subscriptions including inOne mobile, which provides unlimited calls, SMS, and data within Switzerland. Plans vary from basic to premium with different international options and speeds.",
      },
      {
        title: "Swisscom TV",
        content:
          "Swisscom TV is a digital television service offering over 250 channels, replay functionality, and on-demand content. Premium packages include sports and entertainment options.",
      },
      {
        title: "Swisscom Internet",
        content:
          "Swisscom provides high-speed fiber optic internet with speeds up to 10 Gbit/s. All packages include a Swisscom Internet Box for optimal WiFi coverage.",
      },
      {
        title: "Technical Support",
        content:
          "Swisscom offers 24/7 technical support via phone at 0800 800 800, live chat on the website, or in-person at Swisscom Shops. Common issues can be resolved using the My Swisscom app.",
      },
    ]

    // Format the relevant data as context for the AI
    const companyContext = `Here is information from Swisscom's knowledge base that might help answer the query:\n\n${mockSwisscomData
      .map((item) => `${item.title}:\n${item.content}`)
      .join("\n\n")}`

    // Add system message to guide the AI's behavior
    const systemMessage = {
      role: "system",
      content: `You are a helpful, friendly, and professional customer service representative for Swisscom, Switzerland's leading telecom provider. 
      Your name is SwisscomAI.
      
      IMPORTANT RULES:
      1. ONLY provide information about Swisscom products, services, and policies.
      2. If asked about non-Swisscom topics, politely redirect the conversation back to Swisscom.
      3. If you don't know specific information, acknowledge that and offer to connect the user with a human representative.
      4. Be concise and helpful in your responses.
      5. Maintain a professional, friendly tone that represents the Swisscom brand.
      6. Use the following context from Swisscom's knowledge base to inform your responses.
      
      ${companyContext}`,
    }

    // Create a new array with the system message at the beginning
    const allMessages = [systemMessage, ...messages]

    // Ask OpenAI for a streaming chat completion
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: allMessages,
      temperature: 0.7,
      max_tokens: 500,
      stream: true,
    })

    // Create a new headers object
    const headers = new Headers()
    headers.set("Content-Type", "text/event-stream")
    headers.set("Cache-Control", "no-cache")
    headers.set("Connection", "keep-alive")

    // Convert the OpenAI stream to a Web stream
    const stream = new ReadableStream({
      async start(controller) {
        const encoder = new TextEncoder()

        // Send a data event to initialize the stream
        controller.enqueue(
          encoder.encode(
            'data: {"id":"chatcmpl-dev","object":"chat.completion.chunk","created":1680000000,"model":"gpt-4o","choices":[{"index":0,"delta":{"role":"assistant","content":""},"finish_reason":null}]}\n\n',
          ),
        )

        for await (const chunk of response) {
          const content = chunk.choices[0]?.delta?.content || ""

          if (content) {
            // Format as SSE
            const formattedChunk = `data: {"id":"chatcmpl-dev","object":"chat.completion.chunk","created":1680000000,"model":"gpt-4o","choices":[{"index":0,"delta":{"content":"${content.replace(/\n/g, "\\n").replace(/"/g, '\\"')}"},"finish_reason":null}]}\n\n`
            controller.enqueue(encoder.encode(formattedChunk))
          }
        }

        // Send the [DONE] event to close the stream
        controller.enqueue(encoder.encode("data: [DONE]\n\n"))
        controller.close()
      },
    })

    // Return the stream
    return new Response(stream, { headers })
  } catch (error) {
    console.error("Error in chat API:", error)
    return NextResponse.json({ error: "An error occurred" }, { status: 500 })
  }
}

