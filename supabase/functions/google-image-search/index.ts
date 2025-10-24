import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface SearchRequest {
  query: string;
  numResults?: number;
}

Deno.serve(async (req: Request) => {
if (req.method === "OPTIONS") {
  return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { query, numResults = 10 }: SearchRequest = await req.json();

    const apiKey = Deno.env.get("GOOGLE_API_KEY");
    const searchEngineId = Deno.env.get("GOOGLE_SEARCH_ENGINE_ID");

    if (!apiKey || !searchEngineId) {
      throw new Error("Google API credentials not configured");
    }

    const searchUrl = `https://www.googleapis.com/customsearch/v1?key=${apiKey}&cx=${searchEngineId}&q=${encodeURIComponent(query)}&searchType=image&num=${numResults}`;

    const response = await fetch(searchUrl);
    
    if (!response.ok) {
      const errorData = await response.text();
      throw new Error(`Google API error: ${errorData}`);
    }

    const data = await response.json();

    const images = data.items?.map((item: any) => ({
      title: item.title,
      link: item.link,
      thumbnail: item.image?.thumbnailLink,
      contextLink: item.image?.contextLink,
      width: item.image?.width,
      height: item.image?.height,
    })) || [];

    return new Response(
      JSON.stringify({ images }),
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