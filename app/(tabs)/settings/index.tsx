import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Switch,
  Alert,
} from 'react-native';
import { router } from 'expo-router';
import { useAuthStore } from '@/stores/authStore';
import { User, Shield, Bell, Moon, Fingerprint, Crown, LogOut, ChevronRight, Settings as SettingsIcon, Key, Activity, CreditCard, CircleHelp as HelpCircle, Info } from 'lucide-react-native';

export default function SettingsScreen() {
  const { user, signout, biometricEnabled, toggleBiometric } = useAuthStore();
  const [darkMode, setDarkMode] = useState(true);
  const [notifications, setNotifications] = useState(true);
  const [showSubscription, setShowSubscription] = useState(false);

  const handleSignOut = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: () => {
            signout();
            router.replace('/auth');
          },
        },
      ]
    );
  };

  const subscriptionPlans = [
    {
      id: 'free',
      name: 'Free',
      price: '$0',
      period: 'forever',
      features: ['5 GB storage', '100 files', 'Basic encryption'],
      current: user?.subscription === 'free',
    },
    {
      id: 'pro',
      name: 'Pro',
      price: '$9.99',
      period: 'month',
      features: ['100 GB storage', 'Unlimited files', 'Advanced encryption', 'Priority sync'],
      current: user?.subscription === 'pro',
    },
    {
      id: 'business',
      name: 'Business',
      price: '$19.99',
      period: 'month',
      features: ['1 TB storage', 'Team collaboration', 'Advanced security', 'Priority support'],
      current: user?.subscription === 'business',
    },
  ];

  const SettingItem = ({ 
    icon, 
    title, 
    subtitle, 
    onPress, 
    rightElement, 
    danger = false 
  }: {
    icon: React.ReactNode;
    title: string;
    subtitle?: string;
    onPress?: () => void;
    rightElement?: React.ReactNode;
    danger?: boolean;
  }) => (
    <TouchableOpacity
      style={styles.settingItem}
      onPress={onPress}
      disabled={!onPress}
    >
      <View style={styles.settingIcon}>{icon}</View>
      <View style={styles.settingContent}>
        <Text style={[styles.settingTitle, danger && styles.settingTitleDanger]}>
          {title}
        </Text>
        {subtitle && (
          <Text style={styles.settingSubtitle}>{subtitle}</Text>
        )}
      </View>
      {rightElement || (onPress && <ChevronRight size={20} color="#64748B" />)}
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Settings</Text>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.profileCard}>
          <View style={styles.profileInfo}>
            <View style={styles.avatar}>
              <User size={32} color="#F97316" />
            </View>
            <View style={styles.profileDetails}>
              <Text style={styles.profileName}>{user?.displayName}</Text>
              <Text style={styles.profileEmail}>{user?.email}</Text>
              <View style={styles.subscriptionBadge}>
                <Crown size={12} color="#F97316" />
                <Text style={styles.subscriptionText}>{user?.subscription?.toUpperCase()}</Text>
              </View>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Security</Text>
          
          <SettingItem
            icon={<Fingerprint size={20} color="#F97316" />}
            title="Biometric Unlock"
            subtitle="Use fingerprint or Face ID to unlock vault"
            rightElement={
              <Switch
                value={biometricEnabled}
                onValueChange={toggleBiometric}
                trackColor={{ false: '#334155', true: '#F97316' }}
                thumbColor="#FFFFFF"
              />
            }
          />

          <SettingItem
            icon={<Key size={20} color="#0891B2" />}
            title="Change Password"
            subtitle="Update your vault password"
            onPress={() => Alert.alert('Coming Soon', 'Password change feature will be available soon')}
          />

          <SettingItem
            icon={<Activity size={20} color="#059669" />}
            title="Security Audit"
            subtitle="View security logs and activity"
            onPress={() => Alert.alert('Security Audit', 'All recent activity looks secure')}
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Preferences</Text>
          
          <SettingItem
            icon={<Bell size={20} color="#7C3AED" />}
            title="Notifications"
            subtitle="Security alerts and sync updates"
            rightElement={
              <Switch
                value={notifications}
                onValueChange={setNotifications}
                trackColor={{ false: '#334155', true: '#F97316' }}
                thumbColor="#FFFFFF"
              />
            }
          />

          <SettingItem
            icon={<Moon size={20} color="#64748B" />}
            title="Dark Mode"
            subtitle="Currently enabled"
            rightElement={
              <Switch
                value={darkMode}
                onValueChange={setDarkMode}
                trackColor={{ false: '#334155', true: '#F97316' }}
                thumbColor="#FFFFFF"
              />
            }
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Subscription</Text>
          
          <SettingItem
            icon={<CreditCard size={20} color="#F97316" />}
            title="Manage Subscription"
            subtitle={`Current plan: ${user?.subscription?.toUpperCase()}`}
            onPress={() => setShowSubscription(!showSubscription)}
          />

          {showSubscription && (
            <View style={styles.subscriptionPlans}>
              {subscriptionPlans.map((plan) => (
                <View
                  key={plan.id}
                  style={[
                    styles.planCard,
                    plan.current && styles.planCardCurrent,
                  ]}
                >
                  <View style={styles.planHeader}>
                    <Text style={styles.planName}>{plan.name}</Text>
                    <View style={styles.planPrice}>
                      <Text style={styles.planPriceAmount}>{plan.price}</Text>
                      <Text style={styles.planPricePeriod}>/{plan.period}</Text>
                    </View>
                  </View>
                  
                  <View style={styles.planFeatures}>
                    {plan.features.map((feature, index) => (
                      <Text key={index} style={styles.planFeature}>
                        • {feature}
                      </Text>
                    ))}
                  </View>

                  {!plan.current && (
                    <TouchableOpacity style={styles.upgradeButton}>
                      <Text style={styles.upgradeButtonText}>
                        {plan.id === 'free' ? 'Downgrade' : 'Upgrade'}
                      </Text>
                    </TouchableOpacity>
                  )}

                  {plan.current && (
                    <View style={styles.currentPlanBadge}>
                      <Text style={styles.currentPlanText}>Current Plan</Text>
                    </View>
                  )}
                </View>
              ))}
            </View>
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Support</Text>
          
          <SettingItem
            icon={<HelpCircle size={20} color="#0891B2" />}
            title="Help & Support"
            subtitle="Get help with using Secure Vault"
            onPress={() => Alert.alert('Support', 'Contact support at help@securevault.app')}
          />

          <SettingItem
            icon={<Info size={20} color="#64748B" />}
            title="About"
            subtitle="Version 1.0.0"
            onPress={() => Alert.alert('About', 'Secure Vault v1.0.0\nBuilt with security in mind.')}
          />
        </View>

        <View style={styles.section}>
          <SettingItem
            icon={<LogOut size={20} color="#DC2626" />}
            title="Sign Out"
            onPress={handleSignOut}
            danger
          />
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
    paddingTop: 60,
    paddingHorizontal: 24,
    paddingBottom: 24,
  },
  title: {
    fontSize: 28,
    fontFamily: 'Inter-Bold',
    color: '#F8FAFC',
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
  },
  profileCard: {
    backgroundColor: '#1E293B',
    borderRadius: 16,
    padding: 20,
    marginBottom: 32,
    borderWidth: 1,
    borderColor: '#334155',
  },
  profileInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 64,
    height: 64,
    backgroundColor: '#1E3A8A',
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  profileDetails: {
    flex: 1,
  },
  profileName: {
    fontSize: 20,
    fontFamily: 'Inter-Bold',
    color: '#F8FAFC',
    marginBottom: 4,
  },
  profileEmail: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#94A3B8',
    marginBottom: 8,
  },
  subscriptionBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E3A8A',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    alignSelf: 'flex-start',
    gap: 4,
  },
  subscriptionText: {
    fontSize: 10,
    fontFamily: 'Inter-Bold',
    color: '#F97316',
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#94A3B8',
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
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
  settingIcon: {
    width: 40,
    height: 40,
    backgroundColor: '#334155',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  settingContent: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#F8FAFC',
  },
  settingTitleDanger: {
    color: '#DC2626',
  },
  settingSubtitle: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#94A3B8',
    marginTop: 4,
  },
  subscriptionPlans: {
    marginTop: 16,
    gap: 12,
  },
  planCard: {
    backgroundColor: '#334155',
    borderRadius: 12,
    padding: 16,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  planCardCurrent: {
    borderColor: '#F97316',
    backgroundColor: '#1E3A8A',
  },
  planHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  planName: {
    fontSize: 18,
    fontFamily: 'Inter-Bold',
    color: '#F8FAFC',
  },
  planPrice: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  planPriceAmount: {
    fontSize: 20,
    fontFamily: 'Inter-Bold',
    color: '#F97316',
  },
  planPricePeriod: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#94A3B8',
  },
  planFeatures: {
    marginBottom: 16,
  },
  planFeature: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#94A3B8',
    marginBottom: 4,
  },
  upgradeButton: {
    backgroundColor: '#F97316',
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: 'center',
  },
  upgradeButtonText: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    color: '#FFFFFF',
  },
  currentPlanBadge: {
    backgroundColor: '#059669',
    borderRadius: 6,
    paddingVertical: 6,
    alignItems: 'center',
  },
  currentPlanText: {
    fontSize: 12,
    fontFamily: 'Inter-SemiBold',
    color: '#FFFFFF',
  },
});