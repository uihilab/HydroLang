/**
 * Geoprocessor Worker
 * Handles heavy lifting for geospatial operations (GDAL + Hydrology) in a separate thread.
 */

// ==========================================
// 1. Worker-Compatible Loam Client
// ==========================================
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
                    // Resolve absolute path relative to *this* worker's location
                    const absolutePath = new URL(pathPrefix, self.location.href).href;
                    // console.log('Geoprocessor Worker: Spawning Loam Worker from', absolutePath + 'loam-worker.js');

                    worker = new Worker(absolutePath + 'loam-worker.js');

                    worker.onmessage = function (e) {
                        const data = e.data;
                        if (data.ready) {
                            console.log("Loam Worker Ready (Nested)");
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

        open: async function (fileIn) {
            // fileIn is { name, data: Uint8Array } from main thread

            // Pass object with name and data to trigger GDALOpen wrapper's blob mounting path
            const src = {
                name: fileIn.name || 'data.tif',
                data: fileIn.data // Uint8Array
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

// ==========================================
// 2. Main Logic
// ==========================================

let isInitialized = false;

// Relative path to loam folder from this worker
// Source: hydrolang/modules/analyze/components/utils/geoprocessor.worker.js -> ../../../../external/gridded-data/geospatial/loam/
// Dist: utils/geoprocessor.worker.js -> ../hydrolang/external/gridded-data/geospatial/loam/
const href = self.location.href;
let LOAM_PATH;

if (href.includes('/components/utils/')) {
    // Source
    LOAM_PATH = '../../../../external/gridded-data/geospatial/loam/';
} else if (href.includes('/utils/')) {
    // Dist (in utils folder - manual copy)
    LOAM_PATH = '../hydrolang/external/gridded-data/geospatial/loam/';
} else {
    // Dist (root, bundled)
    // Relative to dist/hash.js -> dist/hydrolang/external... 
    LOAM_PATH = './hydrolang/external/gridded-data/geospatial/loam/';
}

async function initialize() {
    if (isInitialized) return;
    await Loam.initialize(LOAM_PATH);
    isInitialized = true;
}

self.onmessage = async (e) => {
    const { id, action, args, data } = e.data;

    try {
        await initialize();

        let result;

        switch (action) {
            // --- GDAL Operations ---
            case 'slope':
            case 'aspect':
            case 'hillshade':
            case 'TRI':
            case 'TPI':
            case 'roughness':
                result = await runGdalDem(action, args, data);
                break;

            case 'clipGeo':
                result = await runGdalClip(args, data);
                break;

            case 'reproject':
                result = await runGdalReproject(args, data);
                break;

            // --- JS Hydrology Operations (Offloaded) ---
            case 'flowAccumulation':
                result = await runFlowAccumulation(args, data);
                break;

            case 'flowDirection':
                result = await runFlowDirection(args, data);
                break;

            case 'watershed':
                result = await runWatershed(args, data);
                break;

            case 'streamExtract':
                result = await runStreamExtract(args, data);
                break;

            case 'fillSinks':
                result = await runFillSinks(args, data);
                break;

            case 'vectorize':
                result = await runVectorize(args, data);
                break;

            case 'calculate':
                result = await runRasterCalculator(args, data);
                break;

            default:
                throw new Error(`Unknown action: ${action}`);
        }

        // Post back success
        // If result is ArrayBuffer, transfer it
        const transfer = (result instanceof ArrayBuffer) ? [result] : [];
        self.postMessage({ id, success: true, result }, transfer);

    } catch (err) {
        console.error(`Worker Action '${action}' Failed:`, err);
        self.postMessage({ id, success: false, message: err.message });
    }
};


// ==========================================
// 3. Implementations
// ==========================================

async function runGdalDem(algorithm, args, dataInput) {
    // dataInput: { buffer: ArrayBuffer }
    // Loam expects Uint8Array
    const buffer = new Uint8Array(dataInput.buffer);
    const srcFile = await Loam.open({ name: 'input.tif', data: buffer });

    let options = [];

    // Map args to GDAL flags
    // -compute_edges is valid for all
    if (args.computeEdges) options.push('-compute_edges');

    // Specifics
    if (algorithm === 'slope') {
        if (args.scale) options.push('-s', args.scale.toString());
        if (args.percent) options.push('-p');
    }
    else if (algorithm === 'hillshade') {
        if (args.zFactor) options.push('-z', args.zFactor.toString());
        if (args.scale) options.push('-s', args.scale.toString());
        if (args.azimuth) options.push('-az', args.azimuth.toString());
        if (args.altitude) options.push('-alt', args.altitude.toString());
    }
    else if (algorithm === 'aspect') {
        if (args.zeroForFlat) options.push('-zero_for_flat');
        // Aspect does NOT take scale
    }
    else if (['TRI', 'TPI', 'roughness'].includes(algorithm)) {
        // These do not take scale or zFactor
    }

    const resultDataset = await srcFile.demProcessing(algorithm, null, options);
    const resultBytes = await resultDataset.bytes(); // Uint8Array
    return resultBytes.buffer;
}

async function runGdalClip(args, dataInput) {
    const buffer = new Uint8Array(dataInput.buffer);
    const srcFile = await Loam.open({ name: 'input.tif', data: buffer });
    const bounds = args.bounds; // [minX, minY, maxX, maxY]

    const ulx = bounds[0];
    const uly = bounds[3]; // maxY is top (usually, unless CRS inverted)
    const lrx = bounds[2];
    const lry = bounds[1];

    const translateOptions = [
        '-projwin', ulx.toString(), uly.toString(), lrx.toString(), lry.toString(),
        '-co', 'COMPRESS=NONE',
        '-co', 'TILED=NO'
    ];

    const resultDataset = await srcFile.convert(translateOptions);
    const resultBytes = await resultDataset.bytes();
    return resultBytes.buffer;
}

async function runGdalReproject(args, dataInput) {
    const buffer = new Uint8Array(dataInput.buffer);
    const srcFile = await Loam.open({ name: 'input.tif', data: buffer });

    const dstCRS = args.dstCRS;
    // Basic lookup shim (similar to main thread)
    const PROJ4_EPSG_4326 = "+proj=longlat +ellps=WGS84 +no_defs";
    const PROJ4_EPSG_5070 = "+proj=aea +lat_1=29.5 +lat_2=45.5 +lat_0=23 +lon_0=-96 +x_0=0 +y_0=0 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs";

    const lookupCRS = (crs) => {
        if (crs === 4326 || crs === 'EPSG:4326') return PROJ4_EPSG_4326;
        if (crs === 5070 || crs === 'EPSG:5070') return PROJ4_EPSG_5070;
        if (typeof crs === 'number') return `EPSG:${crs}`;
        return crs;
    };

    const targetSRS = lookupCRS(dstCRS);
    const warpOptions = ['-t_srs', targetSRS];

    if (args.width && args.height) {
        warpOptions.push('-ts', args.width.toString(), args.height.toString());
    }
    if (args.method) {
        let method = args.method.toLowerCase();
        if (method === 'nearest') method = 'near';
        warpOptions.push('-r', method);
    }
    if (args.bounds) {
        warpOptions.push('-te', args.bounds[0].toString(), args.bounds[1].toString(), args.bounds[2].toString(), args.bounds[3].toString());
    }
    if (args.srcCRS) {
        warpOptions.push('-s_srs', lookupCRS(args.srcCRS));
    }

    warpOptions.push('-co', 'COMPRESS=NONE');
    warpOptions.push('-co', 'TILED=NO');

    const resultDataset = await srcFile.warp(warpOptions);
    const resultBytes = await resultDataset.bytes();
    return resultBytes.buffer;
}


// --- JS Hydrology Utilities ---

class MinHeap {
    constructor() { this.data = []; }
    push(val) { this.data.push(val); this.bubbleUp(this.data.length - 1); }
    pop() {
        const res = this.data[0];
        const last = this.data.pop();
        if (this.data.length > 0) {
            this.data[0] = last;
            this.bubbleDown(0);
        }
        return res;
    }
    size() { return this.data.length; }
    bubbleUp(n) {
        while (n > 0) {
            const p = (n - 1) >>> 1;
            if (this.data[n].val >= this.data[p].val) break;
            [this.data[n], this.data[p]] = [this.data[p], this.data[n]];
            n = p;
        }
    }
    bubbleDown(n) {
        const len = this.data.length;
        while (true) {
            const l = (n << 1) + 1, r = l + 1;
            let min = n;
            if (l < len && this.data[l].val < this.data[min].val) min = l;
            if (r < len && this.data[r].val < this.data[min].val) min = r;
            if (min === n) break;
            [this.data[n], this.data[min]] = [this.data[min], this.data[n]];
            n = min;
        }
    }
}

async function runFillSinks(args, dataInput) {
    const { dem, width, height } = dataInput;
    const w = width;
    const h = height;

    const filled = new Float32Array(dem); // copy DEM
    const visited = new Uint8Array(w * h);
    const heap = new MinHeap(); // must be min-heap by val

    // 1. Push border cells
    for (let x = 0; x < w; x++) {
        let i1 = x;
        let i2 = (h - 1) * w + x;

        heap.push({ idx: i1, val: filled[i1] });
        heap.push({ idx: i2, val: filled[i2] });

        visited[i1] = 1;
        visited[i2] = 1;
    }

    for (let y = 1; y < h - 1; y++) {
        let i1 = y * w;
        let i2 = y * w + (w - 1);

        heap.push({ idx: i1, val: filled[i1] });
        heap.push({ idx: i2, val: filled[i2] });

        visited[i1] = 1;
        visited[i2] = 1;
    }

    // 2. Priority-Flood
    const dX = [-1, 0, 1, -1, 1, -1, 0, 1];
    const dY = [-1, -1, -1, 0, 0, 1, 1, 1];

    while (heap.size() > 0) {
        const { idx, val } = heap.pop();

        const x = idx % w;
        const y = (idx / w) | 0;

        for (let i = 0; i < 8; i++) {
            const nx = x + dX[i];
            const ny = y + dY[i];
            if (nx < 0 || ny < 0 || nx >= w || ny >= h) continue;

            const nIdx = ny * w + nx;
            if (visited[nIdx]) continue;

            visited[nIdx] = 1;

            // Fill to spill elevation (NO epsilon)
            if (filled[nIdx] < val) {
                filled[nIdx] = val;
            }

            heap.push({ idx: nIdx, val: filled[nIdx] });
        }
    }

    return filled;
}

// This avoids managing `geotiff.js` inside the worker.

function calculateD8(dem, w, h) {
    const flowDir = new Uint8Array(w * h);

    const dX = [-1, 0, 1, -1, 1, -1, 0, 1];
    const dY = [-1, -1, -1, 0, 0, 1, 1, 1];
    const dCode = [32, 64, 128, 16, 1, 8, 4, 2];

    for (let y = 0; y < h; y++) {
        for (let x = 0; x < w; x++) {
            const idx = y * w + x;
            const z = dem[idx];

            let maxSlope = 0;
            let bestDir = 0;
            let hasDownhill = false;

            // First pass: check if any downhill neighbor exists
            for (let i = 0; i < 8; i++) {
                const nx = x + dX[i];
                const ny = y + dY[i];
                if (nx < 0 || ny < 0 || nx >= w || ny >= h) continue;

                if (z - dem[ny * w + nx] > 0) {
                    hasDownhill = true;
                    break;
                }
            }

            // Second pass: select direction
            for (let i = 0; i < 8; i++) {
                const nx = x + dX[i];
                const ny = y + dY[i];
                if (nx < 0 || ny < 0 || nx >= w || ny >= h) continue;

                const nIdx = ny * w + nx;
                const dz = z - dem[nIdx];

                if (dz < 0) continue;
                if (dz === 0 && hasDownhill) continue;

                const dist = (dX[i] === 0 || dY[i] === 0) ? 1 : Math.SQRT2;
                const slope = dz / dist;

                if (slope > maxSlope) {
                    maxSlope = slope;
                    bestDir = dCode[i];
                }
            }

            flowDir[idx] = bestDir;
        }
    }

    return flowDir;
}



async function runFlowDirection(args, dataInput) {
    const { dem, width, height } = dataInput;
    return calculateD8(dem, width, height);
}

async function runFlowAccumulation(args, dataInput) {
    const { dem, width, height } = dataInput;
    const w = width;
    const h = height;

    const flowDir = calculateD8(dem, w, h);

    const acc = new Float32Array(w * h).fill(1);
    const indegree = new Uint8Array(w * h);

    const neighbors = {
        1: [1, 0], 2: [1, 1], 4: [0, 1], 8: [-1, 1],
        16: [-1, 0], 32: [-1, -1], 64: [0, -1], 128: [1, -1]
    };

    const len = w * h;

    // Compute indegree
    for (let i = 0; i < len; i++) {
        const code = flowDir[i];
        if (!neighbors[code]) continue;

        const [dx, dy] = neighbors[code];
        const x = i % w;
        const y = (i / w) | 0;

        const nx = x + dx;
        const ny = y + dy;
        if (nx < 0 || ny < 0 || nx >= w || ny >= h) continue;

        indegree[ny * w + nx]++;
    }

    // Initialize stack with headwaters
    const stack = [];
    for (let i = 0; i < len; i++) {
        if (indegree[i] === 0) stack.push(i);
    }

    // Topological accumulation
    while (stack.length) {
        const i = stack.pop();
        const code = flowDir[i];
        if (!neighbors[code]) continue;

        const [dx, dy] = neighbors[code];
        const x = i % w;
        const y = (i / w) | 0;

        const nx = x + dx;
        const ny = y + dy;
        if (nx < 0 || ny < 0 || nx >= w || ny >= h) continue;

        const nIdx = ny * w + nx;
        acc[nIdx] += acc[i];

        indegree[nIdx]--;
        if (indegree[nIdx] === 0) stack.push(nIdx);
    }

    return acc;
}



async function runWatershed(args, dataInput) {
    const { dem, width, height } = dataInput;
    const w = width;
    const h = height;

    const flowDir = calculateD8(dem, w, h);
    const mask = new Uint8Array(w * h);

    const queue = [];
    const startIdx = args.pourPoint.y * w + args.pourPoint.x;
    queue.push(startIdx);

    const reverse = [
        [1, -1, 8],
        [0, -1, 4],
        [-1, -1, 2],
        [1, 0, 16],
        [-1, 0, 1],
        [1, 1, 32],
        [0, 1, 64],
        [-1, 1, 128]
    ];

    while (queue.length) {
        const idx = queue.pop();
        if (mask[idx]) continue;

        mask[idx] = 1;

        const x = idx % w;
        const y = (idx / w) | 0;

        for (let i = 0; i < 8; i++) {
            const nx = x + reverse[i][0];
            const ny = y + reverse[i][1];
            if (nx < 0 || ny < 0 || nx >= w || ny >= h) continue;

            const nIdx = ny * w + nx;
            if (flowDir[nIdx] === reverse[i][2]) {
                queue.push(nIdx);
            }
        }
    }

    return mask;
}



async function runStreamExtract(args, dataInput) {
    // args: { threshold }
    const acc = await runFlowAccumulation(args, dataInput);
    const thr = args.threshold || 1000;
    const out = new Uint8Array(acc.length);

    for (let i = 0; i < acc.length; i++) {
        out[i] = acc[i] >= thr ? 1 : 0;
    }
    return out;
}

async function runVectorize(args, dataInput) {
    const { dem, width, height } = dataInput;
    const w = width;
    const h = height;

    // Switch mode based on args.type
    if (args.type === 'line' || args.type === 'LineString') {
        return traceLines(dem, w, h, args.geotransform);
    }

    // Default: Blocky Edge Tracing (Polygons)
    return traceBlockyPolygons(dem, w, h, args.geotransform);
}

// ----------------------------------------------------
// Vectorization Sub-Routines
// ----------------------------------------------------

function traceLines(dem, w, h, gt = [0, 1, 0, 0, 0, 1]) {
    const getVal = (c, r) => {
        if (c < 0 || r < 0 || c >= w || r >= h) return 0;
        const v = dem[r * w + c];
        return (v !== 0 && !Number.isNaN(v)) ? 1 : 0;
    };

    const neighbors = [
        [0, -1], [1, -1], [1, 0], [1, 1], [0, 1], [-1, 1], [-1, 0], [-1, -1]
    ];

    const nodes = [];
    // Find Ends (deg 1) and Junctions (deg != 2)
    for (let y = 0; y < h; y++) {
        for (let x = 0; x < w; x++) {
            if (getVal(x, y) === 0) continue;
            let deg = 0;
            for (let k = 0; k < 8; k++) {
                if (getVal(x + neighbors[k][0], y + neighbors[k][1]) === 1) deg++;
            }
            if (deg !== 2) nodes.push({ x, y });
        }
    }

    // If loop only (no ends/junctions), pick any point?
    if (nodes.length === 0) {
        outer: for (let y = 0; y < h; y++) {
            for (let x = 0; x < w; x++) {
                if (getVal(x, y) === 1) { nodes.push({ x, y }); break outer; }
            }
        }
    }

    const nodeSet = new Set(nodes.map(n => n.y * w + n.x));
    const segmentVisited = new Uint8Array(w * h);
    const resultLines = [];

    for (const node of nodes) {
        const sx = node.x;
        const sy = node.y;

        for (let k = 0; k < 8; k++) {
            const nx = sx + neighbors[k][0];
            const ny = sy + neighbors[k][1];

            if (getVal(nx, ny) === 0) continue;

            const nIdx = ny * w + nx;

            // If neighbor is Node, handle direct connection (undirected)
            if (nodeSet.has(nIdx)) {
                if ((sy * w + sx) < nIdx) {
                    resultLines.push([{ x: sx, y: sy }, { x: nx, y: ny }]);
                }
                continue;
            }

            if (segmentVisited[nIdx]) continue;

            // Start Tracing
            const line = [{ x: sx, y: sy }, { x: nx, y: ny }];
            segmentVisited[nIdx] = 1;

            let currX = nx;
            let currY = ny;
            let prevX = sx;
            let prevY = sy;

            let walking = true;
            while (walking) {
                let nextX = -1, nextY = -1;
                let foundNext = false;

                for (let j = 0; j < 8; j++) {
                    const tx = currX + neighbors[j][0];
                    const ty = currY + neighbors[j][1];
                    if (tx === prevX && ty === prevY) continue;
                    if (getVal(tx, ty) === 0) continue;

                    nextX = tx; nextY = ty;
                    foundNext = true;
                    break;
                }

                if (!foundNext) {
                    walking = false;
                } else {
                    const nextIdx = nextY * w + nextX;
                    if (nodeSet.has(nextIdx)) {
                        line.push({ x: nextX, y: nextY });
                        walking = false;
                    } else {
                        if (segmentVisited[nextIdx]) {
                            line.push({ x: nextX, y: nextY });
                            walking = false;
                        } else {
                            segmentVisited[nextIdx] = 1;
                            line.push({ x: nextX, y: nextY });
                            prevX = currX; prevY = currY;
                            currX = nextX; currY = nextY;
                        }
                    }
                }
            }
            resultLines.push(line);
        }
    }

    // Map Coords
    const geojson = { type: "FeatureCollection", features: [] };
    const ox = gt[0]; const sx = gt[1];
    const oy = gt[3]; const sy = gt[5];

    let fId = 0;
    for (const line of resultLines) {
        const coords = line.map(pt => [
            ox + (pt.x + 0.5) * sx,
            oy + (pt.y + 0.5) * sy
        ]);

        geojson.features.push({
            type: "Feature",
            id: fId++,
            properties: { id: fId },
            geometry: {
                type: "LineString",
                coordinates: coords
            }
        });
    }

    return geojson;
}

function traceBlockyPolygons(dem, w, h, gt = [0, 1, 0, 0, 0, 1]) {
    const getVal = (c, r) => {
        if (c < 0 || r < 0 || c >= w || r >= h) return 0;
        const v = dem[r * w + c];
        return (v !== 0 && !Number.isNaN(v)) ? 1 : 0;
    };

    const visitedVert = new Uint8Array((w + 1) * h);
    const visitedHoriz = new Uint8Array(w * (h + 1));
    const polylines = [];

    const markVisited = (x, y, type) => {
        if (type === 0) {
            if (x >= 0 && x < w && y >= 0 && y <= h) visitedHoriz[y * w + x] = 1;
        } else {
            if (x >= 0 && x <= w && y >= 0 && y < h) visitedVert[y * (w + 1) + x] = 1;
        }
    };

    const isVisited = (x, y, type) => {
        if (type === 0) {
            if (x < 0 || x >= w || y < 0 || y > h) return true;
            return visitedHoriz[y * w + x] === 1;
        } else {
            if (x < 0 || x > w || y < 0 || y >= h) return true;
            return visitedVert[y * (w + 1) + x] === 1;
        }
    };

    const dx = [1, 0, -1, 0];
    const dy = [0, 1, 0, -1];

    function trace(startX, startY, startDir) {
        let cx = startX;
        let cy = startY;
        let dir = startDir;
        let points = [];
        let loop = 0;
        const max = w * h * 4;

        do {
            points.push({ x: cx, y: cy });

            if (dir === 0) markVisited(cx, cy, 0);
            else if (dir === 1) markVisited(cx, cy, 1);
            else if (dir === 2) markVisited(cx - 1, cy, 0);
            else if (dir === 3) markVisited(cx, cy - 1, 1);

            cx += dx[dir];
            cy += dy[dir];

            const pNW = getVal(cx - 1, cy - 1);
            const pNE = getVal(cx, cy - 1);
            const pSW = getVal(cx - 1, cy);
            const pSE = getVal(cx, cy);

            const checks = [-1, 2, 0, 1];
            let found = false;

            for (let k = 0; k < 4; k++) {
                const nd = (dir + checks[k] + 4) % 4;
                let solid = 0, empty = 0;

                if (nd === 0) { solid = pSE; empty = pNE; }
                else if (nd === 1) { solid = pSW; empty = pSE; }
                else if (nd === 2) { solid = pNW; empty = pSW; }
                else if (nd === 3) { solid = pNE; empty = pNW; }

                if (solid === 1 && empty === 0) {
                    dir = nd;
                    found = true;
                    break;
                }
            }
            if (!found) break;

        } while ((cx !== startX || cy !== startY || dir !== startDir) && loop++ < max);

        return points;
    }

    for (let y = 0; y < h; y++) {
        for (let x = 0; x < w; x++) {
            if (getVal(x, y) === 0) continue;
            if (getVal(x, y - 1) === 0 && !isVisited(x, y, 0)) polylines.push(trace(x, y, 0));
            if (getVal(x, y + 1) === 0 && !isVisited(x, y + 1, 0)) polylines.push(trace(x + 1, y + 1, 2));
            if (getVal(x - 1, y) === 0 && !isVisited(x, y, 1)) polylines.push(trace(x, y + 1, 3));
            if (getVal(x + 1, y) === 0 && !isVisited(x + 1, y, 1)) polylines.push(trace(x + 1, y, 1));
        }
    }

    const geojson = { type: "FeatureCollection", features: [] };
    const ox = gt[0];
    const sx = gt[1];
    const oy = gt[3];
    const sy = gt[5];

    let fId = 0;
    for (const poly of polylines) {
        if (!poly || poly.length < 3) continue;

        const coords = poly.map(pt => [ox + pt.x * sx, oy + pt.y * sy]);
        coords.push(coords[0]);
        coords.reverse();

        geojson.features.push({
            type: "Feature",
            id: fId++,
            properties: { id: fId },
            geometry: {
                type: "Polygon",
                coordinates: [coords]
            }
        });
    }

    return geojson;
}

// ----------------------------------------------------
// Raster Calculator
// ----------------------------------------------------

async function runRasterCalculator(args, dataInput) {
    const { dem, width, height } = dataInput;
    let userFunc;
    try {
        userFunc = new Function('val', 'x', 'y', args.func);
    } catch (e) {
        throw new Error("Invalid Raster Calculator Function: " + e.message);
    }
    const out = new Float32Array(dem.length);
    for (let i = 0; i < dem.length; i++) {
        out[i] = userFunc(dem[i], i % width, (i / width) | 0);
    }
    return out;
}

