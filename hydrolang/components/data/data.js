export default class Data {

	constructor(source) {
		this.source = source;
	}

	/**
	 * @param {string} [location]
	 */
	getCurrentWeather(location) {
		return "Weather is sunny for "+location+" based on data of "+this.source;
	}
}