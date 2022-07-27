/**
 * Module for performing data analysis.
 * All the functions and the components are on a 3rd level chaining.
 * @module analyze
 * @extends stats
 * @extends hydro
 * @extends nn
 */
import stats from './components/stats.js';
import hydro from './components/hydro.js';
import nn from './components/nn.js'

export {
    stats,
    hydro,
    nn
};