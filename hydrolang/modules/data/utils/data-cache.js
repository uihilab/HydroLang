/**
 * Universal Data Cache for HydroLang
 * Handles caching of any data files from any source with automatic management
 * Supports any file format and size with intelligent storage management
 */

/**
 * Universal cache for all data sources
 * @ignore
 */
export class HydroLangCache {
  constructor() {
    this.dbName = 'HydroLang_DataCache';
    this.version = 1;
    this.db = null;
    this.maxCacheSize = 100 * 1024 * 1024 * 1024; // 100GB total
    this.maxFileSize = 10 * 1024 * 1024 * 1024; // 10GB per file max
    this.maxAge = 2 * 24 * 60 * 60 * 1000; // 2 days
    this.cleanupInterval = 60 * 60 * 1000; // Cleanup every hour
    this.lastCleanup = 0;
  }

  async init() {
    if (this.db) return;

    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.version);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        console.log('HydroLang cache initialized');
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = event.target.result;

        // Main data store - now contains everything
        if (!db.objectStoreNames.contains('files')) {
          const store = db.createObjectStore('files', { keyPath: 'cacheKey' });
          store.createIndex('url', 'url', { unique: false });
          store.createIndex('source', 'source', { unique: false });
          store.createIndex('dataset', 'dataset', { unique: false });
          store.createIndex('timestamp', 'timestamp', { unique: false });
          store.createIndex('size', 'size', { unique: false });
          store.createIndex('format', 'format', { unique: false });
          store.createIndex('source_dataset', ['source', 'dataset'], { unique: false });
          store.createIndex('lastAccessed', 'lastAccessed', { unique: false });
        }
      };
    });
  }

  generateCacheKey(url, params = {}) {
    // Generate human-readable key based on request parameters
    const source = params.source || 'unknown';
    const dataType = params.datatype || 'data';

    // Extract meaningful parameters from context
    const context = globalThis._hydroCacheContext || {};
    const args = context.params?.args || params.args || {};

    // Build human-readable key parts
    const keyParts = [source, dataType];

    // Add location if available
    if (args.lat !== undefined && args.lon !== undefined) {
      keyParts.push(`lat${args.lat}`, `lon${args.lon}`);
    } else if (args.latitude !== undefined && args.longitude !== undefined) {
      keyParts.push(`lat${args.latitude}`, `lon${args.longitude}`);
    }

    // Add bbox if available
    if (args.bbox) {
      const bbox = Array.isArray(args.bbox) ? args.bbox.join('_') : args.bbox;
      keyParts.push(`bbox${bbox}`);
    }

    // Add date range if available
    if (args.startDate || args.startDT) {
      const start = String(args.startDate || args.startDT).substring(0, 10); // YYYY-MM-DD
      keyParts.push(`start${start}`);
    }
    if (args.endDate || args.endDT) {
      const end = String(args.endDate || args.endDT).substring(0, 10);
      keyParts.push(`end${end}`);
    }

    // Add timestamp for single-time requests
    if (args.time || args.timestamp) {
      const time = String(args.time || args.timestamp).substring(0, 10);
      keyParts.push(`time${time}`);
    }

    // Add dataset/variable if available
    if (args.dataset) {
      keyParts.push(args.dataset);
    }
    if (args.variable) {
      keyParts.push(args.variable);
    }

    // Add site ID if available (for USGS, etc.)
    if (args.sites || args.site) {
      keyParts.push(`site${args.sites || args.site}`);
    }

    // Join with underscores for readability, remove special characters
    const cacheKey = keyParts.join('_').replace(/[^a-zA-Z0-9_\-\.]/g, '');

    return cacheKey;
  }

  // Generate chunk-specific cache key
  generateChunkKey(baseKey, chunkIndex) {
    // Use a stable key format that doesn't depend on totalChunks
    // to avoid key mismatches when totalChunks is discovered mid-download
    return `${baseKey}-chunk-${chunkIndex}`;
  }


  // Check for partial download and resume if possible
  async checkPartialDownload(url, options = {}) {
    if (!this.db) await this.init();

    const baseKey = this.generateCacheKey(url, options.params || {});
    const manifestKey = `${baseKey}-manifest`;

    try {
      const manifestEntry = await new Promise((resolve, reject) => {
        const transaction = this.db.transaction(['files'], 'readonly');
        const store = transaction.objectStore('files');
        const request = store.get(manifestKey);
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      });

      if (!manifestEntry) return null;

      const manifest = JSON.parse(new TextDecoder().decode(manifestEntry.data));

      // Check which chunks are already downloaded
      const downloadedChunks = [];
      for (let i = 0; i < manifest.totalChunks; i++) {
        const chunkKey = manifest.chunks[i];
        try {
          const chunkEntry = await new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['files'], 'readonly');
            const store = transaction.objectStore('files');
            const request = store.get(chunkKey);
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
          });
          if (chunkEntry) downloadedChunks.push(i);
        } catch (e) {
          // Chunk not found
        }
      }

      console.log(`Found partial download: ${downloadedChunks.length}/${manifest.totalChunks} chunks`);
      return {
        manifest,
        downloadedChunks,
        baseKey,
        manifestKey
      };
    } catch (error) {
      return null;
    }
  }

  // Resume a partial chunked download
  async resumeChunkedDownload(partialDownload, options = {}, chunkSize = 100 * 1024 * 1024) {
    const { manifest, downloadedChunks, baseKey } = partialDownload;
    const { url, totalChunks, totalSize } = manifest;

    console.log(`Resuming download: ${downloadedChunks.length}/${totalChunks} chunks already downloaded`);

    // Download missing chunks sequentially
    const chunkBuffers = [];
    const downloadedSet = new Set(downloadedChunks);

    for (let i = 0; i < totalChunks; i++) {
      if (downloadedSet.has(i)) {
        // Chunk already downloaded, just retrieve it
        try {
          const chunkEntry = await new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['files'], 'readonly');
            const store = transaction.objectStore('files');
            const request = store.get(manifest.chunks[i]);
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
          });
          chunkBuffers.push(chunkEntry.data);
          console.log(`Using cached chunk ${i + 1}/${totalChunks}`);
        } catch (error) {
          console.error(`Failed to retrieve cached chunk ${i}:`, error);
          throw error;
        }
      } else {
        // Download missing chunk
        const start = i * chunkSize;
        const end = Math.min(start + chunkSize - 1, totalSize - 1);

        try {
          console.log(`Downloading missing chunk ${i + 1}/${totalChunks} (bytes ${start}-${end})`);

          const rangeResponse = await globalThis._originalFetch(url, {
            ...options,
            headers: {
              ...options.headers,
              'Range': `bytes=${start}-${end}`
            }
          });

          if (!rangeResponse.ok) {
            throw new Error(`Range request failed: ${rangeResponse.status} ${rangeResponse.statusText}`);
          }

          const chunkData = await rangeResponse.arrayBuffer();
          const chunkKey = manifest.chunks[i];

          await this.put(chunkKey, chunkData, {
            source: options.source || 'unknown',
            dataset: options.dataset || 'unknown',
            format: 'chunk',
            isChunk: true,
            chunkIndex: i,
            totalChunks,
            chunkStart: start,
            chunkEnd: end,
            baseKey,
            originalUrl: url,
            isChunkData: true
          });

          console.log(`Downloaded and cached chunk ${i + 1}/${totalChunks} (${(chunkData.byteLength / 1024 / 1024).toFixed(1)}MB)`);
          chunkBuffers.push(chunkData);
        } catch (error) {
          console.error(`Failed to download chunk ${i}:`, error);
          throw error;
        }
      }
    }

    // Concatenate all chunks for immediate response
    const totalBuffer = new Uint8Array(totalSize);
    let offset = 0;
    for (const chunk of chunkBuffers) {
      totalBuffer.set(new Uint8Array(chunk), offset);
      offset += chunk.byteLength;
    }

    console.log(`Resumed download complete: ${(totalSize / 1024 / 1024).toFixed(1)}MB in ${totalChunks} chunks`);

    // Store the assembled data with the main cache key for future requests
    // Use the original URL from context, not the potentially proxied URL from manifest
    const originalUrl = options.params?.originalUrl || url;
    const cacheKey = this.generateCacheKey(originalUrl, {
      source: options.source || 'unknown',
      datatype: options.dataset || 'data'
    });

    await this.put(cacheKey, totalBuffer.buffer, {
      source: options.source || 'unknown',
      dataset: options.dataset || 'unknown',
      dataType: options.datatype || 'data',
      format: 'netcdf',
      assembledFromChunks: true,
      chunkManifest: manifestKey,
      originalUrl: originalUrl,
      totalSize: totalSize,
      params: options.params
    });

    // Return virtual response
    return {
      ok: true,
      status: 200,
      statusText: 'OK',
      headers: new Headers({
        'content-type': 'application/octet-stream',
        'content-length': totalSize.toString()
      }),
      arrayBuffer: async () => totalBuffer.buffer,
      text: async () => new TextDecoder().decode(totalBuffer),
      json: async () => JSON.parse(new TextDecoder().decode(totalBuffer)),
      blob: async () => new Blob([totalBuffer.buffer])
    };
  }

  // Download file in chunks with immediate storage
  async downloadChunked(url, options = {}, chunkSize = 100 * 1024 * 1024) {
    if (!this.db) await this.init();

    // Silent operation

    // Check for partial download first
    const partialDownload = await this.checkPartialDownload(url, options);
    if (partialDownload) {
      console.log('Resuming partial download');
      return this.resumeChunkedDownload(partialDownload, options, chunkSize);
    }

    // Check if server supports range requests and get content length
    const isS3Url = url.includes('s3.') || url.includes('amazonaws.com') || url.includes('amazon.com');
    let acceptRanges = null;
    let contentLength = null;

    // Skip HEAD request for NOAA URLs or when skipSizeDetection is set
    if (!url.includes('noaa.gov') && !options.params?.skipSizeDetection) {
      try {
        // Try HEAD request first for non-NOAA URLs to detect file size
        const headResponse = await globalThis._originalFetch(url, { method: 'HEAD', ...options });

        if (headResponse.ok) {
          acceptRanges = headResponse.headers.get('accept-ranges');
          contentLength = parseInt(headResponse.headers.get('content-length'));

          if (contentLength) {
            console.log(`File size detected: ${(contentLength / 1024 / 1024).toFixed(1)}MB via HEAD`);
          }
        }
      } catch (headError) {
        console.warn('HEAD request failed:', headError.message);
      }
    }

    // For NOAA URLs or when skipSizeDetection is set, assume range support
    if (!contentLength && (url.includes('noaa.gov') || options.params?.skipSizeDetection)) {
      acceptRanges = 'bytes'; // Assume range support
    }
    // For large files or cloud storage URLs, try range request to detect content length
    else if (!contentLength && (isS3Url || context.expectedSize > 10 * 1024 * 1024) && !url.includes('noaa.gov') && !options.params?.skipSizeDetection) {
      try {
        console.log('Trying range request to detect file size...');
        const rangeResponse = await globalThis._originalFetch(url, {
          ...options,
          headers: {
            ...options.headers,
            'Range': 'bytes=0-0' // Request just first byte
          }
        });

        if (rangeResponse.ok && rangeResponse.status === 206) {
          // Parse content-range header: "bytes 0-0/123456"
          const contentRange = rangeResponse.headers.get('content-range');
          if (contentRange) {
            const match = contentRange.match(/\/(\d+)$/);
            if (match) {
              contentLength = parseInt(match[1]);
              acceptRanges = 'bytes';
              console.log(`File size detected: ${(contentLength / 1024 / 1024).toFixed(1)}MB via range request`);
            }
          }
        }
      } catch (rangeError) {
        console.warn('Range request failed:', rangeError.message);
      }
    }

    // For S3 URLs, assume range support even if content length detection failed
    if (!contentLength && isS3Url) {
      acceptRanges = 'bytes';
    }
    // For other URLs, only enable chunked download if we know the content length
    else if (!contentLength && !url.includes('noaa.gov') && !options.params?.skipSizeDetection) {
      console.warn('Could not determine content length, falling back to full download');
      return globalThis._originalFetch(url, options);
    }

    // For very small files, don't bother with chunking (only if we know the size)
    if (contentLength && contentLength <= chunkSize) {
      return globalThis._originalFetch(url, options);
    }

    const baseKey = this.generateCacheKey(url, options.params || {});
    let totalChunks = contentLength ? Math.ceil(contentLength / chunkSize) : null;
    let actualTotalSize = contentLength;


    // No manifest needed - chunks will be reassembled automatically by baseKey

    // Download and store chunks sequentially
    const chunkBuffers = [];
    let chunkIndex = 0;
    let totalDownloaded = 0;

    while (true) {
      const start = chunkIndex * chunkSize;
      let end;

      if (contentLength) {
        end = Math.min(start + chunkSize - 1, contentLength - 1);
      } else {
        // For unknown size, request chunkSize bytes
        end = start + chunkSize - 1;
      }

      try {
        const chunkDesc = contentLength ?
          `chunk ${chunkIndex + 1}/${totalChunks} (bytes ${start}-${end})` :
          `chunk ${chunkIndex + 1} (bytes ${start}-${end})`;

        console.log(`Downloading ${chunkDesc}`);

        const rangeResponse = await globalThis._originalFetch(url, {
          ...options,
          headers: {
            ...options.headers,
            'Range': `bytes=${start}-${end}`
          }
        });

        if (!rangeResponse.ok) {
          if (rangeResponse.status === 416) {
            // Range not satisfiable - we've reached the end of the file
            console.log(`Reached end of file at chunk ${chunkIndex}`);
            break;
          }
          throw new Error(`Range request failed: ${rangeResponse.status} ${rangeResponse.statusText}`);
        }

        const chunkData = await rangeResponse.arrayBuffer();

        // If we didn't know the total size, update it from content-range header
        if (!contentLength) {
          const contentRange = rangeResponse.headers.get('content-range');
          if (contentRange) {
            const match = contentRange.match(/\/(\d+)$/);
            if (match) {
              actualTotalSize = parseInt(match[1]);
              totalChunks = Math.ceil(actualTotalSize / chunkSize);
            }
          }
        }

        const chunkKey = this.generateChunkKey(baseKey, chunkIndex);

        await this.put(chunkKey, chunkData, {
          cacheKey: chunkKey, // Use chunkKey as the cache key directly
          source: options.source || 'unknown',
          dataset: options.dataset || 'unknown',
          format: 'chunk',
          isChunk: true,
          chunkIndex,
          totalChunks: totalChunks || null,
          chunkStart: start,
          chunkEnd: start + chunkData.byteLength - 1,
          baseKey,
          originalUrl: url,
          isChunkData: true
        });

        chunkBuffers.push(chunkData);
        totalDownloaded += chunkData.byteLength;

        // If this chunk is smaller than requested, we've reached the end
        if (chunkData.byteLength < chunkSize) {
          break;
        }

        chunkIndex++;

        // Safety check - don't download more than a reasonable number of chunks
        if (chunkIndex > 1000) {
          console.warn('Too many chunks downloaded, stopping to prevent infinite loop');
          break;
        }

      } catch (error) {
        console.error(`Failed to download chunk ${chunkIndex}:`, error);
        throw error;
      }
    }

    // Concatenate all chunks for immediate response
    const finalTotalSize = actualTotalSize || totalDownloaded;
    const totalBuffer = new Uint8Array(finalTotalSize);
    let offset = 0;
    for (const chunk of chunkBuffers) {
      totalBuffer.set(new Uint8Array(chunk), offset);
      offset += chunk.byteLength;
    }

    // Store the assembled data with the main cache key for future requests
    const originalUrl = options.params?.originalUrl || url;
    const cacheKey = this.generateCacheKey(originalUrl, {
      source: options.source || 'unknown',
      datatype: options.dataset || 'data'
    });

    await this.put(cacheKey, totalBuffer.buffer, {
      source: options.source || 'unknown',
      dataset: options.dataset || 'unknown',
      dataType: options.datatype || 'data',
      format: 'netcdf',
      assembledFromChunks: true,
      totalSize: finalTotalSize,
      originalUrl: originalUrl,
      params: options.params
    });

    // Return a Response-like object
    return {
      ok: true,
      status: 200,
      statusText: 'OK',
      headers: new Headers({
        'content-type': 'application/octet-stream',
        'content-length': finalTotalSize.toString()
      }),
      arrayBuffer: async () => totalBuffer.buffer,
      text: async () => new TextDecoder().decode(totalBuffer),
      json: async () => JSON.parse(new TextDecoder().decode(totalBuffer))
    };
  }

  // Automatically reassemble chunks for a baseKey
  async reassembleChunks(baseKey) {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(['files'], 'readonly');
      const store = transaction.objectStore('files');

      // Find all chunks for this baseKey
      const chunks = [];
      const request = store.openCursor();

      request.onsuccess = (event) => {
        const cursor = event.target.result;
        if (cursor) {
          const entry = cursor.value;
          // Check if this is a chunk for our baseKey
          if (entry.baseKey === baseKey && entry.isChunk) {
            chunks.push({
              index: entry.chunkIndex,
              data: entry.data,
              size: entry.data.byteLength
            });
          }
          cursor.continue();
        } else {
          // Finished scanning, now reassemble
          if (chunks.length === 0) {
            resolve(null);
            return;
          }

          // Sort chunks by index
          chunks.sort((a, b) => a.index - b.index);

          // Concatenate
          const totalSize = chunks.reduce((sum, chunk) => sum + chunk.size, 0);
          const resultBuffer = new Uint8Array(totalSize);
          let offset = 0;

          for (const chunk of chunks) {
            resultBuffer.set(new Uint8Array(chunk.data), offset);
            offset += chunk.size;
          }

          resolve({
            data: resultBuffer.buffer,
            metadata: {
              reassembled: true,
              totalSize,
              chunkCount: chunks.length,
              baseKey
            }
          });
        }
      };

      request.onerror = () => reject(request.error);
    });
  }

  async get(cacheKey) {
    if (!this.db) await this.init();

    // First try to get as single file
    const singleFile = await new Promise((resolve, reject) => {
      const transaction = this.db.transaction(['files'], 'readonly');
      const fileStore = transaction.objectStore('files');

      const fileRequest = fileStore.get(cacheKey);

      fileRequest.onsuccess = () => {
        const entry = fileRequest.result;
        if (entry && !entry.isChunk) {
          const age = Date.now() - entry.timestamp;
          if (age > this.maxAge) {
            this.delete(cacheKey);
            resolve(null);
          } else {
            resolve({
              data: entry.data,
              metadata: entry
            });
          }
        } else {
          resolve(null);
        }
      };

      transaction.onerror = () => reject(transaction.error);
    });

    if (singleFile) return singleFile;

    // If no single file, try to reassemble chunks automatically
    const chunkedData = await this.reassembleChunks(cacheKey);
    if (chunkedData) return chunkedData;

    // Nothing found
    return null;
  }

  async put(cacheKey, data, metadata) {
    if (!this.db) await this.init();

    // Check file size limit
    if (data.byteLength > this.maxFileSize) {
      console.warn(`File too large (${(data.byteLength / 1024 / 1024).toFixed(1)}MB), skipping cache`);
      return;
    }

    // cacheKey is now passed as first parameter directly
    const entry = {
      cacheKey,
      url: metadata.originalUrl || metadata.url || cacheKey,  // Store original URL for reference
      data,
      dataType: metadata.dataType,  // Add dataType to entry
      timestamp: Date.now(),
      lastAccessed: Date.now(),
      ...metadata
    };

    // Run cleanup if needed
    await this.cleanupIfNeeded();

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(['files'], 'readwrite');
      const fileStore = transaction.objectStore('files');

      // Store everything in files store only
      const fileRequest = fileStore.put(entry);

      transaction.oncomplete = () => {
        console.log(`Cached: ${cacheKey} (${(data.byteLength / 1024 / 1024).toFixed(1)}MB)`);
        resolve(cacheKey);
      };

      transaction.onerror = () => reject(transaction.error);
    });
  }

  async putChunked(cacheKey, buffer, metadata, chunkSize = 100 * 1024 * 1024) {
    if (!this.db) await this.init();

    const totalSize = buffer.byteLength;
    const totalChunks = Math.ceil(totalSize / chunkSize);
    const baseKey = cacheKey;

    console.log(`Storing large file as ${totalChunks} chunks: ${cacheKey}`);

    // Store chunks
    for (let i = 0; i < totalChunks; i++) {
      const start = i * chunkSize;
      const end = Math.min(start + chunkSize, totalSize);
      const chunkData = buffer.slice(start, end);
      const chunkKey = this.generateChunkKey(baseKey, i);

      await this.put(chunkKey, chunkData, {
        ...metadata,
        cacheKey: chunkKey,
        format: 'chunk',
        isChunk: true,
        chunkIndex: i,
        totalChunks,
        chunkStart: start,
        chunkEnd: end - 1,
        baseKey,
        isChunkData: true
      });
    }

    // Store manifest/metadata as the main entry
    // This allows get() to find it and reassemble
    // We store an empty buffer or a small marker for the main entry
    // But wait, get() checks for isChunk. If we store a main entry that is NOT a chunk,
    // get() will return it.
    // get() logic:
    // if (entry && !entry.isChunk) -> return entry.data
    // else -> reassembleChunks

    // So we should NOT store a main entry with data.
    // But reassembleChunks looks for chunks with baseKey.
    // It doesn't look for a main entry.

    // However, we might want to store metadata about the file.
    // If we don't store a main entry, get() will fail to find singleFile and go to reassembleChunks.
    // reassembleChunks finds chunks by baseKey.
    // The chunks we stored have baseKey set.
    // So reassembleChunks should work.

    // But we might want to store a "manifest" or just rely on reassembleChunks.
    // reassembleChunks iterates ALL files to find matching baseKey. This is slow.
    // Ideally we should have an index on baseKey.
    // We do: store.createIndex('source_dataset', ...) but not baseKey?
    // Wait, reassembleChunks uses openCursor() and iterates everything?
    // Yes: `const request = store.openCursor();`
    // This is inefficient.

    // But for now, to fix the error, I just need to implement putChunked.
    // The current implementation of reassembleChunks scans everything.
    // So if I store chunks with baseKey, it should work.

    return baseKey;
  }

  async updateLastAccessed(cacheKey) {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(['metadata'], 'readwrite');
      const store = transaction.objectStore('metadata');
      const request = store.get(cacheKey);

      request.onsuccess = () => {
        if (request.result) {
          const entry = request.result;
          entry.lastAccessed = Date.now();
          store.put(entry);
        }
        resolve();
      };

      request.onerror = () => reject(request.error);
    });
  }

  async cleanupIfNeeded() {
    if (!this.db) await this.init();

    const now = Date.now();
    if (now - this.lastCleanup < this.cleanupInterval) return;

    this.lastCleanup = now;
    console.log('Running cache cleanup...');

    try {
      const stats = await this.getStats();

      // Remove expired files
      const expiredKeys = [];
      for (const entry of stats.entries) {
        if ((now - entry.timestamp) > this.maxAge) {
          expiredKeys.push(entry.cacheKey);
        }
      }

      for (const key of expiredKeys) {
        await this.delete(key);
      }

      // Remove oldest files if still over size limit
      if (stats.totalSize > this.maxCacheSize) {
        const remainingStats = await this.getStats();
        const sortedEntries = remainingStats.entries.sort((a, b) => a.lastAccessed - b.lastAccessed);

        let sizeToRemove = remainingStats.totalSize - this.maxCacheSize;
        for (const entry of sortedEntries) {
          if (sizeToRemove <= 0) break;
          await this.delete(entry.cacheKey);
          sizeToRemove -= entry.size;
        }
      }

      console.log('Cache cleanup complete');
    } catch (error) {
      console.warn('Cache cleanup failed:', error);
    }
  }

  async delete(cacheKey) {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(['files'], 'readwrite');
      const fileStore = transaction.objectStore('files');

      fileStore.delete(cacheKey);

      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
    });
  }

  async getStats() {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(['files'], 'readonly');
      const store = transaction.objectStore('files');
      const request = store.getAll();

      request.onsuccess = () => {
        const entries = request.result;
        const totalSize = entries.reduce((sum, entry) => sum + (entry.data?.byteLength || 0), 0);

        resolve({
          totalFiles: entries.length,
          totalSize,
          totalSizeMB: (totalSize / 1024 / 1024).toFixed(1),
          totalSizeGB: (totalSize / 1024 / 1024 / 1024).toFixed(2),
          entries: entries.map(entry => ({
            cacheKey: entry.cacheKey,
            filename: entry.url?.split('/').pop() || 'unknown',
            source: entry.source,
            dataset: entry.dataset,
            format: entry.format,
            size: entry.data?.byteLength || 0,
            sizeMB: ((entry.data?.byteLength || 0) / 1024 / 1024).toFixed(1),
            timestamp: new Date(entry.timestamp).toISOString(),
            lastAccessed: new Date(entry.lastAccessed).toISOString(),
            age: Math.floor((Date.now() - entry.timestamp) / (24 * 60 * 60 * 1000))
          }))
        });
      };

      request.onerror = () => reject(request.error);
    });
  }

  async clear() {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(['files'], 'readwrite');
      const fileStore = transaction.objectStore('files');

      fileStore.clear();

      transaction.oncomplete = () => {
        console.log('Cleared all cached data');
        resolve();
      };

      transaction.onerror = () => reject(transaction.error);
    });
  }

  async list(options = {}) {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(['files'], 'readonly');
      const store = transaction.objectStore('files');
      const request = store.getAll();

      request.onsuccess = () => {
        let entries = request.result;

        // Filter by source if specified
        if (options.source) {
          entries = entries.filter(entry => entry.source === options.source);
        }

        // Filter by dataType if specified
        if (options.dataType) {
          entries = entries.filter(entry => entry.dataType === options.dataType);
        }

        // Filter out runtime variables unless explicitly requested
        if (!options.includeVariables) {
          entries = entries.filter(entry => !entry.cacheKey.startsWith('var_'));
        }

        // Map to user-friendly format
        const results = entries.map(entry => ({
          cacheKey: entry.cacheKey,
          source: entry.source,
          dataType: entry.dataType,
          format: entry.format,
          size: entry.size,
          sizeFormatted: this.formatBytes(entry.size),
          timestamp: entry.timestamp,
          lastAccessed: entry.lastAccessed,
          age: Date.now() - entry.timestamp,
          ageFormatted: this.formatAge(Date.now() - entry.timestamp),
          url: entry.url
        }));

        // Sort by most recently accessed
        results.sort((a, b) => b.lastAccessed - a.lastAccessed);

        resolve(results);
      };
      request.onerror = () => reject(request.error);
    });
  }

  async getBySource(source) {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(['files'], 'readonly');
      const store = transaction.objectStore('files');
      const request = store.getAll();

      request.onsuccess = () => {
        const entries = request.result;
        const filtered = entries.filter(entry => entry.source === source);
        resolve(filtered);
      };
      request.onerror = () => reject(request.error);
    });
  }

  formatBytes(bytes) {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  formatAge(ms) {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days} day${days > 1 ? 's' : ''} ago`;
    if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    if (minutes > 0) return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
    return `${seconds} second${seconds > 1 ? 's' : ''} ago`;
  }

  // Runtime variable storage methods
  async storeVariable(key, value, metadata = {}) {
    if (!this.db) await this.init();

    // Use a special cache key for variables
    const cacheKey = `var_${key}`;

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(['files'], 'readwrite');
      const fileStore = transaction.objectStore('files');

      // Convert value to ArrayBuffer for storage
      let buffer;
      if (value instanceof ArrayBuffer) {
        buffer = value;
      } else if (typeof value === 'string') {
        buffer = new TextEncoder().encode(value).buffer;
      } else {
        // For objects/arrays, JSON stringify
        const jsonStr = JSON.stringify(value);
        buffer = new TextEncoder().encode(jsonStr).buffer;
      }

      // Store everything in files store
      const fileRequest = fileStore.put({
        cacheKey,
        data: buffer,
        url: `variable://${key}`,
        source: 'runtime',
        dataset: 'variables',
        format: metadata.format || 'json',
        digestible: true,
        filename: key,
        size: buffer.byteLength,
        timestamp: Date.now(),
        lastAccessed: Date.now(),
        variableKey: key,
        variableType: typeof value,
        ...metadata
      });

      transaction.oncomplete = () => {
        console.log(`Stored runtime variable: ${key} (${buffer.byteLength} bytes)`);
        resolve();
      };

      transaction.onerror = () => reject(transaction.error);
    });
  }

  async getVariable(key) {
    if (!this.db) await this.init();

    const cacheKey = `var_${key}`;

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(['files'], 'readonly');
      const fileStore = transaction.objectStore('files');

      // Get file data (everything is in files store now)
      const fileRequest = fileStore.get(cacheKey);

      fileRequest.onsuccess = () => {
        const entry = fileRequest.result;
        if (entry) {
          // Update last accessed time
          this.updateLastAccessed(cacheKey).catch(console.warn);

          // Convert back to original type
          let value;
          const uint8Array = new Uint8Array(entry.data);

          if (entry.variableType === 'string') {
            value = new TextDecoder().decode(uint8Array);
          } else if (entry.format === 'json' || entry.variableType === 'object') {
            const jsonStr = new TextDecoder().decode(uint8Array);
            try {
              value = JSON.parse(jsonStr);
            } catch (e) {
              value = jsonStr; // Fallback to string if JSON parse fails
            }
          } else {
            // Return as ArrayBuffer for binary data
            value = entry.data;
          }

          resolve({
            key: entry.variableKey,
            value,
            metadata: entry,
            timestamp: entry.timestamp,
            lastAccessed: entry.lastAccessed
          });
        } else {
          resolve(null);
        }
      };

      transaction.onerror = () => reject(transaction.error);
    });
  }

  async deleteVariable(key) {
    const cacheKey = `var_${key}`;
    return await this.delete(cacheKey);
  }

  async listVariables() {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(['files'], 'readonly');
      const store = transaction.objectStore('files');
      const request = store.getAll();

      request.onsuccess = () => {
        const allEntries = request.result;
        const variables = allEntries
          .filter(entry => entry.source === 'runtime' && entry.dataset === 'variables')
          .map(entry => ({
            key: entry.variableKey,
            type: entry.variableType,
            format: entry.format,
            size: entry.data?.byteLength || 0,
            timestamp: entry.timestamp,
            lastAccessed: entry.lastAccessed
          }));

        resolve(variables);
      };

      request.onerror = () => reject(request.error);
    });
  }

  // Save dataset results for later use
  async saveDataset(key, data, metadata = {}) {
    const datasetEntry = {
      data,
      savedAt: new Date().toISOString(),
      ...metadata
    };

    return await this.storeVariable(`dataset_${key}`, datasetEntry, {
      format: 'dataset',
      datasetKey: key
    });
  }

  // Load saved dataset
  async loadDataset(key) {
    const result = await this.getVariable(`dataset_${key}`);
    return result ? result.value : null;
  }

  // List saved datasets
  async listDatasets() {
    const allVars = await this.listVariables();
    return allVars.filter(v => v.key.startsWith('dataset_')).map(v => ({
      ...v,
      datasetKey: v.key.replace('dataset_', '')
    }));
  }

  // Delete saved dataset
  async deleteDataset(key) {
    return await this.deleteVariable(`dataset_${key}`);
  }

  // Auto-save retrieved data (convenience method)
  async saveRetrievedData(key, data, source, params = {}) {
    const metadata = {
      source,
      params,
      retrievedAt: new Date().toISOString(),
      autoSaved: true
    };

    return await this.saveDataset(key, data, metadata);
  }

  // Force cache a raw file that was downloaded (manual caching)
  async cacheRawFile(url, arrayBuffer, metadata = {}) {
    try {
      const buffer = arrayBuffer instanceof ArrayBuffer ? arrayBuffer : await arrayBuffer;

      // Determine format
      let format = 'unknown';
      if (url.includes('.nc') || url.includes('netcdf')) format = 'netcdf';
      else if (url.includes('.grb') || url.includes('.grib')) format = 'grib2';
      else if (url.includes('.json')) format = 'json';

      // Generate cache key using old method for manual caching
      const cacheKey = this.generateCacheKey(url, {
        source: metadata.source || 'manual',
        datatype: metadata.dataset || 'raw-file'
      });

      await this.put(cacheKey, buffer, {
        source: metadata.source || 'manual',
        dataset: metadata.dataset || 'raw-file',
        dataType: metadata.dataType || 'raw-file',
        format: format,
        digestible: format === 'json',
        filename: url.split('/').pop() || 'data',
        size: buffer.byteLength,
        manuallyCached: true,
        originalUrl: url,
        ...metadata
      });

      console.log(`Manually cached ${buffer.byteLength} bytes for: ${url}`);
      return true;
    } catch (error) {
      console.error('Failed to manually cache file:', error);
      return false;
    }
  }
}

