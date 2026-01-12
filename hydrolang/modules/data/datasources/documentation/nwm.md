# NWM (National Water Model) Retrospective Data Source

## Overview

The NWM Retrospective data source provides historical streamflow simulations from the NOAA National Water Model. This dataset contains calibrated hydrologic model outputs at high temporal and spatial resolution, covering the entire continental United States.

## Data Characteristics

### Temporal Coverage
- **Start Date**: January 1, 1979
- **End Date**: December 31, 2020
- **Temporal Resolution**: Hourly
- **Time Zone**: UTC
- **Total Hours**: ~367,439 hours

### Spatial Coverage
- **Geographic Extent**: Continental United States
- **Spatial Resolution**: Catchment-scale (varies by location)
- **Features**: 2,776,738 stream reaches/COMIDs
- **Coordinate System**: Geographic (latitude/longitude)

### Available Variables

| Variable | Units | Description | Fill Value |
|----------|-------|-------------|------------|
| `streamflow` | m³/s | Stream discharge | -999900 |
| `velocity` | m/s | Flow velocity | -999900 |
| `nudge` | m³/s | Streamflow nudging | -999900 |

## Usage Examples

### Single Location Point Data

```javascript
// Extract streamflow data for a specific COMID near New Orleans
const result = await hydro.data.retrieve({
  params: {
    source: "nwm",
    datatype: "point-data"
  },
  args: {
    dataset: "nwm-retrospective-2-1-zarr-pds",
    variables: ["streamflow"],
    comid: 22799307,  // Specific COMID (can also use lat/lon)
    startDate: "2019-07-01T00:00:00Z",
    endDate: "2019-07-31T23:00:00Z",
    format: "json"
  }
});

// Result structure
{
  "variable": "streamflow",
  "location": {
    "latitude": 29.955178,
    "longitude": -90.155185,
    "comid": "22799307"
  },
  "timeRange": {
    "start": "2019-07-01T00:00:00Z",
    "end": "2019-07-31T23:00:00Z"
  },
  "data": [
    {
      "timestamp": "2019-07-01T00:00:00.000Z",
      "value": 11095.85,
      "comid": "22799307"
    },
    {
      "timestamp": "2019-07-01T01:00:00.000Z",
      "value": 11092.88,
      "comid": "22799307"
    },
    // ... ~743 more hourly values for the month
  ],
  "metadata": {
    "units": "m³/s",
    "scaleFactor": 0.01,
    "source": "NWM",
    "dataset": "NWM Retrospective Version 2.1 - Zarr format - 41-year simulation (1979-2020)",
    "version": "2.1"
  }
}
```

### Coordinate-based Location (NLDI Lookup)

```javascript
// Extract data using latitude/longitude - COMID will be found automatically
const result = await hydro.data.retrieve({
  params: {
    source: "nwm",
    datatype: "point-data"
  },
  args: {
    dataset: "nwm-retrospective-2-1-zarr-pds",
    variables: ["streamflow"],
    latitude: 29.955178,   // New Orleans area
    longitude: -90.155185,
    startDate: "2019-07-01T00:00:00Z",
    endDate: "2019-07-01T23:00:00Z"
  }
});
```

### Multiple Locations (Timeseries)

