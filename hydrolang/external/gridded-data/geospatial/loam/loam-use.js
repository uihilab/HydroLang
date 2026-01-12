/**
 * Main Thread Loam Service
 * Handles GDAL/Loam operations via local worker
 */

// Custom Loam Client Shim
const Loam = (function () {
    let worker = null;
    let initPromise = null;
    let messageId = 0;
    const callbacks = {};

    class LoamDataset {
        constructor(source, operations = []) {
            this.source = source;
            this.operations = operations;
        }

        async convert(args) {
            return new LoamDataset(this.source, [...this.operations, { func: 'GDALTranslate', args }]);
        }

        async warp(args) {
            return new LoamDataset(this.source, [...this.operations, { func: 'GDALWarp', args }]);
        }

        async demProcessing(processing, colorFilename, options) {
            // Args passed to worker must be a flat array of strings
            // [processingMode, colorFile, ...optionsArray]
            return new LoamDataset(this.source, [...this.operations, {
                func: 'GDALDEMProcessing',
                args: [processing, colorFilename || "", ...(options || [])]
            }]);
        }

        async bytes() {
            return Loam._runAccessor('LoamReadBytes', this.source, this.operations);
        }
    }

    return {
        initialize: function (pathPrefix) {
            if (initPromise) return initPromise;

            initPromise = new Promise((resolve, reject) => {
                try {
                    // Resolve absolute URL for base path using import.meta.url context
                    // This works in both source (ESM) and bundled (Webpack outputModule) environments
                    const absolutePath = new URL(pathPrefix, import.meta.url).href;

                    // Direct worker instantiation
                    try {
                        // console.log('LoamService: Spawning worker from', absolutePath + 'loam-worker.js');
                        worker = new Worker(new URL('loam-worker.js', absolutePath), {
                            type: 'classic' // loam-worker is usually classic script, not module? Check file. It has imports? No, it has FS shim.
                            // The original code used `new Worker(absolutePath + 'loam-worker.js')`.
                        });
                    } catch (e) {
                        console.error('LoamService: Worker instantiation failed', e);
                        reject(e);
                        return;
                    }

                    // Worker Message Handler
                    worker.onmessage = function (e) {
                        const data = e.data;
                        if (data.ready) {
                            console.log("Loam Worker Ready (Direct Mode)");
                            resolve();
                            return;
                        }

                        if (data.id && callbacks[data.id]) {
                            if (data.success) {
                                callbacks[data.id].resolve(data.result);
                            } else {
                                callbacks[data.id].reject(new Error(data.message));
                            }
                            delete callbacks[data.id];
                        }
                    };

                    worker.onerror = function (err) {
                        console.error("Loam Worker Error:", err);
                        reject(err);
                    };

                } catch (e) {
                    reject(e);
                }
            });
            return initPromise;
        },

        writeFile: function (name, data) {
            return new Promise((resolve, reject) => {
                const id = ++messageId;
                callbacks[id] = { resolve, reject };
                worker.postMessage({
                    id,
                    action: 'writeFile',
                    name,
                    data
                });
            });
        },

        open: async function (fileIn) {
            await this.initialize();

            let file = fileIn;
            let filename = 'data.tif';
            let buffer;

            if (fileIn instanceof File) {
                filename = fileIn.name;
                buffer = new Uint8Array(await fileIn.arrayBuffer());
            } else if (fileIn instanceof Blob) {
                // Blob doesn't always have name, default used
                buffer = new Uint8Array(await fileIn.arrayBuffer());
            } else if (fileIn instanceof ArrayBuffer) {
                buffer = new Uint8Array(fileIn);
            } else if (fileIn instanceof Uint8Array) {
                buffer = fileIn;
            } else {
                throw new Error("Invalid input to Loam.open");
            }

            // Write file to worker FS (Keeping this as backup/debug, but main path uses object pass)
            // await this.writeFile(filename, buffer);

            // Pass object with name and data to trigger GDALOpen wrapper's blob mounting path
            const src = {
                name: filename,
                data: buffer
            };

            // Open using the src object
            return new LoamDataset({
                func: 'GDALOpen',
                src: src,
                args: [],
                sidecars: []
            });
        },

        _runAccessor: function (accessor, source, operations, args = []) {
            return new Promise((resolve, reject) => {
                const id = ++messageId;
                callbacks[id] = { resolve, reject };
                worker.postMessage({
                    id,
                    accessor,
                    dataset: { source, operations },
                    args
                });
            });
        }
    };
})();


class LoamService {
    constructor() {
        this.isInitialized = false;
        this.initPromise = null;
    }

    async initialize() {
        if (this.isInitialized) return;
        if (this.initPromise) return this.initPromise;

        this.initPromise = this._doInitialize();
        await this.initPromise;
    }

    async _doInitialize() {
        try {
            // Determine path prefix based on environment
            // If import.meta.url contains 'loam-use.js', we are in source mode (./)
            // If not (e.g. bundled in hydrolang.js), we are likely in the bundle root, 
            // and the worker files are in './hydrolang/external/gridded-data/geospatial/loam/'

            const isSource = import.meta.url.includes('loam-use.js');
            const loamPath = isSource ? './' : './hydrolang/external/gridded-data/geospatial/loam/';

            await Loam.initialize(loamPath);
            this.isInitialized = true;
        } catch (error) {
            console.error("Failed to initialize Loam:", error);
            throw error;
        }
    }

    /**
     * Open a dataset from an ArrayBuffer (or File/Blob)
     * @param {ArrayBuffer|File|Blob} data 
     * @param {string} filename Optional filename (used for extension detection)
     * @returns {Promise<LoamDataset>}
     */
    async open(data, filename = 'data.tif') {
        await this.initialize();

        let file = data;
        if (data instanceof ArrayBuffer) {
            file = new File([data], filename, { type: 'image/tiff' });
        } else if (data instanceof Blob) {
            file = data;
        }

        return Loam.open(file);
    }

    /**
     * Generic warp operation
     * @param {ArrayBuffer|Object} input Buffer or LoamDataset
     * @param {Array} args GDAL Warp arguments
     * @returns {Promise<Uint8Array|Object>} Resulting bytes (if buffer input) or dataset (if dataset input)
     */
    async warp(input, args) {
        try {
            // If input has .warp, assume it's a dataset
            if (input && typeof input.warp === 'function') {
                return input.warp(args);
            }

            // Otherwise treat as buffer
            const dataset = await this.open(input);
            const warped = await dataset.warp(args);
            return await warped.bytes();
        } catch (error) {
            console.error("Loam Warp operation failed:", error);
            throw error;
        }
    }

    /**
     * Helper to get metadata using GeoTIFF.js if available in window
     * @param {Uint8Array} buffer 
     */
    async getMetadata(buffer) {
        try {
            const GeoTIFF = window.GeoTIFF || (window.geospatial && window.geospatial.libraries && window.geospatial.libraries.GeoTIFF);
            if (!GeoTIFF) return null;

            const tiff = await GeoTIFF.fromArrayBuffer(buffer.buffer);
            const image = await tiff.getImage();
            return {
                width: image.getWidth(),
                height: image.getHeight(),
                bbox: image.getBoundingBox(),
                origin: image.getOrigin(),
                resolution: image.getResolution()
            };
        } catch (e) {
            console.warn("Metadata extraction failed:", e);
            return null;
        }
    }
}

export const loamService = new LoamService();
