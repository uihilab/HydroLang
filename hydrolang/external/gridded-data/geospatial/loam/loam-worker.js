// [HydroLang] Pre-injected setup for GDAL WASM/Emscripten
try {
  // 0. Load Proj4 first (helper)
  importScripts('https://cdnjs.cloudflare.com/ajax/libs/proj4js/2.10.0/proj4.js');

  // 1. Setup Module configuration for Emscripten
  self.Module = {
    locateFile: function (path, scriptDirectory) {
      // Emscripten passes scriptDirectory or we can use local fallback
      if (path.endsWith('.wasm') || path.endsWith('.data')) {
        // Return path relative to worker location (which is this file)
        return path;
      }
      return path;
    },
    preRun: [function () {
      // Set environment variables before main() runs
      if (typeof ENV !== 'undefined') {
        // GDAL Data
        ENV.GDAL_DATA = '/usr/local/share/gdal';
        // Debug
        ENV['CPL_DEBUG'] = 'ON';
        ENV['CPL_LOG_ERRORS'] = 'ON';
        ENV['GDAL_PAM_ENABLED'] = 'NO'; // Disable .aux.xml writing
        // Proj
        ENV.PROJ_LIB = '/usr/local/share/proj';
        console.log('Loam Worker: ENV configured (GDAL_DATA, PROJ_LIB, CPL_DEBUG, PAM=NO)');
      }
    }]
  };

  // 2. Load GDAL
  importScripts('gdal.js'); // Assumes gdal.js is in same folder

  // 3. Shim FS.mount to handle File objects via FileReaderSync (Critical for Loam.open)
  if (typeof FS !== 'undefined') {
    const originalMount = FS.mount;
    const originalUnmount = FS.unmount;

    FS.mount = function (type, opts, mountpoint) {
      if (opts) console.log('Loam shim: FS.mount called. Keys:', Object.keys(opts), 'Mountpoint:', mountpoint);
      if (opts && (opts.blobs || opts.files)) {

        // Handle blobs
        if (opts.blobs) {
          opts.blobs.forEach(function (b) {
            const dest = mountpoint + '/' + b.name;
            FS.writeFile(dest, b.data);
            console.log('Loam shim: Wrote Blob to', dest, 'size:', b.data.length || b.data.byteLength);
          });
        }

        // Handle files (File objects)
        if (opts.files) {
          try {
            const reader = new FileReaderSync();
            opts.files.forEach(function (f) {
              const dest = mountpoint + '/' + f.name;
              // Read file content synchronously
              const content = reader.readAsArrayBuffer(f);
              FS.writeFile(dest, new Uint8Array(content));
              console.log('Loam shim: Wrote File to', dest, 'size:', content.byteLength);
            });
          } catch (e) {
            console.error('Loam shim: Error mounting Files:', e);
          }
        }
        return;
      }
      return originalMount.apply(this, arguments);
    };

    FS.unmount = function (mountpoint) {
      try { originalUnmount.apply(this, arguments); } catch (e) { }
    };

    // Wrap FS.readFile to debug "FS error"
    const originalReadFile = FS.readFile;
    FS.readFile = function (path, opts) {
      // console.log('FS.readFile calling for:', path);
      try {
        return originalReadFile.apply(this, arguments);
      } catch (e) {
        console.error('FS.readFile failed for path:', path, e);
        throw e;
      }
    };

    console.log('Loam Worker: FS.mount shim & readFile wrapper applied successfully');
  }

} catch (e) {
  console.error('Loam Worker Setup Error:', e);
}