// Global cache instance
const hydroLangCache = new HydroLangCache();

/**
 * Enhanced fetch with universal caching
 * @param {string} url - File URL to fetch
 * @param {Object} options - Fetch options and metadata
 * @returns {Promise<ArrayBuffer>} File data
 */

// Cache management API for global use
export const cacheAPI = {
  // Get cache statistics
  getStats: () => hydroLangCache.getStats(),

  // Clear all cached data
  clear: () => hydroLangCache.clear(),

  // Get cache entries by source
  getBySource: (source) => hydroLangCache.getBySource(source),

  // Delete specific cache entry
  delete: (cacheKey) => hydroLangCache.delete(cacheKey),

  // Force cleanup
  cleanup: () => hydroLangCache.cleanupIfNeeded(),

  // Runtime variable storage
  storeVariable: (key, value, metadata) => hydroLangCache.storeVariable(key, value, metadata),
  getVariable: (key) => hydroLangCache.getVariable(key),
  deleteVariable: (key) => hydroLangCache.deleteVariable(key),
  listVariables: () => hydroLangCache.listVariables(),

  // Dataset storage (for saving retrieved data)
  saveDataset: (key, data, metadata) => hydroLangCache.saveDataset(key, data, metadata),
  loadDataset: (key) => hydroLangCache.loadDataset(key),
  listDatasets: () => hydroLangCache.listDatasets(),
  deleteDataset: (key) => hydroLangCache.deleteDataset(key),
  saveRetrievedData: (key, data, source, params) => hydroLangCache.saveRetrievedData(key, data, source, params),
  cacheRawFile: (url, arrayBuffer, metadata) => hydroLangCache.cacheRawFile(url, arrayBuffer, metadata),

  // Chunked file operations
  putChunked: (url, arrayBuffer, metadata, chunkSize) => hydroLangCache.putChunked(url, arrayBuffer, metadata, chunkSize),
  getChunked: (baseKey) => hydroLangCache.getChunked(baseKey),

};

