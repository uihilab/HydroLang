/**
 * Geoprocessor module for raster data analysis using GeoTIFF.
 * @class
 * @name geoprocessor
 */
import geospatial from "../../../external/gridded-data/geospatial/geospatial.js";

/**
 * Geoprocessor module for raster data analysis using GeoTIFF.
 * @class
 * @name geoprocessor
 */
export default class geoprocessor {

    // ============================================================
    // Worker Management
    // ============================================================

    static async _ensureWorker() {
        if (!this._worker) {
            // Path relative to where this module is imported usually works if using module workers, 
            // but for safety with standard workers we might need absolute or precise relative path.
            // Assuming standard structure:
            const workerUrl = new URL('./utils/geoprocessor.worker.js', import.meta.url);
            this._worker = new Worker(workerUrl, { type: 'module' });

            this._workerCallbacks = {};
            this._msgId = 0;

            this._worker.onmessage = (e) => {
                const { id, success, result, message } = e.data;
                const callback = this._workerCallbacks[id];
                if (callback) {
                    if (success) callback.resolve(result);
                    else callback.reject(new Error(message));
                    delete this._workerCallbacks[id];
                }
            };

            this._worker.onerror = (e) => {
                console.error("Geoprocessor Worker Error:", e);
            };
        }
    }

    static _runWorker(action, args, data, transfer = []) {
        return new Promise(async (resolve, reject) => {
            try {
                await this._ensureWorker();
                const id = ++this._msgId;
                this._workerCallbacks[id] = { resolve, reject };
                this._worker.postMessage({ id, action, args, data }, transfer);
            } catch (e) {
                reject(e);
            }
        });
    }

    // ============================================================
    // Dependency Loading
    // ============================================================

    static async _ensureLibraries() {
        if (!geospatial.isLoaded()) {
            await geospatial.load({
                includeGeoTIFF: true,
                includeProj4: true,
                includeGDAL: true
            });
        }
    }

    // ============================================================
    // Internal Helpers
    // ============================================================

    static async _openFromArrayBuffer(input) {
        await this._ensureLibraries();

        // Handle fallback object (if previous step failed to write GeoTIFF)
        if (input && input._isGeorasterObject) {
            return {
                tiff: null,
                image: {
                    getWidth: () => input.width,
                    getHeight: () => input.height,
                    getSamplesPerPixel: () => input.numberOfRasters,
                    getBoundingBox: () => input.bbox || [0, 0, input.width, input.height], // Fallback bbox
                    getOrigin: () => input.origin || [0, 0],
                    getResolution: () => input.resolution || [1, 1],
                    getFileDirectory: () => ({}),
                    getGeoKeys: () => ({}),
                    readRasters: async ({ samples } = {}) => {
                        let bands = input.values;
                        // Flatten 2D arrays if necessary (georaster object usually has 2D arrays)
                        // But geoprocessor logic often expects flat arrays for processing if it assumes GeoTIFF read result
                        // Actually, geotiff.js readRasters returns arrays of values.
                        // Our fallback object has `values` which might be 2D arrays (rows).
                        // We need to flatten them for consistency if the consuming code expects flat arrays (which it does, e.g. dem[idx]).

                        const flatBands = bands.map(band2D => {
                            if (Array.isArray(band2D[0])) {
                                return band2D.flat();
                            }
                            return band2D;
                        });

                        if (samples) {
                            return samples.map(i => flatBands[i]);
                        }
                        return flatBands;
                    }
                }
            };
        }


        await this._ensureLibraries();

        // 1. Check for Fallback "Georaster-like" Object
        // Created by _toGeorasterObject when binary write fails
        if (input && input.values && input.width && input.height) {
            // Already a usable object. Wrap it in a mock Image interface for compatibility.
            // This mimics the API of GeoTIFF.Image so downstream functions don't need changing.
            return {
                image: {
                    getWidth: () => input.width,
                    getHeight: () => input.height,
                    readRasters: async () => {
                        // Check if values are 2D (array of arrays/TypedArrays). If so, flatten to 1D TypedArray.
                        return input.values.map(band => {
                            // If band is a standard Array (not TypedArray) and contains non-numbers (rows), process it.
                            if (Array.isArray(band) && band.length > 0 && typeof band[0] !== 'number') {
                                const w = input.width;
                                const h = input.height;
                                const flat = new Float32Array(w * h);
                                for (let y = 0; y < h; y++) {
                                    const row = band[y];
                                    const len = row ? row.length : 0;
                                    // Use .set() for efficiency
                                    if (len > 0) flat.set(row, y * w);
                                }
                                return flat;
                            }
                            return band;
                        });
                    },
                    // Mock GeoKeys access if needed (or return extracted keys)
                    getFileDirectory: () => ({
                        ModelTiepoint: input.ModelTiepoint,
                        ModelPixelScale: input.ModelPixelScale,
                        ModelTransformation: input.ModelTransformation,
                        GeoKeyDirectory: input.GeoKeyDirectory,
                        GeoAsciiParams: input.GeoAsciiParams
                    }),
                    getGeoKeys: () => ({
                        GTModelTypeGeoKey: input.GTModelTypeGeoKey,
                        GTRasterTypeGeoKey: input.GTRasterTypeGeoKey,
                        GeographicTypeGeoKey: input.GeographicTypeGeoKey,
                        ProjectedCSTypeGeoKey: input.ProjectedCSTypeGeoKey
                    }),
                    // Fallback helpers
                    getBoundingBox: () => [input.xmin, input.ymin, input.xmax, input.ymax],
                    getOrigin: () => [input.xmin, input.ymax],
                    getResolution: () => [input.pixelWidth, input.pixelHeight]
                }
            };
        }

        // 2. Unwrap if input is an object containing buffer (e.g., { buffer: ab }) or a TypedArray
        let buffer = input;
        if (input && typeof input === 'object') {
            if (input.arrayBuffer instanceof ArrayBuffer) {
                buffer = input.arrayBuffer;
            } else if (input.buffer instanceof ArrayBuffer) {
                buffer = input.buffer;
            }
        }

        if (!buffer || typeof buffer.slice !== 'function') {
            console.error("Geoprocessor Input Error: Expected ArrayBuffer but got:", input);
            throw new Error("Invalid input to Geoprocessor: Expected ArrayBuffer or Buffer-like object.");
        }

        // 3. Use external loader for real files
        const result = await geospatial.loadGeoTIFFFromBuffer(buffer);

        if (result.type === 'geotiff') {
            const image = await result.data.getImage();
            return { tiff: result.data, image };
        } else if (result.type === 'tiff') {
            throw new Error("Tiff.js fallback not fully implemented in geoprocessor internals yet.");
        }

        throw new Error("Unsupported TIFF format loaded.");
    }

