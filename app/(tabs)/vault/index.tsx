import FileUploadModal from '@/components/FileUploadModal';
import { useAuthStore } from '@/stores/authStore';
import { useVaultStore } from '@/stores/vaultStore';
import {
  File,
  Grid3x3,
  Image as ImageIcon,
  List,
  Music,
  Plus,
  Search,
  Shield,
  Import as SortAsc,
  Video,
} from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import {
  Alert,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

export default function VaultScreen() {
  const { user, vaultUnlocked, lockVault } = useAuthStore();
  const {
    files,
    selectedFiles,
    searchQuery,
    sortBy,
    viewMode,
    setSearchQuery,
    setSortBy,
    setViewMode,
    toggleFileSelection,
    clearSelection,
    addFile,
    deleteFiles,
    getTotalStorageUsed,
    loadFilesFromBackend,
  } = useVaultStore();

  const [showOptions, setShowOptions] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);

  // Load files from backend when component mounts
  useEffect(() => {
    if (vaultUnlocked) {
      loadFilesFromBackend();
    }
  }, [vaultUnlocked]);

  if (!vaultUnlocked) {
    return (
      <View style={styles.lockedContainer}>
        <Shield size={64} color="#F97316" />
        <Text style={styles.lockedTitle}>Vault Locked</Text>
        <Text style={styles.lockedSubtitle}>
          Your vault is securely locked. Please authenticate to continue.
        </Text>
      </View>
    );
  }

  const filteredFiles = files.filter((file) =>
    file.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const sortedFiles = [...filteredFiles].sort((a, b) => {
    switch (sortBy) {
      case 'name':
        return a.name.localeCompare(b.name);
      case 'date':
        return (
          new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime()
        );
      case 'size':
        return b.size - a.size;
      case 'type':
        return a.type.localeCompare(b.type);
      default:
        return 0;
    }
  });

  const getFileIcon = (type: string) => {
    switch (type) {
      case 'image':
        return <ImageIcon size={20} color="#F97316" />;
      case 'video':
        return <Video size={20} color="#F97316" />;
      case 'audio':
        return <Music size={20} color="#F97316" />;
      default:
        return <File size={20} color="#F97316" />;
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const handleFileUploaded = async (file: any) => {
    // Add file to local state immediately for UI responsiveness
    addFile(file);
    console.log('✅ File uploaded and encrypted:', file.name);

    // Refresh files from backend to ensure consistency
    try {
      await loadFilesFromBackend();
    } catch (error) {
      console.error('Failed to refresh files from backend:', error);
    }
  };

  const handleDeleteSelected = () => {
    if (selectedFiles.length === 0) return;

    Alert.alert(
      'Delete Files',
      `Are you sure you want to delete ${selectedFiles.length} file(s)?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            deleteFiles(selectedFiles);
            clearSelection();
          },
        },
      ]
    );
  };

  const totalStorage = getTotalStorageUsed();
  const storageUsed = formatFileSize(totalStorage);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View>
            <Text style={styles.greeting}>
              Welcome back, {user?.displayName}
            </Text>
            <Text style={styles.fileCount}>
              {files.length} encrypted files • {storageUsed}
            </Text>
          </View>
          <TouchableOpacity style={styles.lockButton} onPress={lockVault}>
            <Shield size={24} color="#F97316" />
          </TouchableOpacity>
        </View>

        <View style={styles.searchContainer}>
          <Search size={20} color="#64748B" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search files..."
            placeholderTextColor="#64748B"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        <View style={styles.controls}>
          <View style={styles.controlsLeft}>
            <TouchableOpacity
              style={[
                styles.controlButton,
                viewMode === 'grid' && styles.controlButtonActive,
              ]}
              onPress={() => setViewMode('grid')}
            >
              <Grid3x3
                size={18}
                color={viewMode === 'grid' ? '#F97316' : '#64748B'}
              />
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.controlButton,
                viewMode === 'list' && styles.controlButtonActive,
              ]}
              onPress={() => setViewMode('list')}
            >
              <List
                size={18}
                color={viewMode === 'list' ? '#F97316' : '#64748B'}
              />
            </TouchableOpacity>
          </View>

          <View style={styles.controlsRight}>
            <TouchableOpacity style={styles.controlButton}>
              <SortAsc size={18} color="#64748B" />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.addButton}
              onPress={() => setShowUploadModal(true)}
            >
              <Plus size={20} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {selectedFiles.length > 0 && (
        <View style={styles.selectionBar}>
          <Text style={styles.selectionText}>
            {selectedFiles.length} selected
          </Text>
          <View style={styles.selectionActions}>
            <TouchableOpacity
              style={styles.selectionAction}
              onPress={clearSelection}
            >
              <Text style={styles.selectionActionText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.deleteAction}
              onPress={handleDeleteSelected}
            >
              <Text style={styles.deleteActionText}>Delete</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {viewMode === 'grid' ? (
          <View style={styles.grid}>
            {sortedFiles.map((file) => (
              <TouchableOpacity
                key={file.id}
                style={[
                  styles.gridItem,
                  selectedFiles.includes(file.id) && styles.gridItemSelected,
                ]}
                onPress={() => toggleFileSelection(file.id)}
                onLongPress={() => toggleFileSelection(file.id)}
              >
                <View style={styles.filePreview}>
                  {file.thumbnail ? (
                    <Image
                      source={{ uri: file.thumbnail }}
                      style={styles.thumbnail}
                    />
                  ) : (
                    <View style={styles.fileIconContainer}>
                      {getFileIcon(file.type)}
                    </View>
                  )}
                  <View style={styles.encryptionBadge}>
                    <Shield size={12} color="#059669" />
                  </View>
                </View>
                <Text style={styles.fileName} numberOfLines={2}>
                  {file.name}
                </Text>
                <Text style={styles.fileSize}>{formatFileSize(file.size)}</Text>
              </TouchableOpacity>
            ))}
          </View>
        ) : (
          <View style={styles.list}>
            {sortedFiles.map((file) => (
              <TouchableOpacity
                key={file.id}
                style={[
                  styles.listItem,
                  selectedFiles.includes(file.id) && styles.listItemSelected,
                ]}
                onPress={() => toggleFileSelection(file.id)}
              >
                <View style={styles.listItemLeft}>
                  {file.thumbnail ? (
                    <Image
                      source={{ uri: file.thumbnail }}
                      style={styles.listThumbnail}
                    />
                  ) : (
                    <View style={styles.listFileIcon}>
                      {getFileIcon(file.type)}
                    </View>
                  )}
                  <View style={styles.listFileInfo}>
                    <Text style={styles.listFileName}>{file.name}</Text>
                    <Text style={styles.listFileDetails}>
                      {formatFileSize(file.size)} • {file.type}
                    </Text>
                  </View>
                </View>
                <View style={styles.listItemRight}>
                  <Shield size={16} color="#059669" />
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {sortedFiles.length === 0 && (
          <View style={styles.emptyState}>
            <Shield size={48} color="#64748B" />
            <Text style={styles.emptyTitle}>No files in vault</Text>
            <Text style={styles.emptySubtitle}>
              Add your first file to start securing your data
            </Text>
            <TouchableOpacity
              style={styles.emptyButton}
              onPress={() => setShowUploadModal(true)}
            >
              <Plus size={20} color="#FFFFFF" />
              <Text style={styles.emptyButtonText}>Add File</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>

      {/* File Upload Modal */}
      <FileUploadModal
        visible={showUploadModal}
        onClose={() => setShowUploadModal(false)}
        onFileUploaded={handleFileUploaded}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F172A',
  },
  header: {
    paddingTop: 60,
    paddingHorizontal: 24,
    paddingBottom: 16,
    backgroundColor: '#1E293B',
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  greeting: {
    fontSize: 20,
    fontFamily: 'Inter-SemiBold',
    color: '#F8FAFC',
  },
  fileCount: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#94A3B8',
    marginTop: 4,
  },
  lockButton: {
    width: 48,
    height: 48,
    backgroundColor: '#1E3A8A',
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0F172A',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 16,
  },
  searchIcon: {
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#F8FAFC',
  },
  controls: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  controlsLeft: {
    flexDirection: 'row',
    gap: 8,
  },
  controlsRight: {
    flexDirection: 'row',
    gap: 8,
  },
  controlButton: {
    width: 40,
    height: 40,
    backgroundColor: '#0F172A',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  controlButtonActive: {
    backgroundColor: '#1E3A8A',
  },
  addButton: {
    width: 40,
    height: 40,
    backgroundColor: '#F97316',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectionBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#1E3A8A',
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  selectionText: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    color: '#F8FAFC',
  },
  selectionActions: {
    flexDirection: 'row',
    gap: 16,
  },
  selectionAction: {
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  selectionActionText: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    color: '#94A3B8',
  },
  deleteAction: {
    backgroundColor: '#DC2626',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  deleteActionText: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    color: '#FFFFFF',
  },
  content: {
    flex: 1,
    padding: 24,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  gridItem: {
    width: '47%',
    backgroundColor: '#1E293B',
    borderRadius: 12,
    padding: 12,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  gridItemSelected: {
    borderColor: '#F97316',
  },
  filePreview: {
    width: '100%',
    height: 120,
    backgroundColor: '#0F172A',
    borderRadius: 8,
    marginBottom: 8,
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  thumbnail: {
    width: '100%',
    height: '100%',
    borderRadius: 8,
  },
  fileIconContainer: {
    width: 40,
    height: 40,
    backgroundColor: '#334155',
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  encryptionBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 24,
    height: 24,
    backgroundColor: '#059669',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fileName: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    color: '#F8FAFC',
    marginBottom: 4,
  },
  fileSize: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: '#94A3B8',
  },
  list: {
    gap: 12,
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E293B',
    borderRadius: 12,
    padding: 16,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  listItemSelected: {
    borderColor: '#F97316',
  },
  listItemLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  listThumbnail: {
    width: 48,
    height: 48,
    borderRadius: 8,
    marginRight: 12,
  },
  listFileIcon: {
    width: 48,
    height: 48,
    backgroundColor: '#334155',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  listFileInfo: {
    flex: 1,
  },
  listFileName: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#F8FAFC',
    marginBottom: 4,
  },
  listFileDetails: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#94A3B8',
  },
  listItemRight: {
    marginLeft: 12,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
  },
  emptyTitle: {
    fontSize: 20,
    fontFamily: 'Inter-SemiBold',
    color: '#F8FAFC',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#94A3B8',
    textAlign: 'center',
    marginBottom: 24,
    maxWidth: 240,
  },
  emptyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F97316',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
  },
  emptyButtonText: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#FFFFFF',
  },
  lockedContainer: {
    flex: 1,
    backgroundColor: '#0F172A',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  lockedTitle: {
    fontSize: 24,
    fontFamily: 'Inter-Bold',
    color: '#F8FAFC',
    marginTop: 24,
    marginBottom: 8,
  },
  lockedSubtitle: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#94A3B8',
    textAlign: 'center',
    maxWidth: 280,
  },
});
