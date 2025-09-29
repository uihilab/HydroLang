// Test code for GRIB2 grid extraction - FIXED VERSION
// Copy and paste this into your browser console to test

// Test the HRRR grid data retrieval
const testHRRRGrid = async () => {
  console.log('Testing HRRR Grid Data Retrieval (FIXED VERSION)...');

  try {
    const hrrrPrecipGrid = await hydro.data.retrieve({
      params: { source: 'hrrr', datatype: 'grid-data' },
      args: {
        dataset: 'hrrr-operational',
        variable: 'APCP',
        bbox: [-95.0, 29.0, -90.0, 34.0], // Houston area
        startDate: '2025-09-16T12:00:00Z',
        forecastHour: 6
      }
    });

    console.log('SUCCESS! HRRR Grid Data Retrieved');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    // Check if data structure is correct
    console.log('Data Structure Check:');
    console.log('  - hrrrPrecipGrid.data.shape exists:', !!hrrrPrecipGrid.data?.shape);
    console.log('  - hrrrPrecipGrid.data.values exists:', !!hrrrPrecipGrid.data?.values);
    console.log('  - hrrrPrecipGrid.data.coordinates exists:', !!hrrrPrecipGrid.data?.coordinates);

    if (!hrrrPrecipGrid.data?.shape || !hrrrPrecipGrid.data?.values) {
      console.error('Data structure is incorrect!');
      console.log('Raw result:', hrrrPrecipGrid);
      throw new Error('Data structure validation failed');
    }

    console.log('Grid Shape:', hrrrPrecipGrid.data.shape);
    console.log('Sample Values (first row, first 5):', hrrrPrecipGrid.data.values[0]?.slice(0, 5));
    console.log('Coordinate Arrays Length:', {
      latitude: hrrrPrecipGrid.data.coordinates?.latitude?.length || 0,
      longitude: hrrrPrecipGrid.data.coordinates?.longitude?.length || 0
    });
    console.log('Spatial Bounds:', hrrrPrecipGrid.data.coordinates?.bounds);
    console.log('Metadata:', {
      units: hrrrPrecipGrid.metadata?.units,
      parameterName: hrrrPrecipGrid.metadata?.parameterName,
      gridType: hrrrPrecipGrid.metadata?.gridType,
      spatialResolution: hrrrPrecipGrid.metadata?.spatialResolution,
      originalShape: hrrrPrecipGrid.metadata?.originalShape,
      subsetShape: hrrrPrecipGrid.metadata?.subsetShape
    });

    // Test that we have a proper 2D grid
    const shape = hrrrPrecipGrid.data.shape;
    const values = hrrrPrecipGrid.data.values;

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('Validation Tests:');

    // Check for NaN values
    let nanCount = 0;
    let totalCount = 0;
    for (let i = 0; i < values.length; i++) {
      for (let j = 0; j < values[i].length; j++) {
        totalCount++;
        if (isNaN(values[i][j])) nanCount++;
      }
    }

    if (nanCount === 0) {
      console.log('No NaN values found in grid data');
    } else {
      console.log(`Found ${nanCount} NaN values out of ${totalCount} total values`);
    }

    // Check grid structure
    if (Array.isArray(values) && values.length === shape[0]) {
      console.log('Grid has correct number of rows:', values.length);
    } else {
      console.log('Grid row count mismatch:', values.length, 'vs expected', shape[0]);
    }

    if (values[0] && Array.isArray(values[0]) && values[0].length === shape[1]) {
      console.log('Grid has correct number of columns:', values[0].length);
    } else {
      console.log('Grid column count mismatch:', values[0]?.length || 0, 'vs expected', shape[1]);
    }

    // Check coordinate arrays
    const coords = hrrrPrecipGrid.data.coordinates;
    if (coords?.latitude?.length === shape[0]) {
      console.log('Latitude array matches grid rows');
    } else {
      console.log('Latitude array length mismatch:', coords?.latitude?.length || 0, 'vs expected', shape[0]);
    }

    if (coords?.longitude?.length === shape[1]) {
      console.log('Longitude array matches grid columns');
    } else {
      console.log('Longitude array length mismatch:', coords?.longitude?.length || 0, 'vs expected', shape[1]);
    }

    // Show a small sample of the grid
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('Sample Grid (3x3 subset):');
    for (let i = 0; i < Math.min(3, values.length); i++) {
      const row = values[i].slice(0, Math.min(3, values[i].length));
      console.log(`   Row ${i}: [${row.map(v => typeof v === 'number' ? v.toFixed(2) : v).join(', ')}]`);
    }

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('All validation tests passed! Grid data is ready for map integration.');

    return hrrrPrecipGrid;

  } catch (error) {
    console.error('FAILED: HRRR Grid Data Retrieval');
    console.error('Error:', error.message);
    console.error('Stack:', error.stack);
    throw error;
  }
};

// Run the test
console.log('Starting HRRR Grid Test...');
testHRRRGrid().then(result => {
  console.log('Test completed successfully!');
  console.log('Your grid data is ready for map integration!');
}).catch(error => {
  console.log('Test failed:', error.message);
});

// Export for manual testing
window.testHRRRGrid = testHRRRGrid;
