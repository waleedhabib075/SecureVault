import CryptoJS from 'crypto-js';
import * as Crypto from 'expo-crypto';

export interface EncryptedFile {
  encryptedData: string;
  iv: string;
  salt: string;
}

export interface ChunkedEncryptionResult {
  chunks: string[];
  iv: string;
  salt: string;
  totalChunks: number;
  chunkSize: number;
}

export class FileEncryption {
  private static readonly KEY_SIZE = 256;
  private static readonly ITERATION_COUNT = 1000;
  private static readonly CHUNK_SIZE = 1024 * 1024; // 1MB chunks

  /**
   * Generate secure random bytes using expo-crypto
   */
  private static async generateRandomBytes(length: number): Promise<string> {
    const randomBytes = await Crypto.getRandomBytesAsync(length);
    return CryptoJS.enc.Hex.stringify(CryptoJS.lib.WordArray.create(randomBytes));
  }

  /**
   * Encrypt a file using AES-256 with PBKDF2 key derivation
   * Now supports large files through chunked processing
   */
  static async encryptFile(
    fileData: ArrayBuffer | string,
    password: string,
    salt?: string
  ): Promise<EncryptedFile> {
    try {
      console.log('🔐 Starting file encryption...');
      
      // Check if this is a large file that needs chunked processing
      if (typeof fileData === 'object' && fileData.byteLength > this.CHUNK_SIZE) {
        console.log('📁 Large file detected, using chunked encryption...');
        return await this.encryptLargeFile(fileData, password, salt);
      }
      
      // For smaller files, use the original method
      return await this.encryptSmallFile(fileData, password, salt);
      
    } catch (error) {
      console.error('❌ Encryption error:', error);
      throw new Error('Failed to encrypt file');
    }
  }

  /**
   * Encrypt small files (under 1MB) using the original method
   */
  private static async encryptSmallFile(
    fileData: ArrayBuffer | string,
    password: string,
    salt?: string
  ): Promise<EncryptedFile> {
    // Generate salt if not provided
    const generatedSalt = salt || await this.generateRandomBytes(16);
    console.log('✅ Salt generated:', generatedSalt.substring(0, 8) + '...');
    
    // Derive key using PBKDF2
    const key = CryptoJS.PBKDF2(password, generatedSalt, {
      keySize: this.KEY_SIZE / 32,
      iterations: this.ITERATION_COUNT
    });
    console.log('✅ Key derived successfully');

    // Generate IV
    const ivHex = await this.generateRandomBytes(16);
    const iv = CryptoJS.enc.Hex.parse(ivHex);
    console.log('✅ IV generated:', ivHex.substring(0, 8) + '...');

    // Convert file data to WordArray
    let dataToEncrypt: CryptoJS.lib.WordArray;
    if (typeof fileData === 'string') {
      dataToEncrypt = CryptoJS.enc.Utf8.parse(fileData);
      console.log('✅ String data converted to WordArray');
    } else {
      // For ArrayBuffer, convert to hex string
      const uint8Array = new Uint8Array(fileData);
      console.log('✅ ArrayBuffer converted to Uint8Array, length:', uint8Array.length);
      
      const hexString = this.arrayBufferToHex(uint8Array);
      console.log('✅ Uint8Array converted to hex, length:', hexString.length);
      
      dataToEncrypt = CryptoJS.enc.Hex.parse(hexString);
      console.log('✅ Hex converted to WordArray');
    }

    // Encrypt the data
    console.log('🔐 Encrypting data with AES...');
    const encrypted = CryptoJS.AES.encrypt(dataToEncrypt, key, {
      iv: iv,
      padding: CryptoJS.pad.Pkcs7,
      mode: CryptoJS.mode.CBC
    });
    console.log('✅ Data encrypted successfully');

    const result = {
      encryptedData: encrypted.toString(),
      iv: ivHex,
      salt: generatedSalt
    };
    
    console.log('✅ Encryption completed, result size:', result.encryptedData.length);
    return result;
  }

  /**
   * Encrypt large files by processing them in chunks
   */
  private static async encryptLargeFile(
    fileData: ArrayBuffer,
    password: string,
    salt?: string
  ): Promise<EncryptedFile> {
    const uint8Array = new Uint8Array(fileData);
    const totalSize = uint8Array.length;
    const totalChunks = Math.ceil(totalSize / this.CHUNK_SIZE);
    
    console.log(`📁 Processing large file: ${totalSize} bytes in ${totalChunks} chunks`);
    
    // Generate salt if not provided
    const generatedSalt = salt || await this.generateRandomBytes(16);
    console.log('✅ Salt generated:', generatedSalt.substring(0, 8) + '...');
    
    // Derive key using PBKDF2
    const key = CryptoJS.PBKDF2(password, generatedSalt, {
      keySize: this.KEY_SIZE / 32,
      iterations: this.ITERATION_COUNT
    });
    console.log('✅ Key derived successfully');

    // Generate IV
    const ivHex = await this.generateRandomBytes(16);
    const iv = CryptoJS.enc.Hex.parse(ivHex);
    console.log('✅ IV generated:', ivHex.substring(0, 8) + '...');

    // Process file in chunks
    const encryptedChunks: string[] = [];
    
    for (let i = 0; i < totalChunks; i++) {
      const start = i * this.CHUNK_SIZE;
      const end = Math.min(start + this.CHUNK_SIZE, totalSize);
      const chunk = uint8Array.slice(start, end);
      
      console.log(`🔐 Processing chunk ${i + 1}/${totalChunks} (${chunk.length} bytes)`);
      
      // Convert chunk to hex
      const chunkHex = this.arrayBufferToHex(chunk);
      const chunkWordArray = CryptoJS.enc.Hex.parse(chunkHex);
      
      // Encrypt chunk
      const encryptedChunk = CryptoJS.AES.encrypt(chunkWordArray, key, {
        iv: iv,
        padding: CryptoJS.pad.Pkcs7,
        mode: CryptoJS.mode.CBC
      });
      
      encryptedChunks.push(encryptedChunk.toString());
      console.log(`✅ Chunk ${i + 1} encrypted successfully`);
    }

    // Combine all encrypted chunks
    const combinedEncryptedData = encryptedChunks.join('|CHUNK|');
    
    const result = {
      encryptedData: combinedEncryptedData,
      iv: ivHex,
      salt: generatedSalt
    };
    
    console.log('✅ Large file encryption completed, total size:', result.encryptedData.length);
    return result;
  }

