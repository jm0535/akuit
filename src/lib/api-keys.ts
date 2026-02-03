/**
 * API Key Management System
 *
 * This module provides secure API key storage and retrieval for open-source projects.
 * Keys are stored with AES-256 encryption when using client-side storage.
 *
 * Priority order for key resolution:
 * 1. Environment variables (production/server)
 * 2. Database (if user authenticated)
 * 3. Encrypted client-side storage (user-provided)
 * 4. Default/demo keys (limited functionality)
 */

import CryptoJS from 'crypto-js';

export interface ApiKey {
  id: string;
  name: string;
  key: string;
  provider: 'z-ai' | 'openai' | 'anthropic' | 'google' | 'cohere' | 'huggingface' | 'stability' | 'replicate' | 'together' | 'mistral' | 'xai' | 'kimi' | 'deepseek' | 'qwen' | 'baichuan' | 'yi' | 'internlm' | 'zhipu' | 'custom';
  createdAt: string;
  lastUsed?: string;
  isValid?: boolean;
}

const ENCRYPTION_KEY = 'akuit-key-encryption-v1';
const STORAGE_KEY = 'akuit-api-keys';
const ACTIVE_KEY_ID_KEY = 'akuit-active-key-id';

/**
 * Encrypt API key using AES-256
 */
function encryptKey(key: string): string {
  return CryptoJS.AES.encrypt(key, ENCRYPTION_KEY).toString();
}

/**
 * Decrypt API key
 */
function decryptKey(encrypted: string): string {
  const bytes = CryptoJS.AES.decrypt(encrypted, ENCRYPTION_KEY);
  return bytes.toString(CryptoJS.enc.Utf8);
}

/**
 * Mask API key for display (show only last 4 characters)
 */
export function maskApiKey(key: string): string {
  if (!key || key.length < 8) return '****';
  return `${key.substring(0, 4)}...${key.substring(key.length - 4)}`;
}

/**
 * Validate API key format (basic validation)
 */
export function validateApiKey(key: string, provider: ApiKey['provider']): boolean {
  if (!key || key.trim().length === 0) return false;

  switch (provider) {
    case 'z-ai':
      return key.length >= 32;
    case 'openai':
      return key.startsWith('sk-');
    case 'anthropic':
      return key.startsWith('sk-ant-');
    case 'google':
      return key.startsWith('AIza') || key.startsWith('GOAI') || key.length >= 32;
    case 'cohere':
      return key.length >= 32;
    case 'huggingface':
      return key.startsWith('hf_') || key.length >= 32;
    case 'stability':
      return key.startsWith('sk-') || key.length >= 32;
    case 'replicate':
      return key.startsWith('r8_') || key.length >= 32;
    case 'together':
      return key.length >= 32;
    case 'mistral':
      return key.length >= 32;
    case 'xai':
      return key.startsWith('xai-') || key.length >= 32;
    case 'kimi':
      return key.length >= 32;
    case 'deepseek':
      return key.startsWith('sk-') || key.length >= 32;
    case 'qwen':
      return key.startsWith('sk-') || key.length >= 32;
    case 'baichuan':
      return key.length >= 32;
    case 'yi':
      return key.length >= 32;
    case 'internlm':
      return key.length >= 32;
    case 'zhipu':
      return key.length >= 32;
    case 'custom':
      return key.length >= 16;
    default:
      return key.length >= 16;
  }
}

/**
 * Get API key from environment variables (server-side)
 */
export function getEnvApiKey(): string | null {
  if (typeof window !== 'undefined') return null; // Only server-side

  return (
    process.env.AI_API_KEY ||
    process.env.OPENAI_API_KEY ||
    process.env.ANTHROPIC_API_KEY ||
    process.env.GOOGLE_API_KEY ||
    process.env.COHERE_API_KEY ||
    process.env.HUGGINGFACE_API_KEY ||
    process.env.STABILITY_API_KEY ||
    process.env.REPLICATE_API_KEY ||
    process.env.TOGETHER_API_KEY ||
    process.env.MISTRAL_API_KEY ||
    process.env.XAI_API_KEY ||
    process.env.KIMI_API_KEY ||
    process.env.DEEPSEEK_API_KEY ||
    process.env.QWEN_API_KEY ||
    process.env.BAICHUAN_API_KEY ||
    process.env.YI_API_KEY ||
    process.env.INTERNLM_API_KEY ||
    process.env.ZHIPU_API_KEY ||
    null
  );
}

