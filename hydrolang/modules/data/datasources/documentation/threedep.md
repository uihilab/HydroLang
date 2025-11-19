# 3DEP (3D Elevation Program) Data Source

## Overview

The 3DEP data source provides high-resolution elevation data from the USGS 3D Elevation Program. 3DEP delivers high-quality, high-resolution topographic data and elevation models for the United States, including digital elevation models (DEMs) that can be used for hydrologic modeling, terrain analysis, flood mapping, and other geospatial applications.

## Data Characteristics

### Spatial Coverage
- **Geographic Extent**: Continental United States (CONUS)
- **Spatial Resolution**: 1 meter, 3 meters, 5 meters, 10 meters, and 30 meters
- **Coordinate System**: EPSG:5070 (Albers Equal Area) - native projection
- **Output Coordinate System**: EPSG:4326 (WGS84) - standard output
- **Data Format**: GeoTIFF, GeoRaster, JSON

### Temporal Coverage
- **Temporal Resolution**: Static elevation data (no temporal component)
- **Data Version**: Current production version
- **Update Frequency**: Periodic updates as new data becomes available

### Available Variables

| Variable | Units | Description | Fill Value |
|----------|-------|-------------|------------|
| `elevation` | meters | Digital Elevation Model values | -999999 |

## Usage Examples

### Point Elevation Extraction

```javascript
// Extract elevation for a specific coordinate
const result = await hydro.data.retrieve({
  params: {
    source: "threedep",
    datatype: "point-data"
  },
  args: {
    dataset: "3dep-dem",
    variables: ["elevation"],
    latitude: 40.7128,
    longitude: -74.0060,
    format: "json"
  }
});

// Result structure
{
  "variable": "elevation",
  "location": {
    "latitude": 40.7128,
    "longitude": -74.0060
  },
  "value": 10.5, // Elevation in meters above NAVD88
  "metadata": {
    "units": "meters",
    "source": "3DEP",
    "datum": "NAVD88",
    "resolution": "1m",
    "format": "json"
  }
}
```

### Grid Elevation Data Extraction

```javascript
// Extract DEM data for a rectangular region
const result = await hydro.data.retrieve({
  params: {
    source: "threedep",
    datatype: "grid-data"
  },
  args: {
    dataset: "3dep-dem",
    variables: ["elevation"],
    bbox: [-75.0, 40.0, -73.0, 42.0], // [west, south, east, north]
    resolution: 10, // 10-meter resolution
    format: "georaster"
  }
});

// Result structure for GeoRaster format
{
  "variable": "elevation",
  "bbox": [-75.0, 40.0, -73.0, 42.0],
  "data": {
    "values": [
      [125.3, 128.7, 132.1, ...], // 2D elevation array
      [122.8, 126.4, 129.8, ...],
      // ... more rows
    ],
    "coordinates": {
      "latitude": [42.0, 41.999, 41.998, ...],
      "longitude": [-75.0, -74.999, -74.998, ...]
    },
    "shape": [1200, 1200],
    "bounds": {
      "north": 42.0,
      "south": 40.0,
      "east": -73.0,
      "west": -75.0
    }
  },
  "metadata": {
    "units": "meters",
    "source": "3DEP",
    "datum": "NAVD88",
    "resolution": "10m",
    "crs": "EPSG:4326",
    "format": "georaster"
  }
}
```

### GeoTIFF Format Extraction

```javascript
// Extract elevation data as GeoTIFF for GIS applications
const result = await hydro.data.retrieve({
  params: {
    source: "threedep",
    datatype: "grid-data"
  },
  args: {
    dataset: "3dep-dem",
    variables: ["elevation"],
    bbox: [-74.01, 40.70, -73.99, 40.72], // Small area around NYC
    resolution: 1, // 1-meter resolution
    format: "geotiff"
  }
});

// Result structure for GeoTIFF
{
  "variable": "elevation",
  "bbox": [-74.01, 40.70, -73.99, 40.72],
  "data": {
    "geotiff": {
      "buffer": ArrayBuffer(...), // Raw GeoTIFF data
      "size": 245760, // Size in bytes
      "format": "geotiff",
      "bands": 1,
      "width": 1200,
      "height": 1200
    }
  },
  "metadata": {
    "units": "meters",
    "source": "3DEP",
    "datum": "NAVD88",
    "resolution": "1m",
    "crs": "EPSG:5070",
    "compression": "LZ77"
  }
}
```

