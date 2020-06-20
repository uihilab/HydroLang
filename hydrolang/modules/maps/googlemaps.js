class googlemapsapi {
    constructor(gApiKey) {
        this.apikey = gApiKey;

        if (!windows._googlemapsapi) {
            this.callbackname = '_googlemapsapi.mapLoaded';
            window._googlemapsapi = this;
            window._googlemapsapi.mapLoaded = this.mapLoaded.bind(this)
        }
    }

    load() {
        if (!this.promise) {
            this.promise = new Promise(resolve => {
                this.resolve = resolve;

                if (typeof window.google === 'undefined') {
                    const script = document.createElement('script');
                    script.src = `http://maps.googleapis.com/maps/api/js?key=${this.apiKey}&callback=${this.callbackName}`;
                    script.async = true;
                    document.body.append(script);
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

export default googlemapsapi;