    static async _toGeoTIFF(bands, width, height, options = {}) {
        await this._ensureLibraries();
        const GeoTIFF = geospatial.libraries.GeoTIFF;

        try {
            // Check if input is valid
            if (!width || !height) {
                console.error("Invalid dimensions for _toGeoTIFF:", { width, height });
                throw new Error("Width and height must be defined for GeoTIFF creation");
            }

            // 1. Try modern writeArrayBuffer (available in recent versions)
            // Ensure width/height are explicit numbers
            const w = Number(width);
            const h = Number(height);

            if (Number.isNaN(w) || Number.isNaN(h)) {
                console.error("Dimensions resulted in NaN:", { width, height, w, h });
                throw new Error("Invalid numeric dimensions for GeoTIFF");
            }

            if (GeoTIFF && typeof GeoTIFF.writeArrayBuffer === 'function') {
                // Determine format based on first band
                let sampleFormat = 3; // default Float
                let bitsPerSample = 32;

                if (bands[0] instanceof Uint8Array) {
                    sampleFormat = 1; // UInt
                    bitsPerSample = 8;
                } else if (bands[0] instanceof Int16Array) {
                    sampleFormat = 2; // Int
                    bitsPerSample = 16;
                } else if (bands[0] instanceof Int32Array) {
                    sampleFormat = 2; // Int
                    bitsPerSample = 32;
                } else if (bands[0] instanceof Float64Array) {
                    sampleFormat = 3; // Float
                    bitsPerSample = 64;
                }

                const metadata = {
                    width: w,
                    height: h,
                    ImageWidth: w,
                    ImageLength: h,
                    BitsPerSample: Array(bands.length).fill(bitsPerSample),
                    SampleFormat: Array(bands.length).fill(sampleFormat),
                    SamplesPerPixel: bands.length,
                    PlanarConfiguration: 1,
                    ...options // Merge additional GeoTIFF keys (ModelTiepoint, GeoKeyDirectory, etc.)
                };
                return await GeoTIFF.writeArrayBuffer(bands, metadata);
            }

            throw new Error("No GeoTIFF writing method available. GeoTIFF.writeArrayBuffer is required.");

            throw new Error("No GeoTIFF writing method available.");

        } catch (e) {
            console.warn("GeoTIFF write failed or not available. returning raw object for fallback.", e);
            // Fallback: return proper georaster-like object
            return this._toGeorasterObject(bands, width, height, options);
        }
    }

    static _toGeorasterObject(bands, width, height, options = {}) {
        // Calculate basic stats for fallback
        const mins = [], maxs = [], ranges = [];
        for (const band of bands) {
            let min = Infinity, max = -Infinity;
            let count = 0;
            let nanCount = 0;
            for (let i = 0; i < band.length; i++) {
                const v = band[i];
                if (Number.isNaN(v) || v === -9999) { // Handle NaN or NoData
                    nanCount++;
                    continue;
                }
                if (v < min) min = v;
                if (v > max) max = v;
                count++;
            }
            if (min === Infinity) {
                console.warn("Band appears to be all mean/NaN", { length: band.length, nanCount });
            }
            mins.push(min === Infinity ? 0 : min); // Safe default
            maxs.push(max === -Infinity ? 0 : max);
            ranges.push((max === -Infinity ? 0 : max) - (min === Infinity ? 0 : min));
        }

        // Derive bounds from options if available
        let xmin = 0, ymax = height, pixelWidth = 1, pixelHeight = 1;

        if (options.ModelTiepoint && options.ModelPixelScale) {
            // Tiepoint: [i, j, k, x, y, z] -> usually [0, 0, 0, xOrigin, yOrigin, 0]
            const tp = options.ModelTiepoint;
            const ps = options.ModelPixelScale;

            // Standard raster origin (top-left)
            xmin = tp[3];
            ymax = tp[4];
            pixelWidth = ps[0];
            pixelHeight = ps[1];
        }

        const xmax = xmin + (width * pixelWidth);
        const ymin = ymax - (height * pixelHeight);

        // Convert flat arrays to 2D arrays for map compatibility
        const values = bands.map(band => {
            const rows = [];
            for (let y = 0; y < height; y++) {
                // Slice is faster than loop
                const start = y * width;
                const end = start + width;
                rows.push(band.slice(start, end));
            }
            return rows;
        });

        return {
            width,
            height,
            values,
            numberOfRasters: bands.length,
            mins,
            maxs,
            ranges,
            pixelWidth,
            pixelHeight,
            xmin,
            xmax,
            ymin,
            ymax,
            projection: 4326, // Default assumption if not provided, but usually handled by map
            ...options
        };
    }




    // Centralized band derivative
    static _dx(arr, w, h, cell) {
        const out = new Float32Array(w * h);
        for (let y = 0; y < h; y++) {
            for (let x = 0; x < w; x++) {
                const c = y * w + x;
                const left = y * w + Math.max(0, x - 1);
                const right = y * w + Math.min(w - 1, x + 1);
                out[c] = (arr[right] - arr[left]) / (2 * cell);
            }
        }
        return out;
    }

    static _dy(arr, w, h, cell) {
        const out = new Float32Array(w * h);
        for (let y = 0; y < h; y++) {
            for (let x = 0; x < w; x++) {
                const c = y * w + x;
                const up = Math.max(0, y - 1) * w + x;
                const down = Math.min(h - 1, y + 1) * w + x;
                out[c] = (arr[down] - arr[up]) / (2 * cell);
            }
        }
        return out;
    }

    // ============================================================
    // Unified Dispatcher
    // ============================================================

    /**
     * Executes a raster operation based on params.
     * @param {Object} params - Action configuration.
     * @param {string} params.action - The name of the function to execute (e.g. 'slope', 'hillshade').
     * @param {Object} args - Arguments specific to the action.
     * @param {Array<Object>} data - Array of input data objects, each containing a `buffer` property (ArrayBuffer).
     * @returns {Promise<Object>} Result object { ok, result, ... }.
     * @example
     * await hydro.analyze.geoprocessor.execute({
     *   params: { action: 'slope' },
     *   args: { cellSize: 30 },
     *   data: [{ buffer: arrayBuffer }]
     * });
     */
    static async execute({ params = {}, args = {}, data = [] }) {
        const action = params.action;

        // Note: Removed unconditional _ensureLibraries() here to allow worker-compatible operations without DOM.
        // Specific functions that need libs will call it themselves.

        switch (action) {
            case "info": return this.info({ data });
            case "bandMath": return this.bandMath({ args, data });
            case "algebra": return this.algebra({ args, data });
            case "slope": return this.slope({ args, data });
            case "aspect": return this.aspect({ args, data });
            case "hillshade": return this.hillshade({ args, data });
            case "mask": return this.mask({ args, data });
            case "tile": return this.tile({ args, data });
            case "reproject": return this.reproject({ args, data });
            case "flowDirection": return this.flowDirection({ args, data });
            case "flowAccumulation": return this.flowAccumulation({ args, data });
            case "watershed": return this.watershed({ args, data });
            case "streamExtract": return this.streamExtract({ args, data });
            case "pca": return this.pca({ args, data });
            case "clipGeo": return this.clipGeo({ args, data });

            default:
                throw new Error(`Unknown action: ${action}`);
        }
    }

