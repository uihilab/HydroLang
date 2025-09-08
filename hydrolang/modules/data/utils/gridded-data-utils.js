/**
 * Gridded data format utilities
 * Handles lazy loading and management of gridded scientific data libraries (Zarr, NetCDF, HDF5)
 */

// Import the external libraries dynamically
let zarrLibrary = null;
let zarrLoadedLibraries = null;
let netcdfLibrary = null;
let hdf5Library = null;
let geospatialLibrary = null;

/**
 * Load scientific data libraries dynamically
 */
export async function loadSciDataLibrary(format) {
  try {
    switch (format) {
      case 'zarr':
        if (!zarrLibrary) {
          const zarrModule = await import('../../../external/gridded-data/zarr/zarr.js');
          zarrLibrary = zarrModule.default;
        }
        if (!zarrLibrary.isLoaded()) {
          zarrLoadedLibraries = await zarrLibrary.load();
        }
        return zarrLoadedLibraries;

      case 'netcdf':
        if (!netcdfLibrary) {
          const netcdfModule = await import('../../../external/gridded-data/netcdf/netcdf.js');
          netcdfLibrary = netcdfModule.default;
        }
        if (!netcdfLibrary.isLoaded()) {
          await netcdfLibrary.load();
        }
        return netcdfLibrary;

      case 'hdf5':
        if (!hdf5Library) {
          const hdf5Module = await import('../../../external/gridded-data/hdf5/hdf5.js');
          hdf5Library = hdf5Module.default;
        }
        if (!hdf5Library.isLoaded()) {
          await hdf5Library.load();
        }
        return hdf5Library;

      case 'geospatial':
        if (!geospatialLibrary) {
          const geospatialModule = await import('../../../external/gridded-data/geospatial/geospatial.js');
          geospatialLibrary = geospatialModule.default;
        }
        if (!geospatialLibrary.isLoaded()) {
          await geospatialLibrary.load();
        }
        return geospatialLibrary;

      default:
        throw new Error(`Unsupported scientific data format: ${format}`);
    }
  } catch (error) {
    throw new Error(`Failed to load ${format} library: ${error.message}`);
  }
}

/**
 * Check if a scientific data library is loaded
 */
export function isSciDataLibraryLoaded(format) {
  switch (format) {
    case 'zarr':
      return zarrLibrary && zarrLibrary.isLoaded() && zarrLoadedLibraries !== null;
    case 'netcdf':
      return netcdfLibrary && netcdfLibrary.isLoaded();
    case 'hdf5':
      return hdf5Library && hdf5Library.isLoaded();
    case 'geospatial':
      return geospatialLibrary && geospatialLibrary.isLoaded();
    default:
      return false;
  }
}

/**
 * Get loaded library instance
 */
export function getSciDataLibrary(format) {
  switch (format) {
    case 'zarr':
      return zarrLoadedLibraries;
    case 'netcdf':
      return netcdfLibrary;
    case 'hdf5':
      return hdf5Library;
    case 'geospatial':
      return geospatialLibrary;
    default:
      return null;
  }
}

/**
 * Aggregate time periods
 */
export function aggregateTime(date, timeStep, direction) {
  const dateObj = new Date(date);
  const hours = timeStep === '1D' ? 24 : parseInt(timeStep) || 1;

  if (direction === 'start') {
    const startOfPeriod = new Date(dateObj);
    startOfPeriod.setHours(Math.floor(dateObj.getHours() / hours) * hours, 0, 0, 0);
    return startOfPeriod.toISOString();
  } else {
    const endOfPeriod = new Date(dateObj);
    endOfPeriod.setHours(Math.ceil((dateObj.getHours() + 1) / hours) * hours, 0, 0, 0);
    return endOfPeriod.toISOString();
  }
}

/**
 * Expand spatial bounding box by step factor
 */
export function expandSpatialBounds(bbox, spatialStep) {
  const [west, south, east, north] = bbox;
  const expansionFactor = spatialStep / 10;
  return [
    Math.max(-180, west - expansionFactor),
    Math.max(-90, south - expansionFactor),
    Math.min(180, east + expansionFactor),
    Math.min(90, north + expansionFactor)
  ];
}

/**
 * Validate coordinate bounds
 */
export function isValidCoordinate(latitude, longitude, spatialBounds) {
  return latitude >= spatialBounds.latitude.min &&
         latitude <= spatialBounds.latitude.max &&
         longitude >= spatialBounds.longitude.min &&
         longitude <= spatialBounds.longitude.max;
}

/**
 * Validate bounding box
 */
export function isValidBoundingBox(bbox, spatialBounds) {
  const [west, south, east, north] = bbox;
  return west >= spatialBounds.longitude.min &&
         east <= spatialBounds.longitude.max &&
         south >= spatialBounds.latitude.min &&
         north <= spatialBounds.latitude.max;
}