/**
 * Generate a simple cache key for non-gridded data
 * @ignore
 */
export function generateSimpleCacheKey(url, params = {}) {
  const source = context.source || 'unknown';
  const datatype = context.dataType || 'data';

  // Use user-provided cache ID if available
  if (context.cacheId) {
    // Special handling for Zarr chunks to ensure uniqueness even with a single cacheId
    // If we don't do this, all chunks would overwrite the same cache entry!
    if (url.includes('.zarr/')) {
      const chunkMatch = url.match(/\.zarr\/(.*)$/);
      if (chunkMatch && chunkMatch[1]) {
        // Append chunk path to user's ID (e.g. "my-storm-0.2.5")
        return `${source}/${datatype}/${context.cacheId}-${chunkMatch[1].replace(/\//g, '-')}`;
      }
    }
    return `${source}/${datatype}/${context.cacheId}`;
  }

  // Auto-generate 4-digit hash from URL only (ignore params to ensure cache hits for same file)
  const hashInput = url;
  let hash = 0;
  for (let i = 0; i < hashInput.length; i++) {
    hash = ((hash << 5) - hash) + hashInput.charCodeAt(i);
    hash = hash & hash;
  }
  const shortHash = Math.abs(hash).toString(36).substring(0, 4);

  return `${source}/${datatype}/${shortHash}`;
}

