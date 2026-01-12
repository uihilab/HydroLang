/**
 * Data utilities index
 * Main exports for all data manipulation utilities
 * Centralized gridded data source configuration and processing
 */

// Base classes for gridded data sources (GriddedDataSource, ZarrDataSource, GRIB2DataSource, etc.)
export * from './gridded-data-utils.js';

// General data transformation utilities
export * from './data-transformers.js';

// Data caching utilities
export * from './data-cache.js';

// Chunked file processing utilities
export * from './chunked-file-utils.js';

// Import all DataSource classes locally for GRIDDED_SOURCES
import { AORCDataSource } from './aorc-utils.js';
import { NWMDataSource } from './nwm-utils.js';
import { NLDASDataSource } from './nldas-utils.js';
import { MRMSDataSource } from './mrms-utils.js';
import { HRRRDataSource } from './hrrr-utils.js';
import { ECMWFDataSource } from './ecmwf-utils.js';
import { PRISMDataSource } from './prism-utils.js';
import { DEPDataSource } from './threedep-utils.js';
import { loadGridDataLibrary } from './gridded-data-utils.js';

/**
 * Configuration for gridded data sources
 * Maps source name to DataSource class and method mapping
 * Centralized in utils to keep data.js clean
 */
export const GRIDDED_SOURCES = {
  aorc: {
    library: 'zarr',
    DataSourceClass: AORCDataSource,
    methods: {
      'point-data': 'extractPointData',
      'grid-data': 'extractGridData',
      'timeseries-data': 'extractTimeSeries',
      'dataset-info': 'getDatasetInfo'
    }
  },
  mrms: {
    library: 'grib2',
    DataSourceClass: MRMSDataSource,
    methods: {
      'point-data': 'extractPointData',
      'grid-data': 'extractGridData',
      'timeseries-data': 'extractTimeSeries',
      'dataset-info': 'getDatasetInfo',
      'available-products': 'getAvailableProducts'
    }
  },
  hrrr: {
    library: 'grib2',
    DataSourceClass: HRRRDataSource,
    methods: {
      'point-data': 'extractPointData',
      'grid-data': 'extractGridData',
      'timeseries-data': 'extractTimeSeries',
      'dataset-info': 'getDatasetInfo'
    }
  },
  prism: {
    library: 'geospatial',
    DataSourceClass: PRISMDataSource,
    methods: {
      'point-data': 'extractPointData',
      'grid-data': 'extractGridData',
      'timeseries-data': 'extractTimeSeries',
      'dataset-info': 'getDatasetInfo'
    }
  },
  nwm: {
    library: 'zarr',
    DataSourceClass: NWMDataSource,
    methods: {
      'point-data': 'extractPointData',
      'grid-data': 'extractGridData',
      'timeseries-data': 'extractTimeSeries',
      'bulk-extraction': 'extractBulkData'
    },
    // NWM preprocessing requires access to retrieve function, will be set from data.js
    preProcess: null
  },
  threedep: {
    library: 'geospatial',
    DataSourceClass: DEPDataSource,
    methods: {
      'point-data': 'fetchPointElevation',
      'grid-data': 'fetchDEMData'
    }
  },

};

/**
 * Generic processor for all gridded data sources
 * Replaces 8 individual processXXXData functions with a single unified handler
 * Centralized in utils to keep data.js clean
 * 
 * @param {string} source - Source name (e.g., 'aorc', 'mrms', 'hrrr')
 * @param {string} dataType - Data type (e.g., 'point-data', 'grid-data')
 * @param {Object} args - Arguments for data extraction
 * @param {Object} datasources - Datasources configuration object
 * @returns {Promise} Result from data source
 */
export async function processGriddedSource(source, dataType, args, datasources) {
  const config = GRIDDED_SOURCES[source];
  if (!config) {
    throw new Error(`Unknown gridded source: ${source}`);
  }

  // Resolve datasource config, handling both direct and default export structures
  console.log(`[Data Debug] processGriddedSource called for source: ${source}`);
  console.log(`[Data Debug] datasources keys: ${Object.keys(datasources)}`);
  if (datasources.default) {
    console.log(`[Data Debug] datasources.default keys: ${Object.keys(datasources.default)}`);
  }

  let sourceConfig = datasources[source];
  if (!sourceConfig && datasources.default && datasources.default[source]) {
    console.log(`[Data Debug] Found ${source} in datasources.default`);
    sourceConfig = datasources.default[source];
  } else if (sourceConfig) {
    console.log(`[Data Debug] Found ${source} directly in datasources`);
  } else {
    console.error(`[Data Debug] Could not find ${source} anywhere!`);
  }

  // CRITICAL: Handle Module Namespace Objects (where default export is nested in .default)
  if (sourceConfig && sourceConfig.default && !sourceConfig.datasets) {
    console.log(`[Data Debug] Unwrapping .default from ${source} config`);
    sourceConfig = sourceConfig.default;
  }

  if (!sourceConfig || !sourceConfig.datasets) {
    console.error(`[Data] Failed to resolve datasource configuration for '${source}'`, {
      direct: !!datasources[source],
      inDefault: !!(datasources.default && datasources.default[source]),
      keys: Object.keys(datasources),
      sourceConfigStructure: JSON.stringify(sourceConfig, (key, value) => {
        // Circular reference protection + simple typing
        if (key === 'default') return '[Object]';
        return value;
      })
    });
    // Check if it's an empty object which implies bad import
    if (sourceConfig && Object.keys(sourceConfig).length === 0) {
      console.error(`[Data Debug] Config for ${source} is an empty object! Imports may be broken.`);
    }
    throw new Error(`Configuration for source '${source}' is missing or invalid (datasets property not found).`);
    throw new Error(`Configuration for source '${source}' is missing or invalid (datasets property not found).`);
  }

  // Get dataset configuration from resolved sourceConfig
  const dataset = args.dataset || Object.keys(sourceConfig.datasets)[0];
  const originalConfig = sourceConfig.datasets[dataset];
  if (!originalConfig) {
    throw new Error(`Unknown ${source} dataset: ${dataset}`);
  }
  // Inject name into configuration for internal use
  const datasetConfig = { ...originalConfig, name: dataset };

  // Get the method name for this dataType
  const methodName = config.methods[dataType];
  if (!methodName) {
    throw new Error(`Unsupported ${source} data type: ${dataType}`);
  }

  try {
    const DataSourceClass = config.DataSourceClass;
    const dataSourceInstance = new DataSourceClass(datasetConfig, sourceConfig.variables || {});

    // Ensure library is loaded (only if processing is enabled)
    if (args.process !== false) {
      await dataSourceInstance.loadLibrary();
    }

    // Call the method directly on the class instance
    if (typeof dataSourceInstance[methodName] !== 'function') {
      throw new Error(`Method ${methodName} not found on ${source} data source`);
    }

    // Unpack arguments based on dataType (methods expect individual params, not an args object)
    let result;

    // Special handling for 3DEP: pass args object directly as per new design
    if (source === 'threedep') {
      result = await dataSourceInstance[methodName](args);
    } else {
      // Standard gridded data source signatures (Legacy/Unchanged for now)
      switch (dataType) {
        case 'point-data':
          result = await dataSourceInstance[methodName](
            args.variable || args.variables?.[0],
            args.latitude,
            args.longitude,
            args.startDate ? new Date(args.startDate) : new Date(),
            args
          );
          break;
        case 'grid-data':
          result = await dataSourceInstance[methodName](
            args.variable || args.variables?.[0],
            args.bbox,
            args.startDate ? new Date(args.startDate) : new Date(),
            args
          );
          break;
        case 'timeseries-data':
          result = await dataSourceInstance[methodName](
            args.variable || args.variables?.[0],
            args.latitude,
            args.longitude,
            args.startDate ? new Date(args.startDate) : new Date(),
            args.endDate ? new Date(args.endDate) : new Date(),
            args
          );
          break;
        default:
          // For dataset-info, available-products, bulk-extraction, etc.
          result = await dataSourceInstance[methodName](args);
      }
    }

    return result;
  } catch (error) {
    // If error is about missing library, try to load it
    if (error.message && (error.message.includes('library') || error.message.includes('Library') ||
      error.message.includes('not available') || error.message.includes('not loaded'))) {
      console.log(`[data] Attempting to load required ${config.library} library...`);
      try {
        await loadGridDataLibrary(config.library);
        console.log(`[data] ${config.library} library loaded successfully, retrying...`);

        // Retry with library loaded
        const DataSourceClass = config.DataSourceClass;
        const dataSourceInstance = new DataSourceClass(datasetConfig, sourceConfig.variables || {});
        await dataSourceInstance.loadLibrary();

        // Unpack arguments the same way
        let retryResult;

        // Special handling for 3DEP
        if (source === 'threedep') {
          retryResult = await dataSourceInstance[methodName](args);
        } else {
          // Standard gridded data source signatures
          switch (dataType) {
            case 'point-data':
              retryResult = await dataSourceInstance[methodName](
                args.variable || args.variables?.[0],
                args.latitude,
                args.longitude,
                args.startDate ? new Date(args.startDate) : new Date(),
                args
              );
              break;
            case 'grid-data':
              retryResult = await dataSourceInstance[methodName](
                args.variable || args.variables?.[0],
                args.bbox,
                args.startDate ? new Date(args.startDate) : new Date(),
                args
              );
              break;
            case 'timeseries-data':
              retryResult = await dataSourceInstance[methodName](
                args.variable || args.variables?.[0],
                args.latitude,
                args.longitude,
                args.startDate ? new Date(args.startDate) : new Date(),
                args.endDate ? new Date(args.endDate) : new Date(),
                args
              );
              break;
            default:
              retryResult = await dataSourceInstance[methodName](args);
          }
        }

        return retryResult;
      } catch (loadError) {
        throw new Error(`Failed to load required ${config.library} library: ${error.message}`);
      }
    }

    console.error(`${source.toUpperCase()} processing error: ${error.message}`);
    throw new Error(`${source.toUpperCase()} data processing failed: ${error.message}`);
  }
}
