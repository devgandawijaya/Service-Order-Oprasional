const userViewModel = require("../viewmodel/userViewModel");
const userView = require("../view/userView");
const dateTime = require("../hellpers/datetime");
const synmetris = require("../hellpers/synmetris");
const jwtUtil = require("../hellpers/jwt");
const paths = require('../hellpers/service_c');
const logger = require('../hellpers/logger');
const axios = require("axios");

class UserController {
  constructor() {
    this.getTokens = this.getTokens.bind(this);
    this.getClientScreetc = this.getClientScreetc.bind(this);
  }

  /*
    1. jadin ambil token ke BCA untuk proses
    2. kirim job order dan konfirmasi
  */

  async getTokens(req, res) {
    try {
      const resultTokenExpiredDate = await userViewModel.getTokenExperedDate("bca");

      if (!resultTokenExpiredDate || resultTokenExpiredDate.length === 0) {
        const screetClients = await this.getClientScreetc();

        res.status(200).send({
          code: 200,
          message: "Tokens retrieved successfully",
          data: screetClients,
        });
      } else {
        res.status(202).send({
          code: 202,
          message: "Token is still valid.",
          data: null,
        });
      }
    } catch (error) {
      res.status(500).send({
        code: 500,
        message: error.message || error.status,
        data: null,
      });
    }
  }

  async getClientScreetc() {
    const result = await userViewModel.getClientSecrets();

    if (!result || result.length === 0) {
      throw new Error("Client secret not found.");
    }

    const { client_id, url, private_key } =
      result[0];

    const signtoconf = `${client_id}|${dateTime.getCurrentDateTime()}`;
    const urls = url+""+paths.auth.refreshToken;

    const headers = {
      "Content-Type": "application/json",
      "X-TIMESTAMP": dateTime.getCurrentDateTime(),
      "X-CLIENT-KEY": client_id,
      "X-SIGNATURE": synmetris.createSignature(signtoconf, private_key),
    };

    const body = {
      grantType: "client_credentials",
    };

    try {
      const response = await axios.post(urls, body, { headers });

      if (response.status == 200) {
        const resultTokenExpiredDate = await userViewModel.storeTokenSession(
          response
        );
        return resultTokenExpiredDate;
      } else {
        return response.statusText;
      }
    } catch (error) {
      throw new Error(
        error.response.data.responseCode +
        " - " +
        error.response.data.responseMessage
      );
    }
  }

  /*
    1. jadin kirim token ke bca
  */

  async postTokens(req, res) {
    try {

      const result = await userViewModel.getClientSecrets();
      const { client_id } = result[0];

      // Header dan body yang diperlukan
      const headers = [
        { key: 'x-timestamp', code: '4007301', message: 'Invalid timestamp format [X-TIMESTAMP]' },
        { key: 'x-client-key', code: '4007302', message: 'Client key is missing [X-CLIENT-KEY]' },
        { key: 'x-signature', code: '4007303', message: 'Signature is missing [X-SIGNATURE]' }
      ];

      const bodyParams = [
        { key: 'grantType', value: 'client_credentials', code: '4007305', message: "Invalid grantType, must be 'client_credentials'" }
      ];

      // Fungsi untuk respons error
      const sendError = (code, message) => res.status(400).json({ ErrorCode: code, ErrorMessage: message });

      // Validasi header
      for (const { key, code, message } of headers) {
        if (!req.headers[key]) return sendError(code, message);
      }

      // Validasi body
      for (const { key, value, code, message } of bodyParams) {
        if (req.body[key] !== value) return sendError(code, message);
      }

      
      if (client_id !== req.headers['x-client-key']) {
        return sendError("4017300", "Unauthorized.[Unknown client]");
      }

        const payload = { userId: 2007301, username: "bca" };
        const token = jwtUtil.generateToken(payload, client_id);
        const storetobca = await userViewModel.storeTokenSessionBca(token);
        return res.status(200).json({
          responseCode: "2007301",
          responseMessage: storetobca ? "Successful" : "Failed to store token session",
          accessToken: token,
          tokenType: "Bearer",
          expiresIn: "900"
        });
      

    } catch (error) {
      return res.status(500).json({ ErrorCode: '500', ErrorMessage: 'Internal server error' });
    }
  }


