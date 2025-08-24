import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import * as ImagePicker from 'expo-image-picker';
import * as MediaLibrary from 'expo-media-library';
import { Platform } from 'react-native';

export interface PickedFile {
  uri: string;
  name: string;
  size: number;
  type: string;
  mimeType?: string;
  data?: ArrayBuffer;
}

export class FilePicker {
  /**
   * Request necessary permissions
   */
  static async requestPermissions(): Promise<boolean> {
    try {
      // Request camera permissions
      const cameraPermission = await ImagePicker.requestCameraPermissionsAsync();
      
      // Request media library permissions
      const mediaPermission = await MediaLibrary.requestPermissionsAsync();
      
      return cameraPermission.granted && mediaPermission.granted;
    } catch (error) {
      console.error('Permission request error:', error);
      return false;
    }
  }

  /**
   * Pick an image from camera
   */
  static async pickFromCamera(): Promise<PickedFile | null> {
    try {
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];
        const fileInfo = await this.getFileInfo(asset.uri);
        
        return {
          uri: asset.uri,
          name: `Camera_${Date.now()}.jpg`,
          size: fileInfo.size,
          type: 'image',
          mimeType: 'image/jpeg',
        };
      }
      return null;
    } catch (error) {
      console.error('Camera picker error:', error);
      return null;
    }
  }

  /**
   * Pick an image from gallery
   */
  static async pickFromGallery(): Promise<PickedFile | null> {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.All,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];
        const fileInfo = await this.getFileInfo(asset.uri);
        const fileExtension = this.getFileExtension(asset.uri);
        
        return {
          uri: asset.uri,
          name: asset.fileName || `Gallery_${Date.now()}${fileExtension}`,
          size: fileInfo.size,
          type: this.getFileType(asset.type || 'unknown'),
          mimeType: asset.type,
        };
      }
      return null;
    } catch (error) {
      console.error('Gallery picker error:', error);
      return null;
    }
  }

  /**
   * Pick a document
   */
  static async pickDocument(): Promise<PickedFile | null> {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: '*/*',
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];
        
        return {
          uri: asset.uri,
          name: asset.name,
          size: asset.size || 0,
          type: this.getFileType(asset.mimeType || 'unknown'),
          mimeType: asset.mimeType,
        };
      }
      return null;
    } catch (error) {
      console.error('Document picker error:', error);
      return null;
    }
  }

  /**
   * Get file information
   */
  private static async getFileInfo(uri: string): Promise<{ size: number }> {
    try {
      if (Platform.OS === 'web') {
        // Web implementation
        const response = await fetch(uri);
        const blob = await response.blob();
        return { size: blob.size };
      } else {
        // Native implementation - use FileSystem to get file info
        try {
          const fileInfo = await FileSystem.getInfoAsync(uri);
          if (fileInfo.exists && fileInfo.size !== undefined) {
            return { size: fileInfo.size };
          }
          
          // Fallback to fetch if FileSystem doesn't provide size
          const response = await fetch(uri);
          const blob = await response.blob();
          return { size: blob.size };
        } catch {
          // Fallback to 0 if we can't determine size
          return { size: 0 };
        }
      }
    } catch (error) {
      console.error('File info error:', error);
      return { size: 0 };
    }
  }

  /**
   * Get file extension from URI
   */
  private static getFileExtension(uri: string): string {
    const lastDotIndex = uri.lastIndexOf('.');
    if (lastDotIndex === -1) return '';
    return uri.substring(lastDotIndex);
  }

  /**
   * Get file type from MIME type or extension
   */
  private static getFileType(mimeType: string): string {
    if (mimeType.startsWith('image/')) return 'image';
    if (mimeType.startsWith('video/')) return 'video';
    if (mimeType.startsWith('audio/')) return 'audio';
    if (mimeType.includes('pdf') || mimeType.includes('document')) return 'document';
    return 'document';
  }

  /**
   * Convert file to ArrayBuffer
   */
  static async fileToArrayBuffer(uri: string): Promise<ArrayBuffer> {
    try {
      if (Platform.OS === 'web') {
        const response = await fetch(uri);
        const blob = await response.blob();
        return await blob.arrayBuffer();
      } else {
        // For native, use expo-file-system to read the file
        const base64 = await FileSystem.readAsStringAsync(uri, {
          encoding: FileSystem.EncodingType.Base64,
        });
        
        // Convert base64 to ArrayBuffer
        const binaryString = atob(base64);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }
        return bytes.buffer;
      }
    } catch (error) {
      console.error('File to ArrayBuffer error:', error);
      throw new Error('Failed to read file');
    }
  }
}
