import { useAuthStore } from '@/stores/authStore';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL || 'http://192.168.1.14:3000/api';

export interface UploadedFile {
  id: string;
  name: string;
  type: 'image' | 'video' | 'document' | 'audio';
  size: number;
  encrypted: boolean;
  uploadedAt: string;
  lastModified: string;
  encryption: {
    encryptedData: string;
    iv: string;
    salt: string;
  };
  originalUri?: string;
  mimeType?: string;
  storagePath?: string;
}

export class FileUploadService {
  static async uploadFile(
    fileData: ArrayBuffer,
    fileName: string,
    fileType: 'image' | 'video' | 'document' | 'audio',
    fileSize: number,
    mimeType: string,
    encryptedData: string,
    iv: string,
    salt: string
  ): Promise<UploadedFile> {
    try {
      const { user } = useAuthStore.getState();
      
      if (!user) {
        throw new Error('User not authenticated');
      }

      // Get the current Firebase ID token
      const firebaseUser = useAuthStore.getState().firebaseUser;
      if (!firebaseUser) {
        throw new Error('Firebase user not found');
      }

      const idToken = await firebaseUser.getIdToken();
      
      // Convert ArrayBuffer to base64 for JSON transmission
      const base64Data = btoa(String.fromCharCode(...new Uint8Array(fileData)));

      const response = await fetch(`${API_BASE_URL}/files`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${idToken}`,
        },
        body: JSON.stringify({
          name: fileName,
          type: fileType,
          size: fileSize,
          mimeType: mimeType,
          encrypted: true,
          encryption: {
            encryptedData: base64Data,
            iv: iv,
            salt: salt,
          },
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Upload failed: ${errorData.error || response.statusText}`);
      }

      const uploadedFile = await response.json();
      console.log('✅ File uploaded successfully:', uploadedFile);
      
      return uploadedFile;
    } catch (error) {
      console.error('❌ File upload error:', error);
      throw error;
    }
  }

  static async getFiles(): Promise<UploadedFile[]> {
    try {
      const firebaseUser = useAuthStore.getState().firebaseUser;
      if (!firebaseUser) {
        throw new Error('Firebase user not found');
      }

      const idToken = await firebaseUser.getIdToken();
      
      const response = await fetch(`${API_BASE_URL}/files`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${idToken}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Failed to fetch files: ${errorData.error || response.statusText}`);
      }

      const files = await response.json();
      return files;
    } catch (error) {
      console.error('❌ Error fetching files:', error);
      throw error;
    }
  }

  static async deleteFile(fileId: string): Promise<void> {
    try {
      const firebaseUser = useAuthStore.getState().firebaseUser;
      if (!firebaseUser) {
        throw new Error('Firebase user not found');
      }

      const idToken = await firebaseUser.getIdToken();
      
      const response = await fetch(`${API_BASE_URL}/files/${fileId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${idToken}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Failed to delete file: ${errorData.error || response.statusText}`);
      }

      console.log('✅ File deleted successfully');
    } catch (error) {
      console.error('❌ Error deleting file:', error);
      throw error;
    }
  }
}
