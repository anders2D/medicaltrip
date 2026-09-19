/**
 * CRDT Conflict-Free Replicated Data Types & State Synchronization Engine
 * Medical Trip Colombia S.A.S. — Milestone 4 Actor Model
 * 
 * Provides mathematically sound, commutative, associative, and idempotent
 * state convergence across decentralized Web Worker actors and the main thread.
 * 0 external framework dependencies. 100% pure BigInt & JavaScript ESM.
 */

/**
 * 1. PN-Counter (Positive-Negative Counter)
 * Tracks commutative, monotonic increments and decrements across decentralized nodes.
 * Stores monetary amounts and counters strictly in BigInt cents.
 */
export class CRDTPNCounter {
  /** @type {Map<string, bigint>} */
  #p;
  /** @type {Map<string, bigint>} */
  #n;

  /**
   * @param {object} [initialData]
   * @param {Record<string, bigint|string|number>} [initialData.p]
   * @param {Record<string, bigint|string|number>} [initialData.n]
   */
  constructor(initialData = {}) {
    this.#p = new Map();
    this.#n = new Map();

    if (initialData.p) {
      for (const [k, v] of Object.entries(initialData.p)) {
        this.#p.set(k, BigInt(v));
      }
    }
    if (initialData.n) {
      for (const [k, v] of Object.entries(initialData.n)) {
        this.#n.set(k, BigInt(v));
      }
    }
  }

  /**
   * Increments positive counter for a specific node/actor.
   * @param {string} actorId
   * @param {bigint|number|string} [amount=1n]
   * @returns {this}
   */
  increment(actorId, amount = 1n) {
    if (!actorId) throw new Error('[CRDTPNCounter] actorId is required');
    const bigAmount = BigInt(amount);
    if (bigAmount < 0n) {
      return this.decrement(actorId, -bigAmount);
    }
    const current = this.#p.get(actorId) || 0n;
    this.#p.set(actorId, current + bigAmount);
    return this;
  }

  /**
   * Decrements counter via negative vector for a specific node/actor.
   * @param {string} actorId
   * @param {bigint|number|string} [amount=1n]
   * @returns {this}
   */
  decrement(actorId, amount = 1n) {
    if (!actorId) throw new Error('[CRDTPNCounter] actorId is required');
    const bigAmount = BigInt(amount);
    if (bigAmount < 0n) {
      return this.increment(actorId, -bigAmount);
    }
    const current = this.#n.get(actorId) || 0n;
    this.#n.set(actorId, current + bigAmount);
    return this;
  }