  /*
    1. bca kirim order ke jadin
  */
  async getOrders(req, res) {

    const headers = [
      { key: 'x-timestamp', code: '4007301', message: 'Invalid timestamp format [X-TIMESTAMP]' },
      { key: 'x-signature', code: '4017300', message: 'Signature is missing [X-SIGNATURE]' },
      { key: 'Authorization', code: '401M401', message: 'Invalid token (B2B)' },
      { key: 'CHANNEL-ID', code: '4007301', message: 'Invalid field format [clientId/clientSecret/grantType]' },
      { key: 'X-PARTNER-ID', code: '4007301', message: 'Invalid field format [clientId/clientSecret/grantType]' },
      { key: 'X-EXTERNAL-ID', code: '4007301', message: 'Invalid field format [clientId/clientSecret/grantType]' },
    ];

    for (const header of headers) {
      const value = req.headers[header.key.toLowerCase()];
      if (!value) {
        return res.status(400).json({
          code: header.code,
          message: header.message,
        });
      }
    }

    const token = req.headers['authorization']?.split(' ')[1];

    if (!token) {
      return res.status(401).json({
        code: '401M400',
        message: 'Token not provided',
      });
    }

    const resultTokenExpiredDate = await userViewModel.getTokenExperedDateToken(token);

    if (!Array.isArray(resultTokenExpiredDate) || resultTokenExpiredDate.length === 0) {
      return res.status(401).json({
        code: '401M401',
        message: 'Invalid token (B2B)',
      });
   }

    const getValidateHeaders = await userViewModel.getValidateHeader(req);

    if (getValidateHeaders >= 1) {
      return res.status(401).json({
        code: '409M100',
        message: 'Conflict',
      });
    }

    const storeOrders = await userViewModel.storeOrder(req);    
    if (storeOrders.rowCount > 0) {
      return res.status(200).json({
        code: '200M500',
        message: 'Successful',
      });
    } else {
      return res.status(401).json({
        code: '401M401',
        message: 'Invalid token (B2B)',
      });
    }

  }


  async getOrderToServer(req, res) {

    try {
      const toserver = await userViewModel.getOrderToServer();
      if (!toserver || toserver.length === 0) {

        res.status(202).send({
          code: 202,
          message: "Data Tidak Tersedia Dalam Waktu 5 menit",
          data: null,
        });

      } else {


        res.status(200).send({
          code: 200,
          message: "Data Tersedia Dalam Waktu 5 menit",
          data: toserver,
        });
      }
    } catch (error) {
      res.status(500).send({
        code: 500,
        message: error.message || error.status,
        data: null,
      });
    }

  }

  async postNonCluster(req, res) {

    const { requestId } = req.body;
    const resultCount = await userViewModel.validateNonCluster(requestId);

    if (resultCount > 0) {

      const result = await userViewModel.getClientSecrets();
      if (!result || result.length === 0) {
        throw new Error("Client secret not found.");
      }

    const { client_id, url, channelid, partnerid, private_key } = result[0];
    
    const signtoconf = `${client_id}|${dateTime.getCurrentDateTime()}`;
      const urls = url + "" + paths.nonCluster.noncluster;

      const headers = {
        "CHANNEL-ID": channelid,
        "X-PARTNER-ID": partnerid,
        "X-EXTERNAL-ID": dateTime.generateExternalId(partnerid),
        "X-TIMESTAMP": dateTime.getCurrentDateTime(),
        "X-SIGNATURE": synmetris.createSignature(signtoconf, private_key),
      };

      console.log("Header ::: ", headers);
      console.log("URL ::: ", urls);

      try {

        const response = await axios.post(urls, JSON.stringify(req.body), { headers });
        const { responseCode } = response.data;

        const jsonResponse = {
          responseCode,
          responseMessage: mapResponseCode(responseCode),
          originalResponse: response.data,
          status: response.status,
          statusText: response.statusText,
          headers: response.headers
        };

        return res.status(200).json({
          code : responseCode.data
        });

      } catch (error) {
        return res.status(400).json({
          code: error.response.data.responseCode,
          message: error.response.data.responseMessage
        });

      }

    } else {
      return res.status(400).json({
        code: '403M203',
        message: 'Suspected Fraud'
      });
    }

  }

  async postMasterVendor(req, res) {
    const headers = [
      { key: 'x-timestamp', code: '4007301', message: 'Invalid timestamp format [X-TIMESTAMP]' },
      { key: 'x-signature', code: '4017300', message: 'Signature is missing [X-SIGNATURE]' },
      { key: 'Authorization', code: '401M401', message: 'Invalid token (B2B)' },
      { key: 'CHANNEL-ID', code: '4007301', message: 'Invalid field format [clientId/clientSecret/grantType]' },
      { key: 'X-PARTNER-ID', code: '4007301', message: 'Invalid field format [clientId/clientSecret/grantType]' },
      { key: 'X-EXTERNAL-ID', code: '4007301', message: 'Invalid field format [clientId/clientSecret/grantType]' },
    ];

    for (const header of headers) {
      const value = req.headers[header.key.toLowerCase()];
      if (!value) {
        return res.status(400).json({
          code: header.code,
          message: header.message,
        });
      }
    }

    const token = req.headers['authorization']?.split(' ')[1];
    if (!token) {
      return res.status(401).json({
        code: '401M400',
        message: 'Token not provided',
      });
    }

    const resultTokenExpiredDate = await userViewModel.getTokenExperedDateToken(token);
    if (!resultTokenExpiredDate?.length) {
      return res.status(401).json({
        code: '401M401',
        message: 'Invalid token (B2B)',
      });
    }

    const getValidateHeaders = await userViewModel.getValidateHeader(req);
    if (getValidateHeaders >= 1) {
      return res.status(401).json({
        code: '409M100',
        message: 'Conflict',
      });
    }

    try {
      const storeMasterVendors = await userViewModel.storeMasterVendor(req);
      // Cek jika insert berhasil
      if (storeMasterVendors) {
        return res.status(200).json({
          code: '200M500',
          message: 'Successful'
        });
      } else {
        return res.status(400).json({
          code: '400M300',
          message: 'Bad request',
        });
      }
    } catch (error) {
      return res.status(500).json({
        code: '504M300',
        message: 'Timeout'
      });
    }
  }

