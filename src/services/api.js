import { supabase } from '../lib/supabase';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

async function callEdgeFunction(functionName, payload, method = 'POST') {
  const { data: { session } } = await supabase.auth.getSession();

  if (!session) {
    throw new Error('User not authenticated');
  }

  const url = `${SUPABASE_URL}/functions/v1/${functionName}`;

  const response = await fetch(url, {
    method,
    headers: {
      'Authorization': `Bearer ${session.access_token}`,
      'Content-Type': 'application/json',
    },
    body: method !== 'GET' ? JSON.stringify(payload) : undefined,
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'API request failed');
  }

  return response.json();
}

export const imageSearchService = {
  async searchImages(query, numResults = 10) {
    return callEdgeFunction('google-image-search', { query, numResults });
  },
};

export const imageValidationService = {
  async validateImage(imageUrl, productName, productDescription) {
    return callEdgeFunction('validate-image-gemini', {
      imageUrl,
      productName,
      productDescription,
    });
  },
};

export const driveService = {
  async uploadImage(filename, imageData, mimeType, folderId) {
    return callEdgeFunction('google-drive-manager?action=upload', {
      filename,
      imageData,
      mimeType,
      folderId,
    });
  },

  async listFiles(folderId, pageSize = 100, pageToken) {
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
      throw new Error('User not authenticated');
    }

    let url = `${SUPABASE_URL}/functions/v1/google-drive-manager?action=list&pageSize=${pageSize}`;

    if (folderId) {
      url += `&folderId=${folderId}`;
    }

    if (pageToken) {
      url += `&pageToken=${pageToken}`;
    }

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${session.access_token}`,
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to list files');
    }

    return response.json();
  },

  async deleteFile(fileId) {
    return callEdgeFunction('google-drive-manager?action=delete', { fileId }, 'DELETE');
  },
};

export const projectService = {

  async startProjectProcessing(projectId) {
    return callEdgeFunction('process-project', { project_id: projectId });
  },

  async getProjects() {
    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  },

  async getProject(id) {
    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (error) throw error;
    return data;
  },

  async createProject(project) {
    const { data: { user } } = await supabase.auth.getUser();

    const { data, error } = await supabase
      .from('projects')
      .insert([{ ...project, user_id: user.id }])
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async updateProject(id, updates) {
    const { data, error } = await supabase
      .from('projects')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async deleteProject(id) {
    const { error } = await supabase
      .from('projects')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },
};

export const productService = {
  async getProducts(projectId) {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('project_id', projectId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  },

  async createProduct(product) {
    const { data, error } = await supabase
      .from('products')
      .insert([product])
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async updateProduct(id, updates) {
    const { data, error } = await supabase
      .from('products')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async deleteProduct(id) {
    const { error } = await supabase
      .from('products')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },
};

export const certifiedImageService = {
  async getImages() {
    const { data, error } = await supabase
      .from('certified_images')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  },

  async createImage(image) {
    const { data: { user } } = await supabase.auth.getUser();

    const { data, error } = await supabase
      .from('certified_images')
      .insert([{ ...image, uploaded_by: user.id }])
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async updateImage(id, updates) {
    const { data, error } = await supabase
      .from('certified_images')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async deleteImage(id) {
    const { error } = await supabase
      .from('certified_images')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },
  
  async uploadImageFile(file, metadata = {}) {
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      throw new Error('User not authenticated');
    }

    // Gerar nome único para o arquivo
    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
    const filePath = `${user.id}/${fileName}`;

    // Upload para o Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('certified-images')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false,
      });

    if (uploadError) {
      throw new Error(`Upload failed: ${uploadError.message}`);
    }

    // Obter URL pública
    const { data: urlData } = supabase.storage
      .from('certified-images')
      .getPublicUrl(filePath);

    const imageUrl = urlData.publicUrl;

    // Criar registro no banco de dados
    const normalizedName = metadata.product_name
      ? metadata.product_name
          .toLowerCase()
          .normalize("NFD")
          .replace(/[\u0300-\u036f]/g, "")
          .replace(/[^a-z0-9\s]/g, "")
          .trim()
      : "";

    const { data: imageRecord, error: dbError } = await supabase
      .from('certified_images')
      .insert([{
        product_name: metadata.product_name || file.name,
        normalized_name: normalizedName,
        image_url: imageUrl,
        category: metadata.category || null,
        description: metadata.description || null,
        tags: metadata.tags || [],
        uploaded_by: user.id,
        usage_count: 0,
      }])
      .select()
      .single();

    if (dbError) {
      // Se falhar ao criar registro, deletar arquivo do storage
      await supabase.storage
        .from('certified-images')
        .remove([filePath]);
      
      throw new Error(`Database error: ${dbError.message}`);
    }

    return imageRecord;
  },
};

export const userService = {
  async getUsers() {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  },

  async getCurrentUser() {
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return null;

    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .maybeSingle();

    if (error) throw error;
    return data;
  },

  async updateProfile(id, updates) {
    const { data, error } = await supabase
      .from('profiles')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },
};

