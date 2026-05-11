import { Config, Context } from "@netlify/functions";

export default async (req: Request, context: Context) => {
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method Not Allowed" }), { status: 405 });
  }

  try {
    const data = await req.json();
    const base64Image = data.image; // Assume client sends base64 image string

    if (!base64Image) {
      return new Response(JSON.stringify({ error: "No image provided" }), { status: 400 });
    }

    const ANTHROPIC_API_KEY = process.env.CLAUDE_API_KEY;
    if (!ANTHROPIC_API_KEY) {
      return new Response(JSON.stringify({ error: "API Key not configured" }), { status: 500 });
    }

    const payload = {
      model: "claude-3-5-sonnet-20241022",
      max_tokens: 1024,
      system: "Extract merchant, date, total, and category from this receipt as structured JSON. The JSON should have keys: 'merchant', 'date', 'total', 'category'. Return ONLY the raw JSON object, without markdown formatting.",
      messages: [
        {
          role: "user",
          content: [
            {
              type: "image",
              source: {
                type: "base64",
                media_type: "image/jpeg", // Make sure frontend sends correct media type, or extract from string
                data: base64Image.replace(/^data:image\/(png|jpeg|jpg);base64,/, ""),
              },
            },
            {
              type: "text",
              text: "Extract the details from this receipt.",
            },
          ],
        },
      ],
    };

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error("Anthropic API Error:", errorData);
      return new Response(JSON.stringify({ error: "Failed to process image with Claude" }), { status: 500 });
    }

    const result = await response.json();
    let extractedText = result.content[0].text;
    
    // Safely parse JSON if Claude returned markdown formatting
    extractedText = extractedText.replace(/```json/g, '').replace(/```/g, '').trim();
    const jsonResult = JSON.parse(extractedText);

    return new Response(JSON.stringify(jsonResult), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
      },
    });
  } catch (error) {
    console.error("Error processing receipt:", error);
    return new Response(JSON.stringify({ error: "Internal Server Error" }), { status: 500 });
  }
};

export const config: Config = {
  path: "/api/scan-receipt",
};
