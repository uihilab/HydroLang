# HydroLang Data Sources

This directory contains various data source implementations for accessing hydrological, meteorological, and geospatial data. Each data source provides specific functionality for retrieving different types of environmental data.

## Documentation

Detailed documentation for each data source is available in the [`documentation/`](./documentation/) folder. Each data source has its own comprehensive README with usage examples, data characteristics, and technical details.

## Available Data Sources

### Meteorological and Climate Data

| Data Source | Description | Documentation |
|-------------|-------------|---------------|
| **AORC** | Analysis of Record for Calibration - High-resolution meteorological forcing data | [aorc.md](./documentation/aorc.md) |
| **HRRR** | High Resolution Rapid Refresh - Real-time weather forecasts and analysis | [hrrr.md](./documentation/hrrr.md) |
| **MRMS** | Multi-Radar Multi-Sensor - High-resolution precipitation and radar data | [mrms.md](./documentation/mrms.md) |
| **NLDAS** | North American Land Data Assimilation System - Meteorological forcing data | [nldas.md](./documentation/nldas.md) |
| **PRISM** | Parameter-elevation Relationships on Independent Slopes Model - Climate data | [prism.md](./documentation/prism.md) |

### Hydrological Data

| Data Source | Description | Documentation |
|-------------|-------------|---------------|
| **NWM** | National Water Model - Streamflow simulations and forecasts | [nwm.md](./documentation/nwm.md) |

### Geospatial and Elevation Data

| Data Source | Description | Documentation |
|-------------|-------------|---------------|
| **3DEP** | 3D Elevation Program - High-resolution elevation data | [threedep.md](./documentation/threedep.md) |

### Flood Damage and Mitigation Data

| Data Source | Description | Documentation |
|-------------|-------------|---------------|
| **DM Data Sources** | Flood damage assessment and mitigation planning data for Iowa communities | [dm_datasources.md](./documentation/dm_datasources.md) |

## Quick Start

```javascript
// Example: Retrieve elevation data for a location
const elevationData = await hydro.data.retrieve({
  params: {
    source: "threedep",
    datatype: "point-data"
  },
  args: {
    dataset: "3dep-dem",
    variables: ["elevation"],
    latitude: 40.7128,
    longitude: -74.0060
  }
});

// Example: Get precipitation data
const precipData = await hydro.data.retrieve({
  params: {
    source: "aorc",
    datatype: "point-data"
  },
  args: {
    dataset: "aorc-v1.1",
    variables: ["APCP_surface"],
    latitude: 39.7392,
    longitude: -104.9903,
    startDate: "2020-07-01T00:00:00Z",
    endDate: "2020-07-01T23:00:00Z"
  }
});
```

## Data Source Categories

### Real-time/Operational Data
- **HRRR**: Hourly weather forecasts and analysis
- **MRMS**: Near real-time precipitation and radar data
- **AORC**: Historical meteorological forcing data

### Historical/Archive Data
- **NWM**: Long-term streamflow simulations (1979-present)
- **NLDAS**: Meteorological forcing data (1979-present)
- **PRISM**: Historical climate data (1895-present)
- **3DEP**: Static elevation data

### Specialized/Local Data
- **DM Data Sources**: Iowa-specific flood damage and mitigation data
- Community-level flood risk assessment tools
- Property-level damage functions and mitigation costs

## API Structure

All data sources follow a consistent API pattern:

```javascript
const result = await hydro.data.retrieve({
  params: {
    source: "datasource_name",    // Data source identifier
    datatype: "data_type"         // Type of data to retrieve
  },
  args: {
    // Data source specific parameters
    dataset: "dataset_name",
    variables: ["variable1", "variable2"],
    // ... additional parameters
  }
});
```

## Error Handling

```javascript
try {
  const result = await hydro.data.retrieve({
    params: { source: "example", datatype: "point-data" },
    args: { /* parameters */ }
  });

  if (result.error) {
    console.error('Data retrieval failed:', result.error);
  } else {
    console.log('Data retrieved successfully');
  }
} catch (error) {
  console.error('Request failed:', error.message);
}
```

## Getting Help

- **Documentation**: Check the [`documentation/`](./documentation/) folder for detailed guides
- **Examples**: Each data source README contains comprehensive usage examples
- **API Reference**: Technical details and parameter specifications are provided in each guide

## Contributing

When adding new data sources:
1. Create a new datasource implementation file (e.g., `newsource.js`)
2. Add comprehensive documentation in the `documentation/` folder
3. Update this README to include the new data source
4. Follow the established API patterns and documentation standards

## Cache System

HydroLang includes a sophisticated caching system that automatically caches downloaded data files to prevent loss of large downloads when processing fails. The cache system provides both automatic file caching and user-controlled runtime variable storage.

### Features

- **Automatic Caching**: Downloaded files are automatically cached to prevent data loss
- **Size Management**: 100GB total capacity with intelligent cleanup
- **Expiration**: 90-day automatic expiration of cached files
- **Format Awareness**: Tracks whether cached data is directly usable in the web application
- **Runtime Variables**: Store and retrieve user variables at runtime
- **Cache Controls**: Enable/disable caching per request

### Cache Controls in Retrieve Function

The `retrieve` function accepts cache control parameters:

```javascript
// Default behavior - caching enabled
const result = await hydro.data.retrieve({
  params: {
    source: "nldas",
    datatype: "point-data",
    cache: true  // Enable caching (default)
  },
  args: { /* ... */ }
});

// Disable caching for this request
const result = await hydro.data.retrieve({
  params: {
    source: "nldas",
    datatype: "point-data",
    cache: false  // Disable caching
  },
  args: { /* ... */ }
});

// Cache-only mode (only return cached data, don't fetch new)
const result = await hydro.data.retrieve({
  params: {
    source: "nldas",
    datatype: "point-data",
    cacheOnly: true  // Only use cached data
  },
  args: { /* ... */ }
});
```

### Cache Management

The cache system provides global access through `globalThis.hydroLangCache`:

```javascript
// Get cache statistics
await globalThis.hydroLangCache.getStats()

// Clear all cached data
await globalThis.hydroLangCache.clear()

// Get cached files by data source
await globalThis.hydroLangCache.getBySource('nldas')

// Force cleanup of expired files
await globalThis.hydroLangCache.cleanup()

// Delete specific cache entry
await globalThis.hydroLangCache.delete(cacheKey)
```

### Runtime Variable Storage

Store and retrieve variables at runtime (persists across sessions):

```javascript
// Store a variable
await globalThis.hydroLangCache.storeVariable('myModel', {
  parameters: [1, 2, 3],
  metadata: { version: '1.0' }
});

// Retrieve a variable
const stored = await globalThis.hydroLangCache.getVariable('myModel');
console.log(stored.value); // { parameters: [1, 2, 3], metadata: { version: '1.0' } }

// List all stored variables
const variables = await globalThis.hydroLangCache.listVariables();

// Delete a variable
await globalThis.hydroLangCache.deleteVariable('myModel');
```

### Cache Architecture

- **Storage**: IndexedDB for persistent, large-scale storage
- **Key Generation**: Smart keys based on URL + request parameters
- **Cleanup**: Automatic removal of expired/old files when capacity is reached
- **Thread Safety**: Handles concurrent access safely
- **Performance**: Optimized for large file storage and retrieval

## License and Terms of Use

Data sources may have different licensing terms and usage restrictions. Please refer to:
- Individual data source documentation for specific terms
- Original data provider websites for licensing information
- Attribution requirements for each data source