/**
 * Detect file format from URL or content type
 * @ignore
 */
export function detectFormat(url, contentType = '') {
  if (contentType.includes('application/json') || url.includes('outputFormat=application/json')) return 'json';
  if (contentType.includes('application/xml') || contentType.includes('text/xml')) return 'xml';
  if (contentType.includes('application/x-grib')) return 'grib2';
  if (contentType.includes('application/x-netcdf')) return 'netcdf';

  const urlPath = url.split('?')[0].toLowerCase();
  if (urlPath.endsWith('.nc')) return 'netcdf';
  if (urlPath.endsWith('.grib2') || urlPath.endsWith('.grb')) return 'grib2';
  if (urlPath.endsWith('.h5') || urlPath.endsWith('.hdf5')) return 'hdf5';
  if (urlPath.endsWith('.tif') || urlPath.endsWith('.tiff')) return 'geotiff';
  if (urlPath.endsWith('.zip')) return 'archive';
  if (url.includes('.zarr/')) {
    const pathAfterZarr = url.split('.zarr/')[1];
    if (pathAfterZarr && /^\d+\.\d+\.\d+$/.test(pathAfterZarr.split('/')[0])) {
      return 'zarr-chunk';
    }
    return 'zarr';
  }
  return 'unknown';
}

/**
 * Fetch with caching support
 * @ignore
 */