    // ============================================================
    // Raster Info
    // ============================================================

    /**
     * Extracts metadata from a GeoTIFF buffer.
     * @param {Object} options
     * @param {Array<Object>} options.data - Input data containing one object with { buffer: ArrayBuffer }.
     * @returns {Promise<Object>} Metadata object including width, height, bbox, origin, resolution, and native directory.
     * @example
     * await hydro.analyze.geoprocessor.info({
     *   data: [{ buffer: arrayBuffer }]
     * });
     */
    static async info({ data }) {
        await this._ensureLibraries(); // Needs libs to parse TIFF
        const buffer = data;
        const { image } = await this._openFromArrayBuffer(buffer);

        return {
            width: image.getWidth(),
            height: image.getHeight(),
            samples: image.getSamplesPerPixel(),
            bbox: image.getBoundingBox(),
            origin: image.getOrigin(),
            resolution: image.getResolution(),
            metadata: image.getFileDirectory()
        };
    }

    // ============================================================
    // Band Math
    // ============================================================

    /**
     * Performs mathematical expressions on raster bands.
     * @param {Object} options
     * @param {Object} options.args - Arguments.
     * @param {string} options.args.expr - Mathematical expression (e.g., "(nir-red)/(nir+red)").
     * @param {Object<string, number>} options.args.bands - Mapping of variable names to band indices (e.g., { red: 0, nir: 3 }).
     * @param {Array<Object>} options.data - Input data containing one object with { buffer: ArrayBuffer }.
     * @returns {Promise<Object>} Result containing the processed single-band GeoTIFF buffer.
     * @example
     * await hydro.analyze.geoprocessor.bandMath({
     *   args: { expr: "(nir - red) / (nir + red)", bands: { red: 0, nir: 3 } },
     *   data: [{ buffer: multispectralBuffer }]
     * });
     */
    static async bandMath({ args, data }) {
        /**
         * args:
         *   expr: "(nir-red)/(nir+red)"
         *   bands: { red:0, nir:3 }
         */

        await this._ensureLibraries(); // Needs internal parsing
        const buffer = data;
        const { image } = await this._openFromArrayBuffer(buffer);

        const width = image.getWidth(), height = image.getHeight();
        const bandIndices = Object.values(args.bands);

        const rasters = await image.readRasters({ samples: bandIndices });

        let context = {};
        let i = 0;
        for (const key in args.bands) {
            context[key] = rasters[i++];
        }

        const fn = new Function(...Object.keys(context), `return ${args.expr};`);
        const out = new Float32Array(width * height);

        for (let p = 0; p < out.length; p++) {
            const vals = Object.values(context).map(b => b[p]);
            out[p] = fn(...vals);
        }

        const resultBuffer = await this._toGeoTIFF([out], width, height);

        return resultBuffer;
    }

    // ============================================================
    // Raster Algebra (two rasters)
    // ============================================================

    /**
     * Performs arithmetic operations between two rasters.
     * @param {Object} options
     * @param {Object} options.args - Arguments.
     * @param {string} options.args.op - Operation to perform: "add", "sub", "mul", or "div".
     * @param {Array<Object>} options.data - Input data containing two objects with { buffer: ArrayBuffer }.
     * @returns {Promise<Object>} Result containing the processed single-band GeoTIFF buffer.
     * @example
     * await hydro.analyze.geoprocessor.algebra({
     *   args: { op: 'sub' },
     *   data: [{ buffer: bufferA }, { buffer: bufferB }]
     * });
     */
    static async algebra({ args, data }) {
        /**
         * args.op: "add" | "sub" | "mul" | "div"
         * data: [ {buffer A}, {buffer B} ]
         */

        const { image: img1 } = await this._openFromArrayBuffer(data[0]);
        const { image: img2 } = await this._openFromArrayBuffer(data[1]);

        const a = (await img1.readRasters({ samples: [0] }))[0];
        const b = (await img2.readRasters({ samples: [0] }))[0];

        const out = new Float32Array(a.length);
        const op = args.op;

        switch (op) {
            case "add": for (let i = 0; i < a.length; i++) out[i] = a[i] + b[i]; break;
            case "sub": for (let i = 0; i < a.length; i++) out[i] = a[i] - b[i]; break;
            case "mul": for (let i = 0; i < a.length; i++) out[i] = a[i] * b[i]; break;
            case "div": for (let i = 0; i < a.length; i++) out[i] = a[i] / b[i]; break;
            default: return { ok: false, error: `Invalid algebra op: ${op}` };
        }

        const w = img1.getWidth(), h = img1.getHeight();
        const buffer = await this._toGeoTIFF([out], w, h);
        return buffer;
    }

    // ============================================================
    // Terrain: Slope
    // ============================================================

    /**
     * Calculates the slope of a DEM in degrees.
     * @param {Object} options
     * @param {Object} options.args - Arguments.
     * @param {number} [options.args.cellSize] - Optional override for cell size. If not provided, extracted from resolution.
     * @param {Array<Object>} options.data - Input data containing a DEM { buffer: ArrayBuffer }.
     * @returns {Promise<Object>} Result containing slope raster.
     * @example
     * await hydro.analyze.geoprocessor.slope({
     *   args: { cellSize: 30 },
     *   data: [{ buffer: demBuffer }]
     * });
     */
    /**
     * Calculates Slope using GDAL.
     */
    static async slope({ args, data }) {
        try {
            // data is ArrayBuffer. Do NOT transfer it as it is reused.
            return await this._runWorker('slope', args, { buffer: data });
        } catch (e) { throw new Error(`GDAL Slope Error: ${e.message}`); }
    }

    /**
     * Calculates Aspect using GDAL.
     */
    static async aspect({ args, data }) {
        try {
            return await this._runWorker('aspect', args, { buffer: data });
        } catch (e) { throw new Error(`GDAL Aspect Error: ${e.message}`); }
    }

    /**
   * Calculate Terrain Ruggedness Index (TRI) using GDAL
   * Measures terrain heterogeneity - higher values = more rugged terrain
   * Useful for habitat modeling, geomorphology, and terrain classification
   * 
   * @function tri
   * @memberof geoprocessor
   * @async
   * @param {Object} options - Function options
   * @param {Object} [options.args] - Processing arguments
   * @param {ArrayBuffer} options.data - Input DEM as GeoTIFF ArrayBuffer
   * @returns {Promise<ArrayBuffer>} TRI raster as GeoTIFF
   * 
   * @example
   * // Calculate terrain ruggedness
   * const dem = await hydro.data.retrieve({
   *   params: { source: '3dep', datatype: 'DEM' },
   *   args: { bbox: [-105.5, 40.0, -105.0, 40.5] }
   * });
   * 
   * const tri = await hydro.analyze.geoprocessor.tri({ data: dem });
   * // Higher values indicate more rugged, complex terrain
   */
    static async tri({ args, data }) {
        try {
            return await this._runWorker('TRI', args, { buffer: data });
        } catch (e) { throw new Error(`GDAL TRI Error: ${e.message}`); }
    }

