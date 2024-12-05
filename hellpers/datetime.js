const moment = require('moment-timezone');

function getCurrentDateTime() {
    const timezone = 'Asia/Jakarta';
    const dateTime = moment().tz(timezone).format();
    return dateTime;
}

function formatDate(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0'); // getMonth() is zero-based
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');
    const milliseconds = String(date.getMilliseconds()).padStart(3, '0');

    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}.${milliseconds}`;
}


function generateExternalId(partnerId) {
    const partnerCode = partnerId.slice(-3);
    const today = new Date(moment().tz('Asia/Jakarta').format());
    const formattedDate = today.toISOString().slice(2, 10).replace(/-/g, "");
    const randomIncrement = Math.floor(Math.random() * 1000000);
    const formattedIncrement = String(randomIncrement).padStart(6, "0");
    const externalId = `${partnerCode}${formattedDate}${formattedIncrement}`;
    return externalId;
}




module.exports = {
    getCurrentDateTime, formatDate, generateExternalId
  };
  
