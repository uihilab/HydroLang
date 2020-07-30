import $ from "../jquery/jquery.js";

class leafletosmapi {
  constructor() {
    if (!window._leafletosmapi) {
      this.callbackname = "_leafletosmapi.mapLoaded";
      window._leafletosmapi = this;
      window._leafletosmapi.mapLoaded = this.mapLoaded.bind(this);
    }
  }

  async load() {
    await $.when(
        $.getScript( "https://unpkg.com/leaflet@1.6.0/dist/leaflet.js" ),
        $.Deferred(function( deferred ){
            $( deferred.resolve );
        })
    ).done(function(){
        console.log("Leaflet is loaded.");
    });

    await $.when(
        $.getScript( "https://cdnjs.cloudflare.com/ajax/libs/leaflet-plugins/3.3.1/layer/vector/KML.js" ),
        $.Deferred(function( deferred ){
            $( deferred.resolve );
        })
    ).done(function(){
        console.log("kml thing is loaded.");
    });

    $("<link/>", {
       rel: "stylesheet",
       type: "text/css",
       href: "https://unpkg.com/leaflet@1.6.0/dist/leaflet.css"
    }).appendTo("head");
  }
  mapLoaded() {
    if (this.resolve) {
      this.resolve();
    }
  }
}

export default leafletosmapi;