    /**
   * Calculate Topographic Position Index (TPI) using GDAL
   * Compares elevation of each cell to mean of surrounding cells
   * Positive=ridges/hilltops, Negative=valleys, Zero=flat/mid-slope
   * 
   * @function tpi
   * @memberof geoprocessor
   * @async
   * @param {Object} options - Function options
   * @param {Object} [options.args] - Processing arguments
   * @param {ArrayBuffer} options.data - Input DEM as GeoTIFF ArrayBuffer
   * @returns {Promise<ArrayBuffer>} TPI raster as GeoTIFF
   * 
   * @example
   * // Identify ridges and valleys
   * const tpi = await hydro.analyze.geoprocessor.tpi({ data: demBuffer });
   * // Positive values = ridges, negative = valleys
   * // Use for landform classification
   */
    static async tpi({ args, data }) {
        try {
            return await this._runWorker('TPI', args, { buffer: data });
        } catch (e) { throw new Error(`GDAL TPI Error: ${e.message}`); }
    }

    /**
   * Calculate terrain roughness using GDAL
   * Measures difference between max and min elevation in neighborhood
   * Indicates vertical terrain variation
   * 
   * @function roughness
   * @memberof geoprocessor
   * @async
   * @param {Object} options - Function options
   * @param {Object} [options.args] - Processing arguments
   * @param {ArrayBuffer} options.data - Input DEM as GeoTIFF ArrayBuffer
   * @returns {Promise<ArrayBuffer>} Roughness raster as GeoTIFF
   * 
   * @example
   * // Calculate surface roughness
   * const roughness = await hydro.analyze.geoprocessor.roughness({ data: demBuffer });
   * // High values = very rough surface (cliffs, rock outcrops)
   * // Low values = smooth surface (plains, gentle slopes)
   */
    static async roughness({ args, data }) {
        try {
            return await this._runWorker('roughness', args, { buffer: data });
        } catch (e) { throw new Error(`GDAL Roughness Error: ${e.message}`); }
    }

    // ============================================================
    // Terrain: Hillshade
    // ============================================================

    /**
     * Generates a hillshade map from a DEM.
     * @param {Object} options
     * @param {Object} options.args - Arguments.
     * @param {number} [options.args.azimuth=315] - Light source azimuth in degrees.
     * @param {number} [options.args.altitude=45] - Light source altitude in degrees.
     * @param {number} [options.args.cellSize] - Optional override for cell size.
     * @param {Array<Object>} options.data - Input data containing a DEM { buffer: ArrayBuffer }.
     * @returns {Promise<Object>} Result containing hillshade raster (0-255).
     * @example
     * await hydro.analyze.geoprocessor.hillshade({
     *   args: { azimuth: 315, altitude: 45 },
     *   data: [{ buffer: demBuffer }]
     * });
     */
    // ============================================================
    // GDAL WASM Analysis Functions (Hillshade, Slope, Aspect)
    // ============================================================
    // GDAL WASM Analysis Functions
    // ============================================================

    /**
     * Helper to initialize GDAL and open a source dataset.
     * Reduces code duplication.
     */
    static async _openGDALSource(data) {
        await this._ensureLibraries();
        let loamClient = (typeof geospatial !== 'undefined' && geospatial.libraries && geospatial.libraries.loam) ? geospatial.libraries.loam : (self.geospatial ? self.geospatial.libraries?.loam : window.hydro?.analyze?.geospatial?.libraries?.loam);
        if (!loamClient) throw new Error("GDAL WASM (loam) client not found. Ensure libraries are initialized.");

        const buffer = (data instanceof ArrayBuffer) ? data : (data.buffer instanceof ArrayBuffer ? data.buffer : (Array.isArray(data) && data[0]?.buffer ? data[0].buffer : null));
        if (!buffer) throw new Error("Invalid input data. Expected ArrayBuffer or GeoTIFF object.");

        return await loamClient.open(new Uint8Array(buffer));
    }

    /**
     * Calculates Hillshade using GDAL.
     * @param {Object} options
     * @param {Object} options.args - Arguments.
     * @param {number} [options.args.zFactor=1] - Vertical exaggeration.
     * @param {number} [options.args.scale=1] - Ratio of vertical units to horizontal.
     * @param {number} [options.args.azimuth=315] - Azimuth of the light (degrees).
     * @param {number} [options.args.altitude=45] - Altitude of the light (degrees).
     * @param {Array<Object>} options.data - Input data containing a DEM { buffer: ArrayBuffer }.
     * @returns {Promise<ArrayBuffer>} Hillshade raster buffer.
     */
    static async hillshade({ args, data }) {
        try {
            return await this._runWorker('hillshade', args, { buffer: data });
        } catch (e) { throw new Error(`GDAL Hillshade Error: ${e.message}`); }
    }

    /**
     * Clips a GeoTIFF to the specified bounding box using GDAL WASM (GDALTranslate).
     * @param {Object} options
     * @param {Object} options.args - Arguments.
     * @param {Array<number>} options.args.bounds - Bounding box [minX, minY, maxX, maxY].
     * @param {Array<Object>|ArrayBuffer} options.data - Input data (ArrayBuffer of GeoTIFF).
     * @returns {Promise<ArrayBuffer>} Clipped GeoTIFF buffer.
     */
    static async clipGeo({ args, data }) {
        try {
            return await this._runWorker('clipGeo', args, { buffer: data });
        } catch (e) { throw new Error(`GDAL Clip Error: ${e.message}`); }
    }

    // ============================================================
    // Mask by elevation threshold
    // ============================================================

    /**
     * Creates a binary mask based on min/max threshold values.
     * @param {Object} options
     * @param {Object} options.args - Arguments.
     * @param {number} [options.args.min=-Infinity] - Minimum value (inclusive).
     * @param {number} [options.args.max=Infinity] - Maximum value (inclusive).
     * @param {Array<Object>} options.data - Input data containing one object with { buffer: ArrayBuffer }.
     * @returns {Promise<Object>} Result containing binary mask (0 or 1).
     * @example
     * await hydro.analyze.geoprocessor.mask({
     *   args: { min: 0, max: 1000 },
     *   data: [{ buffer: demBuffer }]
     * });
     */
    static async mask({ args, data }) {
        const buffer = data;
        const { image } = await this._openFromArrayBuffer(buffer);

        const dem = (await image.readRasters({ samples: [0] }))[0];
        const out = new Float32Array(dem.length);

        const min = args.min ?? -Infinity;
        const max = args.max ?? Infinity;

        for (let i = 0; i < out.length; i++) {
            out[i] = (dem[i] >= min && dem[i] <= max) ? 1 : 0;
        }

        return await this._toGeoTIFF([out], image.getWidth(), image.getHeight());
    }

    // ============================================================
    // Tiling
    // ============================================================

