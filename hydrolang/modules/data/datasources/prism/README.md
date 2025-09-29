# PRISM (Parameter-elevation Relationships on Independent Slopes Model) Data Source

## Overview

The PRISM data source provides high-resolution climate and weather data for the United States, including precipitation, temperature, humidity, and solar radiation variables. PRISM uses sophisticated climate-elevation regression models to produce spatially continuous grids of climate data from weather station observations.

## Data Characteristics

### Temporal Coverage
- **Start Date**: January 1, 1895 (varies by variable and region)
- **End Date**: Current date (varies by stability level)
- **Temporal Resolution**: Daily, Monthly, 30-year Normals, Annual
- **Time Zone**: Local Standard Time
- **Update Frequency**: Daily (provisional), Monthly (stable)

### Spatial Coverage
- **Geographic Extent**: United States (CONUS, Alaska, Hawaii, Puerto Rico)
- **Spatial Resolution**: 
  - 400m (15 arc-seconds)
  - 800m (30 arc-seconds) 
  - 4km (2.5 arc-minutes)
- **Coordinate System**: Geographic NAD83 (EPSG:4269)
- **File Format**: Cloud Optimized GeoTIFF (new format), BIL (legacy format)

### Available Variables

#### Climate Variables (Daily, Monthly, Normals)
| Variable | Units | Description | Availability |
|----------|-------|-------------|--------------|
| `ppt` | mm | Total precipitation | Daily, Monthly, Normals |
| `tmin` | °C | Minimum temperature | Daily, Monthly, Normals |
| `tmean` | °C | Mean temperature | Daily, Monthly, Normals |
| `tmax` | °C | Maximum temperature | Daily, Monthly, Normals |
| `tdmean` | °C | Mean dewpoint temperature | Daily, Monthly, Normals |
| `vpdmin` | hPa | Minimum vapor pressure deficit | Daily, Monthly, Normals |
| `vpdmax` | hPa | Maximum vapor pressure deficit | Daily, Monthly, Normals |

#### Solar Radiation Variables (Normals only)
| Variable | Units | Description | Availability |
|----------|-------|-------------|--------------|
| `solclear` | MJ/m²/day | Clear sky solar radiation | Normals |
| `soltotal` | MJ/m²/day | Total solar radiation | Normals |
| `solslope` | MJ/m²/day | Sloped surface solar radiation | Normals |
| `soltrans` | dimensionless | Cloud transmittance | Normals |

### Regional Coverage
- **CONUS (us)**: Continental United States
- **Alaska (ak)**: Alaska
- **Hawaii (hi)**: Hawaiian Islands
- **Puerto Rico (pr)**: Puerto Rico

## Usage Examples

### Daily Point Data Extraction

```javascript
// Extract daily precipitation for Portland, OR
const result = await hydro.data.retrieve({
  params: {
    source: "prism",
    datatype: "point-data"
  },
  args: {
    dataset: "prism-current",
    variable: "ppt",
    latitude: 45.5152,
    longitude: -122.6784,
    startDate: "2025-09-15T00:00:00Z",
    dataTypeOverride: "daily",
    region: "us",
    resolution: "25m"
  }
});

// Result structure
{
  "variable": "ppt",
  "location": {
    "latitude": 45.5152,
    "longitude": -122.6784
  },
  "timestamp": "2025-09-15T00:00:00.000Z",
  "value": 2.5,
  "metadata": {
    "units": "mm",
    "longName": "Total Precipitation",
    "dataType": "daily",
    "region": "us",
    "resolution": "25m",
    "source": "PRISM",
    "format": "tif",
    "gridLocation": {
      "latitude": 45.515625,
      "longitude": -122.678125,
      "indices": [156, 423]
    }
  }
}
```

### Monthly Temperature Grid Data

