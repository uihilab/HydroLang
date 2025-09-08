# AORC (Analysis of Record for Calibration) Data Source

## Overview

The AORC data source provides high-resolution meteorological forcing data for hydrologic modeling and analysis. AORC data includes precipitation, temperature, humidity, wind speed, and other meteorological variables at hourly temporal resolution and approximately 1km spatial resolution across the contiguous United States.

## Data Characteristics

### Temporal Coverage
- **Start Date**: January 1, 1979
- **End Date**: December 31, 2020 (varies by variable)
- **Temporal Resolution**: Hourly
- **Time Zone**: UTC

### Spatial Coverage
- **Geographic Extent**: Contiguous United States
- **Spatial Resolution**: ~1km (0.027° × 0.027°)
- **Coordinate System**: WGS84 (EPSG:4326)
- **Grid Dimensions**: 4201 × 8401 (latitude × longitude)

### Available Variables

| Variable | Units | Description | Fill Value |
|----------|-------|-------------|------------|
| `APCP_surface` | kg/m² | Total precipitation | -32767 |
| `DLWRF_surface` | W/m² | Downward longwave radiation | -999900 |
| `DSWRF_surface` | W/m² | Downward shortwave radiation | -999900 |
| `PRES_surface` | Pa | Surface pressure | -999900 |
| `SPFH_2maboveground` | kg/kg | Specific humidity at 2m | -999900 |
| `TMP_2maboveground` | K | Temperature at 2m | -999900 |
| `UGRD_10maboveground` | m/s | U-component of wind at 10m | -999900 |
| `VGRD_10maboveground` | m/s | V-component of wind at 10m | -999900 |

## Usage Examples

### Point Data Extraction

```javascript
// Extract precipitation data for Denver, CO
const result = await hydro.data.retrieve({
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
    endDate: "2020-07-01T23:00:00Z",
    format: "json"
  }
});

// Result structure
{
  "variable": "APCP_surface",
  "location": {
    "latitude": 39.7392,
    "longitude": -104.9903
  },
  "timeRange": {
    "start": "2020-07-01T00:00:00Z",
    "end": "2020-07-01T23:00:00Z"
  },
  "data": [
    {
      "timestamp": "2020-07-01T00:00:00.000Z",
      "value": 0.5,
      "variable": "APCP_surface",
      "units": "kg/m²",
      "source": "AORC"
    },
    // ... 23 more hourly values
  ],
  "metadata": {
    "units": "kg/m²",
    "scaleFactor": 0.1,
    "source": "AORC",
    "dataset": "AORC Version 1.1",
    "version": "1.1"
  }
}
```

### Multiple Variables

```javascript
const result = await hydro.data.retrieve({
  params: {
    source: "aorc",
    datatype: "point-data"
  },
  args: {
    dataset: "aorc-v1.1",
    variables: ["APCP_surface", "TMP_2maboveground", "PRES_surface"],
    latitude: 40.7128,
    longitude: -74.0060,
    startDate: "2020-01-01T00:00:00Z",
    endDate: "2020-01-01T23:00:00Z"
  }
});
```

### Grid Data Extraction

```javascript
// Extract data for a rectangular region
const result = await hydro.data.retrieve({
  params: {
    source: "aorc",
    datatype: "grid-data"
  },
  args: {
    dataset: "aorc-v1.1",
    variables: ["APCP_surface"],
    latitude: [39.0, 40.0],    // [minLat, maxLat]
    longitude: [-105.0, -104.0], // [minLon, maxLon]
    startDate: "2020-07-01T12:00:00Z",
    endDate: "2020-07-01T12:00:00Z"
  }
});
```

## Data Processing Notes

### Scaling and Units
- Raw AORC data is stored as integers to save space
- Values are scaled using scale factors and offsets
- The API automatically applies scaling to return physical units

### Missing Data
- Fill values indicate missing or invalid data
- The API returns `null` for missing values
- Check the `fillValue` in metadata for each variable

### Performance Considerations
- Point data extraction is optimized for single locations
- Grid data extraction may be slower for large regions
- Consider temporal range when requesting data

## Error Handling

```javascript
try {
  const result = await hydro.data.retrieve({
    params: { source: "aorc", datatype: "point-data" },
    args: {
      dataset: "aorc-v1.1",
      variables: ["APCP_surface"],
      latitude: 39.7392,
      longitude: -104.9903,
      startDate: "2020-07-01T00:00:00Z",
      endDate: "2020-07-01T23:00:00Z"
    }
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

## References

- **NOAA National Water Center**: https://water.noaa.gov/
- **AORC Data Documentation**: https://water.noaa.gov/about/aorc
- **Data Access**: Data is hosted on AWS S3 and accessed via HTTPS

## Version History

- **v1.1**: Current production version with improved data quality
- **v1.0**: Initial release with complete CONUS coverage
