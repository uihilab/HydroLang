// Author: Gerard Llorach
// License: MIT
// https://github.com/BlueNetCat/grib22json

//fetch('COSMODE_single_level_elements_PS_2018020500_000.grib2')
//fetch('COSMODE_single_level_elements_ASWDIR_S_2018011803_006.grib2')
//fetch('gdas.t00z.pgrb2.0p25.f000.grib2') // temperature in kelvins
//fetch('gdas.t00z.pgrb2.1p00.f000.grib2') // winds
//fetch('winds.grb')
//   .then(response => response.arrayBuffer())
//    .then(buffer => decodeGRIB2File(buffer))
//    .catch(error => console.log(error));

import { GRIB2 } from './grib2.js';


export const decodeGRIB2File = function (buffer, options = {}) {


    let gribByteIndex = 0;
    let gribFiles = [];
    let gribFileBuffers = [];

    // Separate GRIB buffers
    while (gribByteIndex < buffer.byteLength) {
        // Get Total GRIB length from buffer
        let gribLength = new DataView(buffer.slice(gribByteIndex + 12, gribByteIndex + 16)).getInt32();
        gribFileBuffers.push(buffer.slice(gribByteIndex, gribByteIndex + gribLength));
        gribByteIndex += gribLength;
    }

    console.log("Number of grib buffers: " + gribFileBuffers.length);
    // Iterate over GRIB buffers
    for (let i = 0; i < gribFileBuffers.length; i++) {
        gribFiles[i] = new GRIB2(gribFileBuffers[i]);
        decodeGRIB2Buffer(gribFileBuffers[i], gribFiles[i], options);
        gribFiles[i].imgEl = getImgElement(gribFiles[i].data);
    }

    return gribFiles;
}

// Draw the grid datapoints
// Get the image element (also can be used for drawData)
const getImgElement = function (data) {
    var canvas = document.createElement("canvas");
    canvas.width = data.grid.numLongPoints;
    canvas.height = data.grid.numLatPoints;

    var ctx = canvas.getContext("2d");
    var imgData = ctx.createImageData(canvas.width, canvas.height);

    var max = -Infinity;
    var min = Infinity;
    for (let i = 1; i < data.values.length; i++) {
        if (!isNaN(data.values[i])) {
            max = Math.max(max, data.values[i]);
            min = Math.min(min, data.values[i]);
        }
    }

    // How data points are stored is specified in section 3
    for (let i = 0; i < imgData.data.length; i += 4) {
        let value = data.values[i / 4];
        let alpha = (data.values[i / 4] === null || isNaN(data.values[i / 4])) ? 0 : 255;
        let normValue = (value - min) / (max - min);

        imgData.data[i + 0] = normValue * 255;
        imgData.data[i + 1] = 0;
        imgData.data[i + 2] = 0;
        imgData.data[i + 3] = alpha;
    }

    ctx.putImageData(imgData, 0, 0);

    let img = new Image(canvas.width, canvas.height);
    img.src = canvas.toDataURL("image/png");

    return img;
    //document.body.append(canvas);
}












export const decodeGRIB2Buffer = function (buffer, grib2, options = {}) {


    // Section 0 - Indicator Section
    let sectionHeader = buffer.slice(0, 16);
    decodeSection(sectionHeader, grib2.dataTemplate[0]);

    // Check if it is GRIB2
    if (grib2.dataTemplate[0][3].content !== 2) {
        console.error("This is not a GRIB2. File edition number: " + grib2.dataTemplate[0][3].content);
        let str = '** Section 0 <info>: <content> ** \n';
        for (let i = 0; i < grib2.dataTemplate[0].length; i++)
            str += grib2.dataTemplate[0][i].info + ": " + grib2.dataTemplate[0][i].content + "\n";
        console.error(str);
        return;
    }

    // Discipline
    console.log(grib2.dataTemplate[0][2].info + ": " + grib2.dataTemplate[0][2].contentRef + "(" + grib2.dataTemplate[0][2].content + ")");

    // Separate section buffers
    let sectionByteIndex = 16;
    let sectionBuffers = grib2.sectionBuffers;

    while (sectionByteIndex < buffer.byteLength) {
        // Get Total GRIB length from buffer
        let sectionLength = new DataView(buffer.slice(sectionByteIndex, sectionByteIndex + 4)).getInt32();
        sectionBuffers.push(buffer.slice(sectionByteIndex, sectionByteIndex + sectionLength));
        sectionByteIndex += sectionLength;
    }

    if (sectionBuffers.length > 8)
        console.error("TODO: implement repeated sections in grib buffer. Number of sections inside grib buffer: " + sectionBuffers.length);

    // Decode section buffers
    let usedSectionNumbers = [];
    for (let i = 0; i < sectionBuffers.length - 1; i++) { // (length - 1) because of end section has 4 bytes only (7777)
        let sectionNumber = new DataView(sectionBuffers[i].slice(4, 5)).getInt8();
        grib2.dataTemplate[sectionNumber] = decodeSection(sectionBuffers[i], grib2.dataTemplate[sectionNumber]);

        // TODO: sections can be repeated
        if (usedSectionNumbers.includes(sectionNumber))
            console.error("TODO: section " + sectionNumber + "repeated: sections can be repeated inside GRIB. Right now only using the last repeated section");
        usedSectionNumbers.push(sectionNumber);
    }
    // Section 8 data template does not contain the section number
    grib2.dataTemplate[8] = decodeSection(sectionBuffers[sectionBuffers.length - 1], grib2.dataTemplate[8]);


    console.log(grib2.dataTemplate);
    // Transform from binary to JSON
    grib2.data = parseData(grib2.dataTemplate, options);

}



