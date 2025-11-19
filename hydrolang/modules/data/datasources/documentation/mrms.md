# MRMS (Multi-Radar Multi-Sensor) Data Source

## Overview

The MRMS data source provides high-resolution, real-time precipitation and radar-based weather products for the continental United States. MRMS integrates data from multiple radars, satellites, and surface observations to create seamless, high-quality precipitation estimates and other meteorological products at 1km resolution.

## Data Characteristics

### Temporal Coverage
- **Update Frequency**: Every 2 minutes (varies by product)
- **Archive Depth**: ~24-48 hours (operational)
- **Temporal Resolution**: 2-minute, hourly, daily accumulations
- **Time Zone**: UTC
- **Real-time Latency**: 5-10 minutes

### Spatial Coverage
- **Geographic Extent**: Continental United States (CONUS)
- **Spatial Resolution**: 1km (0.01° × 0.01°)
- **Coordinate System**: Geographic WGS84 (EPSG:4326)
- **Grid Dimensions**: 3500 × 7000 (latitude × longitude)

### Available Products

#### Precipitation Products
| Product | Units | Description | Update Frequency |
|---------|-------|-------------|------------------|
| `PrecipRate` | mm/hr | Instantaneous precipitation rate | 2 minutes |
| `RadarOnly_QPE` | mm | Radar-only quantitative precipitation estimate | 2 minutes |
| `MultiSensor_QPE_01H` | mm | 1-hour multi-sensor precipitation | Hourly |
| `MultiSensor_QPE_03H` | mm | 3-hour multi-sensor precipitation | Hourly |
| `MultiSensor_QPE_06H` | mm | 6-hour multi-sensor precipitation | Hourly |
| `MultiSensor_QPE_24H` | mm | 24-hour multi-sensor precipitation | Hourly |
| `GaugeCorr_QPE_01H` | mm | 1-hour gauge-corrected precipitation | Hourly |

#### Radar Products
| Product | Units | Description | Update Frequency |
|---------|-------|-------------|------------------|
| `SeamlessHSR` | dBZ | Seamless hybrid scan reflectivity | 2 minutes |
| `MESH` | mm | Maximum estimated size of hail | 2 minutes |
| `VIL` | kg/m² | Vertically integrated liquid | 2 minutes |
| `EchoTop` | km | Echo top height | 2 minutes |

#### Flash Flood Products
| Product | Units | Description | Update Frequency |
|---------|-------|-------------|------------------|
| `FlashFloodGuidance` | mm | Flash flood guidance | Hourly |
| `FlashFloodThreat` | categorical | Flash flood threat index | 2 minutes |

## Usage Examples

### Real-time Precipitation Rate

```javascript
// Get current precipitation rate for Dallas, TX
  const result = await hydro.data.retrieve({
    params: {
      source: "mrms",
      datatype: "point-data"
    },
    args: {
      dataset: "mrms-radar",
      product: "PrecipRate",
      // variable: "PRATE", // Optional: inferred from product
      latitude: 32.7767,
      longitude: -96.7970,
      startDate: "2025-09-24T14:30:00Z" // Most recent available
    }
  });

// Result structure
{
  "variable": "PrecipRate",
  "location": {
    "latitude": 32.7767,
    "longitude": -96.7970
  },
  "timestamp": "2025-09-24T14:30:00.000Z",
  "value": 15.2, // mm/hr
  "metadata": {
    "units": "mm/hr",
    "longName": "Precipitation Rate",
    "product": "PrecipRate",
    "source": "MRMS",
    "resolution": "1km",
    "updateFrequency": "2 minutes",
    "dataQuality": "operational"
  }
}
```

### Hourly Precipitation Grid

```javascript
// Extract 1-hour precipitation accumulation for Oklahoma
const result = await hydro.data.retrieve({
  params: {
    source: "mrms",
    datatype: "grid-data"
  },
  args: {
    dataset: "mrms-qpe",
    product: "MultiSensor_QPE_01H",
    // variable: "APCP", // Optional: inferred from product
    bbox: [-103.0, 33.5, -94.0, 37.0], // Oklahoma bounds
    startDate: "2025-09-24T14:00:00Z"
  }
});

// Result structure
{
  "variable": "MultiSensor_QPE_01H",
  "bbox": [-103.0, 33.5, -94.0, 37.0],
  "timestamp": "2025-09-24T14:00:00.000Z",
  "data": {
    "values": [
      [0.0, 0.5, 1.2, 0.8, ...], // 2D array [lat][lon] in mm
      [0.2, 0.9, 2.1, 1.5, ...],
      // ... more rows
    ],
    "coordinates": {
      "latitude": [37.0, 36.99, 36.98, ...],
      "longitude": [-103.0, -102.99, -102.98, ...]
    },
    "shape": [350, 900],
    "bounds": {
      "north": 37.0,
      "south": 33.5,
      "east": -94.0,
      "west": -103.0
    }
  },
  "metadata": {
    "units": "mm",
    "longName": "1-Hour Multi-Sensor Quantitative Precipitation Estimate",
    "product": "MultiSensor_QPE_01H",
    "source": "MRMS",
    "resolution": "1km",
    "accumulation": "1 hour"
  }
}
```