  /**
   * Convert ArrayBuffer to hex string (more memory efficient than base64)
   */
  private static arrayBufferToHex(buffer: Uint8Array): string {
    const hex = [];
    for (let i = 0; i < buffer.length; i++) {
      const byte = buffer[i];
      hex.push((byte >>> 4).toString(16));
      hex.push((byte & 0xF).toString(16));
    }
    return hex.join('');
  }

  /**
   * Decrypt a file using AES-256 with PBKDF2 key derivation
   */
  static async decryptFile(
    encryptedFile: EncryptedFile,
    password: string
  ): Promise<ArrayBuffer> {
    try {
      // Check if this is a chunked encrypted file
      if (encryptedFile.encryptedData.includes('|CHUNK|')) {
        return await this.decryptLargeFile(encryptedFile, password);
      } else {
        return await this.decryptSmallFile(encryptedFile, password);
      }
    } catch (error) {
      console.error('Decryption error:', error);
      throw new Error('Failed to decrypt file');
    }
  }

  /**
   * Decrypt small files using the original method
   */
  private static async decryptSmallFile(
    encryptedFile: EncryptedFile,
    password: string
  ): Promise<ArrayBuffer> {
    // Derive key using PBKDF2
    const key = CryptoJS.PBKDF2(password, encryptedFile.salt, {
      keySize: this.KEY_SIZE / 32,
      iterations: this.ITERATION_COUNT
    });

    // Decrypt the data
    const decrypted = CryptoJS.AES.decrypt(encryptedFile.encryptedData, key, {
      iv: CryptoJS.enc.Hex.parse(encryptedFile.iv),
      padding: CryptoJS.pad.Pkcs7,
      mode: CryptoJS.mode.CBC
    });

    // Convert to ArrayBuffer
    const decryptedString = decrypted.toString(CryptoJS.enc.Utf8);
    const uint8Array = new Uint8Array(decryptedString.length);
    for (let i = 0; i < decryptedString.length; i++) {
      uint8Array[i] = decryptedString.charCodeAt(i);
    }

    return uint8Array.buffer;
  }

  /**
   * Decrypt large files that were encrypted in chunks
   */
  private static async decryptLargeFile(
    encryptedFile: EncryptedFile,
    password: string
  ): Promise<ArrayBuffer> {
    // Split encrypted data into chunks
    const encryptedChunks = encryptedFile.encryptedData.split('|CHUNK|');
    console.log(`🔓 Decrypting large file with ${encryptedChunks.length} chunks`);
    
    // Derive key using PBKDF2
    const key = CryptoJS.PBKDF2(password, encryptedFile.salt, {
      keySize: this.KEY_SIZE / 32,
      iterations: this.ITERATION_COUNT
    });

    // Decrypt each chunk
    const decryptedChunks: Uint8Array[] = [];
    
    for (let i = 0; i < encryptedChunks.length; i++) {
      console.log(`🔓 Decrypting chunk ${i + 1}/${encryptedChunks.length}`);
      
      const decrypted = CryptoJS.AES.decrypt(encryptedChunks[i], key, {
        iv: CryptoJS.enc.Hex.parse(encryptedFile.iv),
        padding: CryptoJS.pad.Pkcs7,
        mode: CryptoJS.mode.CBC
      });

      // Convert chunk to ArrayBuffer
      const decryptedString = decrypted.toString(CryptoJS.enc.Utf8);
      const uint8Array = new Uint8Array(decryptedString.length);
      for (let j = 0; j < decryptedString.length; j++) {
        uint8Array[j] = decryptedString.charCodeAt(j);
      }
      
      decryptedChunks.push(uint8Array);
      console.log(`✅ Chunk ${i + 1} decrypted successfully`);
    }

    // Combine all decrypted chunks
    const totalSize = decryptedChunks.reduce((sum, chunk) => sum + chunk.length, 0);
    const result = new Uint8Array(totalSize);
    
    let offset = 0;
    for (const chunk of decryptedChunks) {
      result.set(chunk, offset);
      offset += chunk.length;
    }

    console.log('✅ Large file decryption completed, total size:', result.length);
    return result.buffer;
  }

  /**
   * Generate a random encryption key
   */
  static async generateKey(): Promise<string> {
    return await this.generateRandomBytes(32);
  }

  /**
   * Hash a password for storage
   */
  static async hashPassword(password: string, salt?: string): Promise<string> {
    const generatedSalt = salt || await this.generateRandomBytes(16);
    const hash = CryptoJS.PBKDF2(password, generatedSalt, {
      keySize: 256 / 32,
      iterations: this.ITERATION_COUNT
    });
    return hash.toString();
  }

  /**
   * Verify a password against a hash
   */
  static async verifyPassword(password: string, hash: string, salt: string): Promise<boolean> {
    const computedHash = await this.hashPassword(password, salt);
    return computedHash === hash;
  }
}
