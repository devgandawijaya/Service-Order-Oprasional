function validateHeaders(headers) {
  const missingHeaders = [];


  if (!headers['x-timestamp']) {
    missingHeaders.push({
      ErrorCode: "4007301",
      ErrorMessage: "Invalid timestamp format [X-TIMESTAMP]"
    });
  }


  if (!headers['x-client-key']) {
    missingHeaders.push({
      ErrorCode: "4007301",
      ErrorMessage: "Invalid field format [clientId/clientSecret/grantType]"
    });
  }


  if (!headers['x-signature']) {
    missingHeaders.push({
      ErrorCode: "4007301",
      ErrorMessage: "Invalid field format [clientId/clientSecret/grantType]"
    });
  }

  return {
    isValid: missingHeaders.length === 0,
    missingHeaders: missingHeaders
  };
}


function validateBody(req){

  const missingBody = [];

  if(re){
    if (!req) {
      missingBody.push({
        ErrorCode: "4007301",
        ErrorMessage: "Invalid field format [clientId/clientSecret/grantType]"
      });
    }
  }


  return {
    isValidBody: missingBody.length === 0,
    missingBody: missingBody
  };

}

module.exports = {
  validateHeaders, validateBody
};
