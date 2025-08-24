import { useAuthStore } from '@/stores/authStore';
import { router } from 'expo-router';
import { Eye, EyeOff, Lock, Mail, Shield, User } from 'lucide-react-native';
import React, { useState } from 'react';
import {
  Alert,
  Animated,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

export default function AuthScreen() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [fadeAnim] = useState(new Animated.Value(0));

  const { signin, signup, isLoading, resetAuth, isAuthenticated, forceLogout } =
    useAuthStore();

  React.useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 800,
      useNativeDriver: true,
    }).start();

    // Reset authentication state when entering auth screen
    if (isAuthenticated) {
      resetAuth();
    }
  }, []);

  const handleForceLogout = async () => {
    try {
      await forceLogout();
      Alert.alert(
        'Success',
        'Authentication state cleared. Please restart the app.'
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to clear authentication state.');
    }
  };

  const handleSubmit = async () => {
    try {
      if (isLogin) {
        await signin(email, password);
      } else {
        await signup(email, password, displayName);
      }
      router.replace('/(tabs)/vault');
    } catch (error) {
      let errorMessage = 'Authentication failed. Please try again.';

      if (error instanceof Error) {
        errorMessage = error.message;
      } else if (typeof error === 'string') {
        errorMessage = error;
      }

      Alert.alert('Error', errorMessage);
    }
  };

  const toggleMode = () => {
    setIsLogin(!isLogin);
    setEmail('');
    setPassword('');
    setDisplayName('');
  };

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
        <View style={styles.header}>
          <View style={styles.iconContainer}>
            <Shield size={48} color="#F97316" strokeWidth={2} />
          </View>
          <Text style={styles.title}>Secure Vault</Text>
          <Text style={styles.subtitle}>
            {isLogin ? 'Welcome back' : 'Create your secure vault'}
          </Text>
        </View>

        <View style={styles.form}>
          {!isLogin && (
            <View style={styles.inputContainer}>
              <User size={20} color="#64748B" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Display Name"
                placeholderTextColor="#94A3B8"
                value={displayName}
                onChangeText={setDisplayName}
                autoCapitalize="words"
              />
            </View>
          )}

          <View style={styles.inputContainer}>
            <Mail size={20} color="#64748B" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Email"
              placeholderTextColor="#94A3B8"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>

          <View style={styles.inputContainer}>
            <Lock size={20} color="#64748B" style={styles.inputIcon} />
            <TextInput
              style={[styles.input, styles.passwordInput]}
              placeholder="Password"
              placeholderTextColor="#94A3B8"
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
            />
            <TouchableOpacity
              style={styles.eyeIcon}
              onPress={() => setShowPassword(!showPassword)}
            >
              {showPassword ? (
                <EyeOff size={20} color="#64748B" />
              ) : (
                <Eye size={20} color="#64748B" />
              )}
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={[
              styles.submitButton,
              isLoading && styles.submitButtonDisabled,
            ]}
            onPress={handleSubmit}
            disabled={isLoading}
          >
            <Text style={styles.submitButtonText}>
              {isLoading
                ? 'Loading...'
                : isLogin
                ? 'Sign In'
                : 'Create Account'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.toggleButton} onPress={toggleMode}>
            <Text style={styles.toggleButtonText}>
              {isLogin
                ? "Don't have an account? "
                : 'Already have an account? '}
              <Text style={styles.toggleButtonLink}>
                {isLogin ? 'Sign Up' : 'Sign In'}
              </Text>
            </Text>
          </TouchableOpacity>

          {/* Debug: Force Logout Button */}
          <TouchableOpacity
            style={styles.debugButton}
            onPress={handleForceLogout}
          >
            <Text style={styles.debugButtonText}>🔧 Debug: Force Logout</Text>
          </TouchableOpacity>
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F172A',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  header: {
    alignItems: 'center',
    marginBottom: 48,
  },
  iconContainer: {
    width: 80,
    height: 80,
    backgroundColor: '#1E3A8A',
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 32,
    fontFamily: 'Inter-Bold',
    color: '#F8FAFC',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#94A3B8',
  },
  form: {
    gap: 16,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E293B',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderWidth: 1,
    borderColor: '#334155',
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#F8FAFC',
  },
  passwordInput: {
    paddingRight: 40,
  },
  eyeIcon: {
    position: 'absolute',
    right: 16,
    padding: 4,
  },
  submitButton: {
    backgroundColor: '#F97316',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  submitButtonDisabled: {
    opacity: 0.7,
  },
  submitButtonText: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#FFFFFF',
  },
  toggleButton: {
    alignItems: 'center',
    marginTop: 24,
  },
  toggleButtonText: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#94A3B8',
  },
  toggleButtonLink: {
    color: '#F97316',
    fontFamily: 'Inter-SemiBold',
  },
  debugButton: {
    backgroundColor: '#475569',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 24,
  },
  debugButtonText: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#FFFFFF',
  },
});