    /**
     * Splits a raster into smaller tiles.
     * @param {Object} options
     * @param {Object} options.args - Arguments.
     * @param {number} [options.args.tileSize=256] - Width/Height of tiles in pixels.
     * @param {Array<Object>} options.data - Input data containing one object with { buffer: ArrayBuffer }.
     * @returns {Promise<Object>} Result containing array of tile objects.
     * @example
     * await hydro.analyze.geoprocessor.tile({
     *   args: { tileSize: 512 },
     *   data: [{ buffer: largeRasterBuffer }]
     * });
     */
    static async tile({ args, data }) {
        const buffer = data;
        const tileSize = args.tileSize || 256;

        const { image } = await this._openFromArrayBuffer(buffer);
        const width = image.getWidth();
        const height = image.getHeight();

        const tiles = [];

        for (let y = 0; y < height; y += tileSize) {
            for (let x = 0; x < width; x += tileSize) {
                const w = Math.min(tileSize, width - x);
                const h = Math.min(tileSize, height - y);

                const dataTile = await image.readRasters({
                    window: [x, y, x + w, y + h]
                });

                tiles.push({
                    x, y, width: w, height: h,
                    data: dataTile
                });
            }
        }

        return tiles;
    }

    // ============================================================
    // HYDROLOGY
    // ============================================================

    /**
     * Calculates flow direction using the D8 algorithm.
     * @param {Object} options
     * @param {Array<Object>} options.data - Input data containing a DEM { buffer: ArrayBuffer }.
     * @returns {Promise<Object>} Result containing flow direction raster (D8 codes: 1,2,4,8,16,32,64,128).
     * @example
     * await hydro.analyze.geoprocessor.flowDirection({
     *   data: [{ buffer: demBuffer }]
     * });
     */
    /**
     * Calculate flow direction from DEM using D8 algorithm
     * Determines direction of steepest descent for each cell
     * Essential for watershed delineation and stream network extraction
     * 
     * @function flowDirection
     * @memberof geoprocessor
     * @async
     * @param {Object} options - Function options
     * @param {Object} [options.args] - Processing arguments
     * @param {ArrayBuffer} options.data - Input DEM as GeoTIFF ArrayBuffer
     * @returns {Promise<ArrayBuffer>} Flow direction raster (values 1-128) as GeoTIFF
     * 
     * @example
     * // Calculate flow direction from DEM
     * const dem = await hydro.data.retrieve({
     *   params: { source: '3dep', datatype: 'DEM' },
     *   args: { bbox: [-105.5, 40.0, -105.0, 40.5] }
     * });
     * 
     * const flowDir = await hydro.analyze.geoprocessor.flowDirection({ data: dem });
     * // Direction values: 1=E, 2=SE, 4=S, 8=SW, 16=W, 32=NW, 64=N, 128=NE
     * 
     * @example
     * // Complete watershed workflow
     * const flowDir = await hydro.analyze.geoprocessor.flowDirection({ data: dem });
     * const flowAcc = await hydro.analyze.geoprocessor.flowAccumulation({ data: flowDir });
     * const streams = await hydro.analyze.geoprocessor.streamExtract({ 
     *   args: { threshold: 1000 }, 
     *   data: flowAcc 
     * });
     */
    static async flowDirection({ args, data }) {
        const buffer = data;
        const { image } = await this._openFromArrayBuffer(buffer);

        const w = image.getWidth();
        const h = image.getHeight();
        const dem = (await image.readRasters({ samples: [0] }))[0];

        const out = await this._runWorker('flowDirection', args, { dem, width: w, height: h });

        // Encode result back to GeoTIFF (Preserve Metadata)
        const fileDirectory = image.getFileDirectory ? image.getFileDirectory() : {};
        const geoKeys = {
            ModelTiepoint: fileDirectory.ModelTiepoint,
            ModelPixelScale: fileDirectory.ModelPixelScale,
            ModelTransformation: fileDirectory.ModelTransformation,
            GeoKeyDirectory: fileDirectory.GeoKeyDirectory,
            GeoAsciiParams: fileDirectory.GeoAsciiParams,
            GTModelTypeGeoKey: image.getGeoKeys ? image.getGeoKeys().GTModelTypeGeoKey : undefined,
            GTRasterTypeGeoKey: image.getGeoKeys ? image.getGeoKeys().GTRasterTypeGeoKey : undefined,
            GeographicTypeGeoKey: image.getGeoKeys ? image.getGeoKeys().GeographicTypeGeoKey : undefined,
            ProjectedCSTypeGeoKey: image.getGeoKeys ? image.getGeoKeys().ProjectedCSTypeGeoKey : undefined
        };
        const options = {};
        for (const k in geoKeys) if (geoKeys[k] !== undefined) options[k] = geoKeys[k];

        return await this._toGeoTIFF([out], w, h, options);
    }

    /**
     * Calculates flow accumulation based on flow direction.
     * @param {Object} options
     * @param {Array<Object>} options.data - Input data containing a DEM { buffer: ArrayBuffer }. Note: Calculates flow direction internally.
     * @returns {Promise<Object>} Result containing flow accumulation raster.
     * @example
     * await hydro.analyze.geoprocessor.flowAccumulation({
     *   data: [{ buffer: demBuffer }]
     * });
     */
    /**
     * Calculate flow accumulation from flow direction raster
     * Counts upstream cells flowing into each cell
     * Higher values indicate stream channels and drainage paths
     * 
     * @function flowAccumulation
     * @memberof geoprocessor
     * @async
     * @param {Object} options - Function options
     * @param {Object} [options.args] - Processing arguments  
     * @param {ArrayBuffer} options.data - Flow direction raster as GeoTIFF ArrayBuffer
     * @returns {Promise<ArrayBuffer>} Flow accumulation raster as GeoTIFF
     * 
     * @example
     * // Calculate flow accumulation
     * const flowDir = await hydro.analyze.geoprocessor.flowDirection({ data: demBuffer });
     * const flowAcc = await hydro.analyze.geoprocessor.flowAccumulation({ data: flowDir });
     * // High values (>1000) indicate likely stream channels
     * 
     * @example
     * // Extract stream network from flow accumulation
     * const flowAcc = await hydro.analyze.geoprocessor.flowAccumulation({ data: flowDir });
     * const streams = await hydro.analyze.geoprocessor.streamExtract({
     *   args: { threshold: 500 },  // Cells with >500 upstream cells
     *   data: flowAcc
     * });
     */
    static async flowAccumulation({ args, data }) {
        const buffer = data;

        // 1. Decode main thread (get raw floats)
        const { image } = await this._openFromArrayBuffer(buffer);
        const w = image.getWidth();
        const h = image.getHeight();
        const dem = (await image.readRasters({ samples: [0] }))[0];

        // 2. Send to Worker
        // Note: We copy dem to avoid detaching if we need it later, or transfer if we don't.
        // We do NOT transfer 'dem.buffer' because 'dem' might be a view on a larger buffer that we don't want to lose
        // or we might want to use it again.
        const acc = await this._runWorker('flowAccumulation', args, { dem, width: w, height: h });

        // 3. Encode result back to GeoTIFF (Preserve Metadata)
        const fileDirectory = image.getFileDirectory ? image.getFileDirectory() : {};

        // Extract relevant GeoKeys to preserve geolocation
        const geoKeys = {
            ModelTiepoint: fileDirectory.ModelTiepoint,
            ModelPixelScale: fileDirectory.ModelPixelScale,
            ModelTransformation: fileDirectory.ModelTransformation,
            GeoKeyDirectory: fileDirectory.GeoKeyDirectory,
            GeoAsciiParams: fileDirectory.GeoAsciiParams,
            GTModelTypeGeoKey: image.getGeoKeys ? image.getGeoKeys().GTModelTypeGeoKey : undefined,
            GTRasterTypeGeoKey: image.getGeoKeys ? image.getGeoKeys().GTRasterTypeGeoKey : undefined,
            GeographicTypeGeoKey: image.getGeoKeys ? image.getGeoKeys().GeographicTypeGeoKey : undefined,
            ProjectedCSTypeGeoKey: image.getGeoKeys ? image.getGeoKeys().ProjectedCSTypeGeoKey : undefined
        };

        // Filter undefined keys
        const options = {};
        for (const k in geoKeys) {
            if (geoKeys[k] !== undefined) options[k] = geoKeys[k];
        }

        return await this._toGeoTIFF([acc], w, h, options);
    }