### Radar Reflectivity Data

```javascript
// Get radar reflectivity for severe weather analysis
const result = await hydro.data.retrieve({
  params: {
    source: "mrms",
    datatype: "grid-data"
  },
  args: {
    dataset: "mrms-radar",
    product: "MergedReflectivityQC", // Use actual product name
    // variable: "REF", // Optional: inferred from product
    bbox: [-98.0, 30.0, -94.0, 34.0], // Central Texas
    startDate: "2025-09-24T15:00:00Z"
  }
});

// Result includes reflectivity values in dBZ
// Values typically range from -10 to 80 dBZ
// - < 20 dBZ: Light precipitation
// - 20-35 dBZ: Light to moderate rain
// - 35-50 dBZ: Moderate to heavy rain
// - > 50 dBZ: Heavy rain, possible hail
```

### Time Series Analysis

```javascript
// Extract precipitation time series for flash flood analysis
const result = await hydro.data.retrieve({
  params: {
    source: "mrms",
    datatype: "timeseries-data"
  },
  args: {
    dataset: "mrms-operational",
    product: "PrecipRate",
    latitude: 30.2672,
    longitude: -97.7431, // Austin, TX
    startDate: "2025-09-24T12:00:00Z",
    endDate: "2025-09-24T18:00:00Z" // 6-hour period
  }
});

// Result structure
{
  "variable": "PrecipRate",
  "location": {
    "latitude": 30.2672,
    "longitude": -97.7431
  },
  "timeRange": {
    "start": "2025-09-24T12:00:00Z",
    "end": "2025-09-24T18:00:00Z"
  },
  "data": [
    {
      "timestamp": "2025-09-24T12:00:00.000Z",
      "value": 0.0
    },
    {
      "timestamp": "2025-09-24T12:02:00.000Z",
      "value": 2.5
    },
    // ... 2-minute intervals for 6 hours (180 values)
  ],
  "metadata": {
    "source": "MRMS",
    "temporalResolution": "2M", // 2 minutes
    "count": 180,
    "validCount": 175,
    "dataGaps": 5
  }
}
```

### Flash Flood Monitoring

```javascript
// Monitor flash flood threat for emergency management
const result = await hydro.data.retrieve({
  params: {
    source: "mrms",
    datatype: "point-data"
  },
  args: {
    dataset: "mrms-operational",
    product: "FlashFloodThreat",
    latitude: 29.7604,
    longitude: -95.3698, // Houston, TX
    startDate: "2025-09-24T15:30:00Z"
  }
});

// Result includes categorical threat levels:
// 0: No threat
// 1: Low threat
// 2: Moderate threat
// 3: High threat
// 4: Extreme threat
```

### Available Products Query

```javascript
// Get list of all available MRMS products
const products = await hydro.data.retrieve({
  params: {
    source: "mrms",
    datatype: "available-products"
  }
});

// Returns array of product names and descriptions
[
  {
    "product": "PrecipRate",
    "description": "Precipitation Rate",
    "units": "mm/hr",
    "updateFrequency": "2 minutes"
  },
  {
    "product": "MultiSensor_QPE_01H",
    "description": "1-Hour Multi-Sensor QPE",
    "units": "mm",
    "updateFrequency": "hourly"
  },
  // ... more products
]
```

## Data Processing Notes

### GRIB2 Format
- **File Format**: GRIB2 binary format
- **Compression**: Run-length encoding and bit packing
- **Coordinate System**: Geographic coordinates (WGS84)
- **Data Types**: Integer values with scale factors

### Quality Control
```javascript
// Data quality flags are included in metadata
metadata: {
  "qualityFlags": {
    "radarCoverage": "good",    // good, fair, poor
    "gaugeDensity": "moderate", // high, moderate, low
    "satelliteAvailable": true,
    "processingStatus": "normal" // normal, degraded, test
  }
}
```

### Missing Data Handling
- **No Data Value**: -999.0 indicates no precipitation/radar coverage
- **Below Threshold**: Values below detection threshold set to 0.0
- **Quality Flags**: Indicate data reliability and coverage

### Spatial Resolution Considerations
- **Native Resolution**: 1km for most products
- **Upsampling**: Some products may be upsampled from coarser resolution
- **Edge Effects**: Data quality may be reduced near domain boundaries

## Performance Considerations

### File Sizes and Processing
- **Typical File Size**: 20-50 MB per product/time
- **High-Frequency Updates**: 2-minute products generate large data volumes
- **Processing Time**: Real-time products optimized for speed over accuracy

### Optimal Usage Strategies
```javascript
// For real-time monitoring (fastest)
args: {
  product: "PrecipRate",        // 2-minute updates
  datatype: "point-data"        // Single location
}

// For hydrologic analysis (most accurate)
args: {
  product: "MultiSensor_QPE_01H", // Gauge-corrected
  datatype: "grid-data"           // Spatial analysis
}

// For climatological studies (stable)
args: {
  product: "GaugeCorr_QPE_24H",   // 24-hour accumulations
  temporal: "daily"               // Daily aggregation
}
```

