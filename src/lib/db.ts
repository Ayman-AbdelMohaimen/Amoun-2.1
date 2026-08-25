/**
 * Wazeer OS v2.0 — IndexedDB Database Layer
 * Database: "Monmamar" v4
 * 8 stores: config, state, logs, artifacts, auth_logs, banned_nodes, userMemory, users
 *
 * Green Code: Every store has a living consumer.
 * Security as Mindset: API keys in config store are never transmitted to our server.
 * Scalable Architecture: In-memory fallback if IndexedDB unavailable.
 */

import type {
  Artifact, AuthLog, BannedNode, User, UserMemory,
} from '../types';

// ═══════════════════════════════════════════════════════════════════
// STORE DEFINITIONS
// ═══════════════════════════════════════════════════════════════════

interface StoreDef {
  name: string;
  keyPath: string;
  autoIncrement?: boolean;
  indexes: Array<{ name: string; keyPath: string; options?: IDBIndexParameters }>;
}

const STORES: StoreDef[] = [
  {
    name: 'config',
    keyPath: 'id',
    indexes: [],
  },
  {
    name: 'state',
    keyPath: 'id',
    indexes: [],
  },
  {
    name: 'logs',
    keyPath: 'id',
    autoIncrement: true,
    indexes: [{ name: 'timestamp', keyPath: 'timestamp' }],
  },
  {
    name: 'artifacts',
    keyPath: 'id',
    indexes: [
      { name: 'chatId', keyPath: 'chatId', options: { unique: false } },
      { name: 'type', keyPath: 'type', options: { unique: false } },
      { name: 'pinned', keyPath: 'pinned', options: { unique: false } },
      { name: 'createdAt', keyPath: 'createdAt', options: { unique: false } },
    ],
  },
  {
    name: 'auth_logs',
    keyPath: 'id',
    indexes: [{ name: 'timestamp', keyPath: 'timestamp' }],
  },
  {
    name: 'banned_nodes',
    keyPath: 'ip',
    indexes: [{ name: 'timestamp', keyPath: 'timestamp' }],
  },
  {
    name: 'userMemory',
    keyPath: 'id',
    autoIncrement: true,
    indexes: [
      { name: 'category', keyPath: 'category', options: { unique: false } },
      { name: 'createdAt', keyPath: 'createdAt', options: { unique: false } },
      { name: 'sourceSession', keyPath: 'sourceSessionId', options: { unique: false } },
    ],
  },
  {
    name: 'users',
    keyPath: 'email',
    indexes: [{ name: 'createdAt', keyPath: 'createdAt' }],
  },
  {
    // v5 — Append-only session event log (DSH Event-Sourced Log pattern, write-side).
    // Source of truth for replay/debugging; the messages array remains the UI projection.
    name: 'session_events',
    keyPath: 'id',
    autoIncrement: true,
    indexes: [
      { name: 'sessionId', keyPath: 'sessionId', options: { unique: false } },
      { name: 'timestamp', keyPath: 'timestamp', options: { unique: false } },
    ],
  },
];

// ═══════════════════════════════════════════════════════════════════
// DATABASE CLASS
// ═══════════════════════════════════════════════════════════════════

const DB_NAME = 'Monmamar';
const DB_VERSION = 5;

class WazeerDB {
  private db: IDBDatabase | null = null;
  private fallback: Record<string, Record<string, unknown>[]> = {};
  private useFallback = false;

  async init(): Promise<void> {
    if (this.db) return;
    try {
      this.db = await this.openDB();
    } catch {
      console.warn('[WazeerDB] IndexedDB unavailable, using in-memory fallback');
      this.useFallback = true;
      for (const store of STORES) {
        this.fallback[store.name] = [];
      }
    }
  }

  private openDB(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        for (const store of STORES) {
          if (!db.objectStoreNames.contains(store.name)) {
            const objectStore = db.createObjectStore(
              store.name,
              {
                keyPath: store.keyPath,
                autoIncrement: store.autoIncrement,
              }
            );
            for (const idx of store.indexes) {
              if (!objectStore.indexNames.contains(idx.name)) {
                objectStore.createIndex(idx.name, idx.keyPath, idx.options);
              }
            }
          }
        }
      };

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  // ── Generic CRUD ──────────────────────────────────────────────

