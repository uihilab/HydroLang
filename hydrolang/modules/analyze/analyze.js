/**
 * Module for performing data analysis.
 * All the functions and the components are on a 3rd level chaining.
 * @module analyze
 * @extends stats
 * @extends hydro
 * @extends nn
 * @extends floodDM
 */
import stats from "./components/stats.js";
import hydro from "./components/hydro.js";
import nn from "./components/nn.js";
import floodDM from "./components/floodDM.js"

export default class Analyze {
    constructor(components = ['stats', 'hydro', 'nn', 'floodDM']) {
        if (components.includes('stats')) {
            this.stats = stats;
        }
        if (components.includes('hydro')) {
            this.hydro = hydro;
        }
        if (components.includes('nn')) {
            this.nn = nn;
        }
        if (components.includes('floodDM')) {
            this.floodDM = new floodDM();
        }
    }
}
