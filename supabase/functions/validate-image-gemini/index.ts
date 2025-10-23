import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface ValidationRequest {
  imageUrl: string;
  productName: string;
  productDescription?: string;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const { imageUrl, productName, productDescription }: ValidationRequest = await req.json();

    const apiKey = Deno.env.get("GOOGLE_GEMINI_API_KEY");

    if (!apiKey) {
      throw new Error("Google Gemini API key not configured");
    }

    const imageResponse = await fetch(imageUrl);
    if (!imageResponse.ok) {
      throw new Error("Failed to fetch image");
    }

    const imageBlob = await imageResponse.blob();
    const arrayBuffer = await imageBlob.arrayBuffer();
    const base64Image = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));

    const prompt = `Analise esta imagem e determine se ela corresponde ao produto: "${productName}"${productDescription ? ` com a descrição: "${productDescription}"` : ''}.

Por favor, responda em formato JSON com os seguintes campos:
- "isValid": boolean indicando se a imagem corresponde ao produto
- "confidence": número de 0 a 1 indicando o nível de confiança
- "notes": string com observações sobre a validação
- "suggestedCategories": array de strings com categorias sugeridas para a imagem`;

    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;

    const geminiResponse = await fetch(geminiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: prompt,
              },
              {
                inline_data: {
                  mime_type: imageBlob.type,
                  data: base64Image,
                },
              },
            ],
          },
        ],
      }),
    });

    if (!geminiResponse.ok) {
      const errorData = await geminiResponse.text();
      throw new Error(`Gemini API error: ${errorData}`);
    }

    const geminiData = await geminiResponse.json();
    const responseText = geminiData.candidates?.[0]?.content?.parts?.[0]?.text || "{}";

    let validationResult;
    try {
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      validationResult = jsonMatch ? JSON.parse(jsonMatch[0]) : {
        isValid: false,
        confidence: 0,
        notes: "Failed to parse AI response",
        suggestedCategories: [],
      };
    } catch (parseError) {
      validationResult = {
        isValid: false,
        confidence: 0,
        notes: responseText,
        suggestedCategories: [],
      };
    }

    return new Response(
      JSON.stringify(validationResult),
      {
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  }
});