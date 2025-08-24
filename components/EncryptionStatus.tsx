import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Shield, Lock } from 'lucide-react-native';

interface EncryptionStatusProps {
  isEncrypted: boolean;
  algorithm?: string;
  size?: 'small' | 'medium' | 'large';
}

export function EncryptionStatus({ 
  isEncrypted, 
  algorithm = 'AES-256', 
  size = 'medium' 
}: EncryptionStatusProps) {
  const iconSize = size === 'small' ? 12 : size === 'medium' ? 16 : 20;
  const textSize = size === 'small' ? 10 : size === 'medium' ? 12 : 14;

  return (
    <View style={[styles.container, styles[size]]}>
      {isEncrypted ? (
        <>
          <Shield size={iconSize} color="#059669" />
          <Text style={[styles.text, styles.encrypted, { fontSize: textSize }]}>
            {algorithm}
          </Text>
        </>
      ) : (
        <>
          <Lock size={iconSize} color="#F59E0B" />
          <Text style={[styles.text, styles.unencrypted, { fontSize: textSize }]}>
            Unencrypted
          </Text>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 3,
    gap: 4,
  },
  small: {
    paddingHorizontal: 4,
    paddingVertical: 2,
  },
  medium: {
    paddingHorizontal: 6,
    paddingVertical: 3,
  },
  large: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  text: {
    fontFamily: 'Inter-SemiBold',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  encrypted: {
    color: '#059669',
  },
  unencrypted: {
    color: '#F59E0B',
  },
});