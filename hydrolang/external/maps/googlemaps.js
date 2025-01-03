import $ from "../jquery/jquery.js";

/**
 * Imports Google Maps API. A key is necessary for usage of the engine.
 * @external googlemapsapi
 */

class googlemapsapi {
  constructor(gApiKey) {
    this.apiKey = gApiKey;

    if (!window._googlemapsapi) {
      this.callbackName = "_googlemapsapi.mapLoaded";
      window._googlemapsapi = this;
      window._googlemapsapi.mapLoaded = this.mapLoaded.bind(this);
    }
  }

  async load() {
    await $.when(
      $.getScript(
        `http://maps.googleapis.com/maps/api/js?key=${this.apiKey}&callback=${this.callbackName}`
      ),
      $.Deferred(function (deferred) {
        $(deferred.resolve);
      })
    ).done(function () {
      console.log("Google maps is loaded.");
    });
  }

  mapLoaded() {
    if (this.resolve) {
      this.resolve();
    }
  }
}

export default googlemapsapi;