```javascript
// Extract monthly mean temperature for Pacific Northwest
const result = await hydro.data.retrieve({
  params: {
    source: "prism",
    datatype: "grid-data"
  },
  args: {
    dataset: "prism-current",
    variable: "tmean",
    bbox: [-125.0, 42.0, -116.0, 49.0], // [west, south, east, north]
    startDate: "2025-08-01T00:00:00Z",
    dataTypeOverride: "monthly",
    region: "us",
    resolution: "25m"
  }
});

// Result structure
{
  "variable": "tmean",
  "bbox": [-125.0, 42.0, -116.0, 49.0],
  "timestamp": "2025-08-01T00:00:00.000Z",
  "data": {
    "values": [
      [18.2, 18.5, 19.1, ...], // 2D array [lat][lon]
      [17.8, 18.2, 18.9, ...],
      // ... more rows
    ],
    "coordinates": {
      "latitude": [49.0, 48.95, 48.9, ...],
      "longitude": [-125.0, -124.95, -124.9, ...]
    },
    "shape": [140, 180],
    "bounds": {
      "north": 49.0,
      "south": 42.0,
      "east": -116.0,
      "west": -125.0
    }
  },
  "metadata": {
    "units": "°C",
    "longName": "Mean Temperature",
    "dataType": "monthly",
    "region": "us",
    "resolution": "25m",
    "source": "PRISM",
    "format": "tif"
  }
}
```

### 30-Year Climate Normals

```javascript
// Extract 30-year normal precipitation for Denver, CO
const result = await hydro.data.retrieve({
  params: {
    source: "prism",
    datatype: "point-data"
  },
  args: {
    dataset: "prism-current",
    variable: "ppt",
    latitude: 39.7392,
    longitude: -104.9903,
    startDate: "2025-07-01T00:00:00Z", // July normals
    dataTypeOverride: "normals"
  }
});
```

### Time Series Data (Monthly)

```javascript
// Extract monthly precipitation time series for a location
const result = await hydro.data.retrieve({
  params: {
    source: "prism",
    datatype: "timeseries-data"
  },
  args: {
    dataset: "prism-current",
    variable: "ppt",
    latitude: 40.7128,
    longitude: -74.0060,
    startDate: "2025-01-01T00:00:00Z",
    endDate: "2025-12-31T00:00:00Z",
    dataTypeOverride: "monthly"
  }
});

// Result structure
{
  "variable": "ppt",
  "location": {
    "latitude": 40.7128,
    "longitude": -74.0060
  },
  "timeRange": {
    "start": "2025-01-01T00:00:00Z",
    "end": "2025-12-31T00:00:00Z"
  },
  "data": [
    {
      "timestamp": "2025-01-01T00:00:00.000Z",
      "value": 88.2,
      "metadata": { /* ... */ }
    },
    {
      "timestamp": "2025-02-01T00:00:00.000Z",
      "value": 76.5,
      "metadata": { /* ... */ }
    },
    // ... 12 monthly values
  ],
  "metadata": {
    "source": "PRISM",
    "dataType": "monthly",
    "temporalResolution": "1M",
    "count": 12,
    "validCount": 12
  }
}
```

### Available Variables Query

```javascript
// Get available variables for daily data
const variables = await hydro.data.retrieve({
  params: {
    source: "prism",
    datatype: "available-variables"
  },
  args: {
    availabilityType: "daily"
  }
});

// Returns: ["ppt", "tmin", "tmean", "tmax", "tdmean", "vpdmin", "vpdmax"]
```

## Data Processing Notes

### File Formats
- **New Format (March 2025+)**: Cloud Optimized GeoTIFF (.tif) in zip archives
- **Legacy Format (deprecated Sept 2025)**: Binary Interleaved by Line (.bil) in zip archives
- **Automatic Extraction**: ZIP files are automatically extracted and processed
- **Metadata Included**: Projection, statistics, and FGDC metadata included

### Spatial Resolution Selection
```javascript
// Automatic resolution selection based on region
// Small regions (Hawaii, Puerto Rico): 15s (400m)
// Large regions (CONUS, Alaska): 25m (4km)

// Manual resolution override
args: {
  resolution: "15s", // 400m resolution
  // resolution: "30s", // 800m resolution  
  // resolution: "25m"  // 4km resolution
}
```

### Regional Selection
```javascript
// Automatic region detection based on bounding box
// Manual region override
args: {
  region: "us",  // Continental US
  // region: "ak", // Alaska
  // region: "hi", // Hawaii
  // region: "pr"  // Puerto Rico
}
```

### Data Quality and Stability Levels
- **Early**: Preliminary data (1-2 days after observation)
- **Provisional**: Quality-controlled data (1-2 weeks)
- **Stable**: Final quality-controlled data (1-2 months)
- **30yr_normal**: 30-year climatological normals (1991-2020)