```javascript
// Extract streamflow for multiple locations simultaneously
const result = await hydro.data.retrieve({
  params: {
    source: "nwm",
    datatype: "timeseries-data"
  },
  args: {
    dataset: "nwm-retrospective-2-1-zarr-pds",
    variable: "streamflow",
    locations: [
      [29.928429, -89.984168],  // Location 1
      [29.955178, -90.155185],  // Location 2
      [40.7128, -74.0060]      // New York City
    ],
    startDate: "2019-07-01T00:00:00Z",
    endDate: "2019-07-02T23:00:00Z"
  }
});

// Result structure for multiple locations
{
  "29.928429_-89.984168": {
    "variable": "streamflow",
    "location": { "latitude": 29.928429, "longitude": -89.984168, "comid": "22814607" },
    "data": [/* 48 hourly values */],
    "metadata": { /* ... */ }
  },
  "29.955178_-90.155185": {
    "variable": "streamflow",
    "location": { "latitude": 29.955178, "longitude": -90.155185, "comid": "22799307" },
    "data": [/* 48 hourly values */],
    "metadata": { /* ... */ }
  },
  "40.7128_-74.0060": {
    "variable": "streamflow",
    "location": { "latitude": 40.7128, "longitude": -74.0060, "comid": "Found COMID" },
    "data": [/* 48 hourly values */],
    "metadata": { /* ... */ }
  }
}
```

## COMID (Catchment Outlet Identification)

### Understanding COMIDs
- COMIDs are unique identifiers for stream reaches in the NHDPlus dataset
- Each COMID represents a specific stream segment with defined hydrologic characteristics
- COMIDs are used to extract data for specific locations

### Finding COMIDs
```javascript
// Method 1: Use latitude/longitude (automatic lookup)
const result = await hydro.data.retrieve({
  params: { source: "nldi", datatype: "getFeatureByCoordinates" },
  args: {
    latitude: 29.955178,
    longitude: -90.155185
  }
});

// Method 2: Use NLDI web service directly
// Visit: https://labs.waterdata.usgs.gov/api/nldi/linked-data/comid/22799307
```

### COMID Validation
- COMIDs must be valid NHDPlus identifiers
- Invalid or non-existent COMIDs will return an error
- The API automatically validates COMID existence

## Data Processing Notes

### Scaling and Units
- Raw NWM data is stored as scaled integers
- Values are automatically scaled to physical units
- Check `scaleFactor` in metadata for conversion details

### Missing Data
- Fill value: -999900 indicates missing data
- The API returns `null` for missing values
- Some locations may have data gaps

### Performance Considerations
- Large temporal ranges may take time to process
- Multiple locations are processed in parallel
- Consider data volume when requesting large datasets

## Error Handling

```javascript
try {
  const result = await hydro.data.retrieve({
    params: { source: "nwm", datatype: "point-data" },
    args: {
      dataset: "nwm-retrospective-2-1-zarr-pds",
      variables: ["streamflow"],
      latitude: 29.955178,
      longitude: -90.155185,
      startDate: "2019-07-01T00:00:00Z",
      endDate: "2019-07-01T23:00:00Z"
    }
  });

  if (result.error) {
    console.error('Data retrieval failed:', result.error);
  } else {
    console.log(`Retrieved ${result.data.length} data points`);
  }
} catch (error) {
  console.error('Request failed:', error.message);
}
```

## Data Quality and Limitations

### Known Issues
- Some coastal areas may have missing data
- Extreme events may have quality issues
- Data gaps exist for certain time periods

### Validation
- Data has been calibrated against observed streamflow
- Quality control procedures applied
- Regular updates and improvements

## References

- **NOAA National Water Center**: https://water.noaa.gov/
- **NWM Documentation**: https://water.noaa.gov/about/nwm
- **NHDPlus Dataset**: https://www.usgs.gov/national-hydrography/nhdplus-high-resolution
- **NLDI Service**: https://labs.waterdata.usgs.gov/api/nldi

## Version History

- **v2.1**: Current production version with improved calibration
- **v2.0**: Major update with enhanced hydrologic processes
- **v1.x**: Initial versions with basic functionality

## Technical Details

### Data Format
- **Storage**: Zarr format with Blosc compression
- **Chunking**: Optimized for spatial-temporal queries
- **Access**: HTTPS via AWS S3

### API Endpoints
- **Base URL**: https://noaa-nwm-retrospective-2-1-zarr-pds.s3.amazonaws.com/
- **Product**: chrtout.zarr (channel routing output)
- **Variables**: streamflow, velocity, nudge

