/**
 * Korea Meteorological Administration (KMA): Open Data Portal.
 * Provides access to weather, climate, model data, typhoon tracks, and dust info.
 * For more information, visit: https://data.kma.go.kr/
 *
 * @type {Object}
 * @name KMA
 * @memberof datasources
 */

export default {
    // Weather Observation (ASOS)
    "obs-asos": {
        endpoint: "http://apis.data.go.kr/1360000/AsosHourlyInfoService/getWthrDataList",
        params: {
            serviceKey: null, // API Key
            pageNo: "1",
            numOfRows: "10",
            dataType: "JSON",
            dataCd: "ASOS",
            dateCd: "HR",
            startDt: null, // YYYYMMDD
            startHh: null, // HH
            endDt: null,
            endHh: null,
            stnIds: null, // Station ID
        },
        methods: {
            type: "json",
            method: "GET",
        },
    },

    // Village Forecast (Grid)
    "forecast-village": {
        endpoint: "http://apis.data.go.kr/1360000/VilageFcstInfoService_2.0/getVilageFcst",
        params: {
            serviceKey: null,
            pageNo: "1",
            numOfRows: "10",
            dataType: "JSON",
            base_date: null, // YYYYMMDD
            base_time: null, // HHMM
            nx: null, // Grid X
            ny: null, // Grid Y
        },
        methods: {
            type: "json",
            method: "GET",
        },
    },

    // Typhoon Best Track
    "typhoon-track": {
        endpoint: "https://data.kma.go.kr/data/typhoonData/typTrack.do",
        params: {
            pgmNo: "704",
            typId: null, // Typhoon ID
        },
        methods: {
            type: "json", // or HTML/CSV depending on endpoint behavior
            method: "GET",
        },
    },

    // Dust / Atmospheric Composition (GAW)
    "atmospheric-dust": {
        endpoint: "http://apis.data.go.kr/1360000/AtmosphericEnvironmentService/getDustData", // Hypothetical endpoint based on GAW
        params: {
            serviceKey: null,
            stationId: null,
            date: null,
        },
        methods: {
            type: "json",
            method: "GET",
        },
    },

    requirements: {
        needProxy: false,
        requireskey: true,
        keyname: "serviceKey",
    },

    info: {
        returnFormats: "json, xml",
        MoreInfo: "https://data.kma.go.kr/cmmn/static/staticPage.do?page=intro_api",
        About: "KMA Open Data Portal. Requires a Service Key. Provides extensive observation, forecast, typhoon, and atmospheric data.",
    },

    "endpoint-info": {
        "obs-asos": {
            paramFormat: {
                startDt: "String - Start Date (YYYYMMDD)",
                stnIds: "String - Station ID (e.g., '108' for Seoul)",
            },
            infoSource: "https://www.data.go.kr/data/15057210/openapi.do",
            example: {
                startDt: "20231026",
                stnIds: "108",
                exampleRequest: "http://apis.data.go.kr/1360000/AsosHourlyInfoService/getWthrDataList?serviceKey=YOUR_KEY&startDt=20231026&stnIds=108"
            }
        },
        "forecast-village": {
            paramFormat: {
                base_date: "String - Base Date (YYYYMMDD)",
                base_time: "String - Base Time (HHMM)",
                nx: "Number - Grid X",
                ny: "Number - Grid Y",
            },
            infoSource: "https://www.data.go.kr/data/15084084/openapi.do",
            example: {
                base_date: "20231026",
                base_time: "0500",
                nx: 55,
                ny: 127,
                exampleRequest: "http://apis.data.go.kr/1360000/VilageFcstInfoService_2.0/getVilageFcst?serviceKey=YOUR_KEY&base_date=20231026&base_time=0500&nx=55&ny=127"
            }
        },
        "typhoon-track": {
            paramFormat: {
                typId: "String - Typhoon ID",
            },
            infoSource: "https://data.kma.go.kr/data/typhoonData/typTrack.do",
            example: {
                typId: "202306",
                exampleRequest: "https://data.kma.go.kr/data/typhoonData/typTrack.do?pgmNo=704&typId=202306"
            }
        },
        "atmospheric-dust": {
            paramFormat: {
                stationId: "String - Station ID",
                date: "String - Date",
            },
            infoSource: "https://data.kma.go.kr/",
            example: {
                stationId: "108",
                date: "20231026",
                exampleRequest: "http://apis.data.go.kr/1360000/AtmosphericEnvironmentService/getDustData?serviceKey=YOUR_KEY&stationId=108&date=20231026"
            }
        }
    },
};