### Memory Management
- **Large Grids**: CONUS domain has ~24.5M grid points
- **Temporal Series**: High-frequency data can consume significant memory
- **Spatial Subsetting**: Use bounding boxes to reduce data volume

## Data Accuracy and Limitations

### Strengths
- **High Resolution**: 1km spatial resolution
- **Real-time**: Near real-time availability (5-10 minute latency)
- **Multi-sensor**: Combines radar, satellite, and gauge data
- **Quality Control**: Automated quality control procedures
- **Seamless**: Gap-filled products provide complete coverage

### Limitations
- **CONUS Only**: Limited to continental United States
- **Radar Blind Spots**: Beam blockage in mountainous terrain
- **Winter Weather**: Reduced accuracy for snow and ice
- **Calibration**: Ongoing calibration with gauge networks
- **Latency**: 5-10 minute delay from observation time

### Accuracy by Product Type
- **Real-time QPE**: ±20-30% for moderate precipitation
- **Gauge-corrected**: ±10-20% for moderate precipitation
- **Light precipitation**: Higher relative errors
- **Heavy precipitation**: Better absolute accuracy

## Error Handling

```javascript
try {
  const result = await hydro.data.retrieve({
    params: { source: "mrms", datatype: "point-data" },
    args: {
      dataset: "mrms-operational",
      product: "PrecipRate",
      latitude: 32.7767,
      longitude: -96.7970,
      startDate: "2025-09-24T14:30:00Z"
    }
  });

  if (result.error) {
    console.error('MRMS data retrieval failed:', result.error);
    
    // Check for common issues
    if (result.error.includes('product not available')) {
      console.log('Try a different product or time');
    }
    if (result.error.includes('outside domain')) {
      console.log('Coordinates must be within CONUS');
    }
  } else {
    console.log('MRMS data retrieved successfully');
  }
} catch (error) {
  console.error('Request failed:', error.message);
  
  // Common error types:
  // - Product not available for requested time
  // - Coordinates outside CONUS domain
  // - GRIB2 library loading issues
  // - Network connectivity issues
  // - File parsing errors
}
```

## Use Cases and Applications

### Flash Flood Monitoring
```javascript
// Real-time flash flood assessment
products: ["PrecipRate", "MultiSensor_QPE_01H", "FlashFloodThreat"]
temporal: "2-minute intervals"
spatial: "Urban watersheds"
```

### Severe Weather Analysis
```javascript
// Storm structure and intensity analysis
products: ["SeamlessHSR", "MESH", "VIL", "EchoTop"]
temporal: "2-minute intervals"
spatial: "Storm-scale (10-100 km)"
```

### Hydrologic Modeling
```javascript
// Precipitation input for watershed models
products: ["GaugeCorr_QPE_01H", "MultiSensor_QPE_24H"]
temporal: "Hourly to daily"
spatial: "Watershed scale"
```

### Aviation Weather
```javascript
// Precipitation and radar for flight planning
products: ["PrecipRate", "SeamlessHSR", "EchoTop"]
temporal: "Real-time"
spatial: "Flight corridors"
```

## References

- **MRMS Operations Center**: https://www.nssl.noaa.gov/projects/mrms/
- **Product Guide**: https://www.nssl.noaa.gov/projects/mrms/operational/tables.php
- **Technical Documentation**: https://www.nssl.noaa.gov/projects/mrms/
- **Data Access**: https://mtarchive.geol.iastate.edu/

## Version History

- **MRMS v12**: Current operational version (improved QPE algorithms)
- **MRMS v11**: Previous version (enhanced multi-sensor integration)
- **MRMS v10**: Earlier version (expanded product suite)

## Technical Details

### Data Sources
- **Radars**: WSR-88D network (~160 radars)
- **Satellites**: GOES-East and GOES-West
- **Surface Observations**: Automated weather stations, CoCoRaHS
- **Lightning**: Ground-based lightning detection networks

### Processing Algorithm
1. **Radar QC**: Quality control and calibration
2. **Multi-sensor Integration**: Combine radar, satellite, gauge data
3. **Bias Correction**: Real-time gauge correction
4. **Gap Filling**: Fill radar coverage gaps with satellite data
5. **Product Generation**: Create final gridded products

### File Naming Convention
```
{PRODUCT}_{YYYYMMDD-HHMMSS}.grib2.gz
```
- `PRODUCT`: Product name (e.g., PrecipRate, SeamlessHSR)
- `YYYYMMDD-HHMMSS`: UTC timestamp

### Data Access Patterns
```
Base: https://mtarchive.geol.iastate.edu/data/grib2/mrms/
Pattern: {YYYY}/{MM}/{DD}/{PRODUCT}/
Example: 2025/09/24/PrecipRate/PrecipRate_20250924-143000.grib2.gz
```

### Grid Specifications
- **Projection**: Geographic (Plate Carrée)
- **Resolution**: 0.01° × 0.01° (~1km)
- **Domain**: 20°N to 55°N, 130°W to 60°W
- **Dimensions**: 3500 × 7000 (lat × lon)
- **Total Points**: 24,500,000