  async get<T>(storeName: string, key: string): Promise<T | undefined> {
    if (this.useFallback) {
      const store = this.fallback[storeName];
      if (!store) return undefined;
      const record = store.find((r) => (r as Record<string, unknown>).id === key
        || (r as Record<string, unknown>).email === key
        || (r as Record<string, unknown>).ip === key);
      return record as T | undefined;
    }
    return new Promise((resolve, reject) => {
      const tx = this.db!.transaction(storeName, 'readonly');
      const store = tx.objectStore(storeName);
      const req = store.get(key);
      req.onsuccess = () => resolve(req.result as T | undefined);
      req.onerror = () => reject(req.error);
    });
  }

  async getAll<T>(storeName: string): Promise<T[]> {
    if (this.useFallback) {
      return (this.fallback[storeName] ?? []) as T[];
    }
    return new Promise((resolve, reject) => {
      const tx = this.db!.transaction(storeName, 'readonly');
      const store = tx.objectStore(storeName);
      const req = store.getAll();
      req.onsuccess = () => resolve(req.result as T[]);
      req.onerror = () => reject(req.error);
    });
  }

  async put<T>(storeName: string, record: T): Promise<void> {
    if (this.useFallback) {
      if (!this.fallback[storeName]) this.fallback[storeName] = [];
      const arr = this.fallback[storeName];
      const key = (record as Record<string, unknown>).id
        ?? (record as Record<string, unknown>).email
        ?? (record as Record<string, unknown>).ip;
      const idx = arr.findIndex((r) =>
        (r as Record<string, unknown>).id === key
        || (r as Record<string, unknown>).email === key
        || (r as Record<string, unknown>).ip === key
      );
      if (idx >= 0) arr[idx] = record as unknown as Record<string, unknown>;
      else arr.push(record as unknown as Record<string, unknown>);
      return;
    }
    return new Promise((resolve, reject) => {
      const tx = this.db!.transaction(storeName, 'readwrite');
      const store = tx.objectStore(storeName);
      const req = store.put(record);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  }

  async delete(storeName: string, key: string): Promise<void> {
    if (this.useFallback) {
      const store = this.fallback[storeName];
      if (!store) return;
      const idx = store.findIndex((r) =>
        (r as Record<string, unknown>).id === key
        || (r as Record<string, unknown>).email === key
        || (r as Record<string, unknown>).ip === key
      );
      if (idx >= 0) store.splice(idx, 1);
      return;
    }
    return new Promise((resolve, reject) => {
      const tx = this.db!.transaction(storeName, 'readwrite');
      const store = tx.objectStore(storeName);
      const req = store.delete(key);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  }

  /** Wipes ALL records in a store (Governance Council purges). */
  async clear(storeName: string): Promise<void> {
    if (this.useFallback) {
      this.fallback[storeName] = [];
      return;
    }
    return new Promise((resolve, reject) => {
      const tx = this.db!.transaction(storeName, 'readwrite');
      const req = tx.objectStore(storeName).clear();
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  }

  async getByIndex<T>(storeName: string, indexName: string, value: unknown): Promise<T[]> {
    if (this.useFallback) {
      const store = this.fallback[storeName] ?? [];
      return store.filter((r) => (r as Record<string, unknown>)[indexName] === value) as T[];
    }
    return new Promise((resolve, reject) => {
      const tx = this.db!.transaction(storeName, 'readonly');
      const store = tx.objectStore(storeName);
      const index = store.index(indexName);
      const req = index.getAll(value as IDBValidKey);
      req.onsuccess = () => resolve(req.result as T[]);
      req.onerror = () => reject(req.error);
    });
  }

  // ── Convenience methods ────────────────────────────────────────

  async getApiKeys(): Promise<Record<string, string>> {
    return (await this.get<Record<string, Record<string, string>>>('config', 'api_keys'))?.api_keys ?? {};
  }

  async saveApiKeys(keys: Record<string, string>): Promise<void> {
    await this.put('config', { id: 'api_keys', api_keys: keys });
  }

  async getUser(): Promise<User | undefined> {
    return this.get<User>('config', 'wazir_user');
  }

  async saveUser(user: User): Promise<void> {
    await this.put('config', { id: 'wazir_user', ...user });
  }

  async getEvents(): Promise<unknown[]> {
    const config = await this.get<Record<string, unknown[]>>('config', 'events');
    return config?.events ?? [];
  }

  async saveEvents(events: unknown[]): Promise<void> {
    await this.put('config', { id: 'events', events });
  }

  isAvailable(): boolean {
    return !this.useFallback;
  }
}

export const wazeerDB = new WazeerDB();