// Parse data
const parseData = function (decodedGrib, options = {}) {

    let data = {};

    let grid = {};

    grid.numPoints = getContentByInfo(decodedGrib[3], 'Number of data points');

    // Check which grid definition template is being used
    let templateNumber = getContentByInfo(decodedGrib[3], 'Grid definition template number (= N) (See Table 3.1)');

    // Debug: log what we actually found
    console.log('Grid template number found:', templateNumber);
    console.log('Section 3 contents:', decodedGrib[3]);

    grid.template = templateNumber;

    if (templateNumber == 0) {
        // Template 3.0: Latitude-longitude (regular grid)
        grid.numLongPoints = getContentByInfo(decodedGrib[3], 'Ni — number of points along a parallel');
        grid.numLatPoints = getContentByInfo(decodedGrib[3], 'Nj — number of points along a meridian');

        grid.latStart = getContentByInfo(decodedGrib[3], 'La1 — latitude of first grid point (see Note 1)') / 1e6;
        grid.lonStart = getContentByInfo(decodedGrib[3], 'Lo1 — longitude of first grid point (see Note 1)') / 1e6;

        grid.latEnd = getContentByInfo(decodedGrib[3], 'La2 — latitude of last grid point (see Note 1)') / 1e6;
        grid.lonEnd = getContentByInfo(decodedGrib[3], 'Lo2 — longitude of last grid point (see Note 1)') / 1e6;

        grid.incI = getContentByInfo(decodedGrib[3], 'Di — i direction increment (see Notes 1 and 5)') / 1e6;
        grid.incJ = getContentByInfo(decodedGrib[3], 'Dj — j direction increment (see Note 1 and 5)') / 1e6;

        // Generate full lat/lon arrays
        grid.latitudes = [];
        grid.longitudes = [];

        // Note: GRIB2 usually scans from top-left (North-West)
        // Check scanning mode flag if needed, but for MRMS it's typically:
        // Lat decreases (starts at North), Lon increases (starts at West)
        // However, latStart/latEnd values tell the direction.

        // Simple generation based on start/end/inc
        // Assuming standard scanning mode for now (adjust if needed based on Flag Table 3.4)

        for (let j = 0; j < grid.numLatPoints; j++) {
            // Calculate lat based on start and increment
            // If latStart > latEnd, we subtract increment (or increment is negative?)
            // Usually incJ is positive, so we need to check direction
            let lat;
            if (grid.latStart > grid.latEnd) {
                lat = grid.latStart - (j * grid.incJ);
            } else {
                lat = grid.latStart + (j * grid.incJ);
            }

            for (let i = 0; i < grid.numLongPoints; i++) {
                let lon = grid.lonStart + (i * grid.incI);
                // Normalize lon to -180 to 180 if needed
                if (lon > 180) lon -= 360;

                grid.latitudes.push(lat);
                grid.longitudes.push(lon);
            }
        }
        console.log(`[grib2utils] Generated lat/lon arrays. Latitudes: ${grid.latitudes.length}, Longitudes: ${grid.longitudes.length}`);

    } else if (templateNumber == 30) {
        // Template 3.30: Lambert Conformal (used by HRRR)
        grid.numLongPoints = getContentByInfo(decodedGrib[3], 'Nx — number of points along x-axis');
        grid.numLatPoints = getContentByInfo(decodedGrib[3], 'Ny — number of points along y-axis');

        grid.latStart = getContentByInfo(decodedGrib[3], 'La1 — latitude of first grid point') / 1e6;
        grid.lonStart = getContentByInfo(decodedGrib[3], 'Lo1 — longitude of first grid point') / 1e6;

        // For Lambert Conformal, we don't have latEnd/lonEnd in the same way
        // The grid is defined by the projection parameters
        grid.latEnd = grid.latStart; // Will be calculated differently
        grid.lonEnd = grid.lonStart; // Will be calculated differently

        grid.incI = getContentByInfo(decodedGrib[3], 'Dx — x-direction grid length (see Note 1)') / 1e6;
        grid.incJ = getContentByInfo(decodedGrib[3], 'Dy — y-direction grid length (see Note 1)') / 1e6;

        // Lambert Conformal specific parameters
        grid.lambertLat1 = getContentByInfo(decodedGrib[3], 'Latin 1 — first latitude from the pole at which the secant cone cuts the sphere') / 1e6;
        grid.lambertLat2 = getContentByInfo(decodedGrib[3], 'Latin 2 — second latitude from the pole at which the secant cone cuts the sphere') / 1e6;
        grid.lambertLon = getContentByInfo(decodedGrib[3], 'Lov — longitude of meridian parallel to y-axis along which latitude increases') / 1e6;

    } else {
        console.warn("Unsupported grid definition template: " + templateNumber + ". Using fallback values.");
        // Fallback for unsupported templates
        grid.numLongPoints = Math.sqrt(grid.numPoints) || 1;
        grid.numLatPoints = grid.numPoints / grid.numLongPoints || 1;
        grid.latStart = 0;
        grid.lonStart = 0;
        grid.latEnd = 0;
        grid.lonEnd = 0;
        grid.incI = 1;
        grid.incJ = 1;
    }

    grid.scanningMode = getContentRefByInfo(decodedGrib[3], 'Scanning mode (flags — see Flag Table 3.4 and Note 6)');

    // Ensure scanningMode is properly initialized
    if (!grid.scanningMode || !Array.isArray(grid.scanningMode)) {
        console.warn("Scanning mode not properly parsed, using default [0,0,0,0,0,0,0,0]");
        grid.scanningMode = [[0], [0], [0], [0], [0], [0], [0], [0]]; // Default scanning mode (8 bits)
    }

    // Ensure each scanning mode bit is properly defined
    for (let i = 0; i < 8; i++) {
        if (!grid.scanningMode[i] || !Array.isArray(grid.scanningMode[i])) {
            grid.scanningMode[i] = [0]; // Default bit value
        }
    }

    // Check if numPoints corresponds to numLatPoints * numLongPoints
    if (grid.numPoints != grid.numLatPoints * grid.numLongPoints)
        console.warn("Section 3. Grid numPoints does not equal to numLatPoints * numLongPoints. numPoints = " + grid.numPoints + " , numLatPoints * numLongPoints = " + grid.numLatPoints * grid.numLongPoints);

    // Check if the number of values 
    let numValues = getContentByInfo(decodedGrib[5], "Number of data points where one or more values are specified in Section 7 when a bit map is present, total number of data points when a bit map is absent.");
    if (numValues !== grid.numPoints)
        console.warn("Num values in Section 7: " + numValues + ", Grid points in Section 5: " + grid.numPoints + ". Probably bitmap is present");


    // PRODUCT
    let product = {};
    // Discipline
    let disciplineInfo = decodedGrib[0][2].info// Discipline (From Table 0.0)
    let disciplineNum = decodedGrib[0][2].content;
    product[disciplineInfo] = decodedGrib[0][2].contentRef;
    // Product definition template number
    let productDefInfo = decodedGrib[4][3].info;
    product[productDefInfo] = decodedGrib[4][3].contentRef;
    // Discipline is defined
    if (decodedGrib[0][2].content != 255) { // 255: Missing
        let paramCatInfo = decodedGrib[4][4].info; // Parameter category (see Code table 4.1)
        let paramNumInfo = decodedGrib[4][5].info; // Parameter number (see Code table 4.2)
        let paramCat = decodedGrib[4][4].content;
        let paramNum = decodedGrib[4][5].content;

        console.log(`[grib2utils] Discipline: ${disciplineNum}, Category: ${paramCat}, Parameter: ${paramNum}`);

        product[paramCatInfo] = paramCat; // TODO: table missing
        let parameterCategoryTable = GRIB2.tables['4.2-' + disciplineNum + '-' + paramCat];
        if (parameterCategoryTable == undefined) {
            console.warn("GRIB2 table 4.2-" + disciplineNum + '-' + paramCat + " not defined.")
        } else {
            const paramDef = parameterCategoryTable[paramNum];
            product[paramNumInfo] = paramDef;

            // Add normalized fields for easier access
            if (paramDef) {
                data.parameterName = paramDef.parameter;
                data.shortName = paramDef.abbreviation;
                data.units = paramDef.units;
                console.log(`[grib2utils] Identified variable: ${data.shortName} (${data.parameterName})`);
            }
        }

    } else {
        console.warn('Discipline not defined, therefore no interpretation of product category, paramater, and units.');
    }


    // if (decodedGrib[0][2].contentRef)
    // let productDef = decodedGrib[4][3].info; // Product definition template number (See Table 4.0)
    // let paramCat = decodedGrib[4][4].info; // Parameter category (see Code table 4.1)
    // let paramNum = decodedGrib[4][5].info; // Parameter number (see Code table 4.2)
    // data.product = {
    //     [discipline]: ,
    //     [productDef]: decodedGrib[4][3].contentRef,
    //     [paramCat]: decodedGrib[4][4].contentRef, // NEEDS PARSING
    //     [paramNum]: decodedGrib[4][5].contentRef, // NEEDS PARSING
    // }

    data.grid = grid;
    data.product = product;
    console.log(data.grid);
    console.log(data.product);


    // Template number
    let item = decodedGrib[5].find(item => 'template' in item);
    let template = item !== undefined ? item.template : 'none';

    // Data compression scheme (Templates 5.0, 5.1, 5.2, 5.3)
    if (template == '5.0' || template == '5.1' || template == '5.2' || template == '5.3') {
        let compression = {};
        compression.refValue = getContentByInfo(decodedGrib[5], 'Reference value (R) (IEEE 32-bit floating-point value)');
        compression.binaryScaleFactor = getContentByInfo(decodedGrib[5], 'Binary scale factor (E)');
        compression.decimalScaleFactor = getContentByInfo(decodedGrib[5], 'Decimal scale factor (D)');
        compression.bitsPerValue = getContentByInfo(decodedGrib[5], 'Number of bits used for each packed value for simple packing, or for each group reference value for complex packing or spatial differencing');

        compression.decompress = (rawValue => {
            const c1 = Math.pow(2, compression.binaryScaleFactor)
            const c2 = Math.pow(10, compression.decimalScaleFactor)
            return (compression.refValue + rawValue * c1) / c2;
        });
        data.compression = compression;
    }




    let rawData = decodedGrib[7][2].content;
    let values = [];


    // Grid point data - simple packing
    // https://www.nco.ncep.noaa.gov/pmb/docs/grib2/grib2_doc/grib2_temp5-0.shtml
    if (template == '5.0') {
        let compression = data.compression;
        // Should be the same number
        console.log("Bit length/bits per point : " + (rawData.byteLength * 8 / compression.bitsPerValue) + ", Num points: " + grid.numPoints);
        // Read bits
        values = readValuesFromBuffer(rawData, compression.bitsPerValue, grid.numPoints);
        // Decompress
        for (let i = 0; i < values.length; i++)
            values[i] = compression.decompress(values[i]);
    }
    // Grid point data - complex packing
    // https://www.nco.ncep.noaa.gov/pmb/docs/grib2/grib2_doc/grib2_temp5-2.shtml
    else if (template == '5.2') { // TODO: TEST
        let compression = data.compression;
        let NG = getContentByInfo(decodedGrib[5], 'NG ― number of groups of data values into which field is split');

        let xxIndex = Math.ceil(NG * compression.bitsPerValue / 8);
        // Group reference values (X1)
        let X1 = readValuesFromBuffer(rawData.slice(0, xxIndex), compression.bitsPerValue, NG);

        let yyIndex = xxIndex * 2;
        // Group widths (The group width is the number of bits used for every value in a group.)
        let bitsPerValueGroupWidth = getContentByInfo(decodedGrib[5], 'Number of bits used for the group widths (after the reference value in octet 36 has been removed');
        let groupWidths = readValuesFromBuffer(rawData.slice(xxIndex, yyIndex), bitsPerValueGroupWidth, NG);

        let zzIndex = yyIndex + xxIndex;
        // Scaled group lengths
        let bitsPerValueScaledGL = getContentByInfo(decodedGrib[5], 'Number of bits used for the scaled group lengths (after subtraction of the reference value given in octets 38-41 and division by the length increment given in octet 42)');
        let scaledGroupLengths = readValuesFromBuffer(rawData.slice(yyIndex, zzIndex), bitsPerValueScaledGL, NG);

        // Group lengths (The group length (L) is the number of values in a group.)
        let groupLengths = [];
        let refGroupLength = getContentByInfo(decodedGrib[5], 'Reference for group lengths (see Note 13)');
        let lengthInc = getContentByInfo(decodedGrib[5], 'Length increment for the group lengths (see Note 14)');
        for (let i = 0; i < NG; i++)
            groupLengths[i] = refGroupLength + scaledGroupLengths[i] * lengthInc;

        // Packed values (X2)
        let lastBitIndex = 0;
        let lastByteIndex = zzIndex;
        for (let i = 0; i < NG; i++) {
            let numValuesPerGroup = groupLengths[i]; // Values per group
            let bitsPerValuePerGroup = groupWidths[i]; // Bits per value in group
            let numBytes = Math.ceil(((numValuesPerGroup * bitsPerValuePerGroup) + lastBitIndex) / 8); // Total num bits + previous shift amount
            let X2PerGroup = readValuesFromBuffer(rawData.slice(lastByteIndex, lastByteIndex + numBytes), bitsPerValuePerGroup, numValuesPerGroup, lastBitIndex); // Because X2 are consecutive, we keep lastBitIndex
            lastBitIndex = ((numValuesPerGroup * bitsPerValuePerGroup) + lastBitIndex) % 8; // LastBitIndex goes from 0 to 7, as every iteration we send the specific bytes to read.

            // Unpack values
            // Add ref value (X1) to packed values (X2)
            for (let j = 0; j < numValuesPerGroup; j++) {
                let rawValue = X2PerGroup[j] + X1[i];
                values.push(compress.decompress(rawValue));
            }
        }

    }
    // Grid point data - complex packing and spatial differencing
    // https://www.nco.ncep.noaa.gov/pmb/docs/grib2/grib2_doc/grib2_temp5-3.shtml
    // https://www.nco.ncep.noaa.gov/pmb/docs/grib2/grib2_doc/grib2_temp7-3.shtml
    // https://apps.ecmwf.int/codes/grib/format/grib2/regulations/
    else if (template == '5.3') {
        let compression = data.compression;
        // Spatial differencing order
        let diffOrder = getContentByInfo(decodedGrib[5], 'Order of spatial difference (see Code Table 5.6)'); // WARNING --> IF CODE TABLE IS USED, THIS IS A STRING. OTHERWISE 1= 1ST ORDER, 2= SECOND ORDER
        // Field width (Number of bytes for the first values)
        let fieldWidth = getContentByInfo(decodedGrib[5], 'Number of octets required in the data section to specify extra descriptors needed for spatial differencing (octets 6-ww in data template 7.3)');
        // TODO FIELD IS THE TOTAL NUMBER OF OCTETS FOR EXTRA DESCRIPTORS. SO, IS IT ABOUT ONE VALUE, OR ALL?
        // IS BITS PER VALUE USED THEN?

        // First value(s) of original (undifferenced) scale values, followed by the overall minimum of the differences.
        let numType;
        if (fieldWidth == 1) // Int8
            numType = 'int8';
        else if (fieldWidth == 2) // Int16
            numType = 'int16';
        else if (fieldWidth == 4) // Int32
            numType = 'int32';
        else
            console.error("Field width is not reasonable (in parseData, template 5.3)");

        // For second order
        // (1) Referring to the notation in Note 1 of data representation template 5.3, at order 1, the values stored in octet 6 - ww are g1 and gmin.At order 2, the values stored are h1, h2 and hmin.
        let h1 = decodeByte(rawData.slice(0, fieldWidth), numType);
        let h2 = decodeByte(rawData.slice(fieldWidth, fieldWidth * 2), numType); // Not used if difference order is 1

        // (4) Overall minimum will be negative in most cases. First bit should indicate the sign: 0 if positive, 1 if negative.
        // Regulation: '92.1.5'
        let strBits = bytes2bits(new Uint8Array(rawData.slice(fieldWidth * diffOrder, fieldWidth * (diffOrder + 1)))); // Get string of bits
        let sign = strBits[0] == '0' ? 1 : -1; // Check if first bit is negative
        strBits = '0' + strBits.substring(1, strBits.length);
        let overallMin = sign * bits2uint8(strBits); //hmin

        // Unpack Complex Packing
        let wwIndex = fieldWidth * (diffOrder + 1);
        let unpackedArray = unpackComplexPacking(decodedGrib, rawData, compression, wwIndex);



        // At decoding time, after bit string unpacking, the original scaled values are recovered by adding the overall minimum and summing up recursively.
        // https://apps.ecmwf.int/codes/grib/format/grib2/templates/5/3
        // Add overall min
        // https://apps.ecmwf.int/codes/grib/format/grib2/regulations/
        // Y * 10^D= R + (X1+X2) * 2^E
        // R = overallMin, X1+X2 = unpackedArray
        unpackedArray.forEach((el, index, arr) => arr[index] += overallMin);

        // Spatial differencing - Sum up recursively (f - original, g - first derivative, h - second derivative)
        // https://apps.ecmwf.int/codes/grib/format/grib2/templates/5/3
        let f = [];
        if (diffOrder == 2) {
            let h = unpackedArray;
            // Remove first n (one/two) values (they will be h1 and h2)
            // (1) At decoding time, after bit string unpacking, the original scaled values are recovered by adding the overall minimum and summing up recursively.
            // (2) For differencing of order n, the first n values in the array that are not missing are set to zero in the packed array. These dummy values are not used in unpacking.
            h[0] = h1;
            h[1] = h2;
            //(1) Spatial differencing is a pre - processing before group splitting at encoding time.It is 
            // intended to reduce the size of sufficiently smooth fields, when combined with a splitting scheme 
            // as described in Data Representation Template 5.2.At order 1, an initial field of values f is replaced 
            // by a new field of values g, where g1 = f1, g2 = f2 - f1, ..., gn = fn - fn - 1. At order 2, the field 
            // of values g is itself replaced by a new field of values h, where h1 = f1, h2 = f2, h3 = g3 - g2, ..., 
            // hn = gn - gn - 1. To keep values positive, the overall minimum of the resulting field(either gmin or hmin) 
            // is removed.At decoding time, after bit string unpacking, the original scaled values are recovered by adding 
            // the overall minimum and summing up recursively.
            let g = [h1, h2 - h1]; // Second order
            for (let i = 2; i < h.length; i++) {
                g[i] = h[i] + g[i - 1];
            }
            f = [h1]; // First order
            for (let i = 1; i < g.length; i++) {
                f[i] = g[i] + f[i - 1];
            }
        } else if (diffOrder == 1) {
            let g = unpackedArray;
            g[0] = h1;
            f = [h1]; // First order
            for (let i = 1; i < g.length; i++) {
                f[i] = g[i] + f[i - 1];
            }
        }

        // Decoding (f - original, g - first derivative, h - second derivative)
        // https://apps.ecmwf.int/codes/grib/format/grib2/templates/5/3
        if (grid.numPoints != f.length)
            console.error("Length of raw datapoints (H) is not equal to grid points : grid.numPoints: " + grid.numPoints + ", h.length: " + h.length);

        // Decompress ( apply D and E)
        // https://apps.ecmwf.int/codes/grib/format/grib2/regulations/
        // Y * 10D= R + (X1+X2) * 2E
        for (let i = 0; i < grid.numPoints; i++) {
            values[i] = compression.decompress(f[i]);
        }

        calcMaxMin(values);

    }
    // Grid point data - IEEE Floating Point Data
    // https://www.nco.ncep.noaa.gov/pmb/docs/grib2/grib2_doc/grib2_temp5-4.shtml
    else if (template == '5.4') {

        // Read precision (32, 64 or 128 Floating point type)
        let dataType = getContentRefByInfo(decodedGrib[5], 'Precision (See code Table 5.7)'); //decodedGrib[5][4].contentRef;
        let byteSize;
        let type;
        if (dataType.includes("32-bit")) {
            type = 'float32';
            byteSize = 4;
        } else if (dataType.includes("64-bit")) {
            type = 'float64';
            byteSize = 8;
        } else if (dataType.includes("128-bit")) {
            type = 'float128';
            byteSize = 16;
        }

        // Read values
        values = [];
        for (let i = 0; i < numValues; i++) {
            // Read each value according to Section 5
            values[i] = decodeByte(rawData.slice(i * byteSize, i * byteSize + byteSize), type);
        }
    }
    // Grid point data - PNG Compression
    // https://www.nco.ncep.noaa.gov/pmb/docs/grib2/grib2_doc/grib2_temp5-41.shtml
    else if (template == '5.41') {
        values = unpackPNG(decodedGrib, rawData, options.pako);
    }



    // TODO maybe this should be below Bitmap code
    data.values = values;

    // Debug output for the first message only (without printing the entire array)
    // Debug output for the first message only (without printing the entire array)
    if (values && values.length > 0) {
        let min = Infinity;
        let max = -Infinity;
        let nonZeroCount = 0;

        // Use a loop to avoid stack overflow with spread operator on large arrays
        const len = values.length;
        for (let i = 0; i < len; i++) {
            const v = values[i];
            if (v !== 0 && v !== null && !isNaN(v)) {
                nonZeroCount++;
            }
            if (v < min) min = v;
            if (v > max) max = v;
        }

        if (min === Infinity) min = 0;
        if (max === -Infinity) max = 0;

        console.log(`Values stats: Total=${values.length}, NonZero=${nonZeroCount}, Min=${min}, Max=${max}`);
        // Safe slice for logging
        const sampleSize = Math.min(10, values.length);
        const sample = [];
        for (let i = 0; i < sampleSize; i++) sample.push(values[i]);
        console.log(`Sample values: [${sample.join(', ')}...]`);
    }

    // Bitmap
    // https://www.nco.ncep.noaa.gov/pmb/docs/grib2/grib2_doc/grib2_sect6.shtml
    // https://www.unidata.ucar.edu/blogs/developer/entry/grib_bitmaps_are_not_such
    if (decodedGrib[6][2].content !== 255) {
        console.warn("Bitmap is present: " + getContentRefByInfo(decodedGrib[6], 'Bit-map indicator (See Table 6.0) (See note 1 below)')); //decodedGrib[6][2].contentRef)
        // Bitmap
        if (decodedGrib[6][2].content == 0) {
            // Read bitmap
            let bitmapBuffer = decodedGrib[6][3].content; // A bit for each value, saying if missing or not
            let bitmap = readValuesFromBuffer(bitmapBuffer, 1, grid.numPoints);
            data.bitmap = bitmap;
            // Assign values
            // Gridded values
            let griddedValues = [];
            let vIndex = 0;
            for (let i = 0; i < grid.numPoints; i++) {
                // With bitmap
                if (data.bitmap[i] == 0)
                    griddedValues[i] = null; // Empty value
                else {
                    griddedValues[i] = data.values[vIndex];
                    vIndex++;
                }
            }
            // Reassign values
            data.section7values = data.values;
            data.values = griddedValues;
        } else if (decodedGrib[6][2].content == 254) {
            console.error("TODO: bitmap is defined in a previous dataset in the same grib file.");
        }
    }






    // Scanning mode (section 3)
    // https://www.nco.ncep.noaa.gov/pmb/docs/grib2/grib2_doc/grib2_table3-4.shtml
    // Reorganize the data points so they start on the north-west and finish in the south-east


    // Flip using vertical axis (left becomes right, right becomes left)
    if (grid.scanningMode[0][0] == 1) { // Points in the first row or column scan in the -i (-x) direction
        console.error('TODO: Scanning mode: the data needs to be mirroed in the vertical axis (east should be west and viceversa)');
    }
    // Flip using horizontal axis (top becomes bottom, bottom becomes top)
    // TODO: SCANNING MODE DOES NOT NECESSARILY APPLIES. CHECK START GRID LATITUDE AND END GRID LATITUDE TO KNOW DIRECTION
    if (grid.scanningMode[1][0] == 0) { // Points in the first row or column scan in the -j (-y) direction
        // If latitude first grid point is bigger than end point, it does not apply?
        if (grid.latStart < grid.latEnd) { // Grid defines the first grid latitude point as the southest
            let horizontalFlipValues = [];
            for (let i = 0; i < data.values.length; i++) {
                let colN = i % grid.numLongPoints;
                let rowN = Math.floor(i / grid.numLongPoints);

                let flippedIndex = (grid.numLatPoints - rowN - 1) * grid.numLongPoints + colN;
                horizontalFlipValues[i] = data.values[flippedIndex];
            }
            data.values = horizontalFlipValues;
        }
    }
    // Other scanning modes
    // TODO: the grid can be diamond-shaped, meaning that it is not as simple as painting a point per pixel. Probably it is needed to assing a lat-long value to each datapoint, or to deal with it in the draw function
    if (grid.scanningMode[2][0] == 1) console.error('TODO: Scanning mode: Adjacent points in the j (y) direction are consecutive')
    if (grid.scanningMode[3][0] == 1) console.error('TODO: Scanning mode: Adjacent rows scan in the opposite direction')
    if (grid.scanningMode[4][0] == 1) console.error('TODO: Scanning mode: Points within odd rows are offset by Di/2 in i(x) direction') // Making a grid with diamonds and not squares
    if (grid.scanningMode[5][0] == 1) console.error('TODO: Scanning mode: Points within even rows are offset by Di/2 in i(x) direction') // Making a grid with diamonds and not squares
    // Offset all lat coordinates by Dj/2 (Scanning mode: Points are offset by Dj/2 in j(y) direction)
    if (grid.scanningMode[6][0] == 1) {
        // Check direction
        let jDirection = grid.scanningMode[1][0] == 0 ? -1 : 1;
        // Apply offset
        grid.latEnd = grid.latEnd + jDirection * grid.incJ / 2;
        grid.latStart = grid.latStart + jDirection * grid.incJ / 2;
    }
    if (grid.scanningMode[7][0] == 1) console.error('TODO: Scanning mode: 8th bit at https://www.nco.ncep.noaa.gov/pmb/docs/grib2/grib2_doc/grib2_table3-4.shtml')


    console.log("DATA VALUES: ------");
    console.log(data.values);



    return data;
}



