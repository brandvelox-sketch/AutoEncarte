import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from 'jsr:@supabase/supabase-js@2';

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface ProcessProjectRequest {
  project_id: string;
}

interface Product {
  id: string;
  name: string;
  description: string;
  status: string;
}

interface CertifiedImage {
  id: string;
  product_name: string;
  normalized_name: string;
  image_url: string;
}

// Função auxiliar para normalizar strings
function normalizeString(str: string): string {
  return str
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s]/g, "")
    .trim();
}

// Função auxiliar para chamar outras Edge Functions
async function callEdgeFunction(functionName: string, payload: any, authToken: string) {
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const url = `${supabaseUrl}/functions/v1/${functionName}`;

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${authToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`${functionName} failed: ${error}`);
  }

  return response.json();
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const { project_id }: ProcessProjectRequest = await req.json();

    if (!project_id) {
      throw new Error("project_id is required");
    }

    // Obter token de autenticação
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("Authorization header is required");
    }

    const token = authHeader.replace("Bearer ", "");

    // Criar cliente Supabase
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Atualizar status do projeto para "processing"
    await supabase
      .from("projects")
      .update({ 
        status: "processing",
        processing_started_at: new Date().toISOString()
      })
      .eq("id", project_id);

    // Buscar todos os produtos do projeto
    const { data: products, error: productsError } = await supabase
      .from("products")
      .select("*")
      .eq("project_id", project_id)
      .order("order", { ascending: true });

    if (productsError) {
      throw new Error(`Failed to fetch products: ${productsError.message}`);
    }

    if (!products || products.length === 0) {
      throw new Error("No products found for this project");
    }

    // Buscar todas as imagens certificadas
    const { data: certifiedImages } = await supabase
      .from("certified_images")
      .select("*");

    let productsCompleted = 0;
    let productsFromBank = 0;
    let productsFromWeb = 0;
    let productsFailed = 0;

    // Processar cada produto
    for (const product of products) {
      try {
        // Atualizar status do produto para "searching_bank"
        await supabase
          .from("products")
          .update({ status: "searching_bank" })
          .eq("id", product.id);

        // 1. Verificar se existe imagem certificada
        const normalizedProductName = normalizeString(product.name);
        const matchedImage = certifiedImages?.find(img => 
          normalizeString(img.product_name) === normalizedProductName
        );

        if (matchedImage) {
          // Imagem encontrada no banco certificado
          await supabase
            .from("products")
            .update({
              image_url: matchedImage.image_url,
              image_source: "certified_bank",
              status: "completed",
            })
            .eq("id", product.id);

          // Atualizar contagem de uso da imagem
          await supabase
            .from("certified_images")
            .update({
              usage_count: (matchedImage.usage_count || 0) + 1,
              last_used_at: new Date().toISOString(),
            })
            .eq("id", matchedImage.id);

          productsCompleted++;
          productsFromBank++;
          continue;
        }

        // 2. Buscar imagens na web
        await supabase
          .from("products")
          .update({ status: "searching_web" })
          .eq("id", product.id);

        const searchQuery = `${product.name} ${product.description || ""}`.trim();
        const searchResult = await callEdgeFunction(
          "google-image-search",
          { query: searchQuery, numResults: 5 },
          token
        );

        if (!searchResult.images || searchResult.images.length === 0) {
          throw new Error("No images found");
        }

        // 3. Validar a melhor candidata com Gemini
        await supabase
          .from("products")
          .update({ status: "validating" })
          .eq("id", product.id);

        let bestValidImage = null;
        let bestConfidence = 0;

        for (const image of searchResult.images) {
          try {
            const validation = await callEdgeFunction(
              "validate-image-gemini",
              {
                imageUrl: image.link,
                productName: product.name,
                productDescription: product.description,
              },
              token
            );

            if (validation.isValid && validation.confidence > bestConfidence) {
              bestValidImage = image.link;
              bestConfidence = validation.confidence;
            }

            // Se encontramos uma imagem com alta confiança, usar ela
            if (bestConfidence >= 0.8) {
              break;
            }
          } catch (validationError) {
            console.error(`Validation failed for image: ${validationError}`);
            continue;
          }
        }

        if (bestValidImage) {
          // Imagem válida encontrada
          await supabase
            .from("products")
            .update({
              image_url: bestValidImage,
              image_source: "web_validated",
              status: "completed",
            })
            .eq("id", product.id);

          productsCompleted++;
          productsFromWeb++;
        } else {
          throw new Error("No valid image found");
        }

      } catch (productError) {
        // Falha ao processar produto
        await supabase
          .from("products")
          .update({
            status: "failed",
            error_message: productError.message,
          })
          .eq("id", product.id);

        productsFailed++;
      }
    }

    // Atualizar estatísticas do projeto
    const finalStatus = productsFailed === products.length ? "failed" : "completed";
    
    await supabase
      .from("projects")
      .update({
        status: finalStatus,
        total_products: products.length,
        products_completed: productsCompleted,
        products_from_bank: productsFromBank,
        products_from_web: productsFromWeb,
        products_failed: productsFailed,
        processing_finished_at: new Date().toISOString(),
      })
      .eq("id", project_id);

    return new Response(
      JSON.stringify({
        success: true,
        project_id,
        total_products: products.length,
        products_completed: productsCompleted,
        products_from_bank: productsFromBank,
        products_from_web: productsFromWeb,
        products_failed: productsFailed,
      }),
      {
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );

  } catch (error) {
    console.error("Process project error:", error);
    
    return new Response(
      JSON.stringify({ 
        error: error.message,
        success: false,
      }),
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