  /**
   * Returns total aggregated value in BigInt.
   * @returns {bigint}
   */
  get value() {
    let sumP = 0n;
    let sumN = 0n;
    for (const v of this.#p.values()) sumP += v;
    for (const v of this.#n.values()) sumN += v;
    return sumP - sumN;
  }

  /**
   * Returns positive sum in BigInt.
   * @returns {bigint}
   */
  get positiveValue() {
    let sum = 0n;
    for (const v of this.#p.values()) sum += v;
    return sum;
  }

  /**
   * Returns negative sum in BigInt.
   * @returns {bigint}
   */
  get negativeValue() {
    let sum = 0n;
    for (const v of this.#n.values()) sum += v;
    return sum;
  }

  /**
   * Commutative, associative, idempotent state merge:
   * P_merged = max(P_A, P_B), N_merged = max(N_A, N_B)
   * @param {CRDTPNCounter} other
   * @returns {this}
   */
  merge(other) {
    if (!other || !(other instanceof CRDTPNCounter)) {
      return this;
    }

    // Merge P vectors
    for (const [actorId, otherVal] of other.#p.entries()) {
      const myVal = this.#p.get(actorId) || 0n;
      this.#p.set(actorId, otherVal > myVal ? otherVal : myVal);
    }

    // Merge N vectors
    for (const [actorId, otherVal] of other.#n.entries()) {
      const myVal = this.#n.get(actorId) || 0n;
      this.#n.set(actorId, otherVal > myVal ? otherVal : myVal);
    }

    return this;
  }

  /**
   * Clones this PN-Counter instance.
   * @returns {CRDTPNCounter}
   */
  clone() {
    const next = new CRDTPNCounter();
    for (const [k, v] of this.#p.entries()) next.#p.set(k, v);
    for (const [k, v] of this.#n.entries()) next.#n.set(k, v);
    return next;
  }

  /**
   * Serializes to plain JSON representation.
   * @returns {object}
   */
  toJSON() {
    const pObj = {};
    const nObj = {};
    for (const [k, v] of this.#p.entries()) pObj[k] = v.toString();
    for (const [k, v] of this.#n.entries()) nObj[k] = v.toString();
    return {
      type: 'CRDTPNCounter',
      p: pObj,
      n: nObj,
      value: this.value.toString()
    };
  }

  /**
   * Deserializes from JSON.
   * @param {object} json
   * @returns {CRDTPNCounter}
   */
  static fromJSON(json) {
    if (!json) return new CRDTPNCounter();
    return new CRDTPNCounter({ p: json.p, n: json.n });
  }
}

/**
 * 2. LWW-Element-Set (Last-Write-Wins Element Register / Set)
 * Conflict-free register using timestamped writes with deterministic actorId tie-breaking.
 */
export class CRDTLWWElementSet {
  /** @type {Map<string, { value: any, timestamp: number, actorId: string }>} */
  #addSet;
  /** @type {Map<string, { timestamp: number, actorId: string }>} */
  #removeSet;

  /**
   * @param {object} [initialData]
   */
  constructor(initialData = {}) {
    this.#addSet = new Map();
    this.#removeSet = new Map();

    if (initialData.addSet) {
      for (const [k, v] of Object.entries(initialData.addSet)) {
        this.#addSet.set(k, {
          value: v.value,
          timestamp: Number(v.timestamp),
          actorId: String(v.actorId || 'unknown')
        });
      }
    }
    if (initialData.removeSet) {
      for (const [k, v] of Object.entries(initialData.removeSet)) {
        this.#removeSet.set(k, {
          timestamp: Number(v.timestamp),
          actorId: String(v.actorId || 'unknown')
        });
      }
    }
  }

  /**
   * Deterministic record comparison (LWW with Actor ID tie-breaker)
   * @private
   */
  static #isRecordNewer(a, b) {
    if (!b) return true;
    if (!a) return false;
    if (a.timestamp > b.timestamp) return true;
    if (a.timestamp < b.timestamp) return false;
    return (a.actorId || '') >= (b.actorId || '');
  }

  /**
   * Sets / writes an element value.
   * @param {string} key
   * @param {any} value
   * @param {number|string|Date} [timestamp]
   * @param {string} [actorId='']
   * @returns {this}
   */
  set(key, value, timestamp = Date.now(), actorId = '') {
    if (!key) throw new Error('[CRDTLWWElementSet] key is required');
    const ts = typeof timestamp === 'number' ? timestamp : (new Date(timestamp)).getTime();
    const newRecord = { value, timestamp: ts, actorId: String(actorId) };

    const existing = this.#addSet.get(key);
    if (CRDTLWWElementSet.#isRecordNewer(newRecord, existing)) {
      this.#addSet.set(key, newRecord);
    }
    return this;
  }

  /**
   * Removes / tombstones an element.
   * @param {string} key
   * @param {number|string|Date} [timestamp]
   * @param {string} [actorId='']
   * @returns {this}
   */
  remove(key, timestamp = Date.now(), actorId = '') {
    if (!key) throw new Error('[CRDTLWWElementSet] key is required');
    const ts = typeof timestamp === 'number' ? timestamp : (new Date(timestamp)).getTime();
    const newRecord = { timestamp: ts, actorId: String(actorId) };

    const existing = this.#removeSet.get(key);
    if (CRDTLWWElementSet.#isRecordNewer(newRecord, existing)) {
      this.#removeSet.set(key, newRecord);
    }
    return this;
  }

  /**
   * Checks if element is currently active (in addSet and newer than removeSet).
   * @param {string} key
   * @returns {boolean}
   */
  has(key) {
    const addRecord = this.#addSet.get(key);
    if (!addRecord) return false;

    const removeRecord = this.#removeSet.get(key);
    if (!removeRecord) return true;

    return CRDTLWWElementSet.#isRecordNewer(addRecord, removeRecord);
  }

  /**
   * Gets current element value if active.
   * @param {string} key
   * @returns {any|undefined}
   */
  get(key) {
    return this.has(key) ? this.#addSet.get(key).value : undefined;
  }

  /**
   * Gets metadata for a key.
   * @param {string} key
   * @returns {{ value: any, timestamp: number, actorId: string } | undefined}
   */
  getRecord(key) {
    return this.has(key) ? { ...this.#addSet.get(key) } : undefined;
  }

  /**
   * Returns all active key-value entries as an array.
   * @returns {Array<[string, any]>}
   */
  entries() {
    const results = [];
    for (const [key] of this.#addSet.entries()) {
      if (this.has(key)) {
        results.push([key, this.#addSet.get(key).value]);
      }
    }
    return results;
  }

  /**
   * Returns plain object of all active key-values.
   * @returns {Record<string, any>}
   */
  toObject() {
    const obj = {};
    for (const [k, v] of this.entries()) {
      obj[k] = v;
    }
    return obj;
  }

  /**
   * Commutative, associative, idempotent state merge:
   * Pairwise max timestamp for each key across addSet and removeSet.
   * @param {CRDTLWWElementSet} other
   * @returns {this}
   */
  merge(other) {
    if (!other || !(other instanceof CRDTLWWElementSet)) {
      return this;
    }

    // Merge Add-Sets
    for (const [key, otherRec] of other.#addSet.entries()) {
      const myRec = this.#addSet.get(key);
      if (CRDTLWWElementSet.#isRecordNewer(otherRec, myRec)) {
        this.#addSet.set(key, { ...otherRec });
      }
    }

    // Merge Remove-Sets
    for (const [key, otherRec] of other.#removeSet.entries()) {
      const myRec = this.#removeSet.get(key);
      if (CRDTLWWElementSet.#isRecordNewer(otherRec, myRec)) {
        this.#removeSet.set(key, { ...otherRec });
      }
    }

    return this;
  }

  /**
   * Clones this register instance.
   * @returns {CRDTLWWElementSet}
   */
  clone() {
    const next = new CRDTLWWElementSet();
    for (const [k, v] of this.#addSet.entries()) next.#addSet.set(k, { ...v });
    for (const [k, v] of this.#removeSet.entries()) next.#removeSet.set(k, { ...v });
    return next;
  }

  /**
   * Serializes to JSON.
   * @returns {object}
   */
  toJSON() {
    const addObj = {};
    const remObj = {};
    for (const [k, v] of this.#addSet.entries()) addObj[k] = v;
    for (const [k, v] of this.#removeSet.entries()) remObj[k] = v;
    return {
      type: 'CRDTLWWElementSet',
      addSet: addObj,
      removeSet: remObj,
      activeEntries: this.toObject()
    };
  }

  /**
   * Deserializes from JSON.
   * @param {object} json
   * @returns {CRDTLWWElementSet}
   */
  static fromJSON(json) {
    if (!json) return new CRDTLWWElementSet();
    return new CRDTLWWElementSet({
      addSet: json.addSet,
      removeSet: json.removeSet
    });
  }
}

/**
 * 3. Observed-Remove Set (OR-Set / Add-Wins Set)
 * Conflict-free set using unique causal tags for additions and removals.
 */
export class CRDTObservedRemoveSet {
  /** @type {Map<string, Map<string, { element: any, tag: string, actorId: string, timestamp: number }>>} */
  #addMap;
  /** @type {Set<string>} */
  #removeTags;

  /**
   * @param {object} [initialData]
   */
  constructor(initialData = {}) {
    this.#addMap = new Map();
    this.#removeTags = new Set();

    if (initialData.addMap) {
      for (const [key, tagMapObj] of Object.entries(initialData.addMap)) {
        const tagMap = new Map();
        for (const [tag, rec] of Object.entries(tagMapObj)) {
          tagMap.set(tag, {
            element: rec.element,
            tag: rec.tag || tag,
            actorId: rec.actorId || '',
            timestamp: Number(rec.timestamp || Date.now())
          });
        }
        this.#addMap.set(key, tagMap);
      }
    }
    if (initialData.removeTags && Array.isArray(initialData.removeTags)) {
      for (const t of initialData.removeTags) {
        this.#removeTags.add(String(t));
      }
    }
  }

  /**
   * Generates a unique deterministic causal tag.
   * @private
   */
  #generateTag(actorId) {
    return `${actorId || 'anon'}_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
  }

  /**
   * Adds an element to the OR-Set with a unique causal tag.
   * @param {string} key
   * @param {any} element
   * @param {string} [actorId='']
   * @param {string} [customTag]
   * @param {number} [timestamp]
   * @returns {string} The generated tag
   */
  add(key, element, actorId = '', customTag, timestamp = Date.now()) {
    if (!key) throw new Error('[CRDTObservedRemoveSet] key is required');
    const tag = customTag || this.#generateTag(actorId);

    let tagMap = this.#addMap.get(key);
    if (!tagMap) {
      tagMap = new Map();
      this.#addMap.set(key, tagMap);
    }

    tagMap.set(tag, {
      element,
      tag,
      actorId: String(actorId),
      timestamp: Number(timestamp)
    });

    return tag;
  }

  /**
   * Removes an element by adding all observed tags for that key into the removeTags set.
   * @param {string} key
   * @returns {this}
   */
  remove(key) {
    if (!key) return this;
    const tagMap = this.#addMap.get(key);
    if (tagMap) {
      for (const tag of tagMap.keys()) {
        this.#removeTags.add(tag);
      }
    }
    return this;
  }

  /**
   * Checks if element key has at least one active (unremoved) tag.
   * @param {string} key
   * @returns {boolean}
   */
  has(key) {
    const tagMap = this.#addMap.get(key);
    if (!tagMap || tagMap.size === 0) return false;

    for (const tag of tagMap.keys()) {
      if (!this.#removeTags.has(tag)) {
        return true;
      }
    }
    return false;
  }

  /**
   * Retrieves active element for key.
   * @param {string} key
   * @returns {any|undefined}
   */
  get(key) {
    const tagMap = this.#addMap.get(key);
    if (!tagMap) return undefined;

    for (const [tag, rec] of tagMap.entries()) {
      if (!this.#removeTags.has(tag)) {
        return rec.element;
      }
    }
    return undefined;
  }

  /**
   * Returns array of all active elements in the set.
   * @returns {any[]}
   */
  elements() {
    const active = [];
    for (const [key, tagMap] of this.#addMap.entries()) {
      for (const [tag, rec] of tagMap.entries()) {
        if (!this.#removeTags.has(tag)) {
          active.push(rec.element);
          break; // One active instance per key
        }
      }
    }
    return active;
  }

  /**
   * Commutative, associative, idempotent state merge:
   * Union of addMap entries and union of removeTags.
   * @param {CRDTObservedRemoveSet} other
   * @returns {this}
   */
  merge(other) {
    if (!other || !(other instanceof CRDTObservedRemoveSet)) {
      return this;
    }

    // Merge Add Map
    for (const [key, otherTagMap] of other.#addMap.entries()) {
      let myTagMap = this.#addMap.get(key);
      if (!myTagMap) {
        myTagMap = new Map();
        this.#addMap.set(key, myTagMap);
      }
      for (const [tag, rec] of otherTagMap.entries()) {
        if (!myTagMap.has(tag)) {
          myTagMap.set(tag, { ...rec });
        }
      }
    }

    // Merge Remove Tags (Set union)
    for (const tag of other.#removeTags) {
      this.#removeTags.add(tag);
    }

    return this;
  }

  /**
   * Clones this OR-Set instance.
   * @returns {CRDTObservedRemoveSet}
   */
  clone() {
    const next = new CRDTObservedRemoveSet();
    for (const [k, tagMap] of this.#addMap.entries()) {
      const copyTagMap = new Map();
      for (const [tag, rec] of tagMap.entries()) {
        copyTagMap.set(tag, { ...rec });
      }
      next.#addMap.set(k, copyTagMap);
    }
    for (const tag of this.#removeTags) {
      next.#removeTags.add(tag);
    }
    return next;
  }

  /**
   * Serializes to JSON.
   * @returns {object}
   */
  toJSON() {
    const addMapObj = {};
    for (const [key, tagMap] of this.#addMap.entries()) {
      const tagsObj = {};
      for (const [tag, rec] of tagMap.entries()) {
        tagsObj[tag] = rec;
      }
      addMapObj[key] = tagsObj;
    }
    return {
      type: 'CRDTObservedRemoveSet',
      addMap: addMapObj,
      removeTags: Array.from(this.#removeTags),
      activeElements: this.elements()
    };
  }

  /**
   * Deserializes from JSON.
   * @param {object} json
   * @returns {CRDTObservedRemoveSet}
   */
  static fromJSON(json) {
    if (!json) return new CRDTObservedRemoveSet();
    return new CRDTObservedRemoveSet({
      addMap: json.addMap,
      removeTags: json.removeTags
    });
  }
}

/**
 * 4. CRDTActorState (Composite Replicated Document)
 * Combines PN-Counters, LWW-Registers, and OR-Sets into a unified,
 * replicated state document shared across the Actor Mesh.
 */
export class CRDTActorState {
  /** @type {CRDTPNCounter} */
  expenses;
  /** @type {CRDTLWWElementSet} */
  stopStatuses;
  /** @type {CRDTLWWElementSet} */
  actorLocations;
  /** @type {CRDTObservedRemoveSet} */
  pendingTasks;
  /** @type {Map<string, number>} */
  vectorClock;

  /**
   * @param {object} [initialData]
   */
  constructor(initialData = {}) {
    this.expenses = initialData.expenses instanceof CRDTPNCounter
      ? initialData.expenses
      : CRDTPNCounter.fromJSON(initialData.expenses);

    this.stopStatuses = initialData.stopStatuses instanceof CRDTLWWElementSet
      ? initialData.stopStatuses
      : CRDTLWWElementSet.fromJSON(initialData.stopStatuses);

    this.actorLocations = initialData.actorLocations instanceof CRDTLWWElementSet
      ? initialData.actorLocations
      : CRDTLWWElementSet.fromJSON(initialData.actorLocations);

    this.pendingTasks = initialData.pendingTasks instanceof CRDTObservedRemoveSet
      ? initialData.pendingTasks
      : CRDTObservedRemoveSet.fromJSON(initialData.pendingTasks);

    this.vectorClock = new Map();
    if (initialData.vectorClock) {
      const entries = initialData.vectorClock instanceof Map
        ? initialData.vectorClock.entries()
        : Object.entries(initialData.vectorClock);
      for (const [k, v] of entries) {
        this.vectorClock.set(k, Number(v));
      }
    }
  }

  /**
   * Increments vector clock for an actor.
   * @param {string} actorId
   * @returns {number}
   */
  tick(actorId) {
    const current = this.vectorClock.get(actorId) || 0;
    const next = current + 1;
    this.vectorClock.set(actorId, next);
    return next;
  }

  /**
   * Updates status for an itinerary stop.
   * @param {string} stopId
   * @param {string} status ('PROGRAMADO'|'EN_CAMINO'|'EN_SITIO'|'COMPLETADO')
   * @param {string} actorId
   * @param {number|string} [timestamp]
   * @returns {this}
   */
  updateStopStatus(stopId, status, actorId, timestamp = Date.now()) {
    this.tick(actorId);
    this.stopStatuses.set(stopId, { status, updatedBy: actorId }, timestamp, actorId);
    return this;
  }

  /**
   * Updates actor GPS location.
   * @param {string} actorId
   * @param {{ lat: number, lng: number, heading?: number, speed?: number }} coords
   * @param {number|string} [timestamp]
   * @returns {this}
   */
  updateActorLocation(actorId, coords, timestamp = Date.now()) {
    this.tick(actorId);
    this.actorLocations.set(actorId, coords, timestamp, actorId);
    return this;
  }

  /**
   * Records expense in BigInt cents.
   * @param {string} actorId
   * @param {bigint|number|string} amountInCents
   * @returns {this}
   */
  addExpenseCents(actorId, amountInCents) {
    this.tick(actorId);
    this.expenses.increment(actorId, amountInCents);
    return this;
  }

  /**
   * Commutatively merges another replicated state document into this one.
   * @param {CRDTActorState} other
   * @returns {this}
   */
  merge(other) {
    if (!other || !(other instanceof CRDTActorState)) {
      return this;
    }

    this.expenses.merge(other.expenses);
    this.stopStatuses.merge(other.stopStatuses);
    this.actorLocations.merge(other.actorLocations);
    this.pendingTasks.merge(other.pendingTasks);

    // Merge vector clocks (pairwise max)
    for (const [actorId, otherSeq] of other.vectorClock.entries()) {
      const mySeq = this.vectorClock.get(actorId) || 0;
      this.vectorClock.set(actorId, Math.max(mySeq, otherSeq));
    }

    return this;
  }

  /**
   * Returns a lightweight, immutable snapshot of the active state.
   * @returns {object}
   */
  getSnapshot() {
    const vcObj = {};
    for (const [k, v] of this.vectorClock.entries()) vcObj[k] = v;

    return {
      totalExpenseCents: this.expenses.value.toString(),
      stopStatuses: this.stopStatuses.toObject(),
      actorLocations: this.actorLocations.toObject(),
      pendingTasks: this.pendingTasks.elements(),
      vectorClock: vcObj
    };
  }

  /**
   * Clones this state instance.
   * @returns {CRDTActorState}
   */
  clone() {
    return new CRDTActorState({
      expenses: this.expenses.clone(),
      stopStatuses: this.stopStatuses.clone(),
      actorLocations: this.actorLocations.clone(),
      pendingTasks: this.pendingTasks.clone(),
      vectorClock: new Map(this.vectorClock)
    });
  }

  /**
   * Serializes to JSON.
   * @returns {object}
   */
  toJSON() {
    const vcObj = {};
    for (const [k, v] of this.vectorClock.entries()) vcObj[k] = v;

    return {
      type: 'CRDTActorState',
      expenses: this.expenses.toJSON(),
      stopStatuses: this.stopStatuses.toJSON(),
      actorLocations: this.actorLocations.toJSON(),
      pendingTasks: this.pendingTasks.toJSON(),
      vectorClock: vcObj
    };
  }

  /**
   * Deserializes from JSON.
   * @param {object} json
   * @returns {CRDTActorState}
   */
  static fromJSON(json) {
    if (!json) return new CRDTActorState();
    return new CRDTActorState({
      expenses: CRDTPNCounter.fromJSON(json.expenses),
      stopStatuses: CRDTLWWElementSet.fromJSON(json.stopStatuses),
      actorLocations: CRDTLWWElementSet.fromJSON(json.actorLocations),
      pendingTasks: CRDTObservedRemoveSet.fromJSON(json.pendingTasks),
      vectorClock: json.vectorClock
    });
  }
}
