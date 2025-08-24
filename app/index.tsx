import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { router } from 'expo-router';
import { useAuthStore } from '@/stores/authStore';
import { Shield } from 'lucide-react-native';

export default function SplashScreen() {
  const { isAuthenticated, vaultUnlocked } = useAuthStore();
  const [fadeAnim] = React.useState(new Animated.Value(0));
  const [scaleAnim] = React.useState(new Animated.Value(0.8));

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 50,
        friction: 8,
        useNativeDriver: true,
      }),
    ]).start();

    const timer = setTimeout(() => {
      if (isAuthenticated && vaultUnlocked) {
        router.replace('/(tabs)/vault');
      } else {
        router.replace('/auth');
      }
    }, 2000);

    return () => clearTimeout(timer);
  }, [isAuthenticated, vaultUnlocked]);

  return (
    <View style={styles.container}>
      <Animated.View
        style={[
          styles.content,
          {
            opacity: fadeAnim,
            transform: [{ scale: scaleAnim }],
          },
        ]}
      >
        <View style={styles.iconContainer}>
          <Shield size={64} color="#F97316" strokeWidth={2} />
        </View>
        <Text style={styles.title}>Secure Vault</Text>
        <Text style={styles.subtitle}>Your files, encrypted and secure</Text>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F172A',
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    alignItems: 'center',
  },
  iconContainer: {
    width: 120,
    height: 120,
    backgroundColor: '#1E3A8A',
    borderRadius: 60,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 32,
  },
  title: {
    fontSize: 36,
    fontFamily: 'Inter-Bold',
    color: '#F8FAFC',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#94A3B8',
  },
});