    /**
     * Delineates a watershed basin from a pour point.
     * @param {Object} options
     * @param {Object} options.args - Arguments.
     * @param {Object} options.args.pourPoint - The outlet point { x, y } in pixel coordinates.
     * @param {number} options.args.pourPoint.x - X pixel coordinate.
     * @param {number} options.args.pourPoint.y - Y pixel coordinate.
     * @param {Array<Object>} options.data - Input data containing a DEM { buffer: ArrayBuffer }.
     * @returns {Promise<Object>} Result containing binary watershed mask.
     * @example
     * await hydro.analyze.geoprocessor.watershed({
     *   args: { pourPoint: { x: 100, y: 150 } },
     *   data: [{ buffer: demBuffer }]
     * });
     */
    /**
     * Delineate watershed boundary from pour point
     * Identifies all cells that drain to specified outlet location
     * Critical for catchment analysis and hydrologic modeling
     * 
     * @function watershed
     * @memberof geoprocessor
     * @async
     * @param {Object} options - Function options
     * @param {Object} options.args - Processing arguments
     * @param {Array<number>} options.args.pourPoint - [longitude, latitude] of outlet
     * @param {ArrayBuffer} options.data - Flow direction raster as GeoTIFF ArrayBuffer
     * @returns {Promise<ArrayBuffer>} Watershed boundary raster as GeoTIFF
     * 
     * @example
     * // Delineate watershed for stream gauge location
     * const flowDir = await hydro.analyze.geoprocessor.flowDirection({ data: dem });
     * const watershed = await hydro.analyze.geoprocessor.watershed({
     *   args: { pourPoint: [-105.25, 40.25] },  // Gauge location
     *   data: flowDir
     * });
     * 
     * @example
     * // Complete watershed analysis workflow
     * const dem = await hydro.data.retrieve({
     *   params: { source: '3dep', datatype: 'DEM' },
     *   args: { bbox: [-105.5, 40.0, -105.0, 40.5] }
     * });
     * 
     * const flowDir = await hydro.analyze.geoprocessor.flowDirection({ data: dem });
     * const watershed = await hydro.analyze.geoprocessor.watershed({
     *   args: { pourPoint: [-105.25, 40.25] },
     *   data: flowDir
     * });
     * 
     * // Visualize watershed boundary
     * const map = hydro.map.renderMap({ params: { lat: 40.25, lon: -105.25, zoom: 11 } });
     * hydro.map.Layers({ params: { data: watershed, type: 'georaster' } });
     */
    static async watershed({ args, data }) {
        const buffer = data;
        const { image } = await this._openFromArrayBuffer(buffer);

        const w = image.getWidth();
        const h = image.getHeight();
        const dem = (await image.readRasters({ samples: [0] }))[0];

        // Worker implements logic (computing flow acc internally)
        const mask = await this._runWorker('watershed', args, { dem, width: w, height: h });

        // Encode result back to GeoTIFF (Preserve Metadata)
        const fileDirectory = image.getFileDirectory ? image.getFileDirectory() : {};
        const geoKeys = {
            ModelTiepoint: fileDirectory.ModelTiepoint,
            ModelPixelScale: fileDirectory.ModelPixelScale,
            ModelTransformation: fileDirectory.ModelTransformation,
            GeoKeyDirectory: fileDirectory.GeoKeyDirectory,
            GeoAsciiParams: fileDirectory.GeoAsciiParams,
            GTModelTypeGeoKey: image.getGeoKeys ? image.getGeoKeys().GTModelTypeGeoKey : undefined,
            GTRasterTypeGeoKey: image.getGeoKeys ? image.getGeoKeys().GTRasterTypeGeoKey : undefined,
            GeographicTypeGeoKey: image.getGeoKeys ? image.getGeoKeys().GeographicTypeGeoKey : undefined,
            ProjectedCSTypeGeoKey: image.getGeoKeys ? image.getGeoKeys().ProjectedCSTypeGeoKey : undefined
        };
        const options = {};
        for (const k in geoKeys) if (geoKeys[k] !== undefined) options[k] = geoKeys[k];

        return await this._toGeoTIFF([mask], w, h, options);
    }

    /**
     * Extracts stream networks based on flow accumulation threshold.
     * @param {Object} options
     * @param {Object} options.args - Arguments.
     * @param {number} [options.args.threshold=1000] - Accumulation threshold to define a stream.
     * @param {Array<Object>} options.data - Input data containing a DEM { buffer: ArrayBuffer }.
     * @returns {Promise<Object>} Result containing binary stream mask.
     * @example
     * await hydro.analyze.geoprocessor.streamExtract({
     *   args: { threshold: 500 },
     *   data: [{ buffer: demBuffer }]
     * });
     */
    static async streamExtract({ args, data }) {
        const buffer = data;
        const { image } = await this._openFromArrayBuffer(buffer);

        const w = image.getWidth();
        const h = image.getHeight();
        const dem = (await image.readRasters({ samples: [0] }))[0];

        const out = await this._runWorker('streamExtract', args, { dem, width: w, height: h });

        // Encode result back to GeoTIFF (Preserve Metadata)
        const fileDirectory = image.getFileDirectory ? image.getFileDirectory() : {};
        const geoKeys = {
            ModelTiepoint: fileDirectory.ModelTiepoint,
            ModelPixelScale: fileDirectory.ModelPixelScale,
            ModelTransformation: fileDirectory.ModelTransformation,
            GeoKeyDirectory: fileDirectory.GeoKeyDirectory,
            GeoAsciiParams: fileDirectory.GeoAsciiParams,
            GTModelTypeGeoKey: image.getGeoKeys ? image.getGeoKeys().GTModelTypeGeoKey : undefined,
            GTRasterTypeGeoKey: image.getGeoKeys ? image.getGeoKeys().GTRasterTypeGeoKey : undefined,
            GeographicTypeGeoKey: image.getGeoKeys ? image.getGeoKeys().GeographicTypeGeoKey : undefined,
            ProjectedCSTypeGeoKey: image.getGeoKeys ? image.getGeoKeys().ProjectedCSTypeGeoKey : undefined
        };
        const options = {};
        for (const k in geoKeys) if (geoKeys[k] !== undefined) options[k] = geoKeys[k];

        return await this._toGeoTIFF([out], w, h, options);
    }

