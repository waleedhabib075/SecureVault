import { FileUploadService } from '@/services/fileUploadService';
import { useAuthStore } from '@/stores/authStore';
import { FileEncryption } from '@/utils/encryption';
import { FilePicker, PickedFile } from '@/utils/filePicker';
import {
  Camera,
  FileText,
  Image as ImageIcon,
  Upload,
  X,
} from 'lucide-react-native';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

interface FileUploadModalProps {
  visible: boolean;
  onClose: () => void;
  onFileUploaded: (file: any) => void;
}

export default function FileUploadModal({
  visible,
  onClose,
  onFileUploaded,
}: FileUploadModalProps) {
  const [isUploading, setIsUploading] = useState(false);
  const { user } = useAuthStore();

  const handleFilePick = async (
    pickerType: 'camera' | 'gallery' | 'document'
  ) => {
    try {
      setIsUploading(true);

      // Request permissions first
      const hasPermissions = await FilePicker.requestPermissions();
      if (!hasPermissions) {
        Alert.alert(
          'Permission Required',
          'Please grant camera and media library permissions to upload files.'
        );
        return;
      }

      let pickedFile: PickedFile | null = null;

      switch (pickerType) {
        case 'camera':
          pickedFile = await FilePicker.pickFromCamera();
          break;
        case 'gallery':
          pickedFile = await FilePicker.pickFromGallery();
          break;
        case 'document':
          pickedFile = await FilePicker.pickDocument();
          break;
      }

      if (!pickedFile) {
        Alert.alert('No File Selected', 'Please select a file to upload.');
        return;
      }

      // Show file size info
      const fileSizeMB = (pickedFile.size / (1024 * 1024)).toFixed(1);
      console.log(`📁 Selected file: ${pickedFile.name} (${fileSizeMB} MB)`);

      if (pickedFile.size > 100 * 1024 * 1024) {
        // 100MB warning
        Alert.alert(
          'Large File Warning',
          `This file is ${fileSizeMB} MB. Large files may take longer to encrypt and upload. Continue?`,
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Continue', onPress: () => {} },
          ]
        );
      }

      // Convert file to ArrayBuffer for encryption
      const fileData = await FilePicker.fileToArrayBuffer(pickedFile.uri);

      // Encrypt the file using user's email as password (you can change this)
      const encryptionPassword = user?.email || 'default-password';
      const encryptedFile = await FileEncryption.encryptFile(
        fileData,
        encryptionPassword
      );

      // Upload file to backend
      const uploadedFile = await FileUploadService.uploadFile(
        fileData,
        pickedFile.name,
        pickedFile.type as 'image' | 'video' | 'document' | 'audio',
        pickedFile.size,
        pickedFile.mimeType || 'application/octet-stream',
        encryptedFile.encryptedData,
        encryptedFile.iv,
        encryptedFile.salt
      );

      // Create file object for local storage
      const fileObject = {
        id: uploadedFile.id,
        name: uploadedFile.name,
        type: uploadedFile.type,
        size: uploadedFile.size,
        encrypted: uploadedFile.encrypted,
        thumbnail: pickedFile.type === 'image' ? pickedFile.uri : undefined,
        uploadedAt: uploadedFile.uploadedAt,
        lastModified: uploadedFile.lastModified,
        encryption: uploadedFile.encryption,
        originalUri: pickedFile.uri,
        mimeType: uploadedFile.mimeType,
      };

      // Call the callback with the uploaded file
      onFileUploaded(fileObject);

      Alert.alert(
        'Success',
        'File encrypted and uploaded to vault successfully!'
      );
      onClose();
    } catch (error) {
      console.error('File upload error:', error);

      let errorMessage = 'Failed to upload and encrypt file. Please try again.';

      if (error instanceof Error) {
        if (error.message.includes('Maximum call stack size exceeded')) {
          errorMessage =
            'Encryption failed due to memory constraints. Try a smaller file or restart the app.';
        } else {
          errorMessage = error.message;
        }
      }

      Alert.alert('Upload Failed', errorMessage);
    } finally {
      setIsUploading(false);
    }
  };

  const renderUploadOption = (
    icon: React.ReactNode,
    title: string,
    subtitle: string,
    onPress: () => void,
    color: string
  ) => (
    <TouchableOpacity
      style={[styles.uploadOption, { borderLeftColor: color }]}
      onPress={onPress}
      disabled={isUploading}
    >
      <View style={[styles.uploadIcon, { backgroundColor: color + '20' }]}>
        {icon}
      </View>
      <View style={styles.uploadText}>
        <Text style={styles.uploadTitle}>{title}</Text>
        <Text style={styles.uploadSubtitle}>{subtitle}</Text>
      </View>
      <Upload size={20} color={color} />
    </TouchableOpacity>
  );

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Add File to Vault</Text>
            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <X size={24} color="#64748B" />
            </TouchableOpacity>
          </View>

          <Text style={styles.modalSubtitle}>
            Choose how you want to add a file to your secure vault
          </Text>

          <View style={styles.uploadOptions}>
            {renderUploadOption(
              <Camera size={24} color="#F97316" />,
              'Take Photo',
              'Capture a new photo with camera',
              () => handleFilePick('camera'),
              '#F97316'
            )}

            {renderUploadOption(
              <ImageIcon size={24} color="#0891B2" />,
              'Choose from Gallery',
              'Select existing photos or videos',
              () => handleFilePick('gallery'),
              '#0891B2'
            )}

            {renderUploadOption(
              <FileText size={24} color="#059669" />,
              'Select Document',
              'Pick PDFs, documents, or any file',
              () => handleFilePick('document'),
              '#059669'
            )}
          </View>

          {isUploading && (
            <View style={styles.uploadingOverlay}>
              <ActivityIndicator size="large" color="#F97316" />
              <Text style={styles.uploadingText}>
                Encrypting and uploading file...
              </Text>
            </View>
          )}

          <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#1E293B',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 40,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  modalTitle: {
    fontSize: 24,
    fontFamily: 'Inter-Bold',
    color: '#F8FAFC',
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#334155',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalSubtitle: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#94A3B8',
    marginBottom: 32,
  },
  uploadOptions: {
    gap: 16,
    marginBottom: 32,
  },
  uploadOption: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0F172A',
    borderRadius: 16,
    padding: 20,
    borderLeftWidth: 4,
    borderLeftColor: '#F97316',
  },
  uploadIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  uploadText: {
    flex: 1,
  },
  uploadTitle: {
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
    color: '#F8FAFC',
    marginBottom: 4,
  },
  uploadSubtitle: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#94A3B8',
  },
  uploadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(15, 23, 42, 0.9)',
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  uploadingText: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#F8FAFC',
    marginTop: 16,
  },
  cancelButton: {
    backgroundColor: '#334155',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#F8FAFC',
  },
});