  async postUpdateVendor(req, res) {
    const headers = [
      { key: 'x-timestamp', code: '4007301', message: 'Invalid timestamp format [X-TIMESTAMP]' },
      { key: 'x-signature', code: '4017300', message: 'Signature is missing [X-SIGNATURE]' },
      { key: 'Authorization', code: '401M401', message: 'Invalid token (B2B)' },
      { key: 'CHANNEL-ID', code: '4007301', message: 'Invalid field format [clientId/clientSecret/grantType]' },
      { key: 'X-PARTNER-ID', code: '4007301', message: 'Invalid field format [clientId/clientSecret/grantType]' },
      { key: 'X-EXTERNAL-ID', code: '4007301', message: 'Invalid field format [clientId/clientSecret/grantType]' },
    ];

    for (const header of headers) {
      const value = req.headers[header.key.toLowerCase()];
      if (!value) {
        return res.status(400).json({
          code: header.code,
          message: header.message,
        });
      }
    }

    const token = req.headers['authorization']?.split(' ')[1];
    if (!token) {
      return res.status(401).json({
        code: '401M400',
        message: 'Token not provided',
      });
    }

    const resultTokenExpiredDate = await userViewModel.getTokenExperedDateToken(token);
    if (!resultTokenExpiredDate?.length) {
      return res.status(401).json({
        code: '401M401',
        message: 'Invalid token (B2B)',
      });
    }

    const getValidateHeaders = await userViewModel.getValidateHeader(req);
    if (getValidateHeaders >= 1) {
      return res.status(401).json({
        code: '409M100',
        message: 'Conflict',
      });
    }

    try {
      const updateMasterVendors = await userViewModel.updateMasterVendor(req);
      // Cek jika insert berhasil
      if (updateMasterVendors) {
        return res.status(200).json({
          code: '200M500',
          message: 'Successful'
        });
      } else {
        return res.status(400).json({
          code: '400M300',
          message: 'Bad request',
        });
      }
    } catch (error) {
      return res.status(500).json({
        code: '504M300',
        message: 'Timeout'
      });
    }
  }


  async getInqueryPasswords(req, res){

    const result = await userViewModel.getClientSecrets();
    if (!result || result.length === 0) {
      logger.info(`Client secret not found`);
      throw new Error("Client secret not found.");
    }
    
    const { client_id, url, channelid, partnerid, private_key } = result[0];
    const signtoconf = `${client_id}|${dateTime.getCurrentDateTime()}`;

    const { path1, path2 }= req.body;
    const urls = url + "" + paths.nonCluster.inquiry +"/"+path1+"/"+path2;

    const headers = {
      "CHANNEL-ID": channelid,
      "X-PARTNER-ID": partnerid,
      "X-EXTERNAL-ID": dateTime.generateExternalId(partnerid),
      "X-TIMESTAMP": dateTime.getCurrentDateTime(),
      "X-SIGNATURE": synmetris.createSignature(signtoconf, private_key),
    };


    try{

      const response = await axios.get(urls, { headers });
      const { responseCode } = response.data;

      const jsonResponse = {
        responseCode,
        responseMessage: mapResponseCode(responseCode),
        originalResponse: response.data,
        status: response.status,
        statusText: response.statusText,
        headers: response.headers
      };

      logger.info(`getInqueryPasswords: ${jsonResponse}`);

      return res.status(200).json({
        code : responseCode.data
      });

    } catch (error) {
      return res.status(500).json({
        code: '504M300',
        message: 'Timeout'
      });
    }
  }

}

const mapResponseCode = (responseCode) => {

  const responseMapping = {
    "200M100": "Successful",
    "400M100": "Bad request",
    "400M101": "Invalid Field Format {field name}",
    "400M102": "Invalid Mandatory Field {field name}",
    "401M100": "Unauthorized. [reason]",
    "401M101": "Invalid Token (B2B)",
    "403M103": "Suspected Fraud",
    "403M115": "Transaction Not Permitted. [reason]",
    "404M101": "Transaction Not Found",
    "404M116": "Partner Not Found",
    "409M100": "Conflict",
    "500M101": "Internal Server Error",
    "504M100": "Timeout"
  };

  return responseMapping[responseCode] || "Unknown response code";
};

module.exports = new UserController();
