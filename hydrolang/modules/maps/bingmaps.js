class bingmapsapi {
    constructor(bApiKey) {
        this.apikey = bApiKey;

        if (!windows._bingmapsapi) {
            this.callbackname = '_bingmapsapi.mapLoaded';
            window._bingmapsapi = this;
            window._bingmapsapi.mapLoaded = this.mapLoaded.bind(this)
        }
    }

    load() {
        if (!this.promise) {
            this.promise = new Promise(resolve => {
                this.resolve = resolve;

                if (typeof window.bing === 'undefined') {
                    const script = document.createElement('script');
                    script.src = `http://www.bing.com/api/maps/mapcontrol?&callback=${this.callbackName}&key=${this.apiKey}`;
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

export default bingmapsapi;