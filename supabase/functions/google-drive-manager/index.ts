import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface UploadRequest {
  filename: string;
  imageData: string;
  mimeType: string;
  folderId?: string;
}

interface ListRequest {
  folderId?: string;
  pageSize?: number;
  pageToken?: string;
}

interface DeleteRequest {
  fileId: string;
}

async function getAccessToken(): Promise<string> {
  const clientEmail = Deno.env.get("GOOGLE_SERVICE_ACCOUNT_EMAIL");
  const privateKey = Deno.env.get("GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY")?.replace(/\\n/g, '\n');

  if (!clientEmail || !privateKey) {
    throw new Error("Google Service Account credentials not configured");
  }

  const header = {
    alg: "RS256",
    typ: "JWT",
  };

  const now = Math.floor(Date.now() / 1000);
  const claim = {
    iss: clientEmail,
    scope: "https://www.googleapis.com/auth/drive.file",
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
    body: `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${jwt}`,
  });

  if (!tokenResponse.ok) {
    const errorData = await tokenResponse.text();
    throw new Error(`Failed to get access token: ${errorData}`);
  }

  const tokenData = await tokenResponse.json();
  return tokenData.access_token;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const url = new URL(req.url);
    const action = url.searchParams.get("action");

    const accessToken = await getAccessToken();

    if (action === "upload" && req.method === "POST") {
      const { filename, imageData, mimeType, folderId }: UploadRequest = await req.json();

      const metadata = {
        name: filename,
        ...(folderId && { parents: [folderId] }),
      };

      const boundary = "-------314159265358979323846";
      const delimiter = `\r\n--${boundary}\r\n`;
      const closeDelimiter = `\r\n--${boundary}--`;

      const base64Data = imageData.split(",")[1] || imageData;
      const binaryData = Uint8Array.from(atob(base64Data), c => c.charCodeAt(0));

      const multipartRequestBody =
        delimiter +
        "Content-Type: application/json\r\n\r\n" +
        JSON.stringify(metadata) +
        delimiter +
        `Content-Type: ${mimeType}\r\n` +
        "Content-Transfer-Encoding: base64\r\n\r\n" +
        base64Data +
        closeDelimiter;

      const uploadResponse = await fetch(
        "https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": `multipart/related; boundary=${boundary}`,
          },
          body: multipartRequestBody,
        }
      );

      if (!uploadResponse.ok) {
        const errorData = await uploadResponse.text();
        throw new Error(`Upload failed: ${errorData}`);
      }

      const fileData = await uploadResponse.json();

      await fetch(`https://www.googleapis.com/drive/v3/files/${fileData.id}/permissions`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          role: "reader",
          type: "anyone",
        }),
      });

      const fileUrl = `https://drive.google.com/uc?id=${fileData.id}`;
      const thumbnailUrl = `https://drive.google.com/thumbnail?id=${fileData.id}`;

      return new Response(
        JSON.stringify({
          fileId: fileData.id,
          url: fileUrl,
          thumbnailUrl: thumbnailUrl,
          filename: fileData.name,
        }),
        {
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    } else if (action === "list" && req.method === "GET") {
      const folderId = url.searchParams.get("folderId");
      const pageSize = url.searchParams.get("pageSize") || "100";
      const pageToken = url.searchParams.get("pageToken");

      let listUrl = `https://www.googleapis.com/drive/v3/files?pageSize=${pageSize}&fields=nextPageToken,files(id,name,mimeType,thumbnailLink,webViewLink,createdTime)`;
      
      if (folderId) {
        listUrl += `&q='${folderId}'+in+parents`;
      }
      
      if (pageToken) {
        listUrl += `&pageToken=${pageToken}`;
      }

      const listResponse = await fetch(listUrl, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (!listResponse.ok) {
        const errorData = await listResponse.text();
        throw new Error(`List failed: ${errorData}`);
      }

      const listData = await listResponse.json();

      return new Response(
        JSON.stringify(listData),
        {
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    } else if (action === "delete" && req.method === "DELETE") {
      const { fileId }: DeleteRequest = await req.json();

      const deleteResponse = await fetch(
        `https://www.googleapis.com/drive/v3/files/${fileId}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      if (!deleteResponse.ok && deleteResponse.status !== 204) {
        const errorData = await deleteResponse.text();
        throw new Error(`Delete failed: ${errorData}`);
      }

      return new Response(
        JSON.stringify({ success: true }),
        {
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    } else {
      return new Response(
        JSON.stringify({ error: "Invalid action or method" }),
        {
          status: 400,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }
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