### Missing Data Handling
- Fill value: -9999 indicates missing or invalid data
- The API returns `null` for missing values
- Coastal and mountainous areas may have data gaps

## Error Handling

```javascript
try {
  const result = await hydro.data.retrieve({
    params: { source: "prism", datatype: "point-data" },
    args: {
      dataset: "prism-current",
      variable: "ppt",
      latitude: 39.7392,
      longitude: -104.9903,
      startDate: "2025-09-15T00:00:00Z",
      dataTypeOverride: "daily"
    }
  });

  if (result.error) {
    console.error('PRISM data retrieval failed:', result.error);
  } else {
    console.log('PRISM data retrieved successfully');
  }
} catch (error) {
  console.error('Request failed:', error.message);
  
  // Common error types:
  // - Unknown variable
  // - Coordinates outside region bounds
  // - File not available for date
  // - Geospatial library loading issues
  // - CORS policy restrictions
}
```

### CORS Limitations

**Important Note**: The Oregon State University PRISM server has strict CORS policies that may prevent direct browser access even through proxy servers. If you encounter CORS errors:

#### Alternative Solutions:
1. **Server-side Integration**: Implement PRISM data fetching in your backend API
2. **Pre-downloaded Data**: Download PRISM data files manually and process them locally
3. **Alternative Data Sources**: Consider using other climate data sources that support CORS
4. **Proxy Configuration**: Use a dedicated server-side proxy with proper CORS headers

#### Example Server-side Approach:
```javascript
// Backend API endpoint (Node.js/Express example)
app.get('/api/prism-data', async (req, res) => {
  const { variable, latitude, longitude, date } = req.query;
  
  // Fetch PRISM data server-side (no CORS restrictions)
  const prismUrl = `https://prism.oregonstate.edu/fetchData.php?file=prism_${variable}_us_25m_${date}.zip`;
  const response = await fetch(prismUrl);
  const data = await response.arrayBuffer();
  
  // Process and return data
  res.json({ data: processedData });
});
```

## Performance Considerations

### Optimization Tips
- Use appropriate resolution for your analysis scale
- Consider regional datasets for focused studies
- Monthly/normals data loads faster than daily
- Grid data extraction may be slower for large regions

### Memory Usage
- Large grid extractions are processed efficiently
- GeoTIFF format is optimized for partial reads
- Automatic spatial subsetting reduces memory usage

## Data Quality and Limitations

### Strengths
- High spatial resolution climate data
- Sophisticated climate-elevation modeling
- Comprehensive quality control
- Long historical record

### Limitations
- Point observations may not capture all local variations
- Complex terrain areas may have larger uncertainties
- Some coastal and island areas have limited station coverage
- Daily data availability varies by region and time period

## References

- **PRISM Climate Group**: https://prism.oregonstate.edu/
- **Data Documentation**: https://prism.oregonstate.edu/documents/
- **Technical Information**: https://prism.oregonstate.edu/documents/PRISM_datasets.pdf
- **Data Access**: https://prism.oregonstate.edu/recent/

## Version History

- **New Format (2025+)**: Cloud Optimized GeoTIFF with improved access patterns
- **Legacy Format (1895-2025)**: Binary Interleaved by Line format
- **Transition Period**: Both formats available until September 30, 2025

## Technical Details

### Data Sources
- **Weather Stations**: Cooperative Observer Network, Automated Weather Stations
- **Elevation Data**: Digital Elevation Models (DEMs)
- **Coastal Data**: Additional marine and island stations

### Processing Methods
- **Climate-elevation regression**: Statistical modeling with elevation
- **Station weighting**: Distance and physiographic similarity
- **Quality control**: Automated and manual data validation
- **Grid interpolation**: Spatially continuous surfaces

### File Structure
```
prism_ppt_us_25m_20250915.zip
├── prism_ppt_us_25m_20250915.tif     # Main data file
├── prism_ppt_us_25m_20250915.prj     # Projection info
├── prism_ppt_us_25m_20250915.stx     # Statistics
├── prism_ppt_us_25m_20250915.xml     # FGDC metadata
├── prism_ppt_us_25m_20250915.aux.xml # Esri metadata
├── prism_ppt_us_25m_20250915.info.txt # Creation info
└── prism_ppt_us_25m_20250915.stn.csv # Contributing stations
```
