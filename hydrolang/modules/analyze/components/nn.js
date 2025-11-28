/**
 * Main class for the creation of machine learning models.
 * Acts as a thin client/proxy to the Web Worker where the actual models reside.
 * @class
 * @name nn
 */
export default class nn {

  static worker = new Worker(new URL('./utils/nn.worker.js?v=' + Date.now(), import.meta.url), { type: "module" });
  static pending = new Map();
  static msgId = 0;

  static {
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

  static _send(action, payload) {
    const id = this.msgId++;
    return new Promise((resolve, reject) => {
      this.pending.set(id, { resolve, reject });
      this.worker.postMessage({ id, action, payload });
    });
  }

  /**
   * Creates a machine learning model in the worker.
   * @method createModel
   * @memberof nn
   * @param {Object} params - Contains: type (model type)
   * @param {Object} args - Contains: config (model configuration)
   * @returns {Promise<ModelProxy>} A proxy object to control the model.
   * 
   * @example
   * // Create a Dense Neural Network
   * const denseModel = await hydro.analyze.nn.createModel({
   *   params: { type: 'dense' },
   *   args: { config: { inputs: 10, neurons: 32, outputs: 1 } }
   * });
   * 
   * @example
   * // Create a Convolutional Neural Network (CNN)
   * const cnnModel = await hydro.analyze.nn.createModel({
   *   params: { type: 'cnn' },
   *   args: { config: { inputShape: [28, 28, 1], kernelSize: 3, filters: 32, classes: 10 } }
   * });
   * 
   * @example
   * // Create an LSTM Model
   * const lstmModel = await hydro.analyze.nn.createModel({
   *   params: { type: 'lstm' },
   *   args: { config: { timeSteps: 10, features: 1, units: 50, outputs: 1 } }
   * });
   */
  static async createModel({ params = {}, args = {}, data } = {}) {
    const modelId = `model_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const type = params.type || "dense";
    const config = args.config || {};

    await this._send("CREATE", { modelId, type, config });

    // Return a proxy object that remembers its ID
    return new ModelProxy(modelId);
  }

  /**
   * Loads a pretrained model from a URL.
   * @method loadModel
   * @memberof nn
   * @param {Object} params - Contains: url (path to model.json)
   * @returns {Promise<ModelProxy>} A proxy object to control the model.
   * 
   * @example
   * const loadedModel = await hydro.analyze.nn.loadModel({
   *   params: { url: 'https://example.com/my-model/model.json' }
   * });
   */
  static async loadModel({ params = {}, args, data } = {}) {
    const modelId = `model_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const url = params.url;

    if (!url) {
      throw new Error("URL is required to load a model.");
    }

    await this._send("LOAD", { modelId, url });

    // Return a proxy object that remembers its ID
    return new ModelProxy(modelId);
  }
}

/**
 * Proxy class representing a model living in the worker.
 */
class ModelProxy {
  constructor(modelId) {
    this.id = modelId;
  }

  /**
   * Trains the model with provided data.
   * @method train
   * @memberof ModelProxy
   * @param {Object} params - Contains: epochs, batchSize, validationSplit, optimizer, loss, metrics
   * @param {Object} data - Contains: inputs, outputs (as arrays or tensors) OR a cache key string
   * @returns {Promise<Object>} Training status and history.
   * 
   * @example
   * await model.train({
   *   params: { epochs: 50, batchSize: 32, loss: 'meanSquaredError', optimizer: 'adam' },
   *   data: { inputs: xTrain, outputs: yTrain }
   * });
   */
  async train({ params = {}, args, data } = {}) {
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

    return nn._send("TRAIN", {
      modelId: this.id,
      data: trainData,
      config: params
    });
  }

  /**
   * Generates predictions using the trained model.
   * @method predict
   * @memberof ModelProxy
   * @param {Object} params - Contains: inputShape (optional)
   * @param {Object|Array} data - Input data for prediction OR a cache key string
   * @returns {Promise<Array>} Prediction results.
   * 
   * @example
   * const predictions = await model.predict({
   *   params: { inputShape: [1, 10] },
   *   data: xTest
   * });
   */
  async predict({ params = {}, args, data } = {}) {
    let predictInputs = data;

    // Resolve cache key if inputs is a string
    if (typeof data === 'string') {
      const cache = globalThis.hydro?.cache;
      if (cache) {
        const cached = await cache.get(data);
        if (cached) {
          predictInputs = cached.data;
        } else {
          console.warn(`[NN] Cache key '${data}' not found. Sending as is.`);
        }
      }
    }

    return nn._send("PREDICT", {
      modelId: this.id,
      inputs: predictInputs,
      inputShape: params.inputShape
    });
  }

  /**
   * Saves the model to the local file system (browser downloads).
   * @method save
   * @memberof ModelProxy
   * @param {Object} params - Contains: name (filename for the model)
   * @returns {Promise<Object>} Save status.
   * 
   * @example
   * await model.save({
   *   params: { name: 'my-trained-model' }
   * });
   */
  async save({ params = {}, args, data } = {}) {
    return nn._send("SAVE", {
      modelId: this.id,
      name: params.name || 'model'
    });
  }

  /**
   * Disposes the model from memory in the worker.
   * @method dispose
   * @memberof ModelProxy
   * @returns {void}
   * 
   * @example
   * model.dispose();
   */
  dispose() {
    nn._send("DISPOSE", { modelId: this.id });
  }
}
