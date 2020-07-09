class leafletosmapi {
    constructor() {
        if (!window._leafletosmapi) {
            this.callbackname = '_leafletosmapi.mapLoaded';
            window._leafletosmapi = this;
            window._leafletosmapi.mapLoaded = this.mapLoaded.bind(this)
        }
    }

    load() {
        if (!this.promise) {
            this.promise = 
            
            new Promise(resolve => {
                this.resolve = resolve;

                //Load the CSS required for leaflet.
                if (typeof window.leaflet === 'undefined') {
                    const link = document.createElement('link');
                    link.id = "leafletCSS";
                    link.rel = "stylesheet";
                    link.type = "text/css";
                    link.href = "https://unpkg.com/leaflet@1.6.0/dist/leaflet.css";
                    link.integrity = "sha512-xwE/Az9zrjBIphAcBb3F6JVqxf46+CDLwfLMHloNu6KEQCAWi6HcDUbeOfBIptF7tcCzusKFjFw2yuvEpDL9wQ==";
                    link.crossOrigin = "";
                    
                    //Load the leaflet library.
                    const script = document.createElement('script');
                    script.id = "leafletScript";
                    script.type = "text/javascript";
                    script.src = "https://unpkg.com/leaflet@1.6.0/dist/leaflet.js";
                    script.integrity = "sha512-gZwIG9x3wUXg2hdXF6+rVkLF/0Vi9U8D2Ntg4Ga5I5BZpVkVxlJWbSQtXPSiUTtC0TjtGOmxa1AJPuV0CPthew==";
                    script.crossOrigin = "";

                    //Plugin KML: load KML layers.
                    const kml = document.createElement('script');
                    kml.id = "kml for leaflet"
                    kml.type = "text/javascript";
                    kml.src = "https://cdnjs.cloudflare.com/ajax/libs/leaflet-plugins/3.3.1/layer/vector/KML.js"
                    kml.crossOrigin = "";

                
                    document.head.appendChild(link);
                    document.head.appendChild(script);
                    document.head.appendChild(kml)
                } else {
                    this.resolve();
                }
            });
        }
        return this.promise;
    }
    mapLoaded() {
        if (this.resolve) {
            this.resolve();
        }
    }
}


export default leafletosmapi;

