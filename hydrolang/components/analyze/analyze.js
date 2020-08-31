/**
 * Module for performing data analysis.
 * All the functions and the components are on a 3rd level chaining.
 * @module analyze
 * @extends stats
 * @extends hydro
 * @extends nn
 */
import stats from './core/stats.js';
import hydro from './core/hydro.js';
import nn from './core/nn.js'

export {
    stats,
    hydro,
    nn
};