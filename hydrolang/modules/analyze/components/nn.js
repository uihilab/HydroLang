/**
 * Main class for the creation of machine learning models.
 * Acts as a thin client/proxy to the Web Worker where the actual models reside.
 * @class
 * @name nn
 */
export default class nn {

  constructor() {
    this.worker = new Worker(new URL('./utils/nn.worker.js', import.meta.url), { type: "module" });
    this.pending = new Map();
    this.msgId = 0;

    this.worker.onmessage = (e) => {
      const { id, status, payload, action } = e.data;

      // Handle progress updates (e.g., EPOCH_END) without resolving the promise yet
      if (action === "EPOCH_END") {
        console.log(`[Training] Epoch ${payload.epoch}: loss = ${payload.logs.loss}`);
        return;
      }

      if (this.pending.has(id)) {
        const { resolve, reject } = this.pending.get(id);
        this.pending.delete(id);
        if (status === "SUCCESS") resolve(payload);
        else reject(new Error(payload));
      }
    };
  }

  _send(action, payload) {
    const id = this.msgId++;
    return new Promise((resolve, reject) => {
      this.pending.set(id, { resolve, reject });
      this.worker.postMessage({ id, action, payload });
    });
  }

  /**
   * Creates a model in the worker.
   * @param {Object} params - { type, config }
   * @returns {Promise<ModelProxy>} A proxy object to control the model.
   */
  async createModel({ params } = {}) {
    const modelId = `model_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const type = params.type || "dense";
    const config = params.config || params;

    await this._send("CREATE", { modelId, type, config });

    // Return a proxy object that remembers its ID
    return new ModelProxy(this, modelId);
  }

  /**
   * Loads a pretrained model (Not fully implemented in worker yet, but placeholder).
   */
  async loadModel({ params } = {}) {
    // Implementation would involve sending URL to worker to load
    throw new Error("loadModel not yet implemented in Fat Worker architecture.");
  }
}

/**
 * Proxy class representing a model living in the worker.
 */
class ModelProxy {
  constructor(nnInstance, modelId) {
    this.nn = nnInstance;
    this.id = modelId;
  }

  /**
   * Trains the model.
   * @param {Object} data - { inputs, outputs, inputShape, outputShape } OR a cache key string
   * @param {Object} config - { epochs, batchSize, ... }
   */
  async train({ data, config }) {
    let trainData = data;

    // Resolve cache key if data is a string
    if (typeof data === 'string') {
      const cache = globalThis.hydro?.cache;
      if (cache) {
        const cached = await cache.get(data);
        if (cached) {
          trainData = cached.data;
        } else {
          console.warn(`[NN] Cache key '${data}' not found. Sending as is.`);
        }
      }
    }

    return this.nn._send("TRAIN", {
      modelId: this.id,
      data: trainData,
      config
    });
  }

  /**
   * Predicts using the model.
   * @param {Object} inputs - Raw input data (array) OR a cache key string
   * @param {Array} inputShape - Shape of the input
   */
  async predict({ inputs, inputShape }) {
    let predictInputs = inputs;

    // Resolve cache key if inputs is a string
    if (typeof inputs === 'string') {
      const cache = globalThis.hydro?.cache;
      if (cache) {
        const cached = await cache.get(inputs);
        if (cached) {
          predictInputs = cached.data;
        } else {
          console.warn(`[NN] Cache key '${inputs}' not found. Sending as is.`);
        }
      }
    }

    return this.nn._send("PREDICT", {
      modelId: this.id,
      inputs: predictInputs,
      inputShape
    });
  }

  /**
   * Saves the model.
   * @param {string} name 
   */
  async save(name) {
    return this.nn._send("SAVE", {
      modelId: this.id,
      name
    });
  }

  /**
   * Disposes the model in the worker.
   */
  dispose() {
    this.nn._send("DISPOSE", { modelId: this.id });
  }
}
