import { certifiedImageService } from '@/services/api';

export const base44 = {
  entities: {
    CertifiedImage: {
      create: (data) => certifiedImageService.createImage(data),
    },
  },
  integrations: {
    Core: {
      UploadFile: async ({ file, metadata = {} }) => {
        try {
          const imageRecord = await certifiedImageService.uploadImageFile(file, metadata);
          return { file_url: imageRecord.image_url };
        } catch (error) {
          console.error("Upload failed:", error);
          throw error;
        }
      },
    },
  },
};