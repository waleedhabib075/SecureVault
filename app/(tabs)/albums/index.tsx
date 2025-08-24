import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  TextInput,
  Image,
  Modal,
  Alert,
} from 'react-native';
import { useVaultStore } from '@/stores/vaultStore';
import { FolderOpen, Plus, Search, MoveVertical as MoreVertical, CreditCard as Edit3, Trash2, Move } from 'lucide-react-native';

export default function AlbumsScreen() {
  const {
    albums,
    files,
    createAlbum,
    deleteAlbum,
    setCurrentAlbum,
  } = useVaultStore();

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newAlbumName, setNewAlbumName] = useState('');
  const [newAlbumDescription, setNewAlbumDescription] = useState('');
  const [selectedColor, setSelectedColor] = useState('#F97316');

  const colors = [
    '#F97316', '#DC2626', '#059669', '#0891B2', 
    '#7C3AED', '#DB2777', '#EA580C', '#16A34A'
  ];

  const handleCreateAlbum = () => {
    if (!newAlbumName.trim()) {
      Alert.alert('Error', 'Please enter an album name');
      return;
    }

    createAlbum({
      name: newAlbumName,
      description: newAlbumDescription,
      color: selectedColor,
    });

    setNewAlbumName('');
    setNewAlbumDescription('');
    setSelectedColor('#F97316');
    setShowCreateModal(false);
  };

  const getAlbumFileCount = (albumId: string) => {
    return files.filter(file => file.albumId === albumId).length;
  };

  const getAlbumThumbnail = (albumId: string) => {
    const albumFiles = files.filter(file => file.albumId === albumId);
    return albumFiles.find(file => file.thumbnail)?.thumbnail;
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Albums</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => setShowCreateModal(true)}
        >
          <Plus size={20} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.grid}>
          {albums.map((album) => {
            const fileCount = getAlbumFileCount(album.id);
            const thumbnail = getAlbumThumbnail(album.id);

            return (
              <TouchableOpacity
                key={album.id}
                style={styles.albumCard}
                onPress={() => {
                  setCurrentAlbum(album.id);
                  // Navigate to album detail screen
                }}
              >
                <View style={styles.albumPreview}>
                  {thumbnail ? (
                    <Image source={{ uri: thumbnail }} style={styles.albumThumbnail} />
                  ) : (
                    <View style={[styles.albumPlaceholder, { backgroundColor: album.color }]}>
                      <FolderOpen size={32} color="#FFFFFF" />
                    </View>
                  )}
                  <View style={[styles.albumColorBadge, { backgroundColor: album.color }]} />
                </View>
                
                <View style={styles.albumInfo}>
                  <Text style={styles.albumName}>{album.name}</Text>
                  <Text style={styles.albumFileCount}>
                    {fileCount} {fileCount === 1 ? 'file' : 'files'}
                  </Text>
                  {album.description && (
                    <Text style={styles.albumDescription} numberOfLines={2}>
                      {album.description}
                    </Text>
                  )}
                </View>

                <TouchableOpacity style={styles.albumMenu}>
                  <MoreVertical size={20} color="#64748B" />
                </TouchableOpacity>
              </TouchableOpacity>
            );
          })}
        </View>

        {albums.length === 0 && (
          <View style={styles.emptyState}>
            <FolderOpen size={48} color="#64748B" />
            <Text style={styles.emptyTitle}>No albums yet</Text>
            <Text style={styles.emptySubtitle}>
              Create albums to organize your files
            </Text>
            <TouchableOpacity
              style={styles.emptyButton}
              onPress={() => setShowCreateModal(true)}
            >
              <Plus size={20} color="#FFFFFF" />
              <Text style={styles.emptyButtonText}>Create Album</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>

      <Modal
        visible={showCreateModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowCreateModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Create Album</Text>

            <TextInput
              style={styles.modalInput}
              placeholder="Album name"
              placeholderTextColor="#64748B"
              value={newAlbumName}
              onChangeText={setNewAlbumName}
            />

            <TextInput
              style={[styles.modalInput, styles.modalTextArea]}
              placeholder="Description (optional)"
              placeholderTextColor="#64748B"
              value={newAlbumDescription}
              onChangeText={setNewAlbumDescription}
              multiline
              numberOfLines={3}
            />

            <Text style={styles.colorLabel}>Choose color</Text>
            <View style={styles.colorPicker}>
              {colors.map((color) => (
                <TouchableOpacity
                  key={color}
                  style={[
                    styles.colorOption,
                    { backgroundColor: color },
                    selectedColor === color && styles.colorOptionSelected,
                  ]}
                  onPress={() => setSelectedColor(color)}
                />
              ))}
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.modalCancelButton}
                onPress={() => setShowCreateModal(false)}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalCreateButton}
                onPress={handleCreateAlbum}
              >
                <Text style={styles.modalCreateText}>Create</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F172A',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 60,
    paddingHorizontal: 24,
    paddingBottom: 24,
  },
  title: {
    fontSize: 28,
    fontFamily: 'Inter-Bold',
    color: '#F8FAFC',
  },
  addButton: {
    width: 44,
    height: 44,
    backgroundColor: '#F97316',
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
  },
  grid: {
    gap: 16,
  },
  albumCard: {
    backgroundColor: '#1E293B',
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#334155',
  },
  albumPreview: {
    width: 60,
    height: 60,
    borderRadius: 12,
    marginRight: 16,
    position: 'relative',
  },
  albumThumbnail: {
    width: '100%',
    height: '100%',
    borderRadius: 12,
  },
  albumPlaceholder: {
    width: '100%',
    height: '100%',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  albumColorBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#1E293B',
  },
  albumInfo: {
    flex: 1,
  },
  albumName: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#F8FAFC',
    marginBottom: 4,
  },
  albumFileCount: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#94A3B8',
    marginBottom: 4,
  },
  albumDescription: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: '#64748B',
  },
  albumMenu: {
    padding: 8,
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  modalContent: {
    backgroundColor: '#1E293B',
    borderRadius: 16,
    padding: 24,
  },
  modalTitle: {
    fontSize: 20,
    fontFamily: 'Inter-Bold',
    color: '#F8FAFC',
    marginBottom: 24,
    textAlign: 'center',
  },
  modalInput: {
    backgroundColor: '#0F172A',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#F8FAFC',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#334155',
  },
  modalTextArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  colorLabel: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    color: '#F8FAFC',
    marginBottom: 12,
  },
  colorPicker: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 24,
  },
  colorOption: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 3,
    borderColor: 'transparent',
  },
  colorOptionSelected: {
    borderColor: '#F8FAFC',
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
  },
  modalCancelButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#334155',
  },
  modalCancelText: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#94A3B8',
  },
  modalCreateButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 8,
    backgroundColor: '#F97316',
  },
  modalCreateText: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#FFFFFF',
  },
});