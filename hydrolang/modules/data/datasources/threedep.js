/**
 * USGS 3D Elevation Program (3DEP) - Digital Elevation Model Data
 * Provides elevation data via USGS National Map ImageServer exportImage
 * https://www.usgs.gov/3d-elevation-program
 * @type {Object}
 * @author kento-sugiyama
 * @name ThreeDEP
 * @memberof datasources
 */

export default {
  "export-image": {
    endpoint:
      "https://elevation.nationalmap.gov/arcgis/rest/services/3DEPElevation/ImageServer/exportImage",
    params: {
      f: "image",
      bbox: null, // "west,south,east,north"
      bboxSR: "4326",
      imageSR: "5070",
      size: null, // "width,height" e.g. "100,100"
      format: "tiff",
      pixelType: "F32",
      noDataInterpretation: "esriNoDataMatchAny",
      interpolation: "RSP_BilinearInterpolation",
      compression: "LZ77",
      compressionQuality: "75",
      bandIds: "0",
    },
    methods: {
      type: "binary",
      method: "GET",
    },
  },

  requirements: {
    needProxy: false,
    requireskey: false,
  },

  info: {
    returnFormats: "tiff",
    MoreInfo: "https://www.usgs.gov/3d-elevation-program",
    About:
      "USGS 3D Elevation Program provides high-resolution elevation data via ArcGIS ImageServer. Returns TIFF images with elevation values for specified bounding boxes.",
  },

  docs: {
    "export-image": {
      description:
        "Export elevation data as TIFF image for a specified bounding box region",
      parameters: {
        bbox: "String - Bounding box in format 'west,south,east,north' (required)",
        size: "String - Output image dimensions 'width,height' (required, e.g. '100,100')",
        bboxSR:
          "String - Spatial reference of bbox coordinates (default: '4326' for WGS84)",
        imageSR:
          "String - Output spatial reference (default: '5070' for Albers Equal Area)",
        format: "String - Output format (default: 'tiff')",
        pixelType: "String - Pixel data type (default: 'F32' for 32-bit float)",
        interpolation:
          "String - Resampling method (default: 'RSP_BilinearInterpolation')",
        compression: "String - Compression method (default: 'LZ77')",
        compressionQuality:
          "String - Compression quality 0-100 (default: '75')",
        bandIds: "String - Band indices to export (default: '0')",
      },
      infoSource:
        "https://developers.arcgis.com/rest/services-reference/enterprise/export-image/",
      example: {
        bbox: "-80.5,43.5,-80.4,43.6",
        size: "100,100",
        exampleRequest:
          "https://elevation.nationalmap.gov/arcgis/rest/services/3DEPElevation/ImageServer/exportImage?f=image&bbox=-80.5,43.5,-80.4,43.6&bboxSR=4326&imageSR=5070&size=100,100&format=tiff&pixelType=F32&noDataInterpretation=esriNoDataMatchAny&interpolation=RSP_BilinearInterpolation&compression=LZ77&compressionQuality=75&bandIds=0",
      },
    },
  },
};