### Dataset Information

```javascript
// Get metadata about the 3DEP dataset
const result = await hydro.data.retrieve({
  params: {
    source: "threedep",
    datatype: "dataset-info"
  },
  args: {
    dataset: "3dep-dem",
    info: "spatial" // or "variables", "metadata"
  }
});
```

## Data Processing Notes

### Resolution Options
- **1 meter**: Highest resolution, available for select urban areas
- **3 meters**: High resolution, available for most of CONUS
- **5 meters**: Moderate resolution, good coverage
- **10 meters**: Standard resolution, nationwide coverage
- **30 meters**: Legacy resolution, complete nationwide coverage

### Coordinate Systems
- **Native**: EPSG:5070 (Albers Equal Area) - used for data storage
- **Output**: EPSG:4326 (WGS84) - standard geographic coordinates
- **Automatic Transformation**: Coordinate system conversion handled automatically

### Data Quality and Accuracy
- **Vertical Accuracy**: ±1 meter or better (varies by resolution)
- **Horizontal Accuracy**: ±2 meters or better
- **Datum**: NAVD88 (North American Vertical Datum 1988)
- **Quality Control**: USGS quality assurance procedures

### File Formats
- **GeoTIFF**: Standard geospatial raster format, suitable for GIS applications
- **GeoRaster**: JavaScript-friendly format for web applications
- **JSON**: Simple point data format for single locations

## Performance Considerations

### Data Volume
- **Point queries**: Fast response, minimal data transfer
- **Grid queries**: Data volume scales with area and resolution
- **1m resolution**: ~4MB per square kilometer
- **10m resolution**: ~40KB per square kilometer

### Optimal Usage
```javascript
// For single point elevation lookup
args: {
  resolution: 10, // Lower resolution sufficient for point data
  format: "json"  // Lightweight format
}

// For terrain analysis over large areas
args: {
  resolution: 30, // Balance between detail and performance
  format: "geotiff" // GIS-compatible format
}

// For web mapping applications
args: {
  resolution: 10, // Good detail for visualization
  format: "georaster" // JavaScript-friendly
}
```

## Error Handling

```javascript
try {
  const result = await hydro.data.retrieve({
    params: { source: "threedep", datatype: "point-data" },
    args: {
      dataset: "3dep-dem",
      variables: ["elevation"],
      latitude: 40.7128,
      longitude: -74.0060
    }
  });

  if (result.error) {
    console.error('3DEP data retrieval failed:', result.error);
  } else {
    console.log('Elevation data retrieved successfully');
  }
} catch (error) {
  console.error('Request failed:', error.message);

  // Common error types:
  // - Coordinates outside CONUS coverage
  // - Requested resolution not available for area
  // - Service temporarily unavailable
  // - Invalid bounding box parameters
}
```

## Data Quality and Limitations

### Strengths
- **High Resolution**: Up to 1-meter resolution in select areas
- **Nationwide Coverage**: Complete CONUS coverage
- **High Accuracy**: Survey-grade elevation data
- **Multiple Formats**: Flexible output formats for different applications
- **Free Access**: No cost for data access

### Limitations
- **CONUS Only**: Limited to continental United States
- **Resolution Variability**: 1m data not available everywhere
- **Static Data**: No temporal component (elevation doesn't change rapidly)
- **File Size**: Large areas at high resolution produce big files
- **Processing Time**: Complex coordinate transformations for large requests

### Accuracy Guidelines
- **1m data**: ±1m vertical accuracy, urban areas only
- **3m data**: ±1.5m vertical accuracy, most CONUS areas
- **10m data**: ±2.5m vertical accuracy, nationwide coverage
- **30m data**: ±5m vertical accuracy, complete coverage

## References

- **USGS 3DEP Program**: https://www.usgs.gov/3d-elevation-program
- **National Map**: https://www.usgs.gov/programs/national-map
- **Data Access**: https://elevation.nationalmap.gov/
- **Technical Documentation**: https://www.usgs.gov/3d-elevation-program/3dep-products-and-services

## Version History

- **Current**: Production version with nationwide coverage
- **Updates**: Periodic releases as new data is collected and processed
- **Archive**: Historical versions maintained for reproducibility

