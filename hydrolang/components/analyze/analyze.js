// Static functions are used after 3rd level of chaining.
// Add only static functions which does not rely on data
// stored on objects, i.e. only uses the data that is
// given to the function as a parameter 


class stats {

    /** min: minimum value of an array
     * @param {array} array with data.
     * @returns {var} variable with min value of dataset.
     */
	static min(arr) {
	    var low = arr[0];
	    var i=0;
	    while (++i <arr.length)
	        if (arr[i] <low)
	            low = arr[i];
	    return low;
	}
}


class hydro {

}


export{
	stats,
	hydro
}