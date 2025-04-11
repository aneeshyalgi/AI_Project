import { streamText } from "ai"
import { openai } from "@ai-sdk/openai"

export const runtime = "edge"

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

    // Use the AI SDK's streamText function to handle the streaming response
    const result = streamText({
      model: openai("gpt-4o"),
      messages: allMessages,
    })

    // Return the response as a stream
    return result.toDataStreamResponse({
      headers: {
        "x-conversation-id": "dev-conversation-id",
      },
    })
  } catch (error) {
    console.error("Error in chat API:", error)
    return new Response(JSON.stringify({ error: "An error occurred" }), {
      status: 500,
      headers: {
        "Content-Type": "application/json",
      },
    })
  }
}

