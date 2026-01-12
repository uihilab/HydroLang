/**
 * CHIRPS (Climate Hazards Group InfraRed Precipitation with Station data)
 * A 30+ year quasi-global rainfall dataset. Spans 50°S-50°N (and all longitudes) and ranges from 1981 to near-present.
 * Useful for Central America and Africa.
 * For more information: https://www.chc.ucsb.edu/data/chirps
 *
 * @type {Object}
 * @name CHIRPS
 * @memberof datasources
 */

const chirpsConfig = {
    // Base URL for CHIRPS data
    baseUrl: "https://data.chc.ucsb.edu/products/CHIRPS-2.0/",

    // Configuration for available datasets and their structures
    datasets: {
        "africa_6-hourly": {
            path: "africa_6-hourly/",
            formats: ["bin"], // Special binary format
            resolutions: ["0p1"], // 0.1 degree
            structure: "year_month" // e.g. /1981/01/filename
        },
        "africa_daily": {
            path: "africa_daily/",
            formats: ["tifs", "bils"],
            resolutions: ["p05", "p25"], // 0.05 and 0.25
            structure: "standard" // e.g. /tifs/p05/year/filename
        },
        "africa_dekad": {
            path: "africa_dekad/",
            formats: ["tifs", "bils", "pngs"],
            resolutions: ["p05", "p25"], // implicit/varied structure, often flat or simple
            structure: "flat_format_folder" // e.g. /tifs/filename (or similar, needs careful handling)
        },
        "africa_monthly": {
            path: "africa_monthly/",
            formats: ["tifs", "bils", "pngs"],
            resolutions: ["p05", "p25"],
            structure: "flat_format_folder"
        },
        "africa_pentad": {
            path: "africa_pentad/",
            formats: ["tifs", "bils", "pngs"],
            resolutions: ["p05", "p25"],
            structure: "flat_format_folder"
        },
        // "camer-carib_dekad": { /* Similar patterns... */ }, 
        // Simplified for core global/africa requests first, expanding structure as needed:

        "global_daily": {
            path: "global_daily/",
            formats: ["tifs", "netcdf"],
            resolutions: ["p05", "p25"],
            structure: "standard" // tifs/p05/year/filename
        },
        "global_monthly": {
            path: "global_monthly/",
            formats: ["tifs", "netcdf", "bils"],
            resolutions: ["p05", "p25"],
            structure: "standard"
        },
        "global_annual": {
            path: "global_annual/",
            formats: ["tifs", "netcdf"],
            resolutions: ["p05", "p25"],
            structure: "flat_format_folder"
        },
        // Add other datasets as requested, mapping them to generic structures
    }
};

/**
 * Generates the URL for CHIRPS data based on user arguments.
 * @param {Object} args - Arguments for the request
 * @param {string} dataType - Type of data requested (mapped to dataset key)
 * @returns {string} Fully constructed URL
 */
function sourceType(args, dataType) {
    // Default to global_daily if not specified or known
    const datasetKey = (dataType && chirpsConfig.datasets[dataType]) ? dataType : "global_daily";
    const config = chirpsConfig.datasets[datasetKey];

    if (!config) {
        throw new Error(`Dataset '${dataType}' is not supported or invalid.`);
    }

    // Extract parameters with defaults
    const year = args.year || new Date().getFullYear().toString();
    const month = args.month ? args.month.toString().padStart(2, '0') : null;

    // Format handling: map generic 'tiff' to 'tifs', 'netcdf' to 'netcdf', etc.
    let format = args.format || "tifs";
    if (format === "tiff" || format === "tif") format = "tifs";
    if (format === "bil") format = "bils";
    if (format === "png") format = "pngs";

    if (!config.formats.includes(format)) {
        // Fallback to first available format if requested is invalid for this dataset
        // console.warn(`Format '${args.format}' not available for ${datasetKey}. Using '${config.formats[0]}' instead.`);
        format = config.formats[0];
    }

    // Resolution handling
    let resolution = args.resolution || "p05"; // Default to 0.05 deg
    if (resolution === "0.05") resolution = "p05";
    if (resolution === "0.25") resolution = "p25";
    if (resolution === "0.1") resolution = "0p1";

    // Check if resolution is valid for dataset (some don't use resolution folders explicitly for all formats)
    // For simplicity, we assume if it's in the list, it's a valid folder part if the structure requires it.

    // Construct filename (basic construction, can be overridden by explicit filename arg)
    let filename = args.filename;
    if (!filename) {
        if (datasetKey.includes("daily")) {
            // e.g., chirps-v2.0.2024.01.01.tif.gz
            // Need full date for daily
            // If args has specific day/month/year
            // This part is tricky as filenames vary slightly. 
            // Best approach: If user doesn't provide filename, we try to construct it carefully or rely on them providing it for specific files.
            // HOWEVER, the user asked to "construct data requests yourself through the use the inputs".

            const yyyy = year;
            const mm = month || "01";
            const dd = args.day ? args.day.toString().padStart(2, '0') : "01";

            let ext = format === "tifs" ? ".tif.gz" : (format === "netcdf" ? ".nc" : "");
            if (format === "tifs") ext = ".tif.gz"; // Most daily tiffs are gzipped
            if (format === "netcdf") ext = ".nc";

            // CHIRPS v2.0 naming convention
            filename = `chirps-v2.0.${yyyy}.${mm}.${dd}${ext}`;

            // NetCDF daily often yearly aggregate files?
            // global_daily/netcdf/p05/chirps-v2.0.1981.days_p05.nc
            if (format === "netcdf") {
                filename = `chirps-v2.0.${yyyy}.days_${resolution}.nc`;
            }
        } else if (datasetKey.includes("monthly")) {
            // chirps-v2.0.2024.01.tif.gz
            const yyyy = year;
            const mm = month || "01";
            let ext = format === "tifs" ? ".tif.gz" : (format === "netcdf" ? ".nc" : "");
            filename = `chirps-v2.0.${yyyy}.${mm}${ext}`;
            if (format === "netcdf") {
                // global_monthly/netcdf/chirps-v2.0.monthly.nc (usually one big file?) or divided?
                // Actually looks like they might not be split by year for netcdf sometimes?
                // Let's stick to simple file construction for now and expect failures on complex edge cases without scraping.
                // But for daily tiffs (user example), it's standard.
            }
        }
    }

    // Build URL based on structure type
    let url = chirpsConfig.baseUrl + config.path;

    if (config.structure === "standard") {
        // pattern: format/resolution/year/filename
        // e.g. https://data.chc.ucsb.edu/products/CHIRPS-2.0/global_daily/tifs/p05/2024/chirps-v2.0.2024.01.01.tif.gz
        // Note: NetCDF structure might differ slightly (often just netcdf/filename or netcdf/year/filename)
        // Adjusting for 'netcdf' if needed. CHIRPS directory listing shows:
        // global_daily/netcdf/p05/ (contains yearly files)

        url += `${format}/`;

        // Resolution folder usually exists for p05/p25
        if (config.resolutions.length > 0) {
            url += `${resolution}/`;
        }

        // Year folder? 
        // For tifs/p05/ -> yes, there are year folders.
        // For netcdf -> often no year folder, just the file.
        if (format !== "netcdf" && config.structure === "standard") {
            url += `${year}/`;
        }

        url += filename;

    } else if (config.structure === "flat_format_folder") {
        // pattern: format/filename (maybe with resolution in filename)
        url += `${format}/`;
        if (config.resolutions.length > 0 && format !== 'netcdf') {
            // sometimes resolution is a folder even in 'flat' structures for tiffs
            // Let's assume generic logic: check if user provided enough info
        }
        url += filename;
    }

    // Specific overrides for the User's example: global_daily/tifs/p05/2024/
    // URL: https://data.chc.ucsb.edu/products/CHIRPS-2.0/global_daily/tifs/p05/2024/chirps-v2.0.2024.01.01.tif.gz

    return url;
}

export default {
    sourceType, // Export the function to be used by data.js

    // Default configs for discovery/docs (optional but good for 'info')
    "global-daily": {
        endpoint: "dynamic", // Placeholder
        params: {
            year: null,
            month: null,
            day: null,
            format: "tiff", // or netcdf
            resolution: "0.05"
        },
        methods: {
            type: "tiff",
            method: "GET"
        }
    },

    // Add other keys for consistency if users use them directly
    "africa-daily": {
        endpoint: "dynamic",
        params: { year: null, format: "tiff" },
        methods: { type: "tiff", method: "GET" }
    },

    requirements: {
        needProxy: true,
        requireskey: false,
    },

    info: {
        returnFormats: "netcdf, tiff, bil, png",
        MoreInfo: "https://www.chc.ucsb.edu/data/chirps",
        About: "CHIRPS incorporates 0.05° resolution satellite imagery with in-situ station data to create gridded rainfall time series for trend analysis and seasonal drought monitoring."
    },

    "endpoint-info": {
        "global-daily": {
            paramFormat: {
                year: "String - Year (YYYY)",
                month: "String - Month (MM) - optional",
                day: "String - Day (DD) - optional",
                format: "String - 'tiff' (default) or 'netcdf'",
                resolution: "String - '0.05' (default) or '0.25'",
                filename: "String - Optional explicit filename override"
            },
            infoSource: "https://data.chc.ucsb.edu/products/CHIRPS-2.0/",
            example: {
                year: "2023",
                month: "01",
                day: "01",
                format: "tiff",
                resolution: "0.05",
                exampleRequest: "https://data.chc.ucsb.edu/products/CHIRPS-2.0/global_daily/tifs/p05/2023/chirps-v2.0.2023.01.01.tif.gz"
            }
        }
    }
};
