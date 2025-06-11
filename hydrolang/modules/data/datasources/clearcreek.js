/**
 * Data specific for the development of a case study for the implementation of
 * BMI.js standard. This application has been developed and deployed using
 * MRMS-Stage IV data obtained for the IFC HLM model for the Clear Creek
 * in Iowa. 
 * The endpoints available are listed below.
 * For more information,please visit:
 * https://ifis.iowafloodcenter.org/ifis/sc/modelplus/
 * https://agu.confex.com/agu/fm21/meetingapp.cgi/Paper/897497
 * @type {Object}
 * @name ClearCreek
 * @memberof datasources
 */

 export default {
    //returns all the links in a 

    "req-data": {
      endpoint: "https://bmi-data-service.herokuapp.com/links/",
      params: {
        link: null,
        startDate: null,
        endDate: null
      },
      methods:{
        type: "json",
        method: "GET",
      }
    },
  
    //set of requirements from the source. If different methods for dat retrieval can be used, then "GET" is default.
    requirements: {
      needProxy: false,
      requireskey: false,
    },
    info: {
      returnFormats: "json",
      MoreInfo: "https://ifis.iowafloodcenter.org/ifis/sc/modelplus/",
      About: "Data specific for the development of a case study for the implementation of BMI.js standard. This application has been developed and deployed using MRMS-Stage IV data obtained for the IFC HLM model for the Clear Creek in Iowa."
    },
    "endpoint-info": {
      "req-data": {
        paramFormat: {
          link: "String - Link identifier for the dataset",
          startDate: "String - Start date (YYYY-MM-DD format)",
          endDate: "String - End date (YYYY-MM-DD format)"
        },
        infoSource: "https://ifis.iowafloodcenter.org/ifis/sc/modelplus/",
        example: "https://bmi-data-service.herokuapp.com/links/?startDate=2020-01-01&endDate=2020-01-31"
      }
    }
  };
  