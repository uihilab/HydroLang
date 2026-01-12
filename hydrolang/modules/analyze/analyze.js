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
import geoprocessor from "./components/geoprocessor.js";

export default class Analyze {
    constructor(components = ['stats', 'hydro', 'nn', 'geoprocessor']) {
        if (components.includes('stats')) {
            this.stats = stats;
        }
        if (components.includes('hydro')) {
            this.hydro = hydro;
        }
        if (components.includes('nn')) {
            this.nn = nn;
        }
        if (components.includes('geoprocessor')) {
            this.geoprocessor = geoprocessor;
        }
    }

    /**
     * Dynamically loads the floodDM component.
     * @returns {Promise<Object>} The floodDM instance.
     */
    async loadFloodDM() {
        try {
            const module = await import(/* webpackChunkName: "floodDM" */ "./components/floodDM.js");
            this.floodDM = new module.default();
            return this.floodDM;
        } catch (error) {
            console.error("Failed to load floodDM module:", error);
            throw error;
        }
    }
}