// TODO: Total number of required bytes and total number of available bytes does not match
// TODO: Revise X1 and X2 values
// Unpack values (templates 5.2 and 5.3)
const unpackComplexPacking = function (decodedGrib, rawData, compression, inwwIndex) {

    let wwIndex = inwwIndex || 0;

    let NG = getContentByInfo(decodedGrib[5], 'NG ― number of groups of data values into which field is split');

    let xxIndex = Math.ceil(NG * compression.bitsPerValue / 8) + wwIndex;
    // Group reference values (X1)
    // NG group reference values (X1 in the decoding formula), each of which is encoded using the number of bits specified in octet 20 of Data Representation Template 5.0. 
    // Bits set to zero shall be appended where necessary to ensure this sequence of numbers ends on an octet boundary.
    let X1 = readValuesFromBuffer(rawData.slice(wwIndex, xxIndex), compression.bitsPerValue, NG);

    // Group widths ((12) The group width is the number of bits used for every value in a group.)
    // NG group widths, each of which is encoded using the number of bits specified in octet 37 of Data Representation Template 5.2.
    // Bits set to zero shall be appended as necessary to ensure this sequence of numbers ends on an octet boundary.
    let bitsPerValueGroupWidth = getContentByInfo(decodedGrib[5], 'Number of bits used for the group widths (after the reference value in octet 36 has been removed)');
    let refGroupWidth = getContentByInfo(decodedGrib[5], 'Reference for group widths (see Note 12)');
    let yyIndex = Math.ceil(NG * bitsPerValueGroupWidth / 8) + xxIndex;
    let groupWidths = readValuesFromBuffer(rawData.slice(xxIndex, yyIndex), bitsPerValueGroupWidth, NG);
    for (let i = 0; i < NG; i++)
        groupWidths[i] += refGroupWidth;


    // Scaled group lengths
    // NG scaled group lengths, each of which is encoded using the number of bits specified in octet 47 of Data Representation Template 5.2.
    // Bits set to zero shall be appended as necessary to ensure this sequence of numbers ends on an octet boundary. (see Note 14 of Data Representation Template 5.2)
    let bitsPerValueScaledGL = getContentByInfo(decodedGrib[5], 'Number of bits used for the scaled group lengths (after subtraction of the reference value given in octets 38-41 and division by the length increment given in octet 42)');
    let zzIndex = Math.ceil(NG * bitsPerValueScaledGL / 8) + yyIndex;
    let scaledGroupLengths = readValuesFromBuffer(rawData.slice(yyIndex, zzIndex), bitsPerValueScaledGL, NG);

    // Group lengths (The group length (L) is the number of values in a group.)
    // (1) Group lengths have no meaning for row by row packing, where groups are coordinate lines(so th grid description
    // section and possibly the bit - map section are enough); for consistency, associated field width and reference should then be
    // encoded as 0.
    let groupSplittingMethod = getContentByInfo(decodedGrib[5], 'Group splitting method used (see Code Table 5.4)');
    if (groupSplittingMethod != 1)
        console.error('Group splitting method not implemented. See: https://www.nco.ncep.noaa.gov/pmb/docs/grib2/grib2_doc/grib2_table5-4.shtml');

    let groupLengths = [];
    let refGroupLength = getContentByInfo(decodedGrib[5], 'Reference for group lengths (see Note 13)');
    let lengthInc = getContentByInfo(decodedGrib[5], 'Length increment for the group lengths (see Note 14)');
    for (let i = 0; i < NG; i++)
        groupLengths[i] = refGroupLength + scaledGroupLengths[i] * lengthInc;
    // True last group length (number of values in last group)
    // (3) Scaled group lengths, if present, are encoded for each group. But the true last group length (unscaled) should be taken from Data Representation Template.
    let lengthLastGroup = getContentByInfo(decodedGrib[5], 'True length of last group');
    if (lengthLastGroup != groupLengths[groupLengths.length - 1]) { // Double check
        console.warn("True length of last group is not the same as the last value in the gruop length array. " + lengthLastGroup + " vs " + groupLengths[groupLengths.length - 1]);
        groupLengths[groupLengths.length - 1] = lengthLastGroup;
    }
    // Calculate total number of bytes
    // Warnings
    let totalNumBytes = 0;
    let totalNumBits = 0;
    let totalNumPoints = 0;
    for (let i = 0; i < NG; i++) {
        totalNumBits += groupLengths[i] * groupWidths[i];
        totalNumPoints += groupLengths[i];
    }
    let section3NumPoints = getContentByInfo(decodedGrib[3], 'Number of data points');
    if (totalNumPoints != section3NumPoints) console.warn("Total number of points: " + totalNumPoints + ", Section 3 num of points: " + section3NumPoints);
    if ((totalNumBits / 8) - rawData.slice(zzIndex, rawData.byteLength).byteLength > 1)
        console.warn("Total number of required bytes: " + totalNumBits / 8 + ", Available bytes: " + rawData.slice(zzIndex, rawData.byteLength).byteLength);


    // Substitute values for missing data
    let primarySubstitute = getContentByInfo(decodedGrib[5], 'Primary missing value substitute');
    let secondarySubstitute = getContentByInfo(decodedGrib[5], 'Secondary missing value substitute');

    // Packed values (X2)
    let lastBitIndex = 0;
    let lastByteIndex = zzIndex;
    let X2 = [];
    let packedArray = [];
    for (let i = 0; i < NG; i++) {
        let numValuesPerGroup = groupLengths[i]; // Values per group
        let bitsPerValuePerGroup = groupWidths[i]; // Bits per value in group
        let numBytes = Math.ceil(((numValuesPerGroup * bitsPerValuePerGroup) + lastBitIndex) / 8); // Total num bits + previous shift amount

        // MISSING VALUE MANAGEMENT
        // getContentByInfo(decodedGrib[5], 'Missing value management used (see Code Table 5.5)');
        // (10) A group containing only missing values(of either type) will be encoded as a constant group(null width, no associate data)
        // and the group reference will have all bits set to 1 for primary type, and all bits set to 1, except the last bit set to 0, for
        // secondary type.
        // QUESTION: group reference does not have all bits set to 1. Does this have to do with missing value management?
        // (4) For groups with a constant value, associated field width is 0, and no incremental data are physically present. https://apps.ecmwf.int/codes/grib/format/grib2/templates/7/2
        // (5) There may be two types of missing value(s), such as to make a distinction between static misses (for instance, due to a land / sea mask) and occasional misses.
        // (6) As an extra option, substitute value(s) for missing data may be specified. If not wished (or not applicable), all bits
        // should be set to 1 for relevant substitute value(s).
        if (bitsPerValuePerGroup == 0) {
            //console.error("An empty group in X2, with no bits is defined? " + i)
            // Two options: use the subsitute values specified or set all bits to 1?
            // How to know if it is primary or secondary? It should be specified in X1[i] (see note 10)
            // Constant value (see note 4)
            X2[i] = new Array(numValuesPerGroup).fill(0);
        }
        else {
            X2[i] = readValuesFromBuffer(rawData.slice(lastByteIndex, lastByteIndex + numBytes), bitsPerValuePerGroup, numValuesPerGroup, lastBitIndex); // Because X2 are consecutive, we keep lastBitIndex
            lastBitIndex = ((numValuesPerGroup * bitsPerValuePerGroup) + lastBitIndex) % 8; // LastBitIndex goes from 0 to 7, as every iteration we send the specific bytes to read.
            lastByteIndex = lastByteIndex + numBytes - Math.ceil(lastBitIndex / 8); // Total num bits + shift amount, but stays in the current byte unless lastBitIndex is 0, meaning that the whole byte was read
        }

        // Warn if the last byte index is not at the end of the data buffer
        if (i == NG - 1 && (lastByteIndex - rawData.byteLength) > 1) console.warn("LastByteIndex: " + lastByteIndex + ". Available bytes: " + rawData.byteLength);



        // Unpack values
        // Add ref value (X1) to packed values (X2)
        for (let j = 0; j < numValuesPerGroup; j++) {
            packedArray.push(X2[i][j] + X1[i]);
        }
    }
    // Regulation 92.9.4. Data shall be coded in the form of non-negative scaled differences from a reference value of the whole field plus, if applicable, a local reference value.
    //calcMaxMin(packedArray);

    return packedArray;
}




