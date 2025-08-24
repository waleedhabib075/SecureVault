import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
} from 'react-native';
import { Cloud, CloudUpload, CloudDownload, Wifi, WifiOff, CircleCheck as CheckCircle, CircleAlert as AlertCircle, Clock, Zap } from 'lucide-react-native';

interface SyncStatus {
  status: 'idle' | 'syncing' | 'error' | 'success';
  lastSync: string;
  pendingUploads: number;
  pendingDownloads: number;
  totalFiles: number;
  progress: number;
}

export default function SyncScreen() {
  const [syncStatus, setSyncStatus] = useState<SyncStatus>({
    status: 'idle',
    lastSync: '2024-01-15T14:30:00Z',
    pendingUploads: 3,
    pendingDownloads: 1,
    totalFiles: 127,
    progress: 0,
  });

  const [isOnline, setIsOnline] = useState(true);
  const [autoSync, setAutoSync] = useState(true);

  const handleManualSync = async () => {
    if (!isOnline) {
      Alert.alert('No Connection', 'Please check your internet connection');
      return;
    }

    setSyncStatus(prev => ({ ...prev, status: 'syncing', progress: 0 }));
    
    // Simulate sync progress
    for (let i = 0; i <= 100; i += 10) {
      await new Promise(resolve => setTimeout(resolve, 200));
      setSyncStatus(prev => ({ ...prev, progress: i }));
    }

    setSyncStatus(prev => ({
      ...prev,
      status: 'success',
      lastSync: new Date().toISOString(),
      pendingUploads: 0,
      pendingDownloads: 0,
      progress: 100,
    }));

    setTimeout(() => {
      setSyncStatus(prev => ({ ...prev, status: 'idle' }));
    }, 2000);
  };

  const formatLastSync = (timestamp: string) => {
    const now = new Date();
    const sync = new Date(timestamp);
    const diffMs = now.getTime() - sync.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}d ago`;
  };

  const getStatusIcon = () => {
    switch (syncStatus.status) {
      case 'syncing':
        return <Clock size={24} color="#F97316" />;
      case 'success':
        return <CheckCircle size={24} color="#059669" />;
      case 'error':
        return <AlertCircle size={24} color="#DC2626" />;
      default:
        return <Cloud size={24} color="#0891B2" />;
    }
  };

  const getStatusText = () => {
    switch (syncStatus.status) {
      case 'syncing':
        return 'Syncing...';
      case 'success':
        return 'All synced';
      case 'error':
        return 'Sync failed';
      default:
        return 'Ready to sync';
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Cloud Sync</Text>
        <View style={styles.connectionStatus}>
          {isOnline ? (
            <Wifi size={20} color="#059669" />
          ) : (
            <WifiOff size={20} color="#DC2626" />
          )}
        </View>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.statusCard}>
          <View style={styles.statusHeader}>
            {getStatusIcon()}
            <View style={styles.statusInfo}>
              <Text style={styles.statusTitle}>{getStatusText()}</Text>
              <Text style={styles.statusSubtitle}>
                Last sync: {formatLastSync(syncStatus.lastSync)}
              </Text>
            </View>
          </View>

          {syncStatus.status === 'syncing' && (
            <View style={styles.progressContainer}>
              <View style={styles.progressBar}>
                <View 
                  style={[styles.progressFill, { width: `${syncStatus.progress}%` }]} 
                />
              </View>
              <Text style={styles.progressText}>{syncStatus.progress}%</Text>
            </View>
          )}

          <TouchableOpacity
            style={[styles.syncButton, syncStatus.status === 'syncing' && styles.syncButtonDisabled]}
            onPress={handleManualSync}
            disabled={syncStatus.status === 'syncing' || !isOnline}
          >
            <Text style={styles.syncButtonText}>
              {syncStatus.status === 'syncing' ? 'Syncing...' : 'Sync Now'}
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <CloudUpload size={24} color="#F97316" />
            <Text style={styles.statNumber}>{syncStatus.pendingUploads}</Text>
            <Text style={styles.statLabel}>Pending Uploads</Text>
          </View>

          <View style={styles.statCard}>
            <CloudDownload size={24} color="#0891B2" />
            <Text style={styles.statNumber}>{syncStatus.pendingDownloads}</Text>
            <Text style={styles.statLabel}>Pending Downloads</Text>
          </View>

          <View style={styles.statCard}>
            <Cloud size={24} color="#059669" />
            <Text style={styles.statNumber}>{syncStatus.totalFiles}</Text>
            <Text style={styles.statLabel}>Total Files</Text>
          </View>

          <View style={styles.statCard}>
            <Zap size={24} color="#7C3AED" />
            <Text style={styles.statNumber}>AES-256</Text>
            <Text style={styles.statLabel}>Encryption</Text>
          </View>
        </View>

        <View style={styles.settingsSection}>
          <Text style={styles.sectionTitle}>Sync Settings</Text>

          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>Auto Sync</Text>
              <Text style={styles.settingDescription}>
                Automatically sync when connected to WiFi
              </Text>
            </View>
            <TouchableOpacity
              style={[styles.toggle, autoSync && styles.toggleActive]}
              onPress={() => setAutoSync(!autoSync)}
            >
              <View style={[styles.toggleKnob, autoSync && styles.toggleKnobActive]} />
            </TouchableOpacity>
          </View>

          <TouchableOpacity style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>Sync Quality</Text>
              <Text style={styles.settingDescription}>High quality (original files)</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>Storage Used</Text>
              <Text style={styles.settingDescription}>2.3 GB of 15 GB used</Text>
            </View>
          </TouchableOpacity>
        </View>

        <View style={styles.activitySection}>
          <Text style={styles.sectionTitle}>Recent Activity</Text>
          
          <View style={styles.activityList}>
            <View style={styles.activityItem}>
              <CheckCircle size={20} color="#059669" />
              <View style={styles.activityInfo}>
                <Text style={styles.activityTitle}>Document.pdf uploaded</Text>
                <Text style={styles.activityTime}>2 minutes ago</Text>
              </View>
            </View>

            <View style={styles.activityItem}>
              <CheckCircle size={20} color="#059669" />
              <View style={styles.activityInfo}>
                <Text style={styles.activityTitle}>Photo album synced</Text>
                <Text style={styles.activityTime}>1 hour ago</Text>
              </View>
            </View>

            <View style={styles.activityItem}>
              <AlertCircle size={20} color="#F59E0B" />
              <View style={styles.activityInfo}>
                <Text style={styles.activityTitle}>Video upload paused</Text>
                <Text style={styles.activityTime}>3 hours ago</Text>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>
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
  connectionStatus: {
    width: 44,
    height: 44,
    backgroundColor: '#1E293B',
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
  },
  statusCard: {
    backgroundColor: '#1E293B',
    borderRadius: 16,
    padding: 24,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#334155',
  },
  statusHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  statusInfo: {
    marginLeft: 16,
    flex: 1,
  },
  statusTitle: {
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
    color: '#F8FAFC',
  },
  statusSubtitle: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#94A3B8',
    marginTop: 4,
  },
  progressContainer: {
    marginBottom: 16,
  },
  progressBar: {
    height: 6,
    backgroundColor: '#334155',
    borderRadius: 3,
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#F97316',
    borderRadius: 3,
  },
  progressText: {
    fontSize: 12,
    fontFamily: 'Inter-SemiBold',
    color: '#F97316',
    textAlign: 'center',
  },
  syncButton: {
    backgroundColor: '#F97316',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
  },
  syncButtonDisabled: {
    opacity: 0.6,
  },
  syncButtonText: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#FFFFFF',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 32,
  },
  statCard: {
    flex: 1,
    minWidth: '47%',
    backgroundColor: '#1E293B',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#334155',
  },
  statNumber: {
    fontSize: 20,
    fontFamily: 'Inter-Bold',
    color: '#F8FAFC',
    marginTop: 8,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: '#94A3B8',
    textAlign: 'center',
  },
  settingsSection: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
    color: '#F8FAFC',
    marginBottom: 16,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E293B',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#334155',
  },
  settingInfo: {
    flex: 1,
  },
  settingLabel: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#F8FAFC',
    marginBottom: 4,
  },
  settingDescription: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#94A3B8',
  },
  toggle: {
    width: 50,
    height: 28,
    backgroundColor: '#334155',
    borderRadius: 14,
    padding: 2,
    justifyContent: 'center',
  },
  toggleActive: {
    backgroundColor: '#F97316',
  },
  toggleKnob: {
    width: 24,
    height: 24,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    transform: [{ translateX: 0 }],
  },
  toggleKnobActive: {
    transform: [{ translateX: 22 }],
  },
  activitySection: {
    marginBottom: 32,
  },
  activityList: {
    gap: 12,
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E293B',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#334155',
  },
  activityInfo: {
    marginLeft: 12,
    flex: 1,
  },
  activityTitle: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    color: '#F8FAFC',
    marginBottom: 4,
  },
  activityTime: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: '#94A3B8',
  },
});