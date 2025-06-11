/**
 * Helper function to append SOAP 1.1 envelope to a request.
 * @type {Function}
 * @name soapEnv
 * @memberof datasources
 */
//Appends SOAP1.1 envelope to a request.
const envelope = (body) => {
  return `<?xml version="1.0" encoding="utf-8"?><soap:Envelope xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xsd="http://www.w3.org/2001/XMLSchema" xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/"><soap:Body>${body}</soap:Body></soap:Envelope>`;
};
export default envelope;
