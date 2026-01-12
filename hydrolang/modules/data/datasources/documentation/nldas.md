# NLDAS-3 (North American Land Data Assimilation System) Meteorological Forcing Data Source

## Overview

The NLDAS-3 data source provides high-resolution meteorological forcing data for hydrologic modeling and analysis across North and Central America. NLDAS-3 integrates multiple data sources including weather stations, satellites, and numerical weather prediction models to create a comprehensive dataset of meteorological variables at hourly temporal resolution and ~1km spatial resolution.

## Data Characteristics

### Temporal Coverage
- **Start Date**: January 1, 1979
- **End Date**: December 31, 2020 (data through 2020, with newer data added periodically)
- **Temporal Resolution**: Hourly
- **Time Zone**: UTC
- **Data Frequency**: One NetCDF file per day containing 24 hourly records

### Spatial Coverage
- **Geographic Extent**: North and Central America (CONUS, Alaska, Hawaii, Puerto Rico, Central America)
- **Spatial Resolution**: 0.01° × 0.01° (~1km at equator)
- **Coordinate System**: EPSG:4326 (WGS84)
- **Grid Dimensions**: 5300 × 7000 (latitude × longitude)
- **Latitude Range**: 0.0°N to 53.0°N
- **Longitude Range**: 130.0°W to 60.0°W

### Available Variables

The following variables are available exactly as specified in the NLDAS-3 resource documentation:

| Variable | Units | Description | Temporal Resolutions |
|----------|-------|-------------|---------------------|
| `Tair` | K | Near-surface air temperature | 1H, 1D, 1M |
| `Tair_min` | K | Daily minimum near-surface air temperature | 1D |
| `Tair_max` | K | Daily maximum near-surface air temperature | 1D |
| `Qair` | kg kg⁻¹ | Near-surface specific humidity | 1H, 1D, 1M |
| `PSurf` | Pa | Surface pressure | 1H, 1D, 1M |
| `Wind_N` | m s⁻¹ | Northward wind | 1H, 1D, 1M |
| `Wind_E` | m s⁻¹ | Eastward wind | 1H, 1D, 1M |
| `LWdown` | W m⁻² | Downward longwave radiation at the surface | 1H, 1D, 1M |
| `SWdown` | W m⁻² | Downward shortwave radiation at the surface | 1H, 1D, 1M |
| `Rainf` | kg m⁻² | Total precipitation rate | 1H, 1D, 1M |

**Temporal Resolution Notes:**
- **1H**: Hourly data (available in `nldas-3-hourly` dataset)
- **1D**: Daily averaged data + daily min/max temperature (available in `nldas-3-daily` dataset)
- **1M**: Monthly averaged data (available in `nldas-3-monthly` dataset)

**Spatial Resolution:** All variables are available at 0.01° × 0.01° (~1km) resolution across the entire domain.

### Spatial and Temporal Access Implementation

**Spatial Access (Point Data):**
- NLDAS data is stored on a regular 0.01° latitude-longitude grid
- For point requests, the system finds the nearest grid cell to the requested coordinates using Euclidean distance calculation
- The value from the nearest grid cell is returned with metadata about the actual grid cell location
- Grid cells are indexed by finding minimum distance: `min(√((lat₁-lat₂)² + (lon₁-lon₂)²))`

**Temporal Access:**
- **Hourly data**: Each NetCDF file contains 24 hourly time steps for a single day
- **Daily data**: Single time step with daily-averaged values (plus min/max for temperature)
- **Monthly data**: Single time step with monthly-averaged values
- Time filtering: Data points are filtered to match the requested date range
- File selection: Appropriate dataset (hourly/daily/monthly) is chosen based on requested temporal resolution

**Data Processing Steps:**
1. **URL Construction**: Build S3 URL based on dataset, date, and temporal resolution
2. **File Download**: Fetch NetCDF file from NASA S3 bucket
3. **NetCDF Parsing**: Extract coordinate arrays (lat, lon, time) and requested variable data
4. **Spatial Interpolation**: Find nearest grid cell indices for point requests
5. **Temporal Filtering**: Extract data for requested time range
6. **Value Scaling**: Apply any scaling factors (though NLDAS typically uses raw values)
7. **Format Output**: Return data in requested format (JSON, CSV, etc.)

## Usage Examples

### Point Data Extraction

