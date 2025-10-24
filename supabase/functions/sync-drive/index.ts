import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import { createClient } from 'jsr:@supabase/supabase-js@2';

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const DRIVE_FOLDER_ID = Deno.env.get("DRIVE_FOLDER_ID") || "1OdNiRnKCRxMDR6sERogipofXwsGni02i";

function normalizeString(str: string): string {
  if (!str) return "";
  return str
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s]/g, "")
    .trim();
}

async function getAccessToken(): Promise<string> {
  const credentialsBase64 = Deno.env.get("GOOGLE_CREDENTIALS_BASE64");
  if (!credentialsBase64) {
    throw new Error("GOOGLE_CREDENTIALS_BASE64 não configurado");
  }

  const credentials = JSON.parse(atob(credentialsBase64));
  const clientEmail = credentials.client_email;
  const privateKey = credentials.private_key;

  const header = { alg: "RS256", typ: "JWT" };
  const now = Math.floor(Date.now() / 1000);
  const claim = {
    iss: clientEmail,
    scope: "https://www.googleapis.com/auth/drive.readonly",
    aud: "https://oauth2.googleapis.com/token",
    exp: now + 3600,
    iat: now,
  };

  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "pkcs8",
    encoder.encode(privateKey),
    { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
    false,
    ["sign"]
  );

  const encodedHeader = btoa(JSON.stringify(header)).replace(/=/g, "");
  const encodedClaim = btoa(JSON.stringify(claim)).replace(/=/g, "");
  const message = `${encodedHeader}.${encodedClaim}`;
  
  const signature = await crypto.subtle.sign(
    "RSASSA-PKCS1-v1_5",
    key,
    encoder.encode(message)
  );
  
  const encodedSignature = btoa(String.fromCharCode(...new Uint8Array(signature)))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=/g, "");
    
  const jwt = `${message}.${encodedSignature}`;

  const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: `grant_type=urn:ietf:params:oauth-grant-type:jwt-bearer&assertion=${jwt}`,
  });

  if (!tokenResponse.ok) {
    const errorText = await tokenResponse.text();
    throw new Error(`Falha ao obter token: ${errorText}`);
  }

  const tokenData = await tokenResponse.json();
  return tokenData.access_token;
}

async function listDriveFiles(accessToken: string, folderId: string) {
  const url = `https://www.googleapis.com/drive/v3/files?q='${folderId}'+in+parents+and+trashed=false&fields=files(id,name,mimeType)&pageSize=1000`;
  
  const response = await fetch(url, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Erro ao listar arquivos: ${errorText}`);
  }

  const data = await response.json();
  return data.files || [];
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // Inicializa Supabase com Service Role
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    console.log("🔄 Iniciando sincronização com Google Drive...");

    // 1. Obter token de acesso
    const accessToken = await getAccessToken();
    console.log("✅ Token de acesso obtido");

    // 2. Listar arquivos do Drive
    const driveFiles = await listDriveFiles(accessToken, DRIVE_FOLDER_ID);
    console.log(`📁 Encontrados ${driveFiles.length} arquivos no Drive`);

    // Filtrar apenas imagens
    const imageFiles = driveFiles.filter((file: any) => 
      file.mimeType?.startsWith('image/')
    );
    console.log(`🖼️  ${imageFiles.length} arquivos de imagem`);

    if (imageFiles.length === 0) {
      return new Response(
        JSON.stringify({ 
          message: "Nenhuma imagem encontrada na pasta do Drive",
          added: 0,
          skipped: 0
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 3. Buscar imagens já sincronizadas
    const { data: existingImages } = await supabase
      .from('certified_images')
      .select('google_drive_file_id');

    const existingFileIds = new Set(
      existingImages?.map(img => img.google_drive_file_id) || []
    );

    // 4. Filtrar novas imagens
    const newFiles = imageFiles.filter((file: any) => 
      !existingFileIds.has(file.id)
    );
    console.log(`🆕 ${newFiles.length} novas imagens para sincronizar`);

    if (newFiles.length === 0) {
      return new Response(
        JSON.stringify({ 
          message: "Banco de dados já está sincronizado",
          added: 0,
          skipped: imageFiles.length
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 5. Preparar registros para inserção
    const newImageRecords = newFiles.map((file: any) => {
      const productName = file.name
        .replace(/\.[^/.]+$/, "") // Remove extensão
        .replace(/[-_]/g, " ")     // Substitui - e _ por espaço
        .trim();

      return {
        google_drive_file_id: file.id,
        product_name: productName,
        normalized_name: normalizeString(productName),
        image_url: `https://drive.google.com/uc?id=${file.id}`,
        filename: file.name,
        category: null,
        tags: [],
        usage_count: 0,
        uploaded_by: null, // Sistema de sincronização
      };
    });

    // 6. Inserir no banco de dados
    const { error: insertError } = await supabase
      .from('certified_images')
      .insert(newImageRecords);

    if (insertError) {
      throw new Error(`Erro ao inserir imagens: ${insertError.message}`);
    }

    console.log(`✅ ${newFiles.length} imagens sincronizadas com sucesso`);

    return new Response(
      JSON.stringify({ 
        message: `Sincronizadas ${newFiles.length} novas imagens com sucesso!`,
        added: newFiles.length,
        skipped: imageFiles.length - newFiles.length,
        total: imageFiles.length
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("❌ Erro na sincronização:", error);
    return new Response(
      JSON.stringify({ 
        error: error.message,
        details: "Verifique se GOOGLE_CREDENTIALS_BASE64 está configurado corretamente"
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      }
    );
  }
});