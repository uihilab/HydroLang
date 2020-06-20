// Static functions are used after 3rd level of chaining.
// Add only static functions which does not rely on data
// stored on objects, i.e. only uses the data that is
// given to the function as a parameter 
import stats from './core/stats.js';
import hydro from './core/hydro.js';

export {
    stats,
    hydro
};