```javascript
// Extract hourly precipitation and temperature for Denver, CO
const result = await hydro.data.retrieve({
  params: {
    source: "nldas",
    datatype: "point-data"
  },
  args: {
    dataset: "nldas-3-hourly",
    variables: ["Rainf", "Tair", "Qair"],
    latitude: 39.7392,
    longitude: -104.9903,
    startDate: "2015-01-31T00:00:00Z",
    endDate: "2015-01-31T23:00:00Z",
    format: "json"
  }
});

// Result structure
{
  "variable": "Rainf",
  "location": {
    "latitude": 39.7392,
    "longitude": -104.9903
  },
  "timeRange": {
    "start": "2015-01-31T00:00:00Z",
    "end": "2015-01-31T23:00:00Z"
  },
  "data": [
    {
      "timestamp": "2015-01-31T00:00:00.000Z",
      "value": 0.0,
      "variables": {
        "Rainf": 0.0,
        "Tair": 268.15,
        "Qair": 0.0032
      }
    },
    {
      "timestamp": "2015-01-31T01:00:00.000Z",
      "value": 0.0,
      "variables": {
        "Rainf": 0.0,
        "Tair": 267.85,
        "Qair": 0.0031
      }
    },
    // ... 22 more hourly values
  ],
  "metadata": {
    "source": "NLDAS-3",
    "dataset": "nldas-3-hourly",
    "temporalResolution": "1H",
    "spatialResolution": "0.01° (~1km)",
    "units": {
      "Rainf": "kg m⁻²",
      "Tair": "K",
      "Qair": "kg kg⁻¹"
    }
  }
}
```

### Grid Data Extraction

```javascript
// Extract temperature grid for the Pacific Northwest
const result = await hydro.data.retrieve({
  params: {
    source: "nldas",
    datatype: "grid-data"
  },
  args: {
    dataset: "nldas-3-hourly",
    variables: ["Tair"],
    bbox: [-125.0, 45.0, -115.0, 50.0], // Pacific Northwest
    startDate: "2015-01-31T12:00:00Z",
    endDate: "2015-01-31T12:00:00Z",
    format: "json"
  }
});

// Result structure
{
  "variable": "Tair",
  "bbox": [-125.0, 45.0, -115.0, 50.0],
  "timestamp": "2015-01-31T12:00:00Z",
  "data": {
    "values": [
      [272.5, 273.1, 273.8, ...], // 2D temperature array [lat][lon] in Kelvin
      [271.8, 272.4, 273.2, ...],
      // ... more rows
    ],
    "coordinates": {
      "latitude": [50.0, 49.875, 49.75, ...],
      "longitude": [-125.0, -124.875, -124.75, ...]
    },
    "shape": [41, 81],
    "bounds": {
      "north": 50.0,
      "south": 45.0,
      "east": -115.0,
      "west": -125.0
    }
  },
  "metadata": {
    "units": "K",
    "longName": "Near-surface air temperature",
    "source": "NLDAS-3",
    "resolution": "0.01° (~1km)",
    "timestamp": "2015-01-31T12:00:00Z"
  }
}
```

### Time Series Analysis

```javascript
// Extract 24-hour time series for multiple locations
const result = await hydro.data.retrieve({
  params: {
    source: "nldas",
    datatype: "timeseries-data"
  },
  args: {
    dataset: "nldas-3-hourly",
    variables: ["Rainf", "Tair"],
    locations: [
      [40.7128, -74.0060],  // New York City
      [34.0522, -118.2437], // Los Angeles
      [41.8781, -87.6298]   // Chicago
    ],
    startDate: "2015-01-31T00:00:00Z",
    endDate: "2015-01-31T23:00:00Z",
    format: "json"
  }
});

// Result structure
{
  "40.7128_-74.0060": {
    "location": { "latitude": 40.7128, "longitude": -74.0060 },
    "data": [
      {
        "timestamp": "2015-01-31T00:00:00Z",
        "Rainf": 0.0,
        "Tair": 271.5
      },
      // ... 23 more hourly values
    ]
  },
  "34.0522_-118.2437": {
    "location": { "latitude": 34.0522, "longitude": -118.2437 },
    "data": [
      {
        "timestamp": "2015-01-31T00:00:00Z",
        "Rainf": 0.0,
        "Tair": 287.2
      },
      // ... 23 more hourly values
    ]
  },
  // ... Chicago data
}
```

### Raw NetCDF File Access

```javascript
// Access raw NetCDF file for custom processing
const result = await hydro.data.retrieve({
  params: {
    source: "nldas",
    datatype: "raw-netcdf"
  },
  args: {
    dataset: "nldas-3-hourly",
    year: "2015",
    month: "01",
    day: "31",
    hour: "12" // Optional: get specific hour
  }
});

// Result contains raw NetCDF file data
{
  "fileUrl": "https://nasa-waterinsight.s3.amazonaws.com/NLDAS3/forcing/hourly/201501/NLDAS_FOR0010_H.A20150131.030.beta.nc",
  "data": ArrayBuffer, // Raw NetCDF binary data
  "metadata": {
    "filename": "NLDAS_FOR0010_H.A20150131.030.beta.nc",
    "size": 12345678,
    "lastModified": "2015-01-31T12:00:00Z"
  }
}
```

