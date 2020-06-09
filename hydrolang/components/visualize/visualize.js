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
		var d = params['data'];
		var char = params['chartType'];
		var data;

		switch (char) {
			case 'bar' || 'pie':
				data = googlecharts.visualization.arrayToDataTable(d);
				break;
			case 'line' || 'scatter':
				data = new tableData['data']();
				for (var i = 0; i < d[0].length; i++){
					data.addColumn('number', [d[0][i]]);
				};
				for (var j = 0; j < d[1][0].length;j++){
				data.addRow([d[1][0][j], d[1][1][j]]);
				}
				break;
			default:
				break;
		}
		var chart = new chartMap[params['chartType']](document.getElementById(params['divID']));
		if (params.hasOwnProperty('options')) {
			var options = params['options'];
			chart.draw(data,options);
		} else {
			chart.draw(data);
		};
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
	ensureGoogleChartsIsSet().then(function(){
		var d = params['data'];
		var types = params['dataType'];
		var data = new tableData['data']();
		var temp = [];
		
		for (var k = 0; k < d[0].length; k++){
			data.addColumn(params['dataType'][k], [d[0][k]]);
		};
		
		for (var i = 0; i < d[1].length;i++){
			if (typeof temp[i] == 'undefined'){
				temp[i] = [];
			};
			for (var l = 0; l < d[1][0].length; l++){
				temp[i][l] = d[1][i][l];
			};
		};

		data.addRows(temp);

		/*for (var n = 0; n < temp.length;n++){
			data.addRows(temp[n]);
		};
		*/

		var view = new tableData['view'](data)
		var table = new tableData['table'](document.getElementById(params['divID']));
		
		if (params.hasOwnProperty('options')) {
			var options = params['options'];
			table.draw(view,options);
		} else {
			table.draw(view);
		};
	});
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
var tableData;

function ensureGoogleChartsIsSet() {
    return new Promise(function (resolve, reject) {
        (function waitForGoogle(){
            if (isGooglechartsLoaded){ 
				chartMap = {
				  "bar": googlecharts.visualization.BarChart,
				  "pie": googlecharts.visualization.PieChart,
				  "line": googlecharts.visualization.LineChart,
				  "scatter": googlecharts.visualization.ScatterChart,
				  // ...
				};
				tableData = {
					"data": googlecharts.visualization.DataTable,
					"view": googlecharts.visualization.DataView,
					"table": googlecharts.visualization.Table,
					//..
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