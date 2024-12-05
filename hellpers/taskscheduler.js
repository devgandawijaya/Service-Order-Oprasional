const cron = require('node-cron');
const userViewModel = require('../viewmodel/userViewModel');
const userController = require("../controllers/userController");
const synmetris = require("../hellpers/synmetris");
const dateTime = require("../hellpers/datetime");
const paths = require('../hellpers/service_c');
const logger = require('../hellpers/logger');
const axios = require('axios');

const myTask = async () => {
  try {
    const apiData = await callApiForEach(await userViewModel.getJoAll());
  } catch (error) {
    logger.error(`Error fetching data: ${error}`);
  }
};

const scheduleTask = () => {
  setInterval(myTask, 10000);
};


const callApiForEach = async (hasil) => {
  const { url, clientsecret, partnerid, externalid, channelid } = (await userViewModel.getClientSecrets())[0];
  let token;
  let resultTokenExpiredDate;

  do {
    token = await userController.getClientScreetc();
    resultTokenExpiredDate = await userViewModel.getTokenExperedDate("bca");
  } while (!resultTokenExpiredDate || resultTokenExpiredDate.length === 0);

  token = resultTokenExpiredDate[0].accesstoken;

  for (const item of hasil) {

    const dataToSend = {
      ...item.body
    };


    if (dataToSend.foto && Array.isArray(dataToSend.foto)) {
      const fotoBase64 = await Promise.all(
        dataToSend.foto.map(async (fotoItem) => {
          try {
            const response = await axios.get(fotoItem.imagesFile, { responseType: 'arraybuffer' });
            const base64Image = Buffer.from(response.data, 'binary').toString('base64');
            return { ...fotoItem, imagesFile: base64Image };
          } catch (error) {
            return { ...fotoItem, imagesFile: null }; 
          }
        })
      );
      dataToSend.foto = fotoBase64;
    }

    const headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
      'X-TIMESTAMP': dateTime.getCurrentDateTime(),
      'X-SIGNATURE': synmetris.createSymmetricSignature(token, dataToSend, dateTime.getCurrentDateTime(), clientsecret),
      'CHANNEL-ID': channelid,
      'X-PARTNER-ID': partnerid,
      'X-EXTERNAL-ID': synmetris.generateUniqueNumber("002")
    };

    console.log("Headers ::: ", headers);
    console.log("URLS ::: ", `${url}${paths.konfirmasi.jobKonfirmasi}`);

    try {
      const response = await axios.post(`${url}${paths.konfirmasi.jobKonfirmasi}`, dataToSend, { headers });
      const { responseCode } = response.data;

      const jsonResponse = {
        responseCode,
        responseMessage: mapResponseCode(responseCode),
        originalResponse: response.data,
        status: response.status,
        statusText: response.statusText,
        headers: response.headers
      };

      // await userViewModel.putTransaction(item.body.requestId, responseCode);
      await userViewModel.storeHistoryTransaction(item.body.requestId, JSON.stringify(jsonResponse));
      logger.log(`Transactional JO Confirmation : ${jsonResponse}`);

    } catch (error) {
      const message = error.response
        ? `Response Code: ${error.response.data.responseCode}, Response Message: ${error.response.data.responseMessage}` : error.request ? `No response received: ${JSON.stringify(error.request, null, 2)}` : `No response received: ${error.message}`;

      // await userViewModel.putTransaction(hasil[0].request_id, error.response.data.responseCode);
      await userViewModel.storeHistoryTransaction(hasil[0].request_id, JSON.stringify(message));
      logger.error(`Error Transactional JO Confirmation : ${message}`);

    }

  }
};


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


module.exports = { scheduleTask };