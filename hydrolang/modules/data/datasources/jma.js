/**
 * Japan Meteorological Agency (JMA): Public Atom Feeds.
 * Provides high-frequency weather warnings, forecasts, tsunami, and typhoon info via XML feeds.
 * For more information, visit: https://www.jma.go.jp/jma/indexe.html
 *
 * @type {Object}
 * @name JMA
 * @memberof datasources
 */

export default {
    // Regular Feed (Warnings/Forecasts)
    "feed-regular": {
        endpoint: "http://www.data.jma.go.jp/developer/xml/feed/regular.xml",
        params: {}, // No params, returns the latest feed
        methods: {
            type: "xml",
            method: "GET",
        },
    },

    // Extra Feed (Volcanic/Earthquake/Other)
    "feed-extra": {
        endpoint: "http://www.data.jma.go.jp/developer/xml/feed/extra.xml",
        params: {},
        methods: {
            type: "xml",
            method: "GET",
        },
    },

    // Tsunami Information
    "tsunami-info": {
        endpoint: "http://www.data.jma.go.jp/developer/xml/feed/eqvol.xml", // Often in eqvol feed
        params: {},
        methods: {
            type: "xml",
            method: "GET",
        },
    },

    // Himawari Satellite Images (Public)
    "himawari-image": {
        endpoint: "https://www.jma.go.jp/bosai/himawari/data/satimg/{target}/{validtime}/{band}/{z}/{x}/{y}.jpg",
        params: {
            target: null, // e.g., "fd" (Full Disk), "jp" (Japan)
            validtime: null, // e.g., "20231025000000"
            band: null, // e.g., "B13" (IR)
            z: null, // Zoom level
            x: null, // Tile X
            y: null, // Tile Y
        },
        methods: {
            type: "image", // Returns binary image
            method: "GET",
        },
    },

    requirements: {
        needProxy: false,
        requireskey: false,
    },

    info: {
        returnFormats: "xml, image",
        MoreInfo: "http://xml.kishou.go.jp/xml_data.html",
        About: "JMA Public Data Feeds. Provides XML Atom feeds for warnings, forecasts, tsunami info, and public Himawari satellite imagery tiles.",
    },

    "endpoint-info": {
        "feed-regular": {
            paramFormat: {},
            infoSource: "http://xml.kishou.go.jp/xml_data.html",
            example: {
                exampleRequest: "http://www.data.jma.go.jp/developer/xml/feed/regular.xml"
            }
        },
        "feed-extra": {
            paramFormat: {},
            infoSource: "http://xml.kishou.go.jp/xml_data.html",
            example: {
                exampleRequest: "http://www.data.jma.go.jp/developer/xml/feed/extra.xml"
            }
        },
        "tsunami-info": {
            paramFormat: {},
            infoSource: "http://xml.kishou.go.jp/xml_data.html",
            example: {
                exampleRequest: "http://www.data.jma.go.jp/developer/xml/feed/eqvol.xml"
            }
        },
        "himawari-image": {
            paramFormat: {
                target: "String - Target area (e.g., 'fd' for Full Disk)",
                validtime: "String - Valid time (YYYYMMDDHHMMSS)",
                band: "String - Band (e.g., 'B13')",
                z: "String - Zoom level",
                x: "String - Tile X",
                y: "String - Tile Y"
            },
            infoSource: "https://www.jma.go.jp/jma/kishou/know/satellite/index.html",
            example: {
                target: "fd",
                validtime: "20231027030000",
                band: "B13",
                z: "4",
                x: "0",
                y: "0",
                exampleRequest: "https://www.jma.go.jp/bosai/himawari/data/satimg/fd/20231027030000/B13/4/0/0.jpg"
            }
        }
    },
};
