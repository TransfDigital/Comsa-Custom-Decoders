/**
 * Payload Decoder for Multiple Platforms (Chirpstack v4 & v3, TTN) adapted for CSER IoT Platform. Rev 29/08/2024 - MRV
 *
 * Copyright 2024 COMSA Service Facility Management
 *
 * @product Pulse Atex
 */

// Chirpstack v4
function decodeUplink(input) {
    var payload = toHexString(input.bytes);  
    var decoded = bin_decode(payload);
    return { data: decoded };
}

// Chirpstack v3
function Decode(fPort, bytes) {
    var payload = toHexString(bytes);
    return bin_decode(payload);
}

// The Things Network
function Decoder(bytes, port) {
    var payload = toHexString(bytes);
    return bin_decode(payload);
}

function bin_decode(payload) {
      var template = {};

      template.pulse = {
          "unit": "",
          "value": hexToUInt(payload.substring(12, 20), 1),
          "name": "Polsos canal 1"
      };

      template.battery = {
          "unit": "%",
          "value": hexToBatteryLvl(payload.substring(40, 44)),
          "name": "Bateria"
      };

      return template;
}

function byteHelper(byte) {
    return ('0' + (byte & 0xFF).toString(16)).slice(-2);
}

function toHexString(byteArray) {
    return byteArray.map(byteHelper).join('');
}

String.prototype.paddingLeft = function (paddingValue) {
   return String(paddingValue + this).slice(-paddingValue.length);
};

function hexToUInt(hex, divider) {
    return parseInt(hex, 16) / divider;
}

function hexToBin(hex, numOfBytes) {
    return parseInt(hex, 16).toString(2).paddingLeft(Array(numOfBytes * 4 + 1).join("0"));
}

function hexToBatteryLvl(hex, startBit, endBit) {
    var binNum = hexToBin(hex, 4);
    var batteryCode = binNum.substring(binNum.length - 4, binNum.length - 2);

    switch (batteryCode) {
        case "00":
            return 100;
        case "01":
            return 75;
        case "10":
            return 50;
        case "11":
            return 25;
        default:
            return 0;
    }
}