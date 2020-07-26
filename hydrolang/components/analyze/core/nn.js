import "../../../modules/tensorflow/tensorflow.js";

export default class nn {
    /**
     * Neural network sequential model creator. Depends solely on the type
     * of problem that the user is trying to solve and should be used accordingly.
     * @param {number} numinputs - number of data inputs. 
     * @param {number} numneurons - number of total neurons in the hidden layer.
     * @param {number} numoutputs - number of neuron ouputs.
     * @returns {Object} model created based on the specifications.
     */
  static createModel(numinputs, numneurons, numoutputs) {
    const model = tf.sequential();

    //Add input layer considering only 1 input layer for the training.
    model.add(
      tf.layers.dense({
        inputShape: [numinputs],
        units: numneurons,
        useBias: true,
        activation: "sigmoid",
      })
    );

    //Add output layer considering only 1 output layer for the training.
    model.add(tf.layers.dense({ units: numoutputs, useBias: true }));

    //print the model
    model.summary();
    return model;
  }
  
  /**
   * converts data serving as input for either training or calculations into tensors.
   * @param {Object[]} arr1 - arrays that serve as inputs. 
   * @param {Object[]} arr2 - array that serve as outputs.
   * @returns {Object} object with minmax of data as well as the arrays converted into tensors.
   */
  static convertToTensor(arr1, arr2) {
    return tf.tidy(() => {
      // Shuffling the data.
      tf.util.shuffle(arr1);
      tf.util.shuffle(arr2);

      //Convert the data to tensors.
      const inputs = arr1.flatmap((d) => d);
      const outputs = arr2.flatmap((d) => d);

      const inputTensor = tf.tensor1d(inputs, [inputs.length, 1]);
      const outputTensor = tf.tensor1d(outputs, [outputs.length, 1]);

      //normalizing the data between range 0 - 1.
      const inputMax = inputTensor.max();
      const inputMin = inputTensor.min();
      const outputMax = outputTensor.max();
      const outputMin = outputTensor.min();

      const normalizedInputs = inputTensor
        .sub(inputMin)
        .div(inputMax.sub(inputMin));
      const normalizedOutputs = outputTensor
        .sub(outputMin)
        .div(outputMax.sub(outputMin));

      return {
        inputs: normalizedInputs,
        outputs: normalizedOutputs,

        //return the min and max bounds to use afterwards.
        inputMax,
        inputMin,
        outputMax,
        outputMin,
      };
    });
  }

  /**
   * trains the model given inputs and ouputs of training data. Generates weights for each expected outcome. 
   * The model can also be saved if required.
   * @param {Object} model - created previously. 
   * @param {Object[]} inputs - array of inputs that are already converted into tensors. 
   * @param {Object[]} outputs - array of outputs that are already converted into tensors.
   * @returns {Object} trained model. 
   */
  static async trainModel(model, inputs, outputs) {
    model.compile({
      loss: "meanSquaredError",
      optimizer: "adam",
      metrics: ["mse"],
    });

    const batchsize = 32;
    const epochs = 100;

    return await model.fit(inputs, outputs, {
      batchsize,
      epochs,
      shuffle: true,
      callbacks: tfvis.show.fitCallbacks(
        { name: "Training Performance" },
        ["loss", "mse"],
        { height: 200, callbacks: ["onEpochEnd"] }
      ),
    });
  }

  /**
   * 
   * @param {Object} model - pretrained model.
   * @param {Object[]} inputData - inputdata already converted into tensors. 
   * @param {Object} normalizedData - minmax for both inputs and outputs.
   * @returns {Object} object with predictions, visually rendered too. 
   */
  static prediction(model, inputData, normalizedData) {
    const { inputMax, inputMin, outputMin, outputMax } = normalizedData;

    const [xs, preds] = tf.tidy(() => {
      const xs = tf.linspace(0, 1, 100);
      const preds = model.predict(xs.reshape([100, 1]));

      const unNormXs = xs.mul(inputMax.sub(inputMin)).add(inputMin);

      const unNormPreds = preds.mul(outputMax.sub(outputMin)).add(outputMin);

      return [unNormXs.dataSync(), unNormPreds.dataSync()];
    });

    const predictedPoints = Array.from(xs).map((val, i) => {
      return { x: val, y: preds[i] };
    });

    const originalPoints = inputData.map((d) => ({
      x: d.inputs,
      y: d.outputs,
    }));

    tfvis.render.scatterplot(
      { name: "Model predictions vs Origina Data" },
      {
        values: [originalPoints, predictedPoints],
        series: ["original", "predicted"],
      },
      {
        xLabel: "Hello",
        yLaber: "New Hello",
        height: 300,
      }
    );
  }
}
