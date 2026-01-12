/**
 * Imports Leaflet map engine.
 * @external leafletosmapi
 */
class leafletosmapi {
  constructor() {
    this.loaded = false;

    if (!window._leafletosmapi) {
      this.callbackname = "_leafletosmapi.mapLoaded";
      window._leafletosmapi = this;
      window._leafletosmapi.mapLoaded = this.mapLoaded.bind(this);
    }
  }

  async load() {
    if (this.loaded) {
      return Promise.resolve();
    }

    return new Promise(async (resolve, reject) => {
      try {
        // Load CSS files first
        await this.loadCSS("https://unpkg.com/leaflet@1.6.0/dist/leaflet.css");
        await this.loadCSS("https://cdnjs.cloudflare.com/ajax/libs/leaflet.draw/1.0.4/leaflet.draw.css");

        // Load JavaScript files
        await this.loadScript("https://unpkg.com/leaflet@1.6.0/dist/leaflet.js");
        console.log("Leaflet core is loaded.");

        await this.loadScript("https://cdnjs.cloudflare.com/ajax/libs/leaflet-plugins/3.3.1/layer/vector/KML.js");

        await this.loadScript("https://cdnjs.cloudflare.com/ajax/libs/leaflet.draw/1.0.4/leaflet.draw.js");

        this.loaded = true;
        console.log("Leaflet and all plugins are loaded.");
        resolve();
      } catch (error) {
        reject(new Error(`Failed to load Leaflet: ${error.message}`));
      }
    });
  }

  async loadScript(src) {
    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = src;
      script.async = true;
      script.defer = true;

      script.onload = () => resolve();
      script.onerror = () => reject(new Error(`Failed to load script: ${src}`));

      document.head.appendChild(script);
    });
  }

  async loadCSS(href) {
    return new Promise((resolve, reject) => {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.type = 'text/css';
      link.href = href;

      link.onload = () => resolve();
      link.onerror = () => reject(new Error(`Failed to load CSS: ${href}`));

      document.head.appendChild(link);
    });
  }

  mapLoaded() {
    if (this.resolve) {
      this.resolve();
    }
  }

  isLoaded() {
    return this.loaded;
  }
}

export default leafletosmapi;
