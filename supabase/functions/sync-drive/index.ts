import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import { createClient } from 'jsr:@supabase/supabase-js@2';

// Headers CORS para permitir que seu app (localhost) chame esta função
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

// Define o formato esperado para cada arquivo vindo do frontend
interface DriveFile {
  id: string;
  name: string;
}

// Função auxiliar para normalizar nomes de produtos para busca
function normalizeString(str: string): string {
  if (!str) return "";
  return str.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9\s]/g, "").trim();
}

Deno.serve(async (req: Request) => {
  // Resposta padrão para a verificação "preflight" (OPTIONS) do navegador
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // Inicializa o cliente Supabase com permissões de administrador para poder escrever no banco
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // 1. Recebe a lista de arquivos do Google Drive enviada pelo frontend no corpo da requisição
    const driveFiles: DriveFile[] = await req.json();

    if (!driveFiles || !Array.isArray(driveFiles)) {
      throw new Error("O corpo da requisição deve ser um array de arquivos.");
    }

    if (driveFiles.length === 0) {
      return new Response(JSON.stringify({ message: "Nenhuma lista de arquivos recebida para sincronizar.", added: 0 }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 2. Busca no banco de dados os IDs de todos os arquivos do Drive que já foram sincronizados
    const { data: existingImages, error: dbError } = await supabase
      .from('certified_images')
      .select('google_drive_file_id');
      
    if (dbError) {
      throw new Error(`Erro ao buscar imagens existentes no banco: ${dbError.message}`);
    }
    
    // Cria um Set para uma verificação rápida e eficiente
    const existingFileIds = new Set(existingImages.map(img => img.google_drive_file_id));

    // 3. Filtra a lista recebida para manter apenas os arquivos que ainda não estão no banco
    const newFilesToSync = driveFiles.filter(file => !existingFileIds.has(file.id));

    if (newFilesToSync.length === 0) {
      return new Response(JSON.stringify({ message: "Banco de dados já está sincronizado. Nenhuma imagem nova encontrada.", added: 0 }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 4. Prepara os registros dos novos arquivos para serem inseridos no Supabase
    const newImageRecords = newFilesToSync.map(file => {
      const productName = file.name.replace(/\.[^/.]+$/, "").replace(/[-_]/g, " ").trim();
      return {
        google_drive_file_id: file.id,
        product_name: productName,
        normalized_name: normalizeString(productName),
        image_url: `https://drive.google.com/uc?id=${file.id}`, // URL pública de visualização do Drive
        filename: file.name,
        validated: true, // Vamos assumir que são validadas por estarem nesta pasta
      };
    });

    // 5. Insere todos os novos registros no banco de dados de uma só vez
    const { error: insertError } = await supabase.from('certified_images').insert(newImageRecords);
    if (insertError) {
      throw new Error(`Erro ao inserir novas imagens no banco: ${insertError.message}`);
    }

    // Retorna uma resposta de sucesso
    return new Response(
      JSON.stringify({ message: `Sincronizadas ${newFilesToSync.length} novas imagens com sucesso.`, added: newFilesToSync.length }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    // Em caso de qualquer erro, retorna uma resposta com status 500
    console.error("Erro na função sync-drive:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});