/**
 * Save API key to encrypted storage (client-side)
 */
export async function saveApiKey(key: Omit<ApiKey, 'id' | 'createdAt'>): Promise<ApiKey> {
  const keys = await getApiKeys();

  const newKey: ApiKey = {
    ...key,
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
  };

  const encryptedKey = encryptKey(key.key);
  const keyToStore = { ...newKey, key: encryptedKey };

  const updatedKeys = [...keys, keyToStore];
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedKeys));

  return newKey;
}

/**
 * Get all stored API keys
 */
export async function getApiKeys(): Promise<ApiKey[]> {
  if (typeof window === 'undefined') return []; // Server-side

  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return [];

    const keys = JSON.parse(stored);
    return keys.map((k: ApiKey) => ({
      ...k,
      key: decryptKey(k.key),
    }));
  } catch (error) {
    console.error('Failed to retrieve API keys:', error);
    return [];
  }
}

/**
 * Get active API key
 */
export async function getActiveApiKey(): Promise<string | null> {
  // Priority 1: Environment variables (server-side)
  const envKey = getEnvApiKey();
  if (envKey) return envKey;

  // Priority 2: Active user-provided key (client-side)
  if (typeof window === 'undefined') return null;

  const activeKeyId = localStorage.getItem(ACTIVE_KEY_ID_KEY);
  if (!activeKeyId) return null;

  const keys = await getApiKeys();
  const activeKey = keys.find(k => k.id === activeKeyId);

  return activeKey?.key || null;
}

/**
 * Set active API key
 */
export async function setActiveApiKey(keyId: string): Promise<void> {
  if (typeof window === 'undefined') return;
  localStorage.setItem(ACTIVE_KEY_ID_KEY, keyId);
}

/**
 * Delete API key
 */
export async function deleteApiKey(keyId: string): Promise<void> {
  const keys = await getApiKeys()
  const updatedKeys = keys.filter(k => k.id !== keyId)
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedKeys.map(k => ({ ...k, key: encryptKey(k.key) }))))

  // Clear active key if deleted
  const activeKeyId = localStorage.getItem(ACTIVE_KEY_ID_KEY);
  if (activeKeyId === keyId) {
    localStorage.removeItem(ACTIVE_KEY_ID_KEY);
  }
}

/**
 * Update API key
 */
export async function updateApiKey(keyId: string, updates: Partial<Omit<ApiKey, 'id' | 'createdAt'>>): Promise<void> {
  const keys = await getApiKeys();
  const keyIndex = keys.findIndex(k => k.id === keyId);

  if (keyIndex === -1) throw new Error('Key not found');

  const updatedKey = { ...keys[keyIndex], ...updates };
  keys[keyIndex] = updatedKey;

  localStorage.setItem(STORAGE_KEY, JSON.stringify(keys.map(k => ({ ...k, key: encryptKey(k.key) }))));
}

/**
 * Clear all API keys (logout)
 */
export async function clearApiKeys(): Promise<void> {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(STORAGE_KEY);
  localStorage.removeItem(ACTIVE_KEY_ID_KEY);
}

/**
 * Check if API keys are configured
 */
export async function hasApiKeys(): Promise<boolean> {
  // Check environment variables
  if (getEnvApiKey()) return true;

  // Check stored keys
  const keys = await getApiKeys();
  return keys.length > 0;
}

/**
 * Get default/demo API key (for testing only)
 */
export function getDemoApiKey(): string {
  return 'demo-key-for-testing-only';
}
