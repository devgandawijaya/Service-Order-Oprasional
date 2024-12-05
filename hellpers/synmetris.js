const crypto = require('crypto');
const path = require('path');
const paths = require('../hellpers/service_c');

function createSignature(stringToSign, private_key) {
    const sign = crypto.createSign('RSA-SHA256');
    sign.update(stringToSign);
    sign.end();
    const signature = sign.sign(private_key, 'base64');
    return signature;
}

function createSymmetricSignature(accessToken, payload, timestamp, clientSecret) {
    const httpMethod = "POST";
    const minifiedJson = JSON.stringify(payload);
    const requestBodyHash = crypto.createHash('sha256').update(minifiedJson).digest('hex').toLowerCase();
    const stringToSign = `${httpMethod}:${paths.konfirmasi.jobKonfirmasi}:${accessToken}:${requestBodyHash}:${timestamp}`;
    const hmac = crypto.createHmac('sha512', clientSecret);
    hmac.update(stringToSign);
    const signature = hmac.digest('base64');
    return signature;
}

function sha256WithRsaVerifyBca(data, signature) {

    const publicKey = `-----BEGIN PUBLIC KEY-----
MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA2LZkMU+yemb14+eKdwuQ
KUZMM1fK/XKKZAZDcYQ4dgN6q11IDUCr22txaP7gmnyHpFyJHcu4FEbVbnEJp9w8
hCisiJTUsqT79aqzySYDK01j650NQUIDQWPBVBcoL4Cv1fGwd0rLoGaGrzQLekoq
EUloXX9e0k2P+JeDzNnldX01+0V1gXq3c4wSYtrpovVbdMHqvj1toFUyZjVN2wUU
JaUs2fC/IZvqpw5p5Bwak33J8e5soJ+i/ij7rttZoq+brHbgg5KwmGdIL7jUqLUx
1uJZUPOVM+GwvKXau/7VZKCU1XWnYo7NCYyhoIdIXSRjotW3WFvXXQdXrsvQHxHF
SwIDAQAB
-----END PUBLIC KEY-----`;

    const verify = crypto.createVerify('SHA256');
    verify.update(data);
    verify.end();
    const isVerified = verify.verify(publicKey, Buffer.from(signature, 'base64'));
    return isVerified;
}

function symmetricSignature(data) {
    const httpMethod = "POST";
    const minifiedJson = JSON.stringify(data.payload);
    const requestBodyHash = crypto.createHash('sha256').update(minifiedJson).digest('hex').toLowerCase();
    const stringToSign = `${httpMethod}:${data.typePath}:${data.accessToken}:${requestBodyHash}:${data.timestamp}`;
    const hmac = crypto.createHmac('sha512', data.clientSecret);
    hmac.update(stringToSign);
    const signature = hmac.digest('base64');
    return signature;
}


const generateUniqueNumber = (prefix = "002") => {
    const now = new Date();
    const year = String(now.getFullYear()).slice(-2);
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const datePart = `${year}${month}${day}`;  
    const seconds = String(now.getSeconds()).padStart(2, '0');
    const millis = String(now.getMilliseconds()).padStart(3, '0');
    const sequencePart = `${seconds}${millis}`;
  
    return `${prefix}${datePart}${sequencePart}`;
  };

module.exports = {
    createSignature, createSymmetricSignature,symmetricSignature, generateUniqueNumber
  };