    /**
     * Fills sinks in a DEM (Priority-Flood).
     * @param {Object} params - { args: {}, data: ArrayBuffer }
     * @returns {Promise<ArrayBuffer>} Filled DEM GeoTIFF.
     */
    static async fillSinks({ args, data }) {
        const buffer = data;
        const { image } = await this._openFromArrayBuffer(buffer);

        const w = image.getWidth();
        const h = image.getHeight();
        const dem = (await image.readRasters({ samples: [0] }))[0];

        // Sanity Check Input DEM
        let valid = 0, inputNan = 0;
        for (let i = 0; i < dem.length; i++) {
            if (!Number.isNaN(dem[i])) valid++; else inputNan++;
        }
        console.log(`fillSinks Input DEM Stats: Size=${dem.length}, Valid=${valid}, NaN=${inputNan}`);

        const filled = await this._runWorker('fillSinks', args, { dem, width: w, height: h });

        // Encode result back to GeoTIFF (Preserve Metadata)
        const fileDirectory = image.getFileDirectory ? image.getFileDirectory() : {};
        const geoKeys = {
            ModelTiepoint: fileDirectory.ModelTiepoint,
            ModelPixelScale: fileDirectory.ModelPixelScale,
            ModelTransformation: fileDirectory.ModelTransformation,
            GeoKeyDirectory: fileDirectory.GeoKeyDirectory,
            GeoAsciiParams: fileDirectory.GeoAsciiParams,
            GTModelTypeGeoKey: image.getGeoKeys ? image.getGeoKeys().GTModelTypeGeoKey : undefined,
            GTRasterTypeGeoKey: image.getGeoKeys ? image.getGeoKeys().GTRasterTypeGeoKey : undefined,
            GeographicTypeGeoKey: image.getGeoKeys ? image.getGeoKeys().GeographicTypeGeoKey : undefined,
            ProjectedCSTypeGeoKey: image.getGeoKeys ? image.getGeoKeys().ProjectedCSTypeGeoKey : undefined
        };
        const options = {};
        for (const k in geoKeys) if (geoKeys[k] !== undefined) options[k] = geoKeys[k];

        return await this._toGeoTIFF([filled], w, h, options);
    }



    // ============================================================
    // VECTORIZATION (Raster -> GeoJSON)
    // ============================================================

    /**
     * Vectorizes a binary raster mask into GeoJSON Polygons.
     * @param {Object} options
     * @param {Object} [options.args={}] - Arguments.
     * @param {Array<Object>} options.data - Input data containing a DEM/Mask { buffer: ArrayBuffer }.
     * @returns {Promise<Object>} Resulting GeoJSON FeatureCollection.
     * @example
     * const geojson = await hydro.analyze.geoprocessor.vectorize({
     *   data: [{ buffer: maskBuffer }]
     * });
     */
    static async vectorize({ args = {}, data }) {
        const buffer = data;
        const { image } = await this._openFromArrayBuffer(buffer);

        const w = image.getWidth();
        const h = image.getHeight();
        const dem = (await image.readRasters({ samples: [0] }))[0];

        const origin = image.getOrigin();
        const resolution = image.getResolution();

        const gt = [origin[0], resolution[0], 0, origin[1], 0, -Math.abs(resolution[1])];

        const workerArgs = { ...args, geotransform: gt };

        const geojson = await this._runWorker('vectorize', workerArgs, { dem, width: w, height: h });
        return geojson;
    }

    /**
     * Map a function over every pixel in a raster.
     * @param {Object} options
     * @param {Object} options.args - Arguments.
     * @param {Function|string} options.args.func - Function(val, x, y) or string body.
     * @param {Array<Object>} options.data - Input data { buffer: ArrayBuffer }.
     * @returns {Promise<Float32Array>} Raw raster data (Float32Array).
     */
    static async mapPixels({ args = {}, data }) {
        const buffer = data;
        const { image } = await this._openFromArrayBuffer(buffer);
        const w = image.getWidth();
        const h = image.getHeight();
        const dem = (await image.readRasters({ samples: [0] }))[0];

        // Serialize function
        let funcStr = args.func;
        if (typeof funcStr === 'function') {
            // We need the body.
            // If user passes `val => val + 1`, toString is `val => val + 1`.
            // If user passes `function(val) { return val + 1; }`, toString is full source.

            // Inside worker, we do: new Function('val', 'x', 'y', args.func)
            // If args.func is "val => val + 1", then new Function created is:
            // function(val, x, y) { val => val + 1 } -> This is VALID syntax (expression statement), but DOES NOT RETURN anything!

            // WE MUST WRAP IT if it looks like an arrow function or ensure access to return.
            // Better strategy: Use "return (" + func.toString() + ")(val, x, y);"
            // This immediately invokes the passed function string with the arguments.

            funcStr = "return (" + funcStr.toString() + ")(val, x, y);";
        }

        const workerArgs = { ...args, func: funcStr };
        const result = await this._runWorker('calculate', workerArgs, { dem, width: w, height: h });

        // Return raw array or re-wrap in GeoTIFF?
        // User asked "apply a function... value at a pixel". 
        // Returning raw Float32Array is most flexible for next steps (like statistics).
        // Wrapping in GeoTIFF is expensive.
        // Let's return the Raw Array (Float32Array).
        return result;
    }


    // ============================================================
    // PCA (MULTIBAND)
    // ============================================================