export async function cachedFetch(url, options = {}) {
  const cache = globalThis.hydro?.cache;

  // Safety check: if _originalFetch isn't set yet (e.g. called before init), use native fetch
  // This prevents "globalThis._originalFetch is not a function" errors
  const fetchFn = globalThis._originalFetch || globalThis.fetch;

  if (!cache) return fetchFn(url, options);

  const context = globalThis._hydroCacheContext || {};
  const cacheKey = generateSimpleCacheKey(context, url);

  // 1. CHECK CACHE FIRST (if caching is enabled)
  // If context.cache is explicitly false, skip cache read
  if (context.cache !== false) {
    try {
      const cached = await cache.get(cacheKey);
      if (cached) {
        console.log(`✓ Cache hit [${cacheKey}]`);
        const format = cached.metadata?.format;

        // Return appropriately based on format
        if (format === 'json' || format === 'xml') {
          return new Response(new Blob([cached.data], { type: cached.metadata.contentType }), {
            status: cached.metadata.responseStatus || 200,
            headers: { 'content-type': cached.metadata.contentType }
          });
        } else {
          return cached.data;  // Return ArrayBuffer for binary data
        }
      }
    } catch (e) {
      console.warn('Cache read failed:', e.message);
    }
  } else {
    console.log(`Cache disabled for this request: ${url}`);
  }

  // Not cached - need to fetch from server
  console.log(`Fetching from server: ${url}`);
  let response;
  let lastError;

  // Determine if this should be a chunked download
  // Don't chunk Zarr chunks (they're already individual files) or metadata files
  const isZarrChunk = url.includes('.zarr/') && /\d+\.\d+\.\d+$/.test(url.split('.zarr/')[1]);
  const isMetadataFile = url.includes('.zarray') || url.includes('.zattrs') || url.includes('.zgroup');

  // Check if this is a WFS/API request that returns JSON/XML (should NOT be chunked)
  const isWFSRequest = url.includes('service=WFS') || url.includes('service=WMS') ||
    url.includes('/ows?') || url.includes('/wfs?') ||
    url.includes('outputFormat=application/json') ||
    url.includes('outputFormat=json');

  // Check if this is a very large gridded data file that benefits from chunking
  const isLargeGriddedFile = url.match(/\.(grib2|grb2|nc|hdf|hdf5)(\?|$)/i) &&
    (url.includes('nomads.ncep.noaa.gov') || url.includes('amazonaws.com'));

  // Only use chunked download if:
  // 1. Explicitly requested via context.useChunkedDownload
  // 2. Expected size is known to be very large (>100MB) AND not explicitly disabled
  // 3. URL is a very large GRIB2/NetCDF from NOAA/AWS AND not explicitly disabled
  // DO NOT chunk: WFS requests, Zarr chunks, metadata files, or smaller files (PRISM zips, GeoTIFFs, etc.)

  // Explicit control:
  // context.useChunkedDownload === true -> Force chunked
  // context.useChunkedDownload === false -> Force NO chunked (if it was passed as false) -- wait, I set default to undefined/false in data.js for now?
  // Let's check how I set it in data.js: 
  // context.useChunkedDownload = params.chunked === true || params.chunked === 'auto'
  // So if params.chunked is false/undefined, we rely on auto detection? No, if the user wants to DISABLE it, we need to know.
  // Actually, in data.js I wrote: `useChunkedDownload: params.chunked === true || params.chunked === 'auto'`
  // If params.chunked is `false` (explicitly), `useChunkedDownload` will be `false`.
  // If params.chunked is `undefined` (default), `useChunkedDownload` will be `false`.
  // This logic is slightly flawed if we want "default auto, allow disable".

  // Correct logic in data.js should have been: `chunked: params.chunked`
  // And here we interpret:
  // if (context.params.chunked === true) -> Force YES
  // if (context.params.chunked === false) -> Force NO
  // if (undefined) -> Auto

  // Since I can't change data.js in this same turn easily (I just did, but let's stick to what I have or fix it).
  // In data.js I set `useChunkedDownload` based on `params.chunked`.
  // Wait, I should probably rely on `context.params.chunked` directly here for better clarity? 
  // context.params is available.

  const explicitChunked = context.params?.chunked;

  const shouldUseChunked = !isWFSRequest &&
    !isZarrChunk &&
    !isMetadataFile &&
    (explicitChunked === true || /* Force enable */
      (explicitChunked !== false && /* Not explicitly disabled */
        (
          context.useChunkedDownload || /* Legacy/Internal flag */
          (context.expectedSize && context.expectedSize > 100 * 1024 * 1024) ||
          isLargeGriddedFile
        )
      )
    );

  // Explicit proxy request
  const proxyRequested = options.proxy === true || options.params?.proxy === true || context.params?.proxy === true;

  // Skip direct fetch for URLs that will always fail with CORS oR if proxy explicit requested
  const skipDirectFetch = proxyRequested || url.includes('ncep.noaa.gov') || url.includes('nomads.ncep.noaa.gov') ||
    url.includes('amazonaws.com') || url.includes('nasa.gov');

  if (!skipDirectFetch) {
    try {
      if (shouldUseChunked) {
        console.log('Using chunked download');
        response = await cache.downloadChunked(url, {
          ...options,
          source: context.source || 'unknown',
          expectedSize: context.expectedSize,
          params: context.params
        });
      } else {
        response = await globalThis._originalFetch(url, options);
      }

      // Check if successful - if not, try proxies
      if (!response || !response.ok) {
        response = null;
      }
    } catch (error) {
      lastError = error;
      console.warn('Direct fetch failed, trying proxies:', error.message);
      response = null;
    }
  } else {
    console.log('Skipping direct fetch for CORS-restricted URL, using proxies');
  }

  // Only try proxies if direct fetch failed or was skipped
  if (!response && globalThis.hydro?.proxies) {
    const proxies = globalThis.hydro.proxies;

    // Try local proxies
    if (proxies['local-proxy']?.endpoint) {
      // Handle both single URL and array of URLs
      const proxyEndpoints = Array.isArray(proxies['local-proxy'].endpoint)
        ? proxies['local-proxy'].endpoint
        : [proxies['local-proxy'].endpoint];

      for (const proxyBaseUrl of proxyEndpoints) {
        try {
          const proxiedUrl = proxyBaseUrl + url;
          if (shouldUseChunked) {
            response = await cache.downloadChunked(proxiedUrl, {
              ...options,
              source: context.source || 'unknown',
              expectedSize: url.includes('noaa.gov') ? 100 * 1024 * 1024 : context.expectedSize, // Assume large for NOAA
              params: {
                ...context.params,
                source: context.source || 'unknown',
                originalUrl: url,  // Preserve original URL for cache key generation
                skipSizeDetection: url.includes('noaa.gov') // Skip HEAD requests for NOAA
              }
            });
          } else {
            response = await globalThis._originalFetch(proxiedUrl, options);
          }

          break;
        } catch (proxyError) {
          lastError = proxyError;
        }
      }
    }

    // Try CORS proxy
    if (!response && proxies['researchverse']) {
      try {
        const proxiedUrl = proxies['researchverse'].endpoint + url;
        if (shouldUseChunked) {
          response = await cache.downloadChunked(proxiedUrl, {
            ...options,
            source: context.source || 'unknown',
            expectedSize: url.includes('noaa.gov') ? 100 * 1024 * 1024 : context.expectedSize, // Assume large for NOAA
            params: {
              ...context.params,
              source: context.source || 'unknown',
              originalUrl: url,  // Preserve original URL for cache key generation
              skipSizeDetection: url.includes('noaa.gov') // Skip HEAD requests for NOAA
            }
          });
        } else {
          response = await globalThis._originalFetch(proxiedUrl, options);
        }
        console.log('CORS proxy succeeded');
      } catch (proxyError) {
        lastError = proxyError;
      }
    }
  }

  if (!response) {
    throw new Error(`All fetch attempts failed: ${lastError?.message}`);
  }

  // 3. DETECT FORMAT ONCE
  const contentType = response.headers.get('content-type') || '';
  const format = detectFormat(url, contentType);
  const isAPIResponse = (format === 'json' || format === 'xml');

  // 4. CACHE THE DATA (chunked downloads already cached)
  // context.cache !== false checks if caching is enabled (default is true)
  if (!shouldUseChunked && context.cache !== false) {
    try {
      const buffer = await response.clone().arrayBuffer();
      const isZarrChunk = (format === 'zarr-chunk');
      const isLargeFile = !isZarrChunk && buffer.byteLength > 5 * 1024 * 1024;

      const metadata = {
        source: context.source || 'unknown',
        dataset: context.dataset || context.source || 'unknown',
        dataType: context.dataType || 'data',
        format: format,
        contentType: contentType,
        digestible: isAPIResponse,
        filename: url.split('/').pop() || 'data',
        size: buffer.byteLength,
        responseStatus: response.status,
        responseOk: response.ok,
        params: context.params || {},
        isChunkData: isZarrChunk,
        originalUrl: url  // Store the actual fetch URL
      };

      if (isLargeFile) {
        await cache.putChunked(cacheKey, buffer, { ...metadata, chunked: true });
      } else {
        await cache.put(cacheKey, buffer, metadata);
      }

      console.log(`✓ Cached [${cacheKey}]: ${format} (${(buffer.byteLength / 1024).toFixed(0)}KB)`);
    } catch (e) {
      console.warn('Caching failed:', e.message);
    }
  }

  // 5. RETURN APPROPRIATELY
  if (isAPIResponse) {
    return response;  // Return Response object for API calls
  } else {
    return await response.arrayBuffer();  // Return ArrayBuffer for binary data
  }
}

// Export the cache class and instance
export { HydroLangCache, hydroLangCache as cache };