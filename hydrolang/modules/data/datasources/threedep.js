/**
 * 3D Elevation Program (3DEP) datasource
 * Provides access to high-resolution elevation data from the USGS 3DEP service
 * Supports DEM (Digital Elevation Model) data in various resolutions
 * @type {Object}
 * @name 3DEP
 * @author  kento-sugiyama
 * @memberof datasources
 */

// 3DEP Dataset configurations
const THREED_EP_DATASETS = {
  "3dep-dem": {
    baseUrl: "https://elevation.nationalmap.gov/arcgis/rest/services/3DEPElevation/ImageServer",
    description: "3D Elevation Program - Digital Elevation Model data from USGS",
    spatial: {
      coverage: "CONUS (Continental United States)",
      resolution: { min: 1, max: 30, units: "meters" },
      crs: "EPSG:5070 (Albers Equal Area)",
      outputCrs: "EPSG:4326 (WGS84)"
    },
    temporal: {
      description: "Static elevation data - no temporal component",
      version: "Current"
    },
    features: {
      format: "GeoTIFF",
      pixelType: "32-bit float",
      compression: "LZ77",
      maxImageSize: 2048
    }
  }
};

// Available 3DEP variables (elevation data)
const THREED_EP_VARIABLES = {
  "elevation": {
    longName: "Digital Elevation Model",
    units: "meters",
    scaleFactor: 1.0,
    fillValue: -999999,
    dtype: "float32",
    description: "Elevation values above NAVD88 datum",
    product: "dem",
    format: "geotiff",
    spatialReference: "EPSG:5070"
  }
};

export default {
  // Grid data extraction - spatial subset of elevation data
  "grid-data": {
    endpoint: null, // Dynamic endpoint based on dataset
    params: {
      dataset: null, // Dataset identifier (e.g., "3dep-dem")
      variables: null, // Array of variable names (usually ["elevation"])
      bbox: null, // Bounding box: [west, south, east, north] in WGS84
      resolution: null, // Resolution in meters (1, 3, 5, 10, 30)
      format: null // Output format: "geotiff", "json", "georaster"
    },
    methods: {
      type: "json",
      method: "GET"
    }
  },

  // Point elevation extraction - single location elevation
  "point-data": {
    endpoint: null, // Dynamic endpoint based on dataset
    params: {
      dataset: null, // Dataset identifier
      variables: null, // Variable names (usually ["elevation"])
      latitude: null, // Latitude coordinate
      longitude: null, // Longitude coordinate
      format: null // Output format
    },
    methods: {
      type: "json",
      method: "GET"
    }
  },

  // Dataset metadata and information
  "dataset-info": {
    endpoint: null, // Dynamic endpoint based on dataset
    params: {
      dataset: null, // Dataset identifier
      info: null // Type of info: "variables", "spatial", "metadata"
    },
    methods: {
      type: "json",
      method: "GET"
    }
  },

  requirements: {
    needProxy: false,
    requireskey: false,
  },

  info: {
    returnFormats: "geotiff, json, georaster",
    MoreInfo: "https://www.usgs.gov/3d-elevation-program",
    About: "The 3D Elevation Program (3DEP) provides high-resolution elevation data for the United States. Data is served through the USGS National Map service as GeoTIFF files."
  },

  // Available datasets and their configurations
  datasets: THREED_EP_DATASETS,

  // Available variables and their properties
  variables: THREED_EP_VARIABLES,

  "endpoint-info": {
    "grid-data": {
      paramFormat: {
        dataset: "String - Dataset identifier (e.g., '3dep-dem')",
        variables: "Array - Variable names (usually ['elevation'])",
        bbox: "Array - Bounding box [west, south, east, north] in WGS84 coordinates",
        resolution: "Number - Resolution in meters (1, 3, 5, 10, 30)",
        format: "String - Output format ('geotiff', 'json', 'georaster')"
      },
      infoSource: "https://www.usgs.gov/3d-elevation-program",
      example: {
        dataset: "3dep-dem",
        variables: ["elevation"],
        bbox: [-75.0, 40.0, -73.0, 42.0],
        resolution: 10,
        format: "georaster",
        exampleRequest: "Extract DEM data for New York region at 10m resolution"
      }
    },
    "point-data": {
      paramFormat: {
        dataset: "String - Dataset identifier",
        variables: "Array - Variable names (usually ['elevation'])",
        latitude: "Number - Latitude coordinate (-90 to 90)",
        longitude: "Number - Longitude coordinate (-180 to 180)",
        format: "String - Output format"
      },
      infoSource: "https://www.usgs.gov/3d-elevation-program",
      example: {
        dataset: "3dep-dem",
        variables: ["elevation"],
        latitude: 40.7128,
        longitude: -74.0060,
        format: "json",
        exampleRequest: "Get elevation for New York City coordinates"
      }
    },
    "dataset-info": {
      paramFormat: {
        dataset: "String - Dataset identifier",
        info: "String - Information type ('variables', 'spatial', 'metadata')"
      },
      infoSource: "https://www.usgs.gov/3d-elevation-program",
      example: {
        dataset: "3dep-dem",
        info: "spatial",
        exampleRequest: "Get spatial coverage information for 3DEP dataset"
      }
    }
  }
};
