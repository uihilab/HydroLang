import googlecharts, {isGooglechartsLoaded} from '../../modules/googlecharts/googlecharts.js';

/**
 * Brief summary of what this function does
 * @param {example data type} example description
 * @returns {example data type} example description
 * @example
 * example usage code here
 */
function chart(params) {
	ensureGoogleChartsIsSet().then(function(){
		var data = googlecharts.visualization.arrayToDataTable(params['data']);
		var chart = new chartMap[params['chartType']](document.getElementById(params['divID']));
		chart.draw(data);
	});

	return "A chart is drawn based on given parameters";
}

/**
 * Brief summary of what this function does
 * @param {example data type} example description
 * @returns {example data type} example description
 * @example
 * example usage code here
 */
function table(params) {
	return "table function is called";
}

export{
	chart,
	table
}


/***************************/
/*** Supporting functions **/
/***************************/

// Chart types of Google Charts
var chartMap;

function ensureGoogleChartsIsSet() {
    return new Promise(function (resolve, reject) {
        (function waitForGoogle(){
            if (isGooglechartsLoaded){ 
				chartMap = {
				  "bar": googlecharts.visualization.BarChart,
				  "pie": googlecharts.visualization.PieChart,
				  // ...
				};
            	return resolve();
            }
            setTimeout(waitForGoogle, 30);
        })();
    });
}

/**********************************/
/*** End of Supporting functions **/
/**********************************/