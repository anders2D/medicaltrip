/**
 * Medical Trip Hub — Local-First Storage & Persistence Engine (100% Offline)
 * Persistencia en IndexedDB / LocalStorage con CQRS Event Ledger y protección anti-evicción Safari/WebKit.
 */

const DB_NAME = 'MedicalTripOfflineDB';
const DB_VERSION = 2;

export class LocalFirstDB {
    static _db = null;
    static _memoryStore = {};

    static async init() {
        // 1. Solicitar almacenamiento persistente al navegador (Anti-Eviction)
        await this.requestPersistentStorage();

        // 2. Inicializar IndexedDB
        return new Promise((resolve) => {
            if (!window.indexedDB) {
                console.warn('[LocalFirstDB]: IndexedDB no disponible, usando LocalStorage fallback.');
                resolve(false);
                return;
            }

            const request = indexedDB.open(DB_NAME, DB_VERSION);

            request.onupgradeneeded = (event) => {
                const db = event.target.result;
                if (!db.objectStoreNames.contains('itinerarios')) {
                    db.createObjectStore('itinerarios', { keyPath: 'id_hito' });
                }
                if (!db.objectStoreNames.contains('gastos_tickets')) {
                    db.createObjectStore('gastos_tickets', { keyPath: 'id_gasto' });
                }
                if (!db.objectStoreNames.contains('liquidaciones')) {
                    db.createObjectStore('liquidaciones', { keyPath: 'id_liquidacion' });
                }
                if (!db.objectStoreNames.contains('eventos_cqrs')) {
                    db.createObjectStore('eventos_cqrs', { autoIncrement: true });
                }
            };

            request.onsuccess = (event) => {
                this._db = event.target.result;
                console.log('✅ [LocalFirstDB]: IndexedDB 100% Offline inicializada con éxito.');
                resolve(true);
            };

            request.onerror = (event) => {
                console.warn('[LocalFirstDB]: Error al abrir IndexedDB:', event.target.error);
                resolve(false);
            };
        });
    }

    static async requestPersistentStorage() {
        if (navigator.storage && navigator.storage.persist) {
            try {
                const isPersisted = await navigator.storage.persist();
                console.log(`🛡️ [Storage Manager]: Almacenamiento Persistente Anti-Evicción: ${isPersisted ? 'ACTIVADO' : 'ESTÁNDAR'}`);
                return isPersisted;
            } catch (e) {
                console.warn('No se pudo invocar storage.persist():', e);
            }
        }
        return false;
    }

    static async getStorageEstimate() {
        if (navigator.storage && navigator.storage.estimate) {
            try {
                const estimate = await navigator.storage.estimate();
                return {
                    usageMB: ((estimate.usage || 0) / (1024 * 1024)).toFixed(2),
                    quotaMB: ((estimate.quota || 0) / (1024 * 1024)).toFixed(2),
                    percent: estimate.quota ? Math.round((estimate.usage / estimate.quota) * 100) : 0
                };
            } catch (e) {
                // Ignore
            }
        }
        return { usageMB: '0.50', quotaMB: '1000.00', percent: 1 };
    }

    // CQRS Event Append (Single-Writer Principle)
    static async appendEvent(eventType, payload) {
        const eventRecord = {
            timestamp: new Date().toISOString(),
            eventType,
            payload
        };

        if (this._db) {
            try {
                const tx = this._db.transaction('eventos_cqrs', 'readwrite');
                tx.objectStore('eventos_cqrs').add(eventRecord);
            } catch (e) {
                // Fallback
            }
        }

        // LocalStorage Event Stream
        const historyKey = 'mt_cqrs_events';
        try {
            const raw = localStorage.getItem(historyKey) || '[]';
            const parsed = JSON.parse(raw);
            parsed.push(eventRecord);
            if (parsed.length > 500) parsed.shift(); // FIFO circular
            localStorage.setItem(historyKey, JSON.stringify(parsed));
        } catch (e) {
            // LocalStorage quota handling
        }
    }

    static async saveTicketExpense(expense) {
        await this.appendEvent('GASTO_REGISTRADO', expense);
        const key = `mt_expense_${expense.id_gasto}`;
        try {
            localStorage.setItem(key, JSON.stringify(expense));
        } catch (e) {}

        if (this._db) {
            try {
                const tx = this._db.transaction('gastos_tickets', 'readwrite');
                tx.objectStore('gastos_tickets').put(expense);
            } catch (e) {}
        }
    }

    static getLocalExpenses(reservaId) {
        const results = [];
        try {
            for (let i = 0; i < localStorage.length; i++) {
                const k = localStorage.key(i);
                if (k && k.startsWith('mt_expense_')) {
                    const item = JSON.parse(localStorage.getItem(k));
                    if (!reservaId || item.id_reserva === reservaId) {
                        results.push(item);
                    }
                }
            }
        } catch (e) {}
        return results;
    }
}
