import "../../../external/tensorflow/tensorflow.js";

/**
 * Main class for the creation of machine learning models using Tensorflow.
 * @class nn
 */
export default class nn {
  /**
   * Neural network sequential model creator. Depends solely on the type
   * of problem that the user is trying to solve and should be used accordingly.
   * @method createModel
   * @memberof nn
   * @param {Object} params - Contains: numinputs (data inputs), numneurons (total hidden layer neurons), numoutputs (neuron outputs)
   * @returns {Object} Model created based on the specifications.
   * @example
   * hydro.analyze.nn.createModel({params: {numinputs: 30, numneurons: 11, numoutputs:50})
   */

  static createModel({ params, args, data } = {}) {
    var numinputs = params.inputs;
    var numneurons = params.neurons;
    var numoutputs = params.outputs;
    const model = tf.sequential();

    //Add input layer considering only 1 input layer for the training.
    model.add(
      tf.layers.dense({
        inputShape: [numinputs],
        units: numinputs,
      })
    );

    //Create a 1 layer of convolutioned neurons
    /*model.add(
      tf.layers.conv1d({
        kernelSize: 2,
        filters: 128,
        strides: 1,
        use_bias: true,
        activation: "relu",
        kernelInitializer: 'VarianceScaling'
      })
    );*/

    model.add(
      tf.layers.dense({
        units: numneurons,
        useBias: true,
        activation: "sigmoid",
      })
    );

    //Add average pooling layer
    /*model.add(
      tf.layers.averagePooling1d({
        poolSize: [numinputs],
        strides: [1]
      })
    );*/

    //flatten the lalayters and reshape the input to (number of samples, number of features)
    /*model.add(
      tf.layers.flatten({})
    );*/

    //Add output layer considering only 1 output layer for the training.
    model.add(
      tf.layers.dense({
        units: numoutputs,
        useBias: true,
        activation: "sigmoid",
      })
    );

    //print the model
    return model;
  }

  /**
   * Converts data serving as input for either training or calculations into Tensorflow tensors.
   * @method convertToTensor
   * @memberof nn
   * @param {Object} data - Contains: 2d-JS array with inputs and outputs as [[inputs], [outputs]]
   * @returns {Object} Object with minmax of data as well as the arrays converted into tensors.
   * @example
   * hydro.analyze.nn.convertToTensor({data: [[inputs],[outputs]]})
   */

  static convertToTensor({ params, args, data } = {}) {
    var arr1 = data[0];
    var arr2 = data[1];
    return tf.tidy(() => {
      //Convert the data to tensors.
      /*const inputs = arr1.map((d) => d);
      const outputs = arr2.map((d) => d);*/

      const inputTensor = tf.tensor1d(arr1).reshape([1, arr1.length]);
      const outputTensor = tf.tensor1d(arr2).reshape([1, arr2.length]);

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
        inputMax: inputMax,
        inputMin: inputMin,
        outputMax: outputMax,
        outputMin: outputMin,
      };
    });
  }

  /**
   * Trains the model given inputs and ouputs of training data. Generates weights for each expected outcome.
   * The model can be saved in local storage using the save model function.
   * The compilation is donw using loss function binary Cross entropy, ADAM optimizer and MSE for evaluation metric.
   * @method trainModel
   * @memberof nn
   * @param {Object} params - Contains: model (from createModel function)
   * @param {Object} args - Contains: epochs (1-1000), lr (learning rate between 0-0.2), batch (size depending on inputs/output ratio)
   * @param {Object} data - Contains: 2d-JS array containing the normalized TF arrays for input and output as [[inputs], [outputs]]
   * @returns {Object} Trained model.
   * @example
   * hydro.analyze.nn.trainModel({params:{model: model}, args: {epochs: 'someNum', lr: 'someNum', batch: 'someNum'},
   * data: [[inputs, outputs]]})
   */

  static async trainModel({ params, args, data } = {}) {
    //Grabbing data from the parameters
    var model = params.model;
    var inputs = data[0];
    var outputs = data[1];

    //Grabbing data from the arguments
    var epochs = args.epochs;
    var learningrate = args.lr;
    var batch = args.batch;

    //temporary solution for the split method to be fixed on the tf.js backend.
    tf.env().set("WEBGL_CPU_FORWARD", false);

    model.compile({
      loss: "binaryCrossentropy",
      optimizer: "adam",
      metrics: ["mse"],
      lr: learningrate,
    });

    const batchsize = batch;

    return await model.fit(inputs, outputs, {
      batchsize,
      epochs: epochs,
      shuffle: true,
      callbacks: tfvis.show.fitCallbacks(
        {
          name: "Training Performance",
        },
        ["loss", "mse"],
        {
          height: 200,
          callbacks: ["onEpochEnd"],
        }
      ),
    });
  }

  /**
   * Given a trained model, uses it for calculating outputs based on raw data.
   * The data is fed as input on the parameters and needs to be of the same size as the
   * training data. The input data needs to be converted into a TS tensor (array) previous
   * to be fed. The function also requires the minmax of the outputs.
   * @method prediction
   * @memberof nn
   * @param {Object} params - Contains: model (pretrained)
   * @param {Object} args - Contains: outputMin (Minimum value of observation), outputMax (Maximum value of observation)
   * @param {Object} data - Contains: 1d-JS array with inputs for model outcome as [inputs]
   * @returns {Object} Object with predictions as array. It also renders to screen.
   * @example
   * hydro.analyze.nn.prediction({params: {model: model}, args: {outputMin: 'someValue', outputMax: 'someValue'},
   * data: [inputs]})
   */

  static prediction({ params, args, data } = {}) {
    //Grab the data from the arguments.
    var model = params.model;
    var inputs = data;
    var outputMin = args.outputMin;
    var outputMax = args.outputMax;
    //Create prediction from model and inputs.
    const predictedPoints = model.predict(inputs);
    //The predictions are normalized, unnormalizing step.
    const unNormPreds = predictedPoints
      .mul(outputMax.sub(outputMin))
      .add(outputMin);
    return Array.from(unNormPreds.dataSync());
  }

  /**
   * Function for downloading a model that is already trained. It is saved in
   * the user's download folder.
   * @method saveModel
   * @memberof nn
   * @param {Object} params - Contains: model (pretrained), name (name for the model)
   * @returns {Object} saved model on local storage.
   * @example
   * hydro.analyze.nn.saveModel({params: {model: model, name: 'someName'}})
   */

  static async saveModel({ params, args, data } = {}) {
    var model = params.model;
    var name = params.name;
    await model.save(`downloads://${name}`);
  }
}