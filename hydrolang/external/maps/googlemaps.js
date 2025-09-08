/**
 * Imports Google Maps API. A key is necessary for usage of the engine.
 * @external googlemapsapi
 */

class googlemapsapi {
  constructor(gApiKey) {
    this.apiKey = gApiKey;
    this.loaded = false;

    if (!window._googlemapsapi) {
      this.callbackName = "_googlemapsapi.mapLoaded";
      window._googlemapsapi = this;
      window._googlemapsapi.mapLoaded = this.mapLoaded.bind(this);
    }
  }

  async load() {
    if (this.loaded) {
      return Promise.resolve();
    }

    return new Promise((resolve, reject) => {
      this.resolve = resolve;
      this.reject = reject;

      // Create script element
      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=${this.apiKey}&callback=${this.callbackName}`;
      script.async = true;
      script.defer = true;

      // Handle script loading errors
      script.onerror = () => {
        this.reject(new Error('Failed to load Google Maps API'));
      };

      // Append script to document head
      document.head.appendChild(script);
    });
  }

  mapLoaded() {
    this.loaded = true;
    console.log("Google Maps API is loaded.");
    if (this.resolve) {
      this.resolve();
    }
  }

  isLoaded() {
    return this.loaded;
  }
}

export default googlemapsapi;
