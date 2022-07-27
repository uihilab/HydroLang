import "../../../modules/tensorflow/tensorflow.js";

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
   * @param {number} numinputs - number of data inputs. 
   * @param {number} numneurons - number of total neurons in the hidden layer.
   * @param {number} numoutputs - number of neuron ouputs.
   * @returns {Object} model created based on the specifications.
   * @example var model = hydro1.analyze.nn.createModel(30, 11, 50)
   */

  static createModel(numinputs, numneurons, numoutputs) {
    const model = tf.sequential();

    //Add input layer considering only 1 input layer for the training.
    model.add(
      tf.layers.dense({
        inputShape: [numinputs],
        units: numinputs
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
        activation: "sigmoid"
      })
    )

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
        activation: "sigmoid"
      })
    );

    //print the model
    console.timeEnd("nnmodel");
    return model;
  }

  /**
   * Converts data serving as input for either training or calculations into Tensorflow tensors.
   * @method convertToTensor
   * @memberof nn
   * @param {Object[]} arr1 - arrays that serve as inputs. 
   * @param {Object[]} arr2 - array that serve as outputs.
   * @returns {Object} object with minmax of data as well as the arrays converted into tensors.
   * @example var tensordata = hydro1.analyze.nn.convertToTensor([inputs], [outputs]])
   */

  static convertToTensor(arr1, arr2) {
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

      console.timeEnd("tensors");
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
   * The model can also be saved if required.
   * @method trainModel
   * @memberof nn
   * @param {Object} model - created previously. 
   * @param {Object[]} inputs - array of inputs that are already converted into tensors. 
   * @param {Object[]} outputs - array of outputs that are already converted into tensors.
   * @param {number} epochs - number of repetitions the algoritm should do through the dataset.
   * @param {number} learningrate - value between 0 - 0.2. 
   * @param {number} batchsize - value of the training 
   * @returns {Object} trained model. 
   */

  static async trainModel(model, inputs, outputs, epochs, learningrate, batch) {
    //temporary solution for the split method to be fixed on the tf.js backend.
    tf.env().set('WEBGL_CPU_FORWARD', false)


    model.compile({
      loss: "binaryCrossentropy",
      optimizer: "adam",
      metrics: ["mse"],
      lr: learningrate
    });

    const batchsize = batch;

    console.timeEnd("trainmodel");
    return await model.fit(inputs, outputs, {
      batchsize,
      epochs: epochs,
      shuffle: true,
      callbacks: tfvis.show.fitCallbacks({
          name: "Training Performance"
        },
        ["loss", "mse"], {
          height: 200,
          callbacks: ["onEpochEnd"]
        }
      ),
    });
  }

  /**
   * Given a trained model, uses it for calculating outputs based on raw data.
   * @method prediction
   * @memberof nn
   * @param {Object} model - pretrained model.
   * @param {Object[]} inputData - inputdata already converted into tensors. 
   * @param {Object} observed - minmax for both inputs and outputs.
   * @returns {Object} object with predictions, visually rendered too. 
   */

  static prediction(model, inputs, outputMin, outputMax) {

    const predictedPoints = model.predict(inputs);

    const unNormPreds = predictedPoints.mul(outputMax.sub(outputMin)).add(outputMin)

    console.timeEnd("predict");
    return Array.from(unNormPreds.dataSync());
  }

  /**
   * Function for downloading a model that is already trained. It is saved in
   * download folder of the user.
   * @method savemodel
   * @memberof nn
   * @param {Object} model - pretrained model.
   * @param {String} name - name of model to be saved.
   * @returns {Object} saved model on local storage.
   */

  static async savemodel(model, name) {
    await model.save(`downloads://${name}`);
  }
}