const calcMaxMin = function (array) {
    let max = 0;
    let min = 0;
    for (let i = 0; i < array.length; i++) {
        max = array[i] > max ? array[i] : max;
        min = array[i] < min ? array[i] : min;
    }
    console.log("Max: " + max + ", Min: " + min);
}

// Unpack PNG (Template 5.41)
const unpackPNG = function (decodedGrib, rawData, pako) {
    // Get scaling parameters from Section 5 (Template 5.41)
    const R = getContentByInfo(decodedGrib[5], 'Reference value (R) (IEEE 32-bit floating-point value)');
    const E = getContentByInfo(decodedGrib[5], 'Binary scale factor (E)');
    const D = getContentByInfo(decodedGrib[5], 'Decimal scale factor (D)');
    const nbits = getContentByInfo(decodedGrib[5], 'Number of bits required to hold the resulting scaled and referenced data values. (i.e. The depth of the grayscale image.) (see Note 2)');

    // Calculate scaling factors
    const ref = R;
    const binScale = Math.pow(2, E);
    const decScale = Math.pow(10, D);

    // Extract PNG data from Section 7
    // Section 7 structure: [Length (4), Number (1), Data (N-5)]
    // But rawData passed here is usually the data part?
    // In parseData, data.values = unpackPNG(decodedGrib, decodedGrib[7][2].content);
    // decodedGrib[7][2] is the data.

    // The content of Section 7 is the PNG stream.
    // We need to parse PNG chunks to find IDAT.
    // PNG Signature: 89 50 4E 47 0D 0A 1A 0A

    let pngBuffer = rawData;
    if (Array.isArray(pngBuffer)) {
        pngBuffer = new Uint8Array(pngBuffer).buffer;
    } else if (pngBuffer instanceof Uint8Array) {
        pngBuffer = pngBuffer.buffer;
    }

    // Simple PNG parser to extract IDAT
    const view = new DataView(pngBuffer);
    let offset = 8; // Skip signature
    let idatChunks = [];
    let totalIdatLength = 0;
    let width = 0;
    let height = 0;
    let bitDepth = 0;
    let colorType = 0;
    let compressionMethod = 0;
    let filterMethod = 0;
    let interlaceMethod = 0;

    while (offset < pngBuffer.byteLength) {
        const length = view.getUint32(offset);
        const type = String.fromCharCode(
            view.getUint8(offset + 4),
            view.getUint8(offset + 5),
            view.getUint8(offset + 6),
            view.getUint8(offset + 7)
        );

        if (type === 'IHDR') {
            width = view.getUint32(offset + 8);
            height = view.getUint32(offset + 12);
            bitDepth = view.getUint8(offset + 16);
            colorType = view.getUint8(offset + 17);
            compressionMethod = view.getUint8(offset + 18);
            filterMethod = view.getUint8(offset + 19);
            interlaceMethod = view.getUint8(offset + 20);
        } else if (type === 'IDAT') {
            const chunkData = new Uint8Array(pngBuffer, offset + 8, length);
            idatChunks.push(chunkData);
            totalIdatLength += length;
        } else if (type === 'IEND') {
            break;
        }

        offset += 12 + length; // Length + Type + Data + CRC
    }

    // Concatenate IDAT chunks
    const compressedData = new Uint8Array(totalIdatLength);
    let pos = 0;
    for (const chunk of idatChunks) {
        compressedData.set(chunk, pos);
        pos += chunk.length;
    }

    // Decompress using pako
    let decompressedData;
    try {
        decompressedData = pako.inflate(compressedData);
    } catch (e) {
        console.error("PNG decompression failed:", e);
        return [];
    }

    // Apply PNG unfiltering (reconstruct)
    // For grayscale (Color Type 0), each scanline starts with a filter byte (0-4)
    // Scanline length = 1 (filter) + ceil(width * bitDepth / 8)
    // But here, bitDepth from IHDR should match nbits from GRIB2.

    const bytesPerPixel = Math.ceil(bitDepth / 8);
    const scanlineLength = 1 + Math.ceil(width * bitDepth / 8);
    const reconData = new Uint8Array(height * (scanlineLength - 1));

    let reconPos = 0;
    let scanlinePos = 0;
    let prevScanline = new Uint8Array(scanlineLength - 1); // Initialize with zeros

    for (let y = 0; y < height; y++) {
        const filterType = decompressedData[scanlinePos];
        const scanline = decompressedData.slice(scanlinePos + 1, scanlinePos + scanlineLength);
        const reconScanline = new Uint8Array(scanline.length);

        for (let i = 0; i < scanline.length; i++) {
            const x = scanline[i];
            const a = i >= bytesPerPixel ? reconScanline[i - bytesPerPixel] : 0;
            const b = prevScanline[i];
            const c = i >= bytesPerPixel ? prevScanline[i - bytesPerPixel] : 0;

            let val = x;
            if (filterType === 1) { // Sub
                val = (x + a) & 0xFF;
            } else if (filterType === 2) { // Up
                val = (x + b) & 0xFF;
            } else if (filterType === 3) { // Average
                val = (x + Math.floor((a + b) / 2)) & 0xFF;
            } else if (filterType === 4) { // Paeth
                const p = a + b - c;
                const pa = Math.abs(p - a);
                const pb = Math.abs(p - b);
                const pc = Math.abs(p - c);
                let pr;
                if (pa <= pb && pa <= pc) pr = a;
                else if (pb <= pc) pr = b;
                else pr = c;
                val = (x + pr) & 0xFF;
            }
            reconScanline[i] = val;
        }

        reconData.set(reconScanline, reconPos);
        prevScanline = reconScanline;
        reconPos += reconScanline.length;
        scanlinePos += scanlineLength;
    }

    // Convert reconstructed bytes to values
    // Assuming 8-bit or 16-bit grayscale
    const values = [];
    const dataView = new DataView(reconData.buffer);

    for (let i = 0; i < reconData.length; i += bytesPerPixel) {
        let rawVal;
        if (bitDepth === 8) {
            rawVal = dataView.getUint8(i);
        } else if (bitDepth === 16) {
            rawVal = dataView.getUint16(i, false); // Big-endian
        } else {
            // Handle other bit depths if needed
            rawVal = 0;
        }

        // Apply GRIB2 scaling: Y = (R + X * 2^E) / 10^D
        const val = (ref + rawVal * binScale) / decScale;
        values.push(val);
    }

    return values;
}





// Read values coded into bits on a buffer (uint)
const readValuesFromBuffer = function (arraybuffer, bitsPerValue, numValues, inBitIndex) {
    let values = [];
    let bitIndex = inBitIndex || 0;
    const rawUint8 = new Uint8Array(arraybuffer);
    // https://hacks.mozilla.org/2017/01/typedarray-or-dataview-understanding-byte-order/
    // The order of the bytes for a value that uses more than one byte, depends on the way binary data is enconded (its endianess)
    // Big endian or network endian: it is often used in network transmissions (sometimes referred to as the “network endianness”)
    // Small endian: most systems today happen to work with it on the CPU- and memory levels, and that’s great for performance.

    // DataView uses big endian or network endianess: is a safe way to deal with binary data that you receive from or send to other systems.
    // TypedArrays (i.e. new Uint8Array) uses small endian in this computer: are great for creating binary data, for instance to pass on to Canvas2D ImageData or WebGL.
    // grib2 is in big endian? https://www.cpc.ncep.noaa.gov/products/wesley/wgrib2/

    // Example
    //var a = new Uint16Array(arraybuffer.slice(0,2)); // small endian
    //var b = new DataView(arraybuffer).getUint16(); // big endian (one can specify little endian too)
    //var c = bits2uint8(bytes2bits(new Uint8Array(arraybuffer.slice(0,2))));
    //console.log("Small endian uint16: " + a + ", Big endian uint16: " + b + ", Using strings: " + c); 


    // If you are out of bounds
    if ((bitsPerValue * numValues + bitIndex) / 8 > rawUint8.length)
        console.error("Num required bytes: " + (bitsPerValue * numValues + bitIndex) / 8 + ", Num available bytes: " + rawUint8.length);


    // Test with string values
    var values2ndmethod = [];
    var bitsString = bytes2bits(rawUint8);
    bitsString = bitsString.slice(bitIndex);
    for (var i = 0; i < numValues * bitsPerValue; i += bitsPerValue) //
        values2ndmethod.push(bits2uint8(bitsString.substr(i, bitsPerValue)));


    //for (var i = 0; i < numValues; i++)
    //    console.log(values[i] - values2ndmethod[i])

    return values2ndmethod;
}





// Get content by infoValue
const getContentByInfo = function (sectionArray, infoValue) {
    for (let i = 0; i < sectionArray.length; i++) {
        if (sectionArray[i].info === infoValue)
            return sectionArray[i].content;
    }
}
// Get contentRef by infoValue
const getContentRefByInfo = function (sectionArray, infoValue) {
    for (let i = 0; i < sectionArray.length; i++) {
        if (sectionArray[i].info === infoValue)
            return sectionArray[i].contentRef;
    }
}









// Decode section
const decodeSection = function (buffer, section) {

    for (let i = 0; i < section.length; i++) {
        let prop = section[i];


        // Variable section content
        // Part of the section might depends on an external template
        if ("templateRef" in prop) {
            // Get template info
            let templateId;
            // Find section item with such startIndex (templateRef is defined at the end of the section)
            for (let j = 0; j < i; j++)
                if (section[j].startIndex == prop.templateRef.index)
                    templateId = prop.templateRef.section + '.' + section[j].content;
            // Assign template to section
            section = section.slice(0, i); // Remove from here to end of section // TODO SECTION 3 DO NOT REMOVE, ONLY APPEND
            try {
                let templateData = JSON.parse(JSON.stringify(GRIB2.templates[templateId])); // Copy template
                section = section.concat(templateData);

                // Store template id - find a safe place to store it
                if (section.length > 0) {
                    // Store on the last element before concatenation (the original element at position i-1)
                    if (i > 0 && section[i - 1]) {
                        section[i - 1]["template"] = templateId;
                    }
                    console.log("Using template: " + templateId + " (applied to section)");
                } else {
                    console.log("Warning: Template concatenation resulted in empty section");
                }
                i--; // Decrement i to process the first item of the template in the next iteration
            }
            catch (error) {
                console.log(templateId + " is not defined.")
                console.log(error);
            }
        }


        // Variable startIndex
        if (typeof (prop.startIndex) === 'string') {
            if (prop.startIndex === 'nextAvailable') {
                if (i > 0 && section[i - 1]) {
                    prop.startIndex = section[i - 1].startIndex + section[i - 1].size;
                } else {
                    console.log("Warning: Cannot calculate nextAvailable startIndex, previous section not available");
                    prop.startIndex = 0; // Default fallback
                }
            }
        }

        // Variable content size
        if (typeof (prop.size) === 'string') {
            if (prop.size === 'end') { // From start index to the end of the section
                let sectionSize = section[0].content;
                prop.size = sectionSize - (prop.startIndex - 1);
            }
            else if (prop.size === 'calc') { // TODO TEST
                // Get value from section
                let value;
                // Find section item with such startIndex (templateRef is defined at the end of the section)
                for (let j = 0; j < i; j++)
                    if (section[j].startIndex == prop.sizeRef.index)
                        prop.size = prop.sizeRef.calc(value);

            }
        }


        // Decode bytes
        let byteContentBuffer = buffer.slice(prop.startIndex - 1, prop.startIndex - 1 + prop.size);
        let tempPropContent = decodeByte(byteContentBuffer, prop.type);

        // Store raw bytes (for debugging purposes)
        prop.bytes = byteContentBuffer;

        // Regulations
        // https://apps.ecmwf.int/codes/grib/format/grib2/regulations/
        // 92.1.5 - First bit (most significative) indicates positive/negative
        let sign = 1;
        if (prop.regulation) {
            if (prop.regulation == '92.1.5') {
                // Check if first bit is 1, indicating that the number is negative
                let byteContentUint8 = new Uint8Array(byteContentBuffer); // Transform to uint8 for ease of transformations from bytes to bits to uint8
                let isNegative = byteContentUint8[0] >> 7; // Decode byte and get the first bit by shifting
                if (isNegative) {
                    // Turn first significative byte to 0
                    let strBits = bytes2bits([byteContentUint8[0]]);
                    if (strBits[0] != 1) console.error("something is going wrong here");
                    strBits = '0' + strBits.substr(1); // Replace the first bit for a 0
                    byteContentUint8[0] = bits2uint8(strBits);
                    // Decode bits according to property type using the new modified buffer and a negative sign
                    tempPropContent = -decodeByte(byteContentUint8.buffer, prop.type);
                }
            }
        }
        // Decoded bytes
        prop.content = tempPropContent;


        // Decode table content
        if ("table" in prop) {
            try {
                prop.contentRef = GRIB2.tables[prop.table][prop.content];
            } catch (error) {
                console.log(prop.table + " is not defined." + GRIB2.tables[prop.table]);
            }
        }

        // Decode flag table content (only for 3.3 and 3.4 tables)
        // https://www.nco.ncep.noaa.gov/pmb/docs/grib2/grib2_doc/grib2_temp3-0.shtml
        // https://www.nco.ncep.noaa.gov/pmb/docs/grib2/grib2_doc/grib2_table3-3.shtml
        // https://www.nco.ncep.noaa.gov/pmb/docs/grib2/grib2_doc/grib2_table3-4.shtml
        if ("flagTable" in prop) {
            // Decode flags
            prop.contentRef = [];
            // Transform decimal to bits
            let flagBits = bytes2bits([prop.content]);
            // Iterate through flags
            for (let i = 0; i < flagBits.length; i++) {
                // Start from lower bits
                let flag = flagBits[flagBits.length - 1 - i];
                // Check table
                let flagContent = GRIB2.tables[prop.flagTable][i + 1][flag];
                // Store
                prop.contentRef.push(flagContent);
            }
        }

    }

    return section;
}






function decodeByte(byteContent, type) {
    let content;
    if (byteContent.byteLength == 0)
        content = null;
    else if (type === 'String')
        content = String.fromCharCode.apply(null, new Uint8Array(byteContent));
    else if (type == 'uint8')
        content = new DataView(byteContent).getUint8();
    else if (type == 'uint16')
        content = new DataView(byteContent).getUint16();
    else if (type == 'uint32')
        content = new DataView(byteContent).getUint32();
    else if (type == 'uint64')
        content = Number(new DataView(byteContent).getBigUint64());

    else if (type == 'int8')
        content = new DataView(byteContent).getInt8();
    else if (type == 'int16')
        content = new DataView(byteContent).getInt16();
    else if (type == 'int32')
        content = new DataView(byteContent).getInt32();
    else if (type == 'int64')
        content = Number(new DataView(byteContent).getBigInt64());

    else if (type == 'float32')
        content = new DataView(byteContent).getFloat32();
    else if (type == 'float64')
        content = new DataView(byteContent).getFloat64();
    else if (type == 'float128') {
        console.error("TODO: float128 parsing is not implemented")
        content = new DataView(byteContent).getFloat64();
    }
    else
        content = byteContent;

    return content;
}



// Utility functions
// bytes are in uint8 form
function bytes2bits(bytes) {
    let bits = "";
    for (let i = 0; i < bytes.length; i++) {
        let byte = bytes[i];
        for (let j = 128; j >= 1; j /= 2)
            bits += byte & j ? '1' : '0';
    }
    return bits;
}
// Returns unsigned int
function bits2uint8(bits) {
    let value = 0;
    for (let i = 0; i < bits.length; i++)
        value += parseInt(bits[bits.length - (i + 1)]) ? Math.pow(2, i) : 0;
    return value;
}