### Dataset Information

```javascript
// Get information about available variables
const info = await hydro.data.retrieve({
  params: {
    source: "nldas",
    datatype: "dataset-info"
  },
  args: {
    dataset: "nldas-3-hourly",
    info: "variables"
  }
});

// Returns detailed variable information
{
  "variables": {
    "Tair": {
      "longName": "Near-surface air temperature",
      "units": "K",
      "category": "temperature",
      "temporalResolutions": ["1H", "1D", "1M"]
    },
    "Qair": {
      "longName": "Near-surface specific humidity",
      "units": "kg kg⁻¹",
      "category": "moisture",
      "temporalResolutions": ["1H", "1D", "1M"]
    },
    "PSurf": {
      "longName": "Surface pressure",
      "units": "Pa",
      "category": "pressure",
      "temporalResolutions": ["1H", "1D", "1M"]
    },
    "Wind_N": {
      "longName": "Northward wind",
      "units": "m s⁻¹",
      "category": "wind",
      "temporalResolutions": ["1H", "1D", "1M"]
    },
    "Wind_E": {
      "longName": "Eastward wind",
      "units": "m s⁻¹",
      "category": "wind",
      "temporalResolutions": ["1H", "1D", "1M"]
    },
    "LWdown": {
      "longName": "Downward longwave radiation at the surface",
      "units": "W m⁻²",
      "category": "radiation",
      "temporalResolutions": ["1H", "1D", "1M"]
    },
    "SWdown": {
      "longName": "Downward shortwave radiation at the surface",
      "units": "W m⁻²",
      "category": "radiation",
      "temporalResolutions": ["1H", "1D", "1M"]
    },
    "Rainf": {
      "longName": "Total precipitation rate",
      "units": "kg m⁻²",
      "category": "precipitation",
      "temporalResolutions": ["1H", "1D", "1M"]
    },
    // ... additional variables for daily datasets
    "Tair_min": {
      "longName": "Daily minimum near-surface air temperature",
      "units": "K",
      "category": "temperature",
      "temporalResolutions": ["1D"]
    },
    "Tair_max": {
      "longName": "Daily maximum near-surface air temperature",
      "units": "K",
      "category": "temperature",
      "temporalResolutions": ["1D"]
    }
  }
}
```

## Data Processing Notes

### File Structure and Naming
- **File Format**: NetCDF-4 with internal compression
- **File Naming**: `NLDAS_FOR0010_H.A{YYYY}{MMDD}.{HH}0.beta.nc`
  - `YYYY`: Year (4 digits)
  - `MMDD`: Month and day (4 digits)
  - `HH`: Hour (00-23)
- **Directory Structure**: `YYYYMM/` (e.g., `201501/` for January 2015)

### Coordinate System
- **Projection**: Geographic (latitude/longitude)
- **Resolution**: 0.125° × 0.125°
- **Grid**: Regular latitude-longitude grid
- **Cell Centers**: Data values represent cell center points

### Missing Data Handling
- **Fill Value**: -9999.0 indicates missing or invalid data
- **Quality Control**: NLDAS applies various quality control procedures
- **Interpolation**: Data is spatially interpolated from observations

### Units and Scaling
- **No Scaling Required**: Values are stored in physical units
- **Temperature**: Kelvin (subtract 273.15 for Celsius)
- **Precipitation**: kg/m² (equivalent to mm for water density)
- **Pressure**: Pascals
- **Humidity**: kg/kg (dimensionless ratio)

## Performance Considerations

### File Sizes
- **Typical File Size**: 10-20 MB per day (compressed)
- **Uncompressed Size**: ~50-100 MB per day
- **Memory Usage**: Grid extraction requires ~10-50 MB RAM depending on region size

### Access Patterns
```javascript
// Optimal for single locations
args: {
  datatype: "point-data",
  format: "json"  // Fastest for single points
}

// Optimal for spatial analysis
args: {
  datatype: "grid-data",
  bbox: "minimal_area",  // Limit spatial extent
  format: "netcdf"       // Efficient for grids
}

// Optimal for multiple locations
args: {
  datatype: "timeseries-data",
  locations: "reasonable_count",  // < 100 locations recommended
  format: "csv"  // Compact for time series
}
```

## Data Quality and Limitations

### Strengths
- **High Temporal Resolution**: Hourly data for detailed hydrologic modeling
- **Comprehensive Coverage**: All major meteorological variables
- **Quality Controlled**: Multiple quality assurance procedures
- **Long Time Series**: 40+ years of continuous data
- **North America Coverage**: Complete CONUS and extended areas

### Limitations
- **Spatial Resolution**: 12.5km may not capture local variations
- **Temporal Coverage**: Through 2020 (updates may lag)
- **Data Latency**: Real-time access not available
- **File Size**: Large files for full domain access
- **Memory Requirements**: Grid operations require significant RAM

### Accuracy Considerations
- **Precipitation**: ±10-20% relative error for moderate rainfall
- **Temperature**: ±1-2°C accuracy
- **Wind**: ±1-2 m/s accuracy
- **Radiation**: ±10-20% relative error
- **Humidity**: ±5-10% relative error

## Error Handling

```javascript
try {
  const result = await hydro.data.retrieve({
    params: { source: "nldas", datatype: "point-data" },
    args: {
      dataset: "nldas-3-forcing",
      variables: ["APCPsfc"],
      latitude: 39.7392,
      longitude: -104.9903,
      startDate: "2015-01-31T00:00:00Z",
      endDate: "2015-01-31T23:00:00Z"
    }
  });

  if (result.error) {
    console.error('NLDAS data retrieval failed:', result.error);
  } else {
    console.log(`Retrieved ${result.data.length} hourly values`);
  }
} catch (error) {
  console.error('Request failed:', error.message);

  // Common error types:
  // - Coordinates outside domain
  // - Date outside available range
  // - Invalid variable name
  // - Network connectivity issues
  // - NetCDF parsing errors
}
```

## Use Cases and Applications

### Hydrologic Modeling
```javascript
// NLDAS forcing data for watershed models
variables: ["APCPsfc", "TMP2m", "UGRD10m", "VGRD10m", "DSWRF", "DLWRF"]
temporal: "Hourly time series"
spatial: "Watershed boundaries"
```

### Climate Analysis
```javascript
// Long-term climate trends
variables: ["TMP2m", "APCPsfc", "SPFH2m"]
temporal: "Multi-year time series"
spatial: "Regional analysis"
```

### Weather Research
```javascript
// Meteorological research and analysis
variables: ["PRES2m", "UGRD10m", "VGRD10m", "DSWRF"]
temporal: "Event-based (storms, heat waves)"
spatial: "Case study regions"
```

### Agricultural Applications
```javascript
// Crop modeling and irrigation scheduling
variables: ["APCPsfc", "TMP2m", "SPFH2m", "DSWRF"]
temporal: "Growing season"
spatial: "Agricultural regions"
```

## References

- **NASA NLDAS**: https://ldas.gsfc.nasa.gov/nldas/
- **NLDAS-3 Forcing Data**: https://ldas.gsfc.nasa.gov/nldas/NLDAS2forcing.php
- **Data Access**: https://disc.gsfc.nasa.gov/datasets/NLDAS_FORA0125_H_002/summary
- **Technical Documentation**: https://ldas.gsfc.nasa.gov/sites/default/files/ldas/nldas/NLDAS2_README.pdf

## Version History

- **NLDAS-3**: Current operational version (2015-present)
- **NLDAS-2**: Previous version (1979-2014)
- **NLDAS-1**: Original version (experimental)

## Technical Details

### Data Sources
- **Precipitation**: Multi-sensor analysis (radar + gauge)
- **Temperature**: Surface weather stations
- **Wind**: Surface weather stations and numerical models
- **Radiation**: Satellite observations and models
- **Humidity**: Surface observations and models

### Processing Algorithm
1. **Observation Collection**: Gather data from multiple sources
2. **Quality Control**: Automated and manual quality checks
3. **Spatial Interpolation**: Create gridded fields
4. **Temporal Aggregation**: Hourly averages and accumulations
5. **Format Conversion**: NetCDF file generation

### File Structure
```
NLDAS_FOR0010_H.A20150131.000.beta.nc
├── dimensions:
│   ├── time: 24 (hours in day)
│   ├── lat: 464 (latitude points)
│   └── lon: 224 (longitude points)
├── variables:
│   ├── APCPsfc(time, lat, lon)
│   ├── TMP2m(time, lat, lon)
│   ├── ... (all variables)
└── global attributes:
    ├── title: "NLDAS-3 Forcing"
    ├── institution: "NASA GSFC"
    └── ... (metadata)
```

### Grid Specifications
- **Origin**: Southwest corner at (24.0625°N, 124.9375°W)
- **Cell Size**: 0.125° × 0.125°
- **Orientation**: Latitude increases northward, longitude increases eastward
- **Datum**: WGS84 ellipsoid