    /**
     * Performs Principal Component Analysis (PCA) on multiband rasters.
     * @param {Object} options
     * @param {Object} options.args - Arguments.
     * @param {number} [options.args.components] - Number of PCA components to keep. Defaults to all bands.
     * @param {Array<Object>} options.data - Input data containing a multiband raster { buffer: ArrayBuffer }.
     * @returns {Promise<Object>} Result containing multi-band GeoTIFF with principal components.
     * @example
     * await hydro.analyze.geoprocessor.pca({
     *   args: { components: 3 },
     *   data: [{ buffer: multibandBuffer }]
     * });
     */
    static async pca({ args, data }) {
        /**
         */

        const buffer = data[0];
        const { image } = await this._openFromArrayBuffer(buffer);

        const w = image.getWidth(), h = image.getHeight();
        const bandCount = image.getSamplesPerPixel();
        const pxCount = w * h;

        const bands = await image.readRasters();

        // Mean-center bands
        const means = [];
        for (let b = 0; b < bandCount; b++) {
            let sum = 0;
            for (let i = 0; i < pxCount; i++) sum += bands[b][i];
            means[b] = sum / pxCount;

            for (let i = 0; i < pxCount; i++) bands[b][i] -= means[b];
        }

        // Covariance matrix
        const cov = Array.from({ length: bandCount }, () => Array(bandCount).fill(0));

        for (let i = 0; i < bandCount; i++) {
            for (let j = i; j < bandCount; j++) {
                let sum = 0;
                for (let p = 0; p < pxCount; p++)
                    sum += bands[i][p] * bands[j][p];

                cov[i][j] = cov[j][i] = sum / (pxCount - 1);
            }
        }

        // Eigen decomposition (Jacobi)
        const { eigenvalues, eigenvectors } = this._jacobiEigen(cov);

        // Sort eigenvalues descending
        const idx = eigenvalues.map((v, i) => ({ v, i }))
            .sort((a, b) => b.v - a.v)
            .map(x => x.i);

        const comp = args.components || bandCount;

        // Project data into PCA space
        const outputs = [];
        for (let c = 0; c < comp; c++) {
            const pcIndex = idx[c];
            const eigVec = eigenvectors[pcIndex];

            const out = new Float32Array(pxCount);

            for (let p = 0; p < pxCount; p++) {
                let v = 0;
                for (let b = 0; b < bandCount; b++) v += bands[b][p] * eigVec[b];
                out[p] = v;
            }

            outputs.push(out);
        }

        return await this._toGeoTIFF(outputs, w, h);
    }


    // ===== Jacobi Eigen decomposition =====
    static _jacobiEigen(A) {
        const n = A.length;
        const V = Array.from({ length: n }, () => Array(n).fill(0));
        const D = A.map(row => row.slice());

        for (let i = 0; i < n; i++) V[i][i] = 1;

        const EPS = 1e-10;
        let changed = true;

        while (changed) {
            changed = false;

            for (let p = 0; p < n; p++) {
                for (let q = p + 1; q < n; q++) {
                    if (Math.abs(D[p][q]) < EPS) continue;

                    const phi = 0.5 * Math.atan2(2 * D[p][q], D[q][q] - D[p][p]);
                    const c = Math.cos(phi), s = Math.sin(phi);

                    // rotate D
                    const dpp = c * c * D[p][p] - 2 * s * c * D[p][q] + s * s * D[q][q];
                    const dqq = s * s * D[p][p] + 2 * s * c * D[p][q] + c * c * D[q][q];
                    D[p][p] = dpp;
                    D[q][q] = dqq;
                    D[p][q] = D[q][p] = 0;

                    for (let r = 0; r < n; r++) {
                        if (r === p || r === q) continue;

                        const drp = c * D[r][p] - s * D[r][q];
                        const drq = s * D[r][p] + c * D[r][q];

                        D[r][p] = D[p][r] = drp;
                        D[r][q] = D[q][r] = drq;
                    }

                    // rotate V
                    for (let r = 0; r < n; r++) {
                        const vrp = c * V[r][p] - s * V[r][q];
                        const vrq = s * V[r][p] + c * V[r][q];
                        V[r][p] = vrp;
                        V[r][q] = vrq;
                    }

                    changed = true;
                }
            }
        }

        return {
            eigenvalues: D.map((row, i) => row[i]),
            eigenvectors: V
        };
    }

    /**
     * Clips a raster to a pixel-based window.
     * @param {Object} options
     * @param {Object} options.args - Arguments.
     * @param {Array<number>} options.args.window - Clipping window `[startX, startY, endX, endY]`.
     * @param {Array<Object>} options.data - Input data containing one object with { buffer: ArrayBuffer }.
     * @returns {Promise<Object>} Result containing clipped GeoTIFF buffer.
     */
    static async clip({ args, data }) {
        const buffer = data;
        const { image } = await this._openFromArrayBuffer(buffer);

        const [minX, minY, maxX, maxY] = args.window;
        const width = maxX - minX;
        const height = maxY - minY;

        const bands = await image.readRasters({
            window: [minX, minY, maxX, maxY]
        });

        // Flatten if readRasters returns nested arrays (it usually returns TypedArrays for each band, 
        // but if it's our fallback object, it might be different. Let's assume standard behavior first)
        const flatBands = [];
        for (let i = 0; i < bands.length; i++) {
            flatBands.push(bands[i]);
        }

        return await this._toGeoTIFF(flatBands, width, height);
    }

    // [DEPRECATED] Old JS-based clip removed in favor of GDAL WASM version (see above).
    // static async clipGeo({ args, data }) {
    //     /**
    //      * args:
    //      *   bounds: [minLon, minLat, maxLon, maxLat]
    //      */

    //     const buffer = data;
    //     const { image } = await this._openFromArrayBuffer(buffer);

    //     const [ox, oy] = image.getOrigin();
    //     const [rx, ry] = image.getResolution();

    //     const [minLon, minLat, maxLon, maxLat] = args.bounds;

    //     const startX = Math.floor((minLon - ox) / rx);
    //     const endX = Math.ceil((maxLon - ox) / rx);

    //     const startY = Math.floor((oy - maxLat) / Math.abs(ry));
    //     const endY = Math.ceil((oy - minLat) / Math.abs(ry));

    //     return this.clip({
    //         args: { window: [startX, startY, endX, endY] },
    //         data
    //     });
    // }



    // ============================================================
    // REPROJECTION (proj4.js)
    // ============================================================

    /**
     * Reprojects a raster to a different Coordinate Reference System (CRS).
     * @param {Object} options
     * @param {Object} options.args - Arguments.
     * @param {string} options.args.dstCRS - Destination CRS definition (WKT or Proj4 string).
     * @param {string} [options.args.srcCRS] - Source CRS definition. If not provided, attempts to read from GeoTIFF keys.
     * @param {number} [options.args.width] - Output width.
     * @param {number} [options.args.height] - Output height.
     * @param {string} [options.args.method='nearest'] - Resampling method ('nearest', 'bilinear').
     * @param {Array<Object>} options.data - Input data containing one object with { buffer: ArrayBuffer }.
     * @returns {Promise<Object>} Result containing reprojected GeoTIFF buffer.
     * @example
     * await hydro.analyze.geoprocessor.reproject({
     *   args: { dstCRS: 'EPSG:3857' },
     *   data: [{ buffer: bufferIn4326 }]
     * });
     */
    static async reproject({ args, data }) {
        try {
            // Pass buffer to worker
            return await this._runWorker('reproject', args, { buffer: data });
        } catch (e) {
            console.error("Worker Reprojection Failed:", e);
            throw new Error(`Worker Reprojection Error: ${e.message}`);
        }
    }
}
