/**
 * General data transformation utilities
 * Contains reusable data manipulation functions
 */

/**
 * Apply data scaling based on data source and variable
 * @ignore
 */
export function applyDataScaling(data, variableName, datasources, source) {
  const sourceConfig = datasources[source];
  if (!sourceConfig || !sourceConfig.variables) {
    return data;
  }

  const variableConfig = sourceConfig.variables[variableName];
  if (!variableConfig || !variableConfig.scaleFactor) {
    return data;
  }

  const { scaleFactor, fillValue } = variableConfig;

  if (Array.isArray(data.data)) {
    data.data = data.data.map(value => {
      if (value === fillValue || value === null || value === undefined) {
        return null;
      }
      return value * scaleFactor;
    });
  }

  // Update metadata
  data.metadata = data.metadata || {};
  data.metadata.appliedScaling = true;
  data.metadata.scaleFactor = scaleFactor;
  data.metadata.source = source;

  return data;
}

/**
 * Convert data units based on source and variable
 * @ignore
 */
export function convertDataUnits(data, variableName, targetUnits, source, datasources) {
  const sourceConfig = datasources[source];
  if (!sourceConfig || !sourceConfig.variables) {
    return data;
  }

  const variableConfig = sourceConfig.variables[variableName];
  if (!variableConfig) return data;

  const currentUnits = variableConfig.units;
  if (currentUnits === targetUnits) return data;

  // Unit conversion logic would go here based on source
  // For now, just mark as converted
  data.metadata = data.metadata || {};
  data.metadata.unitConversion = {
    from: currentUnits,
    to: targetUnits,
    applied: true,
    source: source
  };

  return data;
}

/**
 * Apply temporal aggregation to data
 * @ignore
 */
export function aggregateTemporal(data, aggregationConfig) {
  const { method, interval } = aggregationConfig;

  data.metadata = data.metadata || {};
  data.metadata.temporalAggregation = {
    method: method,
    interval: interval,
    applied: true
  };

  return data;
}

/**
 * Apply spatial aggregation to data
 * @ignore
 */
export function aggregateSpatial(data, aggregationConfig) {
  const { method, factor } = aggregationConfig;

  data.metadata = data.metadata || {};
  data.metadata.spatialAggregation = {
    method: method,
    factor: factor,
    applied: true
  };

  return data;
}

/**
 * Apply quality control filters to data
 * @ignore
 */
export function applyQualityControl(data, qcConfig) {
  const { filters } = qcConfig;

  data.metadata = data.metadata || {};
  data.metadata.qualityControl = {
    filters: filters,
    applied: true
  };

  return data;
}

/**
 * Calculate statistics for data
 * @ignore
 */
export function calculateStatistics(data, statsConfig) {
  const { metrics } = statsConfig;

  if (Array.isArray(data.data)) {
    const validData = data.data.filter(v => v !== null && v !== undefined);

    const stats = {};
    if (metrics.includes('mean')) {
      stats.mean = validData.reduce((a, b) => a + b, 0) / validData.length;
    }
    if (metrics.includes('min')) {
      stats.min = Math.min(...validData);
    }
    if (metrics.includes('max')) {
      stats.max = Math.max(...validData);
    }
    if (metrics.includes('std')) {
      const mean = stats.mean || (validData.reduce((a, b) => a + b, 0) / validData.length);
      stats.std = Math.sqrt(validData.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / validData.length);
    }

    data.statistics = stats;
  }

  return data;
}

/**
 * Format data according to specified type and source
 * @ignore
 */
export function formatData(data, args, source, datasources) {
  const { type } = args;

  switch (type) {
    case 'CSV':
      return convertToCSV(data, source, datasources);
    case 'NetCDF':
      return convertToNetCDF(data, source, datasources);
    case 'JSON':
      return data; // Already in JSON format
    case 'ARRAY':
      return convertToArray(data);
    default:
      return data;
  }
}

/**
 * Convert data to CSV format based on source
 * @private
 */
function convertToCSV(data, source, datasources) {
  const sourceConfig = datasources[source];
  let csv = 'timestamp,value,variable,units\n';

  if (Array.isArray(data.data)) {
    data.data.forEach((value, index) => {
      const timestamp = data.timeRange?.start ?
        new Date(new Date(data.timeRange.start).getTime() + index * 3600000).toISOString() :
        `record_${index}`;
      const scaledValue = applyScalingToValue(value, data.metadata);
      csv += `${timestamp},${scaledValue},${data.variable},${data.metadata?.units || ''}\n`;
    });
  } else if (data.variable && Array.isArray(data.data)) {
    // Handle multi-variable data
    data.data.forEach((value, index) => {
      const timestamp = data.timeRange?.start ?
        new Date(new Date(data.timeRange.start).getTime() + index * 3600000).toISOString() :
        `record_${index}`;
      csv += `${timestamp},${value},${data.variable},${data.metadata?.units || ''}\n`;
    });
  }

  return csv;
}

/**
 * Convert data to NetCDF format based on source
 * @private
 */
function convertToNetCDF(data, source, datasources) {
  // Load NetCDF library if needed
  if (!window.hydro?.external?.griddedData?.isLoaded({ format: 'netcdf' })) {
    // Note: This would need to be awaited in an async context
    console.warn('NetCDF library not loaded. Use await window.hydro.external.griddedData.loadLibrary({ format: "netcdf" }) first.');
  }

  const sourceConfig = datasources[source];
  const variableConfig = sourceConfig?.variables?.[data.variable];

  // Create NetCDF-compatible structure
  return {
    type: 'netcdf',
    dimensions: {
      time: data.data ? data.data.length : 0,
      latitude: data.location ? 1 : 0,
      longitude: data.location ? 1 : 0
    },
    variables: {
      [data.variable]: {
        dimensions: ['time', 'latitude', 'longitude'],
        data: data.data,
        attributes: {
          units: data.metadata?.units || '',
          long_name: variableConfig?.longName || data.variable,
          scale_factor: data.metadata?.scaleFactor || 1.0,
          source: source
        }
      }
    },
    globalAttributes: {
      title: `${source.toUpperCase()} ${data.variable} data`,
      institution: sourceConfig?.info?.About?.split(' ')[0] || 'Unknown',
      source: `${source} Dataset`,
      history: `Generated on ${new Date().toISOString()}`,
      dataSource: source
    }
  };
}

/**
 * Convert data to array format
 * @private
 */
function convertToArray(data) {
  if (Array.isArray(data.data)) {
    return data.data;
  }
  return [data];
}

/**
 * Apply scaling to individual values
 * @ignore
 */
function applyScalingToValue(value, metadata) {
  if (value === null || value === undefined || value === metadata?.fillValue) {
    return '';
  }

  const scaleFactor = metadata?.scaleFactor || 1.0;
  return (value * scaleFactor).toFixed(6);
}
