/**
 * Encryption utilities for API key storage
 * Uses AES-256-GCM encryption
 *
 * NOTE: These functions are designed to run in Vercel serverless functions
 * where Node.js crypto module is available. They should NOT be used client-side.
 */

// For type checking in the browser build, we use conditional imports
// The actual crypto operations only run server-side

export interface EncryptedData {
  iv: string; // Base64 encoded initialization vector
  data: string; // Base64 encoded encrypted data
  tag: string; // Base64 encoded authentication tag
}

/**
 * Encrypts a string using AES-256-GCM
 * @param plaintext - The string to encrypt
 * @param key - 32-byte encryption key (from ENCRYPTION_KEY env var)
 * @returns Encrypted data with IV and auth tag
 */
export async function encrypt(plaintext: string, key: string): Promise<string> {
  // This function runs server-side only
  if (typeof window !== 'undefined') {
    throw new Error('Encryption can only be performed server-side');
  }

  // Dynamic import to avoid bundling crypto in client
  const crypto = await import('crypto');

  // Validate key length (must be 32 bytes for AES-256)
  const keyBuffer = Buffer.from(key, 'hex');
  if (keyBuffer.length !== 32) {
    throw new Error('Encryption key must be 32 bytes (64 hex characters)');
  }

  // Generate random IV (12 bytes for GCM)
  const iv = crypto.randomBytes(12);

  // Create cipher
  const cipher = crypto.createCipheriv('aes-256-gcm', keyBuffer, iv);

  // Encrypt
  const encrypted = Buffer.concat([
    cipher.update(plaintext, 'utf8'),
    cipher.final(),
  ]);

  // Get auth tag
  const tag = cipher.getAuthTag();

  // Combine IV + encrypted data + tag into single string
  const result: EncryptedData = {
    iv: iv.toString('base64'),
    data: encrypted.toString('base64'),
    tag: tag.toString('base64'),
  };

  return JSON.stringify(result);
}

/**
 * Decrypts data encrypted with the encrypt function
 * @param encryptedJson - JSON string from encrypt()
 * @param key - Same 32-byte key used for encryption
 * @returns Decrypted plaintext
 */
export async function decrypt(encryptedJson: string, key: string): Promise<string> {
  // This function runs server-side only
  if (typeof window !== 'undefined') {
    throw new Error('Decryption can only be performed server-side');
  }

  // Dynamic import to avoid bundling crypto in client
  const crypto = await import('crypto');

  // Parse encrypted data
  const { iv, data, tag } = JSON.parse(encryptedJson) as EncryptedData;

  // Convert from base64
  const keyBuffer = Buffer.from(key, 'hex');
  const ivBuffer = Buffer.from(iv, 'base64');
  const encryptedBuffer = Buffer.from(data, 'base64');
  const tagBuffer = Buffer.from(tag, 'base64');

  // Create decipher
  const decipher = crypto.createDecipheriv('aes-256-gcm', keyBuffer, ivBuffer);
  decipher.setAuthTag(tagBuffer);

  // Decrypt
  const decrypted = Buffer.concat([
    decipher.update(encryptedBuffer),
    decipher.final(),
  ]);

  return decrypted.toString('utf8');
}

/**
 * Generates a random 32-byte encryption key
 * Use this to generate the ENCRYPTION_KEY environment variable
 * Run: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
 */
export async function generateKey(): Promise<string> {
  if (typeof window !== 'undefined') {
    throw new Error('Key generation can only be performed server-side');
  }

  const crypto = await import('crypto');
  return crypto.randomBytes(32).toString('hex');
}
