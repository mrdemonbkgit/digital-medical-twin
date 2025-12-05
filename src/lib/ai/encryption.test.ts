/**
 * @vitest-environment node
 */
import { describe, it, expect } from 'vitest';
import { encrypt, decrypt, generateKey, type EncryptedData } from './encryption';

// Generate a valid 32-byte test key (base64 encoded)
const testKey = Buffer.from('0'.repeat(32)).toString('base64'); // 32 bytes of zeros for testing

describe('encryption', () => {
  describe('encrypt', () => {
    it('encrypts a string and returns JSON', async () => {
      const plaintext = 'Hello, World!';
      const result = await encrypt(plaintext, testKey);

      expect(typeof result).toBe('string');

      const parsed = JSON.parse(result) as EncryptedData;
      expect(parsed).toHaveProperty('iv');
      expect(parsed).toHaveProperty('data');
      expect(parsed).toHaveProperty('tag');
    });

    it('returns base64 encoded values', async () => {
      const plaintext = 'Test message';
      const result = await encrypt(plaintext, testKey);
      const parsed = JSON.parse(result) as EncryptedData;

      // All fields should be valid base64
      expect(() => Buffer.from(parsed.iv, 'base64')).not.toThrow();
      expect(() => Buffer.from(parsed.data, 'base64')).not.toThrow();
      expect(() => Buffer.from(parsed.tag, 'base64')).not.toThrow();
    });

    it('generates unique IV for each encryption', async () => {
      const plaintext = 'Same message';
      const result1 = await encrypt(plaintext, testKey);
      const result2 = await encrypt(plaintext, testKey);

      const parsed1 = JSON.parse(result1) as EncryptedData;
      const parsed2 = JSON.parse(result2) as EncryptedData;

      // IVs should be different
      expect(parsed1.iv).not.toBe(parsed2.iv);
      // Encrypted data should also be different due to different IVs
      expect(parsed1.data).not.toBe(parsed2.data);
    });

    it('throws error for invalid key length', async () => {
      const plaintext = 'Test';
      const shortKey = Buffer.from('short').toString('base64');

      await expect(encrypt(plaintext, shortKey)).rejects.toThrow(
        'Encryption key must be 32 bytes'
      );
    });

    it('handles empty string', async () => {
      const result = await encrypt('', testKey);

      expect(typeof result).toBe('string');
      const parsed = JSON.parse(result) as EncryptedData;
      expect(parsed.data).toBeDefined();
    });

    it('handles long strings', async () => {
      const longText = 'A'.repeat(10000);
      const result = await encrypt(longText, testKey);

      expect(typeof result).toBe('string');
    });

    it('handles unicode characters', async () => {
      const unicodeText = '你好世界 🌍 مرحبا';
      const encrypted = await encrypt(unicodeText, testKey);
      const decrypted = await decrypt(encrypted, testKey);

      expect(decrypted).toBe(unicodeText);
    });

    it('handles special characters', async () => {
      const specialText = '!@#$%^&*()_+-=[]{}|;:\'",.<>?/\\`~';
      const encrypted = await encrypt(specialText, testKey);
      const decrypted = await decrypt(encrypted, testKey);

      expect(decrypted).toBe(specialText);
    });
  });

  describe('decrypt', () => {
    it('decrypts to original plaintext', async () => {
      const plaintext = 'Secret message';
      const encrypted = await encrypt(plaintext, testKey);
      const decrypted = await decrypt(encrypted, testKey);

      expect(decrypted).toBe(plaintext);
    });

    it('correctly decrypts empty string', async () => {
      const encrypted = await encrypt('', testKey);
      const decrypted = await decrypt(encrypted, testKey);

      expect(decrypted).toBe('');
    });

    it('correctly decrypts long strings', async () => {
      const longText = 'B'.repeat(5000);
      const encrypted = await encrypt(longText, testKey);
      const decrypted = await decrypt(encrypted, testKey);

      expect(decrypted).toBe(longText);
    });

    it('throws error for tampered data', async () => {
      const encrypted = await encrypt('Original', testKey);
      const parsed = JSON.parse(encrypted) as EncryptedData;

      // Tamper with the encrypted data
      const tamperedData = Buffer.from(parsed.data, 'base64');
      tamperedData[0] = tamperedData[0] ^ 0xff; // Flip bits
      parsed.data = tamperedData.toString('base64');

      const tampered = JSON.stringify(parsed);

      // Should throw due to authentication failure
      await expect(decrypt(tampered, testKey)).rejects.toThrow();
    });

    it('throws error for wrong key', async () => {
      const encrypted = await encrypt('Secret', testKey);
      const wrongKey = Buffer.from('1'.repeat(32)).toString('base64');

      // Should throw due to authentication failure
      await expect(decrypt(encrypted, wrongKey)).rejects.toThrow();
    });

    it('throws error for invalid JSON', async () => {
      await expect(decrypt('not json', testKey)).rejects.toThrow();
    });

    it('throws error for malformed encrypted data', async () => {
      const malformed = JSON.stringify({ iv: 'abc', data: 'def' }); // Missing tag

      await expect(decrypt(malformed, testKey)).rejects.toThrow();
    });
  });

  describe('generateKey', () => {
    it('generates a base64 encoded key', async () => {
      const key = await generateKey();

      expect(typeof key).toBe('string');
      expect(() => Buffer.from(key, 'base64')).not.toThrow();
    });

    it('generates a 32-byte key', async () => {
      const key = await generateKey();
      const keyBuffer = Buffer.from(key, 'base64');

      expect(keyBuffer.length).toBe(32);
    });

    it('generates unique keys each time', async () => {
      const key1 = await generateKey();
      const key2 = await generateKey();

      expect(key1).not.toBe(key2);
    });

    it('generates keys that work with encrypt/decrypt', async () => {
      const key = await generateKey();
      const plaintext = 'Test with generated key';

      const encrypted = await encrypt(plaintext, key);
      const decrypted = await decrypt(encrypted, key);

      expect(decrypted).toBe(plaintext);
    });
  });

  describe('EncryptedData interface', () => {
    it('has correct structure', async () => {
      const encrypted = await encrypt('test', testKey);
      const data: EncryptedData = JSON.parse(encrypted);

      expect(typeof data.iv).toBe('string');
      expect(typeof data.data).toBe('string');
      expect(typeof data.tag).toBe('string');
    });
  });

  describe('round-trip encryption', () => {
    it('encrypts and decrypts various data types as strings', async () => {
      const testCases = [
        'Simple text',
        JSON.stringify({ api_key: 'sk-1234567890' }),
        JSON.stringify({ nested: { data: [1, 2, 3] } }),
        '\n\t\r\0', // Control characters
        '🔐🔑🔒', // Emojis
      ];

      for (const original of testCases) {
        const encrypted = await encrypt(original, testKey);
        const decrypted = await decrypt(encrypted, testKey);
        expect(decrypted).toBe(original);
      }
    });

    it('maintains data integrity across multiple encryptions', async () => {
      const key = await generateKey();
      const message = 'Repeated encryption test';

      for (let i = 0; i < 10; i++) {
        const encrypted = await encrypt(message, key);
        const decrypted = await decrypt(encrypted, key);
        expect(decrypted).toBe(message);
      }
    });
  });
});