// ---------------------------------------------------------
// Original loam-worker.js execution starts below
// ---------------------------------------------------------
(function webpackUniversalModuleDefinition(root, factory) {
  if (typeof exports === 'object' && typeof module === 'object')
    module.exports = factory();
  else if (typeof define === 'function' && define.amd)
    define("loam", [], factory);
  else if (typeof exports === 'object')
    exports["loam"] = factory();
  else
    root["loam"] = factory();
})(self, () => {
  return /******/ (() => { // webpackBootstrap
/******/ 	"use strict";
/******/ 	var __webpack_modules__ = ({

/***/ "./src/gdalDataType.js":
/*!*****************************!*\
  !*** ./src/gdalDataType.js ***!
  \*****************************/
/***/ ((__unused_webpack_module, exports) => {



          Object.defineProperty(exports, "__esModule", ({
            value: true
          }));
          exports.GDALDataTypes = void 0;
          // In order to make enums available from JS it's necessary to use embind, which seems like
          // overkill for something this small. This replicates the GDALDataType enum:
          // https://gdal.org/api/raster_c_api.html#_CPPv412GDALDataType and will need to be changed
          // if that enum changes. There is a smoke test that should warn us if it changes upstream.
          var GDALDataTypes = ['Unknown', 'Byte', 'UInt16', 'Int16', 'UInt32', 'Int32', 'Float32', 'Float64', 'CInt16', 'CInt32', 'CFloat32', 'CFloat64', 'TypeCount'];
          exports.GDALDataTypes = GDALDataTypes;

          /***/
        }),

/***/ "./src/guessFileExtension.js":
/*!***********************************!*\
  !*** ./src/guessFileExtension.js ***!
  \***********************************/
/***/ ((module, exports) => {



          Object.defineProperty(exports, "__esModule", ({
            value: true
          }));
          exports["default"] = guessFileExtension;

          function guessFileExtension(args) {
            var supportedFormats = {
              PNG: 'png',
              JPEG: 'jpg',
              GTiff: 'tif'
            }; // Match GDAL 2.1 behavior: if output format is unspecified, the output format is GeoTiff
            // This changes to auto-detection based on extension in GDAL 2.3, so if/when we upgrade to that,
            // this will need to be changed.

            if (!args.includes('-of')) {
              return 'tif';
            } // Otherwise, try to guess the format from the arguments; this isn't meant for validation, just
            // to provide a reasonable filename if it ever ends up getting exposed to the user.


            var formatStr = args[args.indexOf('-of') + 1];

            if (Object.keys(supportedFormats).includes(formatStr)) {
              return supportedFormats[formatStr];
            } // If the next parameter after `-of` isn't in our supported formats, then the user is trying
            // to specify a format that's not supported by gdal-js, or their gdal_translate arguments
            // array is malformed. Either way, it's not really this function's business to validate
            // that, so just return the best guess as to what the user might have intended. Any errors
            // will be handled by the main function's error handling code.


            return formatStr;
          }

          module.exports = exports.default;

          /***/
        }),

/***/ "./src/randomKey.js":
/*!**************************!*\
  !*** ./src/randomKey.js ***!
  \**************************/
/***/ ((module, exports) => {



          Object.defineProperty(exports, "__esModule", ({
            value: true
          }));
          exports["default"] = randomKey;

          // https://stackoverflow.com/questions/10726909/random-alpha-numeric-string-in-javascript
          function randomKey() {
            var length = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 32;
            var chars = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : '0123456789abcdefghijklmnopqrstuvwxyz';
            var result = '';

            for (var i = length; i > 0; i--) {
              result += chars[Math.floor(Math.random() * chars.length)];
            }

            return result;
          }

          module.exports = exports.default;

          /***/
        }),

/***/ "./src/stringParamAllocator.js":
/*!*************************************!*\
  !*** ./src/stringParamAllocator.js ***!
  \*************************************/
/***/ ((module, exports, __webpack_require__) => {



          Object.defineProperty(exports, "__esModule", ({
            value: true
          }));
          exports["default"] = void 0;

          var _validation = __webpack_require__(/*! ./validation.js */ "./src/validation.js");

          function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

          function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

          function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); Object.defineProperty(Constructor, "prototype", { writable: false }); return Constructor; }

          /* global Module */
          var ParamParser = /*#__PURE__*/function () {
            function ParamParser(args) {
              _classCallCheck(this, ParamParser);

              var self = this;

              if (!(0, _validation.isArrayAllStrings)(args)) {
                throw new Error('All items in the argument list must be strings');
              }

              self.args = args;
            }

            _createClass(ParamParser, [{
              key: "allocate",
              value: function allocate() {
                var self = this; // So first, we need to allocate Emscripten heap space sufficient to store each string as a
                // null-terminated C string.
                // Because the C function signature is char **, this array of pointers is going to need to
                // get copied into Emscripten heap space eventually, so we're going to prepare by storing
                // the pointers as a typed array so that we can more easily copy it into heap space later.

                var argPtrsArray = Uint32Array.from(self.args.map(function (argStr) {
                  // +1 for the null terminator byte
                  return Module._malloc(Module.lengthBytesUTF8(argStr) + 1);
                }).concat([0])); // ^ In addition to each individual argument being null-terminated, the GDAL docs specify
                // that GDALTranslateOptionsNew takes its options passed in as a null-terminated array of
                // pointers, so we have to add on a null (0) byte at the end.
                // Next, we need to write each string from the JS string array into the Emscripten heap
                // space we've allocated for it.

                self.args.forEach(function (argStr, i) {
                  Module.stringToUTF8(argStr, argPtrsArray[i], Module.lengthBytesUTF8(argStr) + 1);
                }); // Now, as mentioned above, we also need to copy the pointer array itself into heap space.

                var argPtrsArrayPtr = Module._malloc(argPtrsArray.length * argPtrsArray.BYTES_PER_ELEMENT);

                Module.HEAPU32.set(argPtrsArray, argPtrsArrayPtr / argPtrsArray.BYTES_PER_ELEMENT);
                self.argPtrsArray = argPtrsArray;
                self.argPtrsArrayPtr = argPtrsArrayPtr;
              }
            }, {
              key: "deallocate",
              value: function deallocate() {
                var self = this;

                Module._free(self.argPtrsArrayPtr); // Don't try to free the null terminator byte


                self.argPtrsArray.subarray(0, self.argPtrsArray.length - 1).forEach(function (ptr) {
                  return Module._free(ptr);
                });
                delete self.argPtrsArray;
                delete self.argPtrsArrayPtr;
              }
            }]);

            return ParamParser;
          }();

          exports["default"] = ParamParser;
          module.exports = exports.default;

          /***/
        }),

/***/ "./src/validation.js":
/*!***************************!*\
  !*** ./src/validation.js ***!
  \***************************/
/***/ ((__unused_webpack_module, exports) => {



          Object.defineProperty(exports, "__esModule", ({
            value: true
          }));
          exports.isArrayAllStrings = isArrayAllStrings;

          function isArrayAllStrings(args) {
            return args.every(function (arg) {
              return typeof arg === 'string';
            });
          }

          /***/
        }),

/***/ "./src/wrappers/gdalClose.js":
/*!***********************************!*\
  !*** ./src/wrappers/gdalClose.js ***!
  \***********************************/
/***/ ((module, exports) => {



          Object.defineProperty(exports, "__esModule", ({
            value: true
          }));
          exports["default"] = _default;

          /* global FS */
          function _default(GDALClose, errorHandling) {
            return function (datasetPtr, directory, datasetPath) {
              var returnFileBytes = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : false;
              try {
                GDALClose(datasetPtr);
              } catch (e) {
                console.warn('GDALClose threw error (ignoring):', e);
              }
              var result = [];
              var resultBytes = null;

              if (returnFileBytes) {
                // console.log('GDALClose: Reading back file:', datasetPath);
                try {
                  result = FS.readFile(datasetPath, {
                    encoding: 'binary'
                  });
                  // console.log('GDALClose: Read success, bytes:', result.length);
                } catch (e) {
                  console.error('GDALClose: FS.readFile FAILED for:', datasetPath, e);
                  throw new Error('FS error reading ' + datasetPath + ': ' + e.message);
                }
              }

              FS.unmount(directory);
              FS.rmdir(directory);
              var errorType = errorHandling.CPLGetLastErrorType(); // Check for errors; throw if error is detected
              // Note that due to https://github.com/ddohler/gdal-js/issues/38 this can only check for
              // CEFatal errors in order to avoid raising an exception on GDALClose

              if (errorType === errorHandling.CPLErr.CEFatal) {
                var message = errorHandling.CPLGetLastErrorMsg();
                throw new Error('Error in GDALClose: ' + message);
              } else {
                return result;
              }
            };
          }

          module.exports = exports.default;

          /***/
        }),

/***/ "./src/wrappers/gdalDatasetGetLayerCount.js":
/*!**************************************************!*\
  !*** ./src/wrappers/gdalDatasetGetLayerCount.js ***!
  \**************************************************/
/***/ ((module, exports) => {



          Object.defineProperty(exports, "__esModule", ({
            value: true
          }));
          exports["default"] = _default;

          function _default(GDALDatasetGetLayerCount, errorHandling) {
            return function (datasetPtr) {
              var result = GDALDatasetGetLayerCount(datasetPtr);
              var errorType = errorHandling.CPLGetLastErrorType(); // Check for errors; clean up and throw if error is detected

              if (errorType === errorHandling.CPLErr.CEFailure || errorType === errorHandling.CPLErr.CEFatal) {
                var message = errorHandling.CPLGetLastErrorMsg();
                throw new Error('Error in GDALDatasetGetLayerCount: ' + message);
              } else {
                return result;
              }
            };
          }

          module.exports = exports.default;

          /***/
        }),

/***/ "./src/wrappers/gdalDemProcessing.js":
/*!*******************************************!*\
  !*** ./src/wrappers/gdalDemProcessing.js ***!
  \*******************************************/
/***/ ((module, exports, __webpack_require__) => {



          Object.defineProperty(exports, "__esModule", ({
            value: true
          }));
          exports["default"] = _default;

          var _randomKey = _interopRequireDefault(__webpack_require__(/*! ../randomKey.js */ "./src/randomKey.js"));

          var _guessFileExtension = _interopRequireDefault(__webpack_require__(/*! ../guessFileExtension.js */ "./src/guessFileExtension.js"));

          var _stringParamAllocator = _interopRequireDefault(__webpack_require__(/*! ../stringParamAllocator.js */ "./src/stringParamAllocator.js"));

          function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

          /* global Module, FS, MEMFS */
          // TODO: This is another good reason to switch to Typescript #55
          var DEMProcessingModes = Object.freeze({
            hillshade: 'hillshade',
            slope: 'slope',
            aspect: 'aspect',
            'color-relief': 'color-relief',
            TRI: 'TRI',
            TPI: 'TPI',
            roughness: 'roughness'
          });

          function _default(GDALDEMProcessing, errorHandling, rootPath) {
            /* mode: one of the options in DEMProcessingModes
             * colors: Array of strings matching the format of the color file defined at
             *   https://gdal.org/programs/gdaldem.html#color-relief
             * args: Array of strings matching the remaining arguments of gdaldem, excluding output filename
             */
            return function (dataset, packedArgs) {
              // TODO: Make this unnecessary by switching to comlink or similar (#49)
              var mode = packedArgs[0];
              var colors = packedArgs[1];
              var args = packedArgs.slice(2);

              if (!mode || !DEMProcessingModes.hasOwnProperty(mode)) {
                throw new Error("mode must be one of {Object.keys(DEMProcessingModes)}");
              } else if (mode === DEMProcessingModes['color-relief'] && !colors) {
                throw new Error('A color definition array must be provided if `mode` is "color-relief"');
              } else if (mode !== DEMProcessingModes['color-relief'] && colors && colors.length > 0) {
                throw new Error('A color definition array should not be provided if `mode` is not "color-relief"');
              } // If mode is hillshade, we need to create a color file path


              var colorFilePath = null;

              if (mode === DEMProcessingModes['color-relief']) {
                colorFilePath = rootPath + (0, _randomKey["default"])() + '.txt';
                FS.writeFile(colorFilePath, colors.join('\n'));
              }

              var params = new _stringParamAllocator["default"](args);
              params.allocate(); // argPtrsArrayPtr is now the address of the start of the list of
              // pointers in Emscripten heap space. Each pointer identifies the address of the start of a
              // parameter string, also stored in heap space. This is the direct equivalent of a char **,
              // which is what GDALDEMProcessingOptionsNew requires.

              var demOptionsPtr = Module.ccall('GDALDEMProcessingOptionsNew', 'number', ['number', 'number'], [params.argPtrsArrayPtr, null]); // Validate that the options were correct

              var optionsErrType = errorHandling.CPLGetLastErrorType();

              if (optionsErrType === errorHandling.CPLErr.CEFailure || optionsErrType === errorHandling.CPLErr.CEFatal) {
                if (colorFilePath) {
                  FS.unlink(colorFilePath);
                }

                params.deallocate();
                var message = errorHandling.CPLGetLastErrorMsg();
                throw new Error('Error in GDALDEMProcessing: ' + message);
              } // Now that we have our options, we need to make a file location to hold the output.


              var directory = rootPath + (0, _randomKey["default"])();
              FS.mkdir(directory); // This makes it easier to remove later because we can just unmount rather than recursing
              // through the whole directory structure.

              FS.mount(MEMFS, {}, directory);
              var filename = (0, _randomKey["default"])(8) + '.' + (0, _guessFileExtension["default"])(args);
              var filePath = directory + '/' + filename; // And then we can kick off the actual processing.
              // The last parameter is an int* that can be used to detect certain kinds of errors,
              // but I'm not sure how it works yet and whether it gives the same or different information
              // than CPLGetLastErrorType.
              // Malloc ourselves an int and set it to 0 (False)

              var usageErrPtr = Module._malloc(Int32Array.BYTES_PER_ELEMENT);

              Module.setValue(usageErrPtr, 0, 'i32');
              var newDatasetPtr = GDALDEMProcessing(filePath, // Output
                dataset, mode, colorFilePath, demOptionsPtr, usageErrPtr);
              var errorType = errorHandling.CPLGetLastErrorType(); // If we ever want to use the usage error pointer:
              // let usageErr = Module.getValue(usageErrPtr, 'i32');
              // The final set of cleanup we need to do, in a function to avoid writing it twice.

              function cleanUp() {
                if (colorFilePath) {
                  FS.unlink(colorFilePath);
                }

                Module.ccall('GDALDEMProcessingOptionsFree', null, ['number'], [demOptionsPtr]);

                Module._free(usageErrPtr);

                params.deallocate();
              } // Check for errors; clean up and throw if error is detected


              if (errorType === errorHandling.CPLErr.CEFailure || errorType === errorHandling.CPLErr.CEFatal) {
                cleanUp();

                var _message = errorHandling.CPLGetLastErrorMsg();

                throw new Error('Error in GDALDEMProcessing: ' + _message);
              } else {
                var result = {
                  datasetPtr: newDatasetPtr,
                  filePath: filePath,
                  directory: directory,
                  filename: filename
                };
                cleanUp();
                return result;
              }
            };
          }

          module.exports = exports.default;

          /***/
        }),

/***/ "./src/wrappers/gdalGetGeoTransform.js":
/*!*********************************************!*\
  !*** ./src/wrappers/gdalGetGeoTransform.js ***!
  \*********************************************/
/***/ ((module, exports) => {



          Object.defineProperty(exports, "__esModule", ({
            value: true
          }));
          exports["default"] = _default;

          /* global Module */
          function _default(GDALGetGeoTransform, errorHandling) {
            return function (datasetPtr) {
              // This is the first wrapper where things get a bit hairy; the C function follows a common C
              // pattern where an array to store the results is allocated and passed into the function,
              // which populates the array with the results. Emscripten supports passing arrays to
              // functions, but it always creates a *copy* of the array, which means that the original JS
              // array remains unchanged, which isn't what we want in this case. So first, we have to
              // malloc an array inside the Emscripten heap with the correct size. In this case that is 6
              // because the GDAL affine transform array has six elements.
              var byteOffset = Module._malloc(6 * Float64Array.BYTES_PER_ELEMENT); // byteOffset is now a pointer to the start of the double array in Emscripten heap space
              // GDALGetGeoTransform dumps 6 values into the passed double array.


              GDALGetGeoTransform(datasetPtr, byteOffset); // Module.HEAPF64 provides a view into the Emscripten heap, as an array of doubles.
              // Therefore, our byte offset from _malloc needs to be converted into a double offset, so we
              // divide it by the number of bytes per double, and then get a subarray of those six
              // elements off the Emscripten heap.

              var geoTransform = Module.HEAPF64.subarray(byteOffset / Float64Array.BYTES_PER_ELEMENT, byteOffset / Float64Array.BYTES_PER_ELEMENT + 6);
              var errorType = errorHandling.CPLGetLastErrorType(); // Check for errors; clean up and throw if error is detected

              if (errorType === errorHandling.CPLErr.CEFailure || errorType === errorHandling.CPLErr.CEFatal) {
                Module._free(byteOffset);

                var message = errorHandling.CPLGetLastErrorMsg();
                throw new Error('Error in GDALGetGeoTransform: ' + message);
              } else {
                // To avoid memory leaks in the Emscripten heap, we need to free up the memory we
                // allocated after we've converted it into a Javascript object.
                var result = Array.from(geoTransform);

                Module._free(byteOffset);

                return result;
              }
            };
          }

          module.exports = exports.default;

          /***/
        }),

/***/ "./src/wrappers/gdalGetProjectionRef.js":
/*!**********************************************!*\
  !*** ./src/wrappers/gdalGetProjectionRef.js ***!
  \**********************************************/
/***/ ((module, exports) => {



          Object.defineProperty(exports, "__esModule", ({
            value: true
          }));
          exports["default"] = _default;

          function _default(GDALGetProjectionRef, errorHandling) {
            return function (datasetPtr) {
              var result = GDALGetProjectionRef(datasetPtr);
              var errorType = errorHandling.CPLGetLastErrorType(); // Check for errors; clean up and throw if error is detected

              if (errorType === errorHandling.CPLErr.CEFailure || errorType === errorHandling.CPLErr.CEFatal) {
                var message = errorHandling.CPLGetLastErrorMsg();
                throw new Error('Error in GDALGetProjectionRef: ' + message);
              } else {
                return result;
              }
            };
          }

          module.exports = exports.default;

          /***/
        }),

/***/ "./src/wrappers/gdalGetRasterCount.js":
/*!********************************************!*\
  !*** ./src/wrappers/gdalGetRasterCount.js ***!
  \********************************************/
/***/ ((module, exports) => {



          Object.defineProperty(exports, "__esModule", ({
            value: true
          }));
          exports["default"] = _default;

          function _default(GDALGetRasterCount, errorHandling) {
            return function (datasetPtr) {
              var result = GDALGetRasterCount(datasetPtr);
              var errorType = errorHandling.CPLGetLastErrorType(); // Check for errors; clean up and throw if error is detected

              if (errorType === errorHandling.CPLErr.CEFailure || errorType === errorHandling.CPLErr.CEFatal) {
                var message = errorHandling.CPLGetLastErrorMsg();
                throw new Error('Error in GDALGetRasterCount: ' + message);
              } else {
                return result;
              }
            };
          }

          module.exports = exports.default;

          /***/
        }),

/***/ "./src/wrappers/gdalGetRasterDataType.js":
/*!***********************************************!*\
  !*** ./src/wrappers/gdalGetRasterDataType.js ***!
  \***********************************************/
/***/ ((module, exports, __webpack_require__) => {



          Object.defineProperty(exports, "__esModule", ({
            value: true
          }));
          exports["default"] = _default;

          var _gdalDataType = __webpack_require__(/*! ../gdalDataType.js */ "./src/gdalDataType.js");

          /* global Module */
          function _default(GDALGetRasterDataType, errorHandling) {
            return function (datasetPtr, bandNum) {
              var bandPtr = Module.ccall('GDALGetRasterBand', 'number', ['number', 'number'], [datasetPtr, bandNum]); // GDALGetRasterDataType will provide an integer because it's pulling from an enum
              // So we use that to index into an array of the corresponding type strings so that it's
              // easier to work with from Javascript land.

              var result = _gdalDataType.GDALDataTypes[GDALGetRasterDataType(bandPtr)];

              var errorType = errorHandling.CPLGetLastErrorType(); // Check for errors; clean up and throw if error is detected

              if (errorType === errorHandling.CPLErr.CEFailure || errorType === errorHandling.CPLErr.CEFatal) {
                throw new Error('Error in GDALGetRasterDataType: ' + errorHandling.CPLGetLastErrorMsg());
              } else {
                return result;
              }
            };
          }

          module.exports = exports.default;

          /***/
        }),

/***/ "./src/wrappers/gdalGetRasterMaximum.js":
/*!**********************************************!*\
  !*** ./src/wrappers/gdalGetRasterMaximum.js ***!
  \**********************************************/
/***/ ((module, exports) => {



          Object.defineProperty(exports, "__esModule", ({
            value: true
          }));
          exports["default"] = _default;

          /* global Module */
          function _default(GDALGetRasterMaximum, errorHandling) {
            return function (datasetPtr, bandNum) {
              var bandPtr = Module.ccall('GDALGetRasterBand', 'number', ['number', 'number'], [datasetPtr, bandNum]);
              var result = GDALGetRasterMaximum(bandPtr);
              var errorType = errorHandling.CPLGetLastErrorType(); // Check for errors; clean up and throw if error is detected

              if (errorType === errorHandling.CPLErr.CEFailure || errorType === errorHandling.CPLErr.CEFatal) {
                throw new Error('Error in GDALGetRasterMaximum: ' + errorHandling.CPLGetLastErrorMsg());
              } else {
                return result;
              }
            };
          }

          module.exports = exports.default;

          /***/
        }),

/***/ "./src/wrappers/gdalGetRasterMinimum.js":
/*!**********************************************!*\
  !*** ./src/wrappers/gdalGetRasterMinimum.js ***!
  \**********************************************/
/***/ ((module, exports) => {



          Object.defineProperty(exports, "__esModule", ({
            value: true
          }));
          exports["default"] = _default;

          /* global Module */
          function _default(GDALGetRasterMinimum, errorHandling) {
            return function (datasetPtr, bandNum) {
              var bandPtr = Module.ccall('GDALGetRasterBand', 'number', ['number', 'number'], [datasetPtr, bandNum]);
              var result = GDALGetRasterMinimum(bandPtr);
              var errorType = errorHandling.CPLGetLastErrorType(); // Check for errors; clean up and throw if error is detected

              if (errorType === errorHandling.CPLErr.CEFailure || errorType === errorHandling.CPLErr.CEFatal) {
                throw new Error('Error in GDALGetRasterMinimum: ' + errorHandling.CPLGetLastErrorMsg());
              } else {
                return result;
              }
            };
          }

          module.exports = exports.default;

          /***/
        }),

/***/ "./src/wrappers/gdalGetRasterNoDataValue.js":
/*!**************************************************!*\
  !*** ./src/wrappers/gdalGetRasterNoDataValue.js ***!
  \**************************************************/
/***/ ((module, exports) => {



          Object.defineProperty(exports, "__esModule", ({
            value: true
          }));
          exports["default"] = _default;

          /* global Module */
          function _default(GDALGetRasterNoDataValue, errorHandling) {
            return function (datasetPtr, bandNum) {
              var bandPtr = Module.ccall('GDALGetRasterBand', 'number', ['number', 'number'], [datasetPtr, bandNum]);
              var result = GDALGetRasterNoDataValue(bandPtr);
              var errorType = errorHandling.CPLGetLastErrorType(); // Check for errors; clean up and throw if error is detected

              if (errorType === errorHandling.CPLErr.CEFailure || errorType === errorHandling.CPLErr.CEFatal) {
                throw new Error('Error in GDALGetRasterNoDataValue: ' + errorHandling.CPLGetLastErrorMsg());
              } else {
                return result;
              }
            };
          }

          module.exports = exports.default;

          /***/
        }),

/***/ "./src/wrappers/gdalGetRasterStatistics.js":
/*!*************************************************!*\
  !*** ./src/wrappers/gdalGetRasterStatistics.js ***!
  \*************************************************/
/***/ ((module, exports) => {



          Object.defineProperty(exports, "__esModule", ({
            value: true
          }));
          exports["default"] = _default;

          /* global Module */
          function _default(GDALGetRasterStatistics, errorHandling) {
            return function (datasetPtr, bandNum) {
              var bandPtr = Module.ccall('GDALGetRasterBand', 'number', ['number', 'number'], [datasetPtr, bandNum]); // We need to allocate pointers to store statistics into which will get passed into
              // GDALGetRasterStatistics(). They're all doubles, so allocate 8 bytes each.

              var minPtr = Module._malloc(8);

              var maxPtr = Module._malloc(8);

              var meanPtr = Module._malloc(8);

              var sdPtr = Module._malloc(8);

              var returnErr = GDALGetRasterStatistics(bandPtr, 0, // Approximate statistics flag -- set to false
                1, // Force flag -- will always return statistics even if image must be rescanned
                minPtr, maxPtr, meanPtr, sdPtr);
              var errorType = errorHandling.CPLGetLastErrorType(); // Check for errors; throw if error is detected
              // GDALGetRasterStatistics returns CE_Failure if an error occurs.

              try {
                if (errorType === errorHandling.CPLErr.CEFailure || errorType === errorHandling.CPLErr.CEFatal || returnErr === errorHandling.CPLErr.CEFailure) {
                  throw new Error('Error in GDALGetRasterStatistics: ' + errorHandling.CPLGetLastErrorMsg());
                } else {
                  // At this point the values at each pointer should have been written with statistics
                  // so we can read them out and send them back.
                  return {
                    minimum: Module.getValue(minPtr, 'double'),
                    maximum: Module.getValue(maxPtr, 'double'),
                    median: Module.getValue(meanPtr, 'double'),
                    stdDev: Module.getValue(sdPtr, 'double')
                  };
                }
              } finally {
                Module._free(minPtr);

                Module._free(maxPtr);

                Module._free(meanPtr);

                Module._free(sdPtr);
              }
            };
          }

          module.exports = exports.default;

          /***/
        }),

/***/ "./src/wrappers/gdalGetRasterXSize.js":
/*!********************************************!*\
  !*** ./src/wrappers/gdalGetRasterXSize.js ***!
  \********************************************/
/***/ ((module, exports) => {



          Object.defineProperty(exports, "__esModule", ({
            value: true
          }));
          exports["default"] = _default;

          function _default(GDALGetRasterXSize, errorHandling) {
            return function (datasetPtr) {
              var result = GDALGetRasterXSize(datasetPtr);
              var errorType = errorHandling.CPLGetLastErrorType(); // Check for errors; clean up and throw if error is detected

              if (errorType === errorHandling.CPLErr.CEFailure || errorType === errorHandling.CPLErr.CEFatal) {
                var message = errorHandling.CPLGetLastErrorMsg();
                throw new Error('Error in GDALGetRasterXSize: ' + message);
              } else {
                return result;
              }
            };
          }

          module.exports = exports.default;

          /***/
        }),

/***/ "./src/wrappers/gdalGetRasterYSize.js":
/*!********************************************!*\
  !*** ./src/wrappers/gdalGetRasterYSize.js ***!
  \********************************************/
/***/ ((module, exports) => {



          Object.defineProperty(exports, "__esModule", ({
            value: true
          }));
          exports["default"] = _default;

          function _default(GDALGetRasterYSize, errorHandling) {
            return function (datasetPtr) {
              var result = GDALGetRasterYSize(datasetPtr);
              var errorType = errorHandling.CPLGetLastErrorType(); // Check for errors; clean up and throw if error is detected

              if (errorType === errorHandling.CPLErr.CEFailure || errorType === errorHandling.CPLErr.CEFatal) {
                var message = errorHandling.CPLGetLastErrorMsg();
                throw Error('Error in GDALGetRasterYSize: ' + message);
              } else {
                return result;
              }
            };
          }

          module.exports = exports.default;

          /***/
        }),

/***/ "./src/wrappers/gdalOpen.js":
/*!**********************************!*\
  !*** ./src/wrappers/gdalOpen.js ***!
  \**********************************/
/***/ ((module, exports, __webpack_require__) => {



          Object.defineProperty(exports, "__esModule", ({
            value: true
          }));
          exports["default"] = _default;

          var _randomKey = _interopRequireDefault(__webpack_require__(/*! ../randomKey.js */ "./src/randomKey.js"));

          function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

          function _toConsumableArray(arr) { return _arrayWithoutHoles(arr) || _iterableToArray(arr) || _unsupportedIterableToArray(arr) || _nonIterableSpread(); }

          function _nonIterableSpread() { throw new TypeError("Invalid attempt to spread non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); }

          function _unsupportedIterableToArray(o, minLen) { if (!o) return; if (typeof o === "string") return _arrayLikeToArray(o, minLen); var n = Object.prototype.toString.call(o).slice(8, -1); if (n === "Object" && o.constructor) n = o.constructor.name; if (n === "Map" || n === "Set") return Array.from(o); if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)) return _arrayLikeToArray(o, minLen); }

          function _iterableToArray(iter) { if (typeof Symbol !== "undefined" && iter[Symbol.iterator] != null || iter["@@iterator"] != null) return Array.from(iter); }

          function _arrayWithoutHoles(arr) { if (Array.isArray(arr)) return _arrayLikeToArray(arr); }

          function _arrayLikeToArray(arr, len) { if (len == null || len > arr.length) len = arr.length; for (var i = 0, arr2 = new Array(len); i < len; i++) { arr2[i] = arr[i]; } return arr2; }

          // Redefine constants from https://github.com/OSGeo/gdal/blob/v2.4.4/gdal/gcore/gdal.h
          // Constants are hard to get Emscripten to output in a way that we can usefully reference from
          // Javascript.
          var GDAL_OF_UPDATE = 0x01;
          var GDAL_OF_VERBOSE_ERROR = 0x40;
          /* global FS WORKERFS */

          function _default(GDALOpenEx, errorHandling, rootPath) {
            return function (file) {
              var args = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : [];
              var sidecars = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : [];
              var filename;
              var directory = rootPath + (0, _randomKey["default"])();
              FS.mkdir(directory);

              if (file instanceof File) {
                filename = file.name;
                FS.mount(WORKERFS, {
                  files: [file].concat(_toConsumableArray(sidecars))
                }, directory);
              } else if (file instanceof Blob) {
                filename = 'dataset';
                FS.mount(WORKERFS, {
                  blobs: [{
                    name: filename,
                    data: file
                  }].concat(_toConsumableArray(sidecars))
                }, directory);
              } else if (file instanceof Object && 'name' in file && 'data' in file) {
                filename = file.name;
                FS.mount(WORKERFS, {
                  blobs: [{
                    name: filename,
                    data: file.data
                  }].concat(_toConsumableArray(sidecars))
                }, directory);
              }

              var filePath = directory + '/' + filename;
              var datasetPtr = GDALOpenEx(filePath, // Open for update by default. We don't currently provide users a way to control this
                // externally and the default is read-only.
                GDAL_OF_UPDATE | GDAL_OF_VERBOSE_ERROR, null, null, null);
              var errorType = errorHandling.CPLGetLastErrorType(); // Check for errors; clean up and throw if error is detected

              if (errorType === errorHandling.CPLErr.CEFailure || errorType === errorHandling.CPLErr.CEFatal) {
                FS.unmount(directory);
                FS.rmdir(directory);
                var message = errorHandling.CPLGetLastErrorMsg();
                throw new Error('Error in GDALOpen: ' + message);
              } else {
                return {
                  datasetPtr: datasetPtr,
                  filePath: filePath,
                  directory: directory,
                  filename: filename
                };
              }
            };
          }

          module.exports = exports.default;

          /***/
        }),

/***/ "./src/wrappers/gdalRasterize.js":
/*!***************************************!*\
  !*** ./src/wrappers/gdalRasterize.js ***!
  \***************************************/
/***/ ((module, exports, __webpack_require__) => {



          Object.defineProperty(exports, "__esModule", ({
            value: true
          }));
          exports["default"] = _default;

          var _randomKey = _interopRequireDefault(__webpack_require__(/*! ../randomKey.js */ "./src/randomKey.js"));

          var _guessFileExtension = _interopRequireDefault(__webpack_require__(/*! ../guessFileExtension.js */ "./src/guessFileExtension.js"));

          var _stringParamAllocator = _interopRequireDefault(__webpack_require__(/*! ../stringParamAllocator.js */ "./src/stringParamAllocator.js"));

          function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

          /* global Module, FS, MEMFS */
          function _default(GDALRasterize, errorHandling, rootPath) {
            return function (geojson) {
              var args = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : [];
              var sidecars = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : [];
              var params = new _stringParamAllocator["default"](args); // Make a temporary file location to hold the geojson

              var geojsonPath = rootPath + (0, _randomKey["default"])() + '.geojson';
              FS.writeFile(geojsonPath, JSON.stringify(geojson)); // Append the geojson path to the args so that it's read as the source.
              // Open the geojson using GDALOpenEx, which can handle non-raster sources.

              var datasetPtr = Module.ccall('GDALOpenEx', 'number', ['string'], [geojsonPath]);
              params.allocate(); // Whew, all finished. argPtrsArrayPtr is now the address of the start of the list of
              // pointers in Emscripten heap space. Each pointer identifies the address of the start of a
              // parameter string, also stored in heap space. This is the direct equivalent of a char **,
              // which is what GDALRasterizeOptionsNew requires.

              var rasterizeOptionsPtr = Module.ccall('GDALRasterizeOptionsNew', 'number', ['number', 'number'], [params.argPtrsArrayPtr, null]); // Validate that the options were correct

              var optionsErrType = errorHandling.CPLGetLastErrorType();

              if (optionsErrType === errorHandling.CPLErr.CEFailure || optionsErrType === errorHandling.CPLErr.CEFatal) {
                Module.ccall('GDALClose', 'number', ['number'], datasetPtr);
                FS.unlink(geojsonPath);
                params.deallocate();
                var message = errorHandling.CPLGetLastErrorMsg();
                throw new Error('Error in GDALRasterize: ' + message);
              } // Now that we have our translate options, we need to make a file location to hold the
              // output.


              var directory = rootPath + (0, _randomKey["default"])();
              FS.mkdir(directory); // This makes it easier to remove later because we can just unmount rather than recursing
              // through the whole directory structure.

              FS.mount(MEMFS, {}, directory);
              var filename = (0, _randomKey["default"])(8) + '.' + (0, _guessFileExtension["default"])(args);
              var filePath = directory + '/' + filename; // And then we can kick off the actual warping process.
              // TODO: The last parameter is an int* that can be used to detect certain kinds of errors,
              // but I'm not sure how it works yet and whether it gives the same or different information
              // than CPLGetLastErrorType
              // We can get some error information out of the final pbUsageError parameter, which is an
              // int*, so malloc ourselves an int and set it to 0 (False)

              var usageErrPtr = Module._malloc(Int32Array.BYTES_PER_ELEMENT);

              Module.setValue(usageErrPtr, 0, 'i32');
              var newDatasetPtr = GDALRasterize(filePath, // Output
                0, // NULL because filePath is not NULL
                datasetPtr, rasterizeOptionsPtr, usageErrPtr);
              var errorType = errorHandling.CPLGetLastErrorType(); // If we ever want to use the usage error pointer:
              // let usageErr = Module.getValue(usageErrPtr, 'i32');
              // The final set of cleanup we need to do, in a function to avoid writing it twice.

              function cleanUp() {
                Module.ccall('GDALClose', 'number', ['number'], datasetPtr);
                FS.unlink(geojsonPath);
                Module.ccall('GDALRasterizeOptionsFree', null, ['number'], [rasterizeOptionsPtr]);

                Module._free(usageErrPtr);

                params.deallocate();
              } // Check for errors; clean up and throw if error is detected


              if (errorType === errorHandling.CPLErr.CEFailure || errorType === errorHandling.CPLErr.CEFatal) {
                cleanUp();

                var _message = errorHandling.CPLGetLastErrorMsg();

                throw new Error('Error in GDALRasterize: ' + _message);
              } else {
                var result = {
                  datasetPtr: newDatasetPtr,
                  filePath: filePath,
                  directory: directory,
                  filename: filename
                };
                cleanUp();
                return result;
              }
            };
          }

          module.exports = exports.default;

          /***/
        }),

/***/ "./src/wrappers/gdalTranslate.js":
/*!***************************************!*\
  !*** ./src/wrappers/gdalTranslate.js ***!
  \***************************************/
/***/ ((module, exports, __webpack_require__) => {



          Object.defineProperty(exports, "__esModule", ({
            value: true
          }));
          exports["default"] = _default;

          var _randomKey = _interopRequireDefault(__webpack_require__(/*! ../randomKey.js */ "./src/randomKey.js"));

          var _guessFileExtension = _interopRequireDefault(__webpack_require__(/*! ../guessFileExtension.js */ "./src/guessFileExtension.js"));

          var _stringParamAllocator = _interopRequireDefault(__webpack_require__(/*! ../stringParamAllocator.js */ "./src/stringParamAllocator.js"));

          function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

          /* global Module, FS, MEMFS */
          function _default(GDALTranslate, errorHandling, rootPath) {
            // Args is expected to be an array of strings that could function as arguments to gdal_translate
            return function (dataset, args) {
              var params = new _stringParamAllocator["default"](args);
              params.allocate(); // Whew, all finished. argPtrsArrayPtr is now the address of the start of the list of
              // pointers in Emscripten heap space. Each pointer identifies the address of the start of a
              // parameter string, also stored in heap space. This is the direct equivalent of a char **,
              // which is what GDALTranslateOptionsNew requires.

              var translateOptionsPtr = Module.ccall('GDALTranslateOptionsNew', 'number', ['number', 'number'], [params.argPtrsArrayPtr, null]); // Validate that the options were correct

              var optionsErrType = errorHandling.CPLGetLastErrorType();

              if (optionsErrType === errorHandling.CPLErr.CEFailure || optionsErrType === errorHandling.CPLErr.CEFatal) {
                Module.ccall('GDALTranslateOptionsFree', null, ['number'], [translateOptionsPtr]);
                params.deallocate();
                var message = errorHandling.CPLGetLastErrorMsg();
                throw new Error('Error in GDALTranslate: ' + message);
              } // Now that we have our translate options, we need to make a file location to hold the
              // output.


              var directory = rootPath + (0, _randomKey["default"])();
              FS.mkdir(directory); // This makes it easier to remove later because we can just unmount rather than recursing
              // through the whole directory structure.

              FS.mount(MEMFS, {}, directory);
              var filename = (0, _randomKey["default"])(8) + '.' + (0, _guessFileExtension["default"])(args);
              var filePath = directory + '/' + filename; // And then we can kick off the actual translation process.
              // TODO: The last parameter is an int* that can be used to detect certain kinds of errors,
              // but I'm not sure how it works yet and whether it gives the same or different information
              // than CPLGetLastErrorType
              // We can get some error information out of the final pbUsageError parameter, which is an
              // int*, so malloc ourselves an int and set it to 0 (False)

              var usageErrPtr = Module._malloc(Int32Array.BYTES_PER_ELEMENT);

              Module.setValue(usageErrPtr, 0, 'i32');
              var newDatasetPtr = GDALTranslate(filePath, dataset, translateOptionsPtr, usageErrPtr);
              var errorType = errorHandling.CPLGetLastErrorType(); // If we ever want to use the usage error pointer:
              // let usageErr = Module.getValue(usageErrPtr, 'i32');
              // The final set of cleanup we need to do, in a function to avoid writing it twice.

              function cleanUp() {
                Module.ccall('GDALTranslateOptionsFree', null, ['number'], [translateOptionsPtr]);

                Module._free(usageErrPtr);

                params.deallocate();
              } // Check for errors; clean up and throw if error is detected


              if (errorType === errorHandling.CPLErr.CEFailure || errorType === errorHandling.CPLErr.CEFatal) {
                cleanUp();

                var _message = errorHandling.CPLGetLastErrorMsg();

                throw new Error('Error in GDALTranslate: ' + _message);
              } else {
                var result = {
                  datasetPtr: newDatasetPtr,
                  filePath: filePath,
                  directory: directory,
                  filename: filename
                };
                cleanUp();
                return result;
              }
            };
          }

          module.exports = exports.default;

          /***/
        }),

/***/ "./src/wrappers/gdalVectorTranslate.js":
/*!*********************************************!*\
  !*** ./src/wrappers/gdalVectorTranslate.js ***!
  \*********************************************/
/***/ ((module, exports, __webpack_require__) => {



          Object.defineProperty(exports, "__esModule", ({
            value: true
          }));
          exports["default"] = _default;

          var _randomKey = _interopRequireDefault(__webpack_require__(/*! ../randomKey.js */ "./src/randomKey.js"));

          var _guessFileExtension = _interopRequireDefault(__webpack_require__(/*! ../guessFileExtension.js */ "./src/guessFileExtension.js"));

          var _stringParamAllocator = _interopRequireDefault(__webpack_require__(/*! ../stringParamAllocator.js */ "./src/stringParamAllocator.js"));

          function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

          /* global Module, FS, MEMFS */
          function _default(GDALVectorTranslate, errorHandling, rootPath) {
            // Args is expected to be an array of strings that could function as arguments to ogr2ogr
            return function (dataset, args) {
              var params = new _stringParamAllocator["default"](args);
              params.allocate(); // Whew, all finished. argPtrsArrayPtr is now the address of the start of the list of
              // pointers in Emscripten heap space. Each pointer identifies the address of the start of a
              // parameter string, also stored in heap space. This is the direct equivalent of a char **,
              // which is what GDALVectorTranslateOptionsNew requires.

              var translateOptionsPtr = Module.ccall('GDALVectorTranslateOptionsNew', 'number', ['number', 'number'], [params.argPtrsArrayPtr, null]); // Validate that the options were correct

              var optionsErrType = errorHandling.CPLGetLastErrorType();

              if (optionsErrType === errorHandling.CPLErr.CEFailure || optionsErrType === errorHandling.CPLErr.CEFatal) {
                Module.ccall('GDALVectorTranslateOptionsFree', null, ['number'], [translateOptionsPtr]);
                params.deallocate();
                var message = errorHandling.CPLGetLastErrorMsg();
                throw new Error('Error in GDALVectorTranslate: ' + message);
              } // Now that we have our translate options, we need to make a file location to hold the
              // output.


              var directory = rootPath + (0, _randomKey["default"])();
              FS.mkdir(directory); // This makes it easier to remove later because we can just unmount rather than recursing
              // through the whole directory structure.

              FS.mount(MEMFS, {}, directory);
              var filename = (0, _randomKey["default"])(8) + '.' + (0, _guessFileExtension["default"])(args);
              var filePath = directory + '/' + filename; // GDALVectorTranslate takes a list of input datasets, even though it can only ever have one
              // dataset in that list, so we need to allocate space for that list and then store the
              // dataset pointer in that list.

              var dsPtrsArray = Uint32Array.from([dataset]);

              var dsPtrsArrayPtr = Module._malloc(dsPtrsArray.length * dsPtrsArray.BYTES_PER_ELEMENT);

              Module.HEAPU32.set(dsPtrsArray, dsPtrsArrayPtr / dsPtrsArray.BYTES_PER_ELEMENT); // TODO: The last parameter is an int* that can be used to detect certain kinds of errors,
              // but I'm not sure how it works yet and whether it gives the same or different information
              // than CPLGetLastErrorType
              // We can get some error information out of the final pbUsageError parameter, which is an
              // int*, so malloc ourselves an int and set it to 0 (False)

              var usageErrPtr = Module._malloc(Int32Array.BYTES_PER_ELEMENT);

              Module.setValue(usageErrPtr, 0, 'i32'); // And then we can kick off the actual translation process.

              var newDatasetPtr = GDALVectorTranslate(filePath, 0, // Destination dataset, which we don't use, so pass NULL
                1, // nSrcCount, which must always be 1 https://gdal.org/api/gdal_utils.html
                dsPtrsArrayPtr, // This needs to be a list of input datasets
                translateOptionsPtr, usageErrPtr);
              var errorType = errorHandling.CPLGetLastErrorType(); // If we ever want to use the usage error pointer:
              // let usageErr = Module.getValue(usageErrPtr, 'i32');
              // The final set of cleanup we need to do, in a function to avoid writing it twice.

              function cleanUp() {
                Module.ccall('GDALVectorTranslateOptionsFree', null, ['number'], [translateOptionsPtr]);

                Module._free(usageErrPtr);

                Module._free(dsPtrsArrayPtr);

                params.deallocate();
              } // Check for errors; clean up and throw if error is detected


              if (errorType === errorHandling.CPLErr.CEFailure || errorType === errorHandling.CPLErr.CEFatal) {
                cleanUp();

                var _message = errorHandling.CPLGetLastErrorMsg();

                throw new Error('Error in GDALVectorTranslate: ' + _message);
              } else {
                var result = {
                  datasetPtr: newDatasetPtr,
                  filePath: filePath,
                  directory: directory,
                  filename: filename
                };
                cleanUp();
                return result;
              }
            };
          }

          module.exports = exports.default;

          /***/
        }),

/***/ "./src/wrappers/gdalWarp.js":
/*!**********************************!*\
  !*** ./src/wrappers/gdalWarp.js ***!
  \**********************************/
/***/ ((module, exports, __webpack_require__) => {



          Object.defineProperty(exports, "__esModule", ({
            value: true
          }));
          exports["default"] = _default;

          var _randomKey = _interopRequireDefault(__webpack_require__(/*! ../randomKey.js */ "./src/randomKey.js"));

          var _guessFileExtension = _interopRequireDefault(__webpack_require__(/*! ../guessFileExtension.js */ "./src/guessFileExtension.js"));

          var _stringParamAllocator = _interopRequireDefault(__webpack_require__(/*! ../stringParamAllocator.js */ "./src/stringParamAllocator.js"));

          function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

          /* global Module, FS, MEMFS */
          function _default(GDALWarp, errorHandling, rootPath) {
            // Args is expected to be an array of strings that could function as arguments to gdal_translate
            return function (dataset, args) {
              var params = new _stringParamAllocator["default"](args);
              params.allocate(); // Whew, all finished. argPtrsArrayPtr is now the address of the start of the list of
              // pointers in Emscripten heap space. Each pointer identifies the address of the start of a
              // parameter string, also stored in heap space. This is the direct equivalent of a char **,
              // which is what GDALWarpAppOptionsNew requires.

              var warpAppOptionsPtr = Module.ccall('GDALWarpAppOptionsNew', 'number', ['number', 'number'], [params.argPtrsArrayPtr, null]); // Validate that the options were correct

              var optionsErrType = errorHandling.CPLGetLastErrorType();

              if (optionsErrType === errorHandling.CPLErr.CEFailure || optionsErrType === errorHandling.CPLErr.CEFatal) {
                params.deallocate();
                var message = errorHandling.CPLGetLastErrorMsg();
                throw new Error('Error in GDALWarp: ' + message);
              }

              var directory = rootPath + (0, _randomKey["default"])();
              FS.mkdir(directory); // This makes it easier to remove later because we can just unmount rather than recursing
              // through the whole directory structure.

              FS.mount(MEMFS, {}, directory);
              var filename = (0, _randomKey["default"])(8) + '.' + (0, _guessFileExtension["default"])(args);
              var filePath = directory + '/' + filename; // And then we can kick off the actual warping process.
              // TODO: The last parameter is an int* that can be used to detect certain kinds of errors,
              // but I'm not sure how it works yet and whether it gives the same or different information
              // than CPLGetLastErrorType
              // We can get some error information out of the final pbUsageError parameter, which is an
              // int*, so malloc ourselves an int and set it to 0 (False)

              var usageErrPtr = Module._malloc(Int32Array.BYTES_PER_ELEMENT);

              Module.setValue(usageErrPtr, 0, 'i32'); // We also need a GDALDatasetH * list of datasets. Since we're just warping a single dataset
              // at a time, we don't need to do anything fancy here.

              var datasetListPtr = Module._malloc(4); // 32-bit pointer
              // Set datasetListPtr to the address of dataset


              Module.setValue(datasetListPtr, dataset, '*');
              var newDatasetPtr = GDALWarp(filePath, // Output
                0, // NULL because filePath is not NULL
                1, // Number of input datasets; this is always called on a single dataset
                datasetListPtr, warpAppOptionsPtr, usageErrPtr); // The final set of cleanup we need to do, in a function to avoid writing it twice.

              console.log('GDALWarp completed. ptr:', newDatasetPtr);
              try {
                var st = FS.stat(filePath);
                console.log('Output file exists. size:', st.size, 'path:', filePath);
              } catch (e) {
                console.error('Output file MISSING after GDALWarp:', filePath, e);
              }

              function cleanUp() {
                Module.ccall('GDALWarpAppOptionsFree', null, ['number'], [warpAppOptionsPtr]);

                Module._free(usageErrPtr);

                params.deallocate();
              }

              var errorType = errorHandling.CPLGetLastErrorType(); // If we ever want to use the usage error pointer:
              // let usageErr = Module.getValue(usageErrPtr, 'i32');
              // Check for errors; clean up and throw if error is detected

              if (errorType === errorHandling.CPLErr.CEFailure || errorType === errorHandling.CPLErr.CEFatal) {
                cleanUp();

                var _message = errorHandling.CPLGetLastErrorMsg();

                throw new Error('Error in GDALWarp: ' + _message);
              } else {
                var result = {
                  datasetPtr: newDatasetPtr,
                  filePath: filePath,
                  directory: directory,
                  filename: filename
                };
                cleanUp();
                return result;
              }
            };
          }

          module.exports = exports.default;

          /***/
        }),

/***/ "./src/wrappers/reproject.js":
/*!***********************************!*\
  !*** ./src/wrappers/reproject.js ***!
  \***********************************/
/***/ ((module, exports) => {



          Object.defineProperty(exports, "__esModule", ({
            value: true
          }));
          exports["default"] = _default;

          /* global Module */
          function _default(srcCRSStr, destCRSStr, xCoords, yCoords) {
            // This should never happen
            if (xCoords.length !== yCoords.length) {
              throw new Error('Got mismatched numbers of x and y coordinates.');
            }

            var OSRNewSpatialReference = Module.cwrap('OSRNewSpatialReference', 'number', ['string']);
            var OCTNewCoordinateTransformation = Module.cwrap('OCTNewCoordinateTransformation', 'number', ['number', 'number']); // Transform arrays of coordinates in-place
            // Params are:
            // 1. Coordinate transformation to use
            // 2. Number of coordinates to transform
            // 3. Array of X coordinates to transform
            // 4. Array of Y coordinates to transform
            // 5. Array of Z coordinates to transform

            var OCTTransform = Module.cwrap('OCTTransform', 'number', ['number', 'number', 'number', 'number', 'number']); // We need SRSes for the source and destinations of our transformation

            var sourceSrs = OSRNewSpatialReference(srcCRSStr);
            var targetSrs = OSRNewSpatialReference(destCRSStr); // Now we can create a CoordinateTransformation object to transform between the two

            var coordTransform = OCTNewCoordinateTransformation(sourceSrs, targetSrs); // And lastly, we can transform the Xs and Ys. This requires a similar malloc process to the
            // affine transform function, since the coordinates are transformed in-place

            var xCoordPtr = Module._malloc(xCoords.length * xCoords.BYTES_PER_ELEMENT);

            var yCoordPtr = Module._malloc(yCoords.length * yCoords.BYTES_PER_ELEMENT); // But this time we copy into the memory space from our external array


            Module.HEAPF64.set(xCoords, xCoordPtr / xCoords.BYTES_PER_ELEMENT);
            Module.HEAPF64.set(yCoords, yCoordPtr / yCoords.BYTES_PER_ELEMENT); // Z is null in this case. This transforms in place.

            OCTTransform(coordTransform, xCoords.length, xCoordPtr, yCoordPtr, null); // Pull out the coordinates

            var transXCoords = Array.from(Module.HEAPF64.subarray(xCoordPtr / xCoords.BYTES_PER_ELEMENT, xCoordPtr / xCoords.BYTES_PER_ELEMENT + xCoords.length));
            var transYCoords = Array.from(Module.HEAPF64.subarray(yCoordPtr / yCoords.BYTES_PER_ELEMENT, yCoordPtr / yCoords.BYTES_PER_ELEMENT + yCoords.length)); // Zip it all back up

            var returnVal = transXCoords.map(function (x, i) {
              return [x, transYCoords[i]];
            }); // Clear memory

            Module._free(xCoordPtr);

            Module._free(yCoordPtr);

            Module.ccall('OSRDestroySpatialReference', 'number', ['number'], [sourceSrs]);
            Module.ccall('OSRDestroySpatialReference', 'number', ['number'], [targetSrs]);
            Module.ccall('OCTDestroyCoordinateTransformation', 'number', ['number'], [coordTransform]);
            return returnVal;
          }

          module.exports = exports.default;

          /***/
        })

      /******/
    });
/************************************************************************/
/******/ 	// The module cache
/******/ 	var __webpack_module_cache__ = {};
/******/
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/ 		// Check if module is in cache
/******/ 		var cachedModule = __webpack_module_cache__[moduleId];
/******/ 		if (cachedModule !== undefined) {
/******/ 			return cachedModule.exports;
        /******/
      }
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = __webpack_module_cache__[moduleId] = {
/******/ 			// no module.id needed
/******/ 			// no module.loaded needed
/******/ 			exports: {}
        /******/
      };
/******/
/******/ 		// Execute the module function
/******/ 		__webpack_modules__[moduleId](module, module.exports, __webpack_require__);
/******/
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
      /******/
    }
    /******/
    /************************************************************************/
    var __webpack_exports__ = {};
    // This entry need to be wrapped in an IIFE because it need to be isolated against other modules in the chunk.
    (() => {
      /*!***********************!*\
        !*** ./src/worker.js ***!
        \***********************/


      var _gdalOpen = _interopRequireDefault(__webpack_require__(/*! ./wrappers/gdalOpen.js */ "./src/wrappers/gdalOpen.js"));

      var _gdalRasterize = _interopRequireDefault(__webpack_require__(/*! ./wrappers/gdalRasterize.js */ "./src/wrappers/gdalRasterize.js"));

      var _gdalClose = _interopRequireDefault(__webpack_require__(/*! ./wrappers/gdalClose.js */ "./src/wrappers/gdalClose.js"));

      var _gdalDatasetGetLayerCount = _interopRequireDefault(__webpack_require__(/*! ./wrappers/gdalDatasetGetLayerCount.js */ "./src/wrappers/gdalDatasetGetLayerCount.js"));

      var _gdalDemProcessing = _interopRequireDefault(__webpack_require__(/*! ./wrappers/gdalDemProcessing.js */ "./src/wrappers/gdalDemProcessing.js"));

      var _gdalGetRasterCount = _interopRequireDefault(__webpack_require__(/*! ./wrappers/gdalGetRasterCount.js */ "./src/wrappers/gdalGetRasterCount.js"));

      var _gdalGetRasterXSize = _interopRequireDefault(__webpack_require__(/*! ./wrappers/gdalGetRasterXSize.js */ "./src/wrappers/gdalGetRasterXSize.js"));

      var _gdalGetRasterYSize = _interopRequireDefault(__webpack_require__(/*! ./wrappers/gdalGetRasterYSize.js */ "./src/wrappers/gdalGetRasterYSize.js"));

      var _gdalGetRasterMinimum = _interopRequireDefault(__webpack_require__(/*! ./wrappers/gdalGetRasterMinimum.js */ "./src/wrappers/gdalGetRasterMinimum.js"));

      var _gdalGetRasterMaximum = _interopRequireDefault(__webpack_require__(/*! ./wrappers/gdalGetRasterMaximum.js */ "./src/wrappers/gdalGetRasterMaximum.js"));

      var _gdalGetRasterNoDataValue = _interopRequireDefault(__webpack_require__(/*! ./wrappers/gdalGetRasterNoDataValue.js */ "./src/wrappers/gdalGetRasterNoDataValue.js"));

      var _gdalGetRasterDataType = _interopRequireDefault(__webpack_require__(/*! ./wrappers/gdalGetRasterDataType.js */ "./src/wrappers/gdalGetRasterDataType.js"));

      var _gdalGetRasterStatistics = _interopRequireDefault(__webpack_require__(/*! ./wrappers/gdalGetRasterStatistics.js */ "./src/wrappers/gdalGetRasterStatistics.js"));

      var _gdalGetProjectionRef = _interopRequireDefault(__webpack_require__(/*! ./wrappers/gdalGetProjectionRef.js */ "./src/wrappers/gdalGetProjectionRef.js"));

      var _gdalGetGeoTransform = _interopRequireDefault(__webpack_require__(/*! ./wrappers/gdalGetGeoTransform.js */ "./src/wrappers/gdalGetGeoTransform.js"));

      var _gdalTranslate = _interopRequireDefault(__webpack_require__(/*! ./wrappers/gdalTranslate.js */ "./src/wrappers/gdalTranslate.js"));

      var _gdalVectorTranslate = _interopRequireDefault(__webpack_require__(/*! ./wrappers/gdalVectorTranslate.js */ "./src/wrappers/gdalVectorTranslate.js"));

      var _gdalWarp = _interopRequireDefault(__webpack_require__(/*! ./wrappers/gdalWarp.js */ "./src/wrappers/gdalWarp.js"));

      var _reproject = _interopRequireDefault(__webpack_require__(/*! ./wrappers/reproject.js */ "./src/wrappers/reproject.js"));

      function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

      function _toConsumableArray(arr) { return _arrayWithoutHoles(arr) || _iterableToArray(arr) || _unsupportedIterableToArray(arr) || _nonIterableSpread(); }

      function _nonIterableSpread() { throw new TypeError("Invalid attempt to spread non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); }

      function _iterableToArray(iter) { if (typeof Symbol !== "undefined" && iter[Symbol.iterator] != null || iter["@@iterator"] != null) return Array.from(iter); }

      function _arrayWithoutHoles(arr) { if (Array.isArray(arr)) return _arrayLikeToArray(arr); }

      function _createForOfIteratorHelper(o, allowArrayLike) { var it = typeof Symbol !== "undefined" && o[Symbol.iterator] || o["@@iterator"]; if (!it) { if (Array.isArray(o) || (it = _unsupportedIterableToArray(o)) || allowArrayLike && o && typeof o.length === "number") { if (it) o = it; var i = 0; var F = function F() { }; return { s: F, n: function n() { if (i >= o.length) return { done: true }; return { done: false, value: o[i++] }; }, e: function e(_e) { throw _e; }, f: F }; } throw new TypeError("Invalid attempt to iterate non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); } var normalCompletion = true, didErr = false, err; return { s: function s() { it = it.call(o); }, n: function n() { var step = it.next(); normalCompletion = step.done; return step; }, e: function e(_e2) { didErr = true; err = _e2; }, f: function f() { try { if (!normalCompletion && it["return"] != null) it["return"](); } finally { if (didErr) throw err; } } }; }

      function _unsupportedIterableToArray(o, minLen) { if (!o) return; if (typeof o === "string") return _arrayLikeToArray(o, minLen); var n = Object.prototype.toString.call(o).slice(8, -1); if (n === "Object" && o.constructor) n = o.constructor.name; if (n === "Map" || n === "Set") return Array.from(o); if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)) return _arrayLikeToArray(o, minLen); }

      function _arrayLikeToArray(arr, len) { if (len == null || len > arr.length) len = arr.length; for (var i = 0, arr2 = new Array(len); i < len; i++) { arr2[i] = arr[i]; } return arr2; }

      var DATASETPATH = '/';
      var initialized = false;
      var registry = {};
      var errorHandling = {
        // In order to make enums available from JS it's necessary to use embind, which seems like
        // overkill for something this small. But this is a replication of the CPLErr enum in
        // cpl_error.h
        CPLErr: {
          CENone: 0,
          CEDebug: 1,
          CEWarning: 2,
          CEFailure: 3,
          CEFatal: 4
        },
        // These will be populated by onRuntimeInitialized, below
        CPLErrorReset: null,
        CPLGetLastErrorMsg: null,
        CPLGetLastErrorNo: null,
        CPLGetLastErrorType: null
      };
      self.Module = Object.assign(self.Module || {}, {
        print: function print(text) {
          console.log('stdout: ' + text);
        },
        printErr: function printErr(text) {
          console.log('stderr: ' + text);
        },
        // Optimized builds contain a .js.mem file which is loaded asynchronously;
        // this waits until that has finished before performing further setup.
        onRuntimeInitialized: function onRuntimeInitialized() {
          // Initialize GDAL
          self.Module.ccall('GDALAllRegister', null, [], []); // Set up error handling

          errorHandling.CPLErrorReset = self.Module.cwrap('CPLErrorReset', null, []);
          errorHandling.CPLGetLastErrorMsg = self.Module.cwrap('CPLGetLastErrorMsg', 'string', []);
          errorHandling.CPLGetLastErrorNo = self.Module.cwrap('CPLGetLastErrorNo', 'number', []);
          errorHandling.CPLGetLastErrorType = self.Module.cwrap('CPLGetLastErrorType', 'number', []); // Get a "function pointer" to the built-in quiet error handler so that errors don't
          // cause tons of console noise.

          var cplQuietFnPtr = addFunction(self.Module.cwrap('CPLQuietErrorHandler', null, ['number', 'number', 'string']), 'viii'); // Then set the error handler to the quiet handler.

          self.Module.ccall('CPLSetErrorHandler', 'number', ['number'], [cplQuietFnPtr]); // Set up JS proxy functions
          // Note that JS Number types are used to represent pointers, which means that
          // any time we want to pass a pointer to an object, such as in GDALOpen, which in
          // C returns a pointer to a GDALDataset, we need to use 'number'.
          //

          registry.GDALOpen = (0, _gdalOpen["default"])(self.Module.cwrap('GDALOpenEx', 'number', ['string', // Filename
            'number', // nOpenFlags
            'number', // NULL-terminated list of drivers to limit to when opening file
            'number', // NULL-terminated list of option flags passed to drivers
            'number' // Paths to sibling files to avoid file system searches
          ]), errorHandling, DATASETPATH);
          registry.GDALRasterize = (0, _gdalRasterize["default"])(self.Module.cwrap('GDALRasterize', 'number', ['string', // Destination dataset path or NULL
            'number', // GDALDatasetH destination dataset or NULL
            'number', // GDALDatasetH source dataset or NULL
            'number', // GDALRasterizeOptions * or NULL
            'number' // int * to use for error reporting
          ]), errorHandling, DATASETPATH);
          registry.GDALClose = (0, _gdalClose["default"])(self.Module.cwrap('GDALClose', 'number', ['number']), errorHandling);
          registry.GDALGetRasterCount = (0, _gdalGetRasterCount["default"])(self.Module.cwrap('GDALGetRasterCount', 'number', ['number']), errorHandling);
          registry.GDALDatasetGetLayerCount = (0, _gdalDatasetGetLayerCount["default"])(self.Module.cwrap('GDALDatasetGetLayerCount', 'number', ['number']), errorHandling);
          registry.GDALGetRasterXSize = (0, _gdalGetRasterXSize["default"])(self.Module.cwrap('GDALGetRasterXSize', 'number', ['number']), errorHandling);
          registry.GDALGetRasterYSize = (0, _gdalGetRasterYSize["default"])(self.Module.cwrap('GDALGetRasterYSize', 'number', ['number']), errorHandling);
          registry.GDALGetRasterMinimum = (0, _gdalGetRasterMinimum["default"])(self.Module.cwrap('GDALGetRasterMinimum', 'number', ['number']), errorHandling);
          registry.GDALGetRasterMaximum = (0, _gdalGetRasterMaximum["default"])(self.Module.cwrap('GDALGetRasterMaximum', 'number', ['number']), errorHandling);
          registry.GDALGetRasterNoDataValue = (0, _gdalGetRasterNoDataValue["default"])(self.Module.cwrap('GDALGetRasterNoDataValue', 'number', ['number']), errorHandling);
          registry.GDALGetRasterDataType = (0, _gdalGetRasterDataType["default"])(self.Module.cwrap('GDALGetRasterDataType', 'number', ['number']), errorHandling);
          registry.GDALGetRasterStatistics = (0, _gdalGetRasterStatistics["default"])(self.Module.cwrap('GDALGetRasterStatistics', 'number', ['number']), errorHandling);
          registry.GDALGetProjectionRef = (0, _gdalGetProjectionRef["default"])(self.Module.cwrap('GDALGetProjectionRef', 'string', ['number']), errorHandling);
          registry.GDALGetGeoTransform = (0, _gdalGetGeoTransform["default"])(self.Module.cwrap('GDALGetGeoTransform', 'number', ['number', 'number']), errorHandling);
          registry.GDALTranslate = (0, _gdalTranslate["default"])(self.Module.cwrap('GDALTranslate', 'number', ['string', // Output path
            'number', // GDALDatasetH source dataset
            'number', // GDALTranslateOptions *
            'number' // int * to use for error reporting
          ]), errorHandling, DATASETPATH); // Equivalent to ogr2ogr

          registry.GDALVectorTranslate = (0, _gdalVectorTranslate["default"])(self.Module.cwrap('GDALVectorTranslate', 'number', ['string', // Output path or NULL
            'number', // Destination dataset or NULL
            'number', // Number of input datasets (only 1 is supported)
            'number', // GDALDatasetH * list of source datasets
            'number', // GDALVectorTranslateOptions *
            'number' // int * to use for error reporting
          ]), errorHandling, DATASETPATH);
          registry.GDALWarp = (0, _gdalWarp["default"])(self.Module.cwrap('GDALWarp', 'number', ['string', // Destination dataset path or NULL
            'number', // GDALDatasetH destination dataset or NULL
            'number', // Number of input datasets
            'number', // GDALDatasetH * list of source datasets
            'number', // GDALWarpAppOptions *
            'number' // int * to use for error reporting
          ]), errorHandling, DATASETPATH);
          registry.GDALDEMProcessing = (0, _gdalDemProcessing["default"])(self.Module.cwrap('GDALDEMProcessing', 'number', ['string', // Destination dataset path or NULL
            'number', // GDALDatasetH destination dataset
            // eslint-disable-next-line max-len
            'string', // The processing to apply (one of "hillshade", "slope", "aspect", "color-relief", "TRI", "TPI", "roughness")
            'string', // Color file path (when previous is "hillshade") or NULL (otherwise)
            'number', // GDALDEMProcessingOptions *
            'number' // int * to use for error reporting
          ]), errorHandling, DATASETPATH);

          registry.LoamFlushFS = function () {
            var datasetFolders = FS.lookupPath(DATASETPATH).node.contents;
            Object.values(datasetFolders).forEach(function (node) {
              FS.unmount(FS.getPath(node));
              FS.rmdir(FS.getPath(node));
            });
            return true;
          };

          registry.LoamReproject = _reproject["default"]; // Errors in this function will result in onerror() being called in the main thread, which
          // will reject the initialization promise and tear down the worker, so there's no need to do
          // separate error handling here -- if something goes wrong prior to this point, it's
          // presumably fatal.

          initialized = true;
          postMessage({
            ready: true
          });
        }
      });

      function handleDatasetAccess(accessor, dataset, args) {
        // [DEBUG] Log Source Metadata
        if (dataset.source && dataset.source.func) {
          // ... existing logging or skip if already verified ...
        }

        // 1: Open the source.
        var srcDs = registry[dataset.source.func](dataset.source.src, dataset.source.args, dataset.source.sidecars);
        var resultDs = srcDs;

        // [DEBUG] Log Source Metadata (retained for safety)
        if (srcDs && srcDs.datasetPtr) {
          try {
            // Check Size
            var w = Module.ccall('GDALGetRasterXSize', 'number', ['number'], [srcDs.datasetPtr]);
            var h = Module.ccall('GDALGetRasterYSize', 'number', ['number'], [srcDs.datasetPtr]);
            console.log('Source Dataset Size:', w, 'x', h);

            // Check Projection
            var proj = Module.ccall('GDALGetProjectionRef', 'string', ['number'], [srcDs.datasetPtr]);
            console.log('Source Projection:', proj);

            // Check GeoTransform
            var transformPtr = Module._malloc(6 * 8); // 6 doubles * 8 bytes
            Module.ccall('GDALGetGeoTransform', 'number', ['number', 'number'], [srcDs.datasetPtr, transformPtr]);
            var transform = [];
            for (var i = 0; i < 6; i++) transform.push(Module.getValue(transformPtr + i * 8, 'double'));
            Module._free(transformPtr);
            console.log('Source GeoTransform:', transform);
          } catch (e) {
            // console.error('Failed to log source metadata:', e);
          }
        }

        var _iterator = _createForOfIteratorHelper(dataset.operations), _step;

        try {
          for (_iterator.s(); !(_step = _iterator.n()).done;) {
            var _step$value = _step.value,
              op = _step$value.func,
              _args = _step$value.args;

            // Execute operation
            resultDs = registry[op](srcDs.datasetPtr, _args);

            // Cleanup previous dataset (srcDs)
            // We do NOT read it, just close and cleanup.
            try {
              // Only close if it's not the same as resultDs (which shouldn't happen in Warp chain)
              // and if it's not the initial dataset? Logic says close srcDs.
              registry.GDALClose(srcDs.datasetPtr, srcDs.directory, srcDs.filePath);
            } catch (e) { console.warn('Ignored GDALClose error on intermediate:', e); }

            srcDs = resultDs;
          }
        } catch (err) {
          _iterator.e(err);
        } finally {
          _iterator.f();
        }

        // Final Result Retrieval
        // We MUST close the dataset to flush it to disk before reading.
        // registry.GDALClose(ptr, dir, path, true) does exactly: Close -> Read -> Unmount/Delete -> Return Bytes/Result
        var finalResult = null;
        try {
          // Pass 'true' as 4th arg to get file bytes
          console.log('Finalizing result: Closing and reading...');
          finalResult = registry.GDALClose(resultDs.datasetPtr, resultDs.directory, resultDs.filePath, true);
          console.log('Result retrieved, size:', finalResult ? finalResult.byteLength : 'null');
        } catch (e) {
          console.error('Failed to retrieve final result:', e);
          throw e;
        }

        return finalResult;
      } // Handle function call


      function handleFunctionCall(func, args) {
        if (func in registry) {
          return registry[func].apply(registry, _toConsumableArray(args));
        }

        throw new Error("Function ".concat(func, " was not found"));
      }

      onmessage = function onmessage(msg) {
        if (!initialized) {
          postMessage({
            success: false,
            message: 'Runtime not yet initialized',
            id: msg.data.id
          });
          return;
        }

        try {
          var result;

          if ('func' in msg.data && 'args' in msg.data) {
            result = handleFunctionCall(msg.data.func, msg.data.args);
          } else if ('accessor' in msg.data && 'dataset' in msg.data) {
            result = handleDatasetAccess(msg.data.accessor, msg.data.dataset, msg.data.args);
          } else {
            postMessage({
              success: false,
              message: // eslint-disable-next-line max-len
                'Worker could not parse message: either func + args or accessor + dataset is required',
              id: msg.data.id
            });
            return;
          }

          postMessage({
            success: true,
            result: result,
            id: msg.data.id
          });
        } catch (error) {
          postMessage({
            success: false,
            message: error.message,
            id: msg.data.id
          });
        }
      };
    })();

/******/ 	return __webpack_exports__;
    /******/
  })()
    ;
});
//# sourceMappingURL=loam-worker.js.map