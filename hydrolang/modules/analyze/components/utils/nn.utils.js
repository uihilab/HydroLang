import "../../../external/tensorflow/tensorflow.js";

/**
 * Utility class for Neural Network data processing.
 * @class
 * @name nnUtils
 */
export default class nnUtils {
    /**
     * Recursively flattens an n-dimensional array.
     * @param {Array} data - The nested array to flatten.
     * @returns {Array} A flat array.
     */
    static flattenND(data) {
        if (!Array.isArray(data)) return [data];
        return data.reduce((acc, val) => acc.concat(nnUtils.flattenND(val)), []);
    }

    /**
     * Converts an image (HTMLImageElement, Canvas, or pixel array) to a 4D Tensor.
     * Useful for CNN inputs.
     * @param {Object} params - { image, width, height, channels }
     * @returns {tf.Tensor4D} Tensor of shape [1, height, width, channels]
     */
    static imgToTensor({ image, width, height, channels = 3 } = {}) {
        return tf.tidy(() => {
            if (image instanceof HTMLImageElement || image instanceof HTMLCanvasElement) {
                return tf.browser.fromPixels(image, channels).expandDims(0).toFloat().div(255.0);
            } else if (Array.isArray(image) || image instanceof Float32Array) {
                // Flatten if nested
                const flatData = Array.isArray(image) ? nnUtils.flattenND(image) : image;
                return tf.tensor(flatData, [1, height, width, channels]);
            } else {
                throw new Error("Unsupported image format");
            }
        });
    }

    /**
     * Converts 2D grid data (e.g., from GRIB2/Zarr decoders) to a Tensor.
     * Can handle adding a channel dimension if needed (e.g., for CNNs).
     * @param {Object} params - { data, rows, cols }
     * @returns {tf.Tensor} Tensor of shape [1, rows, cols, 1]
     */
    static gridToTensor({ data, rows, cols } = {}) {
        return tf.tidy(() => {
            // Ensure data is a flat array or typed array
            const flatData = Array.isArray(data) ? nnUtils.flattenND(data) : data;
            const tensor = tf.tensor(flatData, [1, rows, cols, 1]);
            // Normalize? Maybe leave that to the user or add a flag
            return tensor;
        });
    }

    /**
     * Prepares time-series data for LSTM (Samples, TimeSteps, Features).
     * @param {Object} params - { data, windowSize }
     * @returns {Object} { inputs, outputs } tensors
     */
    static seriesToTensor({ data, windowSize } = {}) {
        return tf.tidy(() => {
            // If data is nested (e.g. array of arrays), flatten it first? 
            // Actually, for seriesToTensor, we usually expect a 1D sequence or 2D [steps, features]
            // If it's 1D, we slice it. If it's 2D, we might need different logic.
            // For now, let's assume 1D sequence for simple windowing.
            const flatData = Array.isArray(data) && Array.isArray(data[0]) ? nnUtils.flattenND(data) : data;

            const X = [];
            const y = [];
            for (let i = 0; i < flatData.length - windowSize; i++) {
                X.push(flatData.slice(i, i + windowSize));
                y.push(flatData[i + windowSize]);
            }
            return {
                inputs: tf.tensor(X), // [samples, windowSize, features] (if data is 1D, features=1)
                outputs: tf.tensor(y)
            };
        });
    }
}
