# HRRR (High Resolution Rapid Refresh) Data Source

## Overview

The HRRR data source provides high-resolution, short-term weather forecasts for the continental United States. HRRR is a real-time atmospheric model that produces forecasts with 3km horizontal resolution and hourly temporal resolution, making it ideal for weather analysis, forecasting, and hydrological applications.

## Data Characteristics

### Temporal Coverage
- **Model Cycles**: Every hour (00Z, 01Z, ..., 23Z)
- **Forecast Range**: 0-48 hours (varies by product)
- **Temporal Resolution**: Hourly
- **Time Zone**: UTC
- **Archive Depth**: ~7 days (operational), historical data available
- **Update Frequency**: Hourly

### Spatial Coverage
- **Geographic Extent**: Continental United States (CONUS)
- **Spatial Resolution**: 3km (~0.027°)
- **Coordinate System**: Lambert Conformal Conic
- **Grid Dimensions**: 1381 × 1381 (approximately 1.9M grid points)

### Available Variables

#### Surface Variables
| Variable | GRIB2 Code | Units | Description | Products |
|----------|------------|-------|-------------|----------|
| `APCP` | 0,1,8 | kg/m² | Accumulated precipitation | sfc, subh |
| `TMP` | 0,0,0 | K | Temperature at 2m | sfc |
| `DPT` | 0,0,6 | K | Dewpoint temperature at 2m | sfc |
| `RH` | 0,1,1 | % | Relative humidity at 2m | sfc |
| `UGRD` | 0,2,2 | m/s | U-component of wind at 10m | sfc |
| `VGRD` | 0,2,3 | m/s | V-component of wind at 10m | sfc |
| `WIND` | 0,2,1 | m/s | Wind speed at 10m | sfc |
| `WDIR` | 0,2,0 | degrees | Wind direction at 10m | sfc |
| `PRMSL` | 0,3,1 | Pa | Mean sea level pressure | sfc |
| `VIS` | 0,19,0 | m | Visibility | sfc |
| `TCDC` | 0,6,1 | % | Total cloud cover | sfc |

#### Precipitation Products
| Variable | Units | Description | Accumulation |
|----------|-------|-------------|--------------|
| `APCP` | mm | Precipitation amount | 1-hour |
| `PRATE` | kg/m²/s | Precipitation rate | Instantaneous |

#### Atmospheric Variables
| Variable | Units | Description | Levels |
|----------|-------|-------------|--------|
| `HGT` | m | Geopotential height | 1000-100 mb |
| `REFC` | dBZ | Composite reflectivity | Column maximum |

### Available Products
- **sfc**: Surface analysis and forecast fields
- **subh**: Sub-hourly precipitation (15-minute)
- **prs**: Pressure level data
- **nat**: Native level data

## Usage Examples

### Point Data Extraction

```javascript
// Extract current temperature for New York City
const result = await hydro.data.retrieve({
  params: {
    source: "hrrr",
    datatype: "point-data"
  },
  args: {
    dataset: "hrrr-operational",
    variable: "TMP",
    latitude: 40.7128,
    longitude: -74.0060,
    startDate: "2025-09-24T12:00:00Z",
    forecastHour: 0, // Analysis (0-hour forecast)
    product: "sfc"
  }
});

// Result structure
{
  "variable": "TMP",
  "location": {
    "latitude": 40.7128,
    "longitude": -74.0060
  },
  "timestamp": "2025-09-24T12:00:00.000Z",
  "value": 295.15, // Kelvin
  "metadata": {
    "units": "K",
    "longName": "Temperature",
    "product": "sfc",
    "source": "HRRR",
    "fileUrl": "https://nomads.ncep.noaa.gov/pub/data/nccf/com/hrrr/...",
    "format": "grib2",
    "forecastHour": 0,
    "resolution": "3km",
    "grib2Parameter": "0,0,0"
  }
}
```

### Precipitation Grid Data

```javascript
// Extract 1-hour precipitation forecast for Houston area
const result = await hydro.data.retrieve({
  params: {
    source: "hrrr",
    datatype: "grid-data"
  },
  args: {
    dataset: "hrrr-operational",
    variable: "APCP",
    bbox: [-95.8, 29.3, -95.0, 30.0], // Houston metropolitan area
    startDate: "2025-09-24T12:00:00Z",
    forecastHour: 6 // 6-hour forecast
  }
});

// Result structure
{
  "variable": "APCP",
  "bbox": [-95.8, 29.3, -95.0, 30.0],
  "timestamp": "2025-09-24T12:00:00.000Z",
  "data": {
    "values": [
      [0.0, 0.5, 1.2, 0.8, ...], // 2D array [lat][lon] in mm
      [0.2, 0.9, 2.1, 1.5, ...],
      // ... more rows
    ],
    "coordinates": {
      "latitude": [30.0, 29.98, 29.96, ...],
      "longitude": [-95.8, -95.78, -95.76, ...]
    },
    "shape": [27, 30],
    "bounds": {
      "north": 30.0,
      "south": 29.3,
      "east": -95.0,
      "west": -95.8
    }
  },
  "metadata": {
    "units": "kg/m²",
    "longName": "Total Precipitation",
    "product": "sfc",
    "source": "HRRR",
    "forecastHour": 6,
    "resolution": "3km",
    "bbox": [-95.8, 29.3, -95.0, 30.0],
    "grib2Parameter": "0,1,8"
  }
}
```

### Raw GRIB2 Data (for Worker Pool Processing)

```javascript
// Get raw GRIB2 data without parsing (for custom processing)
const result = await hydro.data.retrieve({
  params: {
    source: "hrrr",
    datatype: "grid-data"
  },
  args: {
    dataset: "hrrr-operational",
    variable: "APCP",
    bbox: [-95.8, 29.3, -95.0, 30.0],
    startDate: "2025-09-24T12:00:00Z",
    forecastHour: 6,
    parse: false // NEW: Return raw GRIB2 data
  }
});

// Result structure for raw data
{
  "variable": "APCP",
  "bbox": [-95.8, 29.3, -95.0, 30.0],
  "timestamp": "2025-09-24T12:00:00.000Z",
  "rawData": {
    "buffer": ArrayBuffer(150979483), // Raw GRIB2 data
    "size": 150979483,               // Size in bytes
    "format": "grib2",              // File format
    "url": "https://nomads.ncep.noaa.gov/..."
  },
  "metadata": {
    "units": "kg/m²",
    "longName": "Total Precipitation",
    "product": "sfc",
    "source": "HRRR",
    "parsed": false,
    "notes": "Raw GRIB2 data - use worker pool for parsing"
  }
}
```

### Time Series Forecasts

```javascript
// Extract temperature time series for a location
const result = await hydro.data.retrieve({
  params: {
    source: "hrrr",
    datatype: "timeseries-data"
  },
  args: {
    dataset: "hrrr-operational",
    variable: "TMP",
    latitude: 39.7392,
    longitude: -104.9903,
    startDate: "2025-09-24T12:00:00Z",
    endDate: "2025-09-25T12:00:00Z" // 24-hour forecast
  }
});

// Result structure
{
  "variable": "TMP",
  "location": {
    "latitude": 39.7392,
    "longitude": -104.9903
  },
  "timeRange": {
    "start": "2025-09-24T12:00:00Z",
    "end": "2025-09-25T12:00:00Z"
  },
  "data": [
    {
      "timestamp": "2025-09-24T12:00:00.000Z",
      "value": 298.15,
      "forecastHour": 0
    },
    {
      "timestamp": "2025-09-24T13:00:00.000Z",
      "value": 299.25,
      "forecastHour": 1
    },
    // ... 24 hourly values
  ],
  "metadata": {
    "source": "HRRR",
    "temporalResolution": "1H",
    "count": 25,
    "validCount": 25,
    "forecastHours": [0, 1, 2, ..., 24]
  }
}
```

### Multiple Variables

```javascript
// Extract multiple weather variables simultaneously
const result = await hydro.data.retrieve({
  params: {
    source: "hrrr",
    datatype: "point-data"
  },
  args: {
    dataset: "hrrr-operational",
    variables: ["TMP", "APCP", "UGRD", "VGRD", "RH"],
    latitude: 40.7128,
    longitude: -74.0060,
    startDate: "2025-09-24T12:00:00Z",
    forecastHour: 3
  }
});
```

## Forecast Hours and Model Cycles

### Understanding Model Cycles
```javascript
// Model run at 12Z with 6-hour forecast
args: {
  startDate: "2025-09-24T12:00:00Z", // Model initialization time
  forecastHour: 6                    // Valid time: 18Z same day
}

// Analysis (0-hour forecast) - current conditions
args: {
  startDate: "2025-09-24T12:00:00Z",
  forecastHour: 0 // Most accurate, based on observations
}
```

### Available Forecast Hours
- **Analysis**: 0 hours (current conditions)
- **Short-term**: 1-18 hours (high accuracy)
- **Medium-term**: 19-36 hours (moderate accuracy)
- **Extended**: 37-48 hours (lower accuracy, not all cycles)

## Data Processing Notes

### GRIB2 Format
- **Binary Format**: Compressed meteorological data
- **Message-based**: Each variable/level/time is a separate message
- **Coordinate System**: Lambert Conformal Conic projection
- **Compression**: Complex packing and spatial differencing

### Memory Efficiency Options
```javascript
// Traditional parsing (full memory usage)
args: {
  parse: true // Default behavior
}

// Raw data mode (minimal memory usage)
args: {
  parse: false // Returns ArrayBuffer for worker processing
}
```

### Coordinate Transformations
- **Model Grid**: Lambert Conformal Conic
- **Output**: Geographic coordinates (WGS84)
- **Automatic**: Transformation handled by API
- **Precision**: ~3km native resolution maintained

### Data Scaling and Units
- **Automatic Scaling**: GRIB2 scale factors applied automatically
- **Unit Conversion**: Raw values converted to standard units
- **Temperature**: Kelvin (can be converted to Celsius/Fahrenheit)
- **Precipitation**: kg/m² (equivalent to mm for water)

## Performance Considerations

### File Sizes
- **Typical GRIB2 file**: 100-200 MB
- **Full domain**: ~1.9M grid points
- **Compressed**: GRIB2 compression reduces file size significantly

### Processing Strategies
```javascript
// For real-time applications
args: {
  forecastHour: 0, // Use analysis for current conditions
  parse: true      // Full parsing for immediate use
}

// For batch processing
args: {
  parse: false // Raw data for parallel worker processing
}

// For focused analysis
args: {
  bbox: [small_area], // Spatial subsetting reduces processing time
  variable: "single"  // Single variable faster than multiple
}
```

### Caching and Availability
- **Real-time**: Latest forecasts available within ~30 minutes
- **Archive**: Previous forecasts available for ~7 days
- **Historical**: Historical data available through NOAA archives

## Error Handling

```javascript
try {
  const result = await hydro.data.retrieve({
    params: { source: "hrrr", datatype: "point-data" },
    args: {
      dataset: "hrrr-operational",
      variable: "TMP",
      latitude: 40.7128,
      longitude: -74.0060,
      startDate: "2025-09-24T12:00:00Z",
      forecastHour: 6
    }
  });

  if (result.error) {
    console.error('HRRR data retrieval failed:', result.error);
  } else {
    console.log('HRRR data retrieved successfully');
  }
} catch (error) {
  console.error('Request failed:', error.message);
  
  // Common error types:
  // - File not found (forecast not available yet)
  // - Coordinates outside CONUS domain
  // - Invalid forecast hour
  // - GRIB2 library loading issues
  // - Memory errors for large extractions
}
```

## Data Quality and Limitations

### Strengths
- **High Resolution**: 3km spatial resolution
- **Rapid Updates**: Hourly model cycles
- **Real-time**: Near real-time availability
- **Comprehensive**: Wide range of meteorological variables
- **Accuracy**: State-of-the-art numerical weather prediction

### Limitations
- **CONUS Only**: Limited to continental United States
- **Short Range**: 0-48 hour forecasts only
- **Model Uncertainty**: Forecast accuracy decreases with time
- **Initialization**: Quality depends on observational data availability
- **Computational**: Large file sizes and processing requirements

### Accuracy Guidelines
- **0-6 hours**: Excellent accuracy for most variables
- **6-18 hours**: Good accuracy for temperature, fair for precipitation
- **18-36 hours**: Moderate accuracy, useful for planning
- **36-48 hours**: Lower accuracy, trends more reliable than details

## References

- **NOAA HRRR Information**: https://rapidrefresh.noaa.gov/hrrr/
- **Model Documentation**: https://rapidrefresh.noaa.gov/RR_HRRR.pdf
- **Data Access**: https://nomads.ncep.noaa.gov/
- **GRIB2 Documentation**: https://www.nco.ncep.noaa.gov/pmb/docs/grib2/

## Version History

- **HRRR v4**: Current operational version (improved physics)
- **HRRR v3**: Previous version (2018-2021)
- **HRRR v2**: Earlier version (2014-2018)

## Technical Details

### Model Configuration
- **Grid**: Lambert Conformal Conic
- **Physics**: Thompson microphysics, MYNN boundary layer
- **Data Assimilation**: GSI (Gridpoint Statistical Interpolation)
- **Radar Integration**: High-resolution radar data assimilation

### File Naming Convention
```
hrrr.t{CC}z.wrfsfcf{FF}.grib2
```
- `CC`: Model cycle hour (00-23)
- `FF`: Forecast hour (00-48)

### Data Access URLs
```
Base: https://nomads.ncep.noaa.gov/pub/data/nccf/com/hrrr/prod/
Pattern: hrrr.{YYYYMMDD}/conus/hrrr.t{CC}z.wrfsfcf{FF}.grib2
Example: hrrr.20250924/conus/hrrr.t12z.wrfsfcf06.grib2
```

### Grid Specifications
- **Projection**: Lambert Conformal Conic
- **Standard Parallels**: 38.5°N and 38.5°N
- **Central Meridian**: 97.5°W
- **Grid Spacing**: 3000 meters
- **Dimensions**: 1381 × 1381
