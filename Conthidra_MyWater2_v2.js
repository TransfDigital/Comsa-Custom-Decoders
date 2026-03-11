/**
 * 
 * Payload Decoder for Multiple Platforms (Chirpstack v4 & v3, TTN) adapted for CSER IoT Platform v2. Rev 09/03/2026 - MRV
 *
 * Copyright 2026 COMSA Service Facility Management
 *
 * @product Conthidra MyWater 2.0
 */

// ---------- Static tables ----------
var alarmsList = [
  "ERROR_MAX_FLOW",
  "ERROR_SABOTAGE",
  "ERROR_LEAKAGE",
  "ERROR_REVERSE_FLOW",
  "ERROR_EXTREME_CONDITIONS",
  "BLOCKED_WATERMETER",
  "ERROR_HARDWARE_TEMPORAL",
  "ERROR_HARDWARE_PERMANENT",
  "ERROR_REMOVE",
  "FLAG_LOCAL_COMM",
  "ERROR_MIN_FLOW",
  "ERROR_LOW_BATTERY"
];

var batteryList = [
  0, 5, 10, 15, 20, 25, 30, 40, 50, 60, 70, 80, 85, 90, 95, 100
];

var pulseRateDict = {
  0x02: 100000,
  0x01: 10000,
  0x00: 1000,
  0x0F: 100,
  0x0E: 10,
  0x0D: 1,
  0x0C: 0.1
};

// Chirpstack v4
function decodeUplink(input) {
    var decoded = myWaterDecode(input.bytes);
    return { data: decoded };
}

// Chirpstack v3
function Decode(fPort, bytes) {
    return myWaterDecode(bytes);
}

// The Things Network
function Decoder(bytes, port) {
    return myWaterDecode(bytes);
}

// ---------- Main Decode ----------
function myWaterDecode(bytes) {
  var decoded = {};

  // decoded.frameVersion = ((bytes[0] >> 4) & 0x0F).toString();

  // ES5 pad to 2 hex digits, uppercase
  var fwMajor = (bytes[0] & 0x0F).toString(16).toUpperCase();
  if (fwMajor.length === 1) fwMajor = "0" + fwMajor;
  var fwMinor = bytes[1].toString(16).toUpperCase();
  if (fwMinor.length === 1) fwMinor = "0" + fwMinor;
  // decoded.firmwareVersion = fwMajor + "." + fwMinor;

  // devSN: 4 bytes LE -> safe 32-bit
  // decoded.devSN = readUInt32LE(bytes, 2).toString();

  // meterSN: 5 bytes LE -> may exceed 2^32-1, return decimal string
  // decoded.meterSN = readUIntLE_asDecString(bytes, 6, 5);

  // timestamp at offset 11 (uint32 LE)
  var seconds = readUInt32LE(bytes, 11);
  var dateTime = new Date(1970, 0, 1, 1, 0, 0, 0);
  dateTime.setUTCSeconds(seconds);
  // decoded.dateTime = dateTime;

  // alarms
  // decoded.alarms = {};
  // byte 15: bits 0..7
  // for (var a = 0; a < 8; a++) {
  //   decoded.alarms[alarmsList[a]] = !!(bytes[15] & (1 << a));
  // }
  // byte 16: bits 4..7 map to next 4 alarms
  // for (a = 0; a < 4; a++) {
  //   decoded.alarms[alarmsList[a + 8]] = !!(bytes[16] & (0x10 << a));
  // }

  // battery (low nibble of byte 16)
  decoded.battery = batteryList[bytes[16] & 0x0F];

  // 12 deltas: int16 LE from offset 17
  var deltaValues = [];
  for (var d = 0; d < 12; d++) {
    var delta = readInt16LE(bytes, 17 + d * 2);
    if (delta === -32768) delta = "NV";
    deltaValues.push(delta);
  }

  // profile / period (byte 41)
  var profile, period;
  if (!(bytes[41] & 0x10)) {
    profile = "Standard";
    period = (bytes[41] & 0x01) ? "00h - 12h" : "12h - 00h";
  } else {
    profile = "Extreme";
    period = bytes[41] & 0x0F;
    switch (period) {
      case 0: period = "21h - 00h"; break;
      case 1: period = "00h - 03h"; break;
      case 2: period = "03h - 06h"; break;
      case 3: period = "06h - 09h"; break;
      case 4: period = "09h - 12h"; break;
      case 5: period = "12h - 15h"; break;
      case 6: period = "15h - 18h"; break;
      case 7: period = "18h - 21h"; break;
      default: period = undefined; break;
    }
  }

  // 20-bit signed offset: bytes 42,43, and high nibble of 44
  var offset = (bytes[42] << 12) | (bytes[43] << 4) | (bytes[44] >> 4);
  if (offset & 0x80000) {
    // sign-extend 20-bit to 32-bit
    offset |= 0xFFF00000;
  }
  // decoded.offset = offset;

  // pulseRate from low nibble of byte 44
  // decoded.pulseRate = pulseRateDict[bytes[44] & 0x0F];

  // pulseCount: int32 LE at 45
  var pulseCount = readInt32LE(bytes, 45);
  // decoded.pulseCount = pulseCount;

  // idx = pulseCount + offset
  decoded.volume_water = (pulseCount + offset) * 0.001; // Scalefactor to obtain m3
  
  //Add times for deltas
  var timesObject = timesCalculator(period, dateTime, profile);
  decoded.volume_water_delta = [];
  var i;
  for (i = 0; i < deltaValues.length; i++) {
    if (deltaValues[i] !== "NV") {
      var record = {
        value: deltaValues[i] * 0.001,              // Scalefactor to obtain m3
        ts: timesObject.deltaTimes[i].getTime()     // Ts in Unix Milliseconds
      };
      decoded.volume_water_delta.push(record);
    }
  }
  // decoded.deltaTimes = timesObject.deltaTimes;
  // decoded.startPeriodTime = timesObject.startPeriodTime;
  // decoded.endPeriodTime = timesObject.endPeriodTime;

  return decoded;
}

// ---------- Times Enricher for deltas ----------


function timesCalculator(period, dateTime, profile) {
  var timesObject = {};
  
  // Extract the starting and ending hours from the period string.
  // Expected formats:
  //  - "12h - 00h" for Standard profile
  //  - "00h - 03h", "03h - 06h", ... for Extreme profile
  // substring(0,2) => first two chars (start hour)
  // substring(6,8) => chars at positions 6..7 (end hour)
  var startPeriodHour = parseInt(period.substring(0, 2), 10);
  var endPeriodHour   = parseInt(period.substring(6, 8), 10);
  
  // Build the start period Date using the base timestamp (dateTime)
  // and set it to the exact hour, minute and second boundaries in UTC.
  var startPeriodDateTime = new Date(dateTime);
  startPeriodDateTime.setUTCSeconds(0);
  startPeriodDateTime.setUTCMinutes(0);
  startPeriodDateTime.setUTCHours(startPeriodHour);
  
  // Build the end period Date similarly (same base date, different hour).
  var endPeriodDateTime = new Date(dateTime);
  endPeriodDateTime.setUTCSeconds(0);
  endPeriodDateTime.setUTCMinutes(0);
  endPeriodDateTime.setUTCHours(endPeriodHour);
  
  // Edge case: when the end hour is 00, the period crosses midnight.
  // Example: "12h - 00h" means the start was the previous day at 12:00 UTC
  // and the end is current day at 00:00 UTC.
  if (endPeriodHour === 0) {
      startPeriodDateTime.setDate(startPeriodDateTime.getDate() - 1);
  }
  
  // Convert to UNIX timestamps (seconds since 1970-01-01 UTC).
  var startPeriodTimestamp = Math.floor(startPeriodDateTime.getTime() / 1000);
  var endPeriodTimestamp   = Math.floor(endPeriodDateTime.getTime() / 1000);

  // Step size (in seconds) depends on the profile:
  //  - Standard: hourly steps (3600 s)
  //  - Extreme: 15-minute steps (900 s)
  var step = profile === "Standard" ? 60 * 60 : 15 * 60;
  
  // Build the array of Date objects representing each step within the period.
  var deltaTimes = [];
  
  // Iterate from start (inclusive) to end (exclusive) using the chosen step.
  for (var i = startPeriodTimestamp; i < endPeriodTimestamp; i += step) {
      var dateTime = new Date(i * 1000); // convert seconds back to milliseconds
      deltaTimes.push(dateTime);
  }
  
  // Return all computed values in a single object.
  timesObject.deltaTimes      = deltaTimes;
  timesObject.startPeriodTime = startPeriodDateTime;
  timesObject.endPeriodTime   = endPeriodDateTime;

  return timesObject;
}

// ---------- Helpers (ES5, no Buffer/DataView/BigInt) ----------
function readUInt32LE(bytes, offset) {
  // Return unsigned 32-bit
  return (
    (bytes[offset]      ) |
    (bytes[offset + 1] << 8) |
    (bytes[offset + 2] << 16) |
    ((bytes[offset + 3] << 24) >>> 0)
  ) >>> 0;
}

function readInt32LE(bytes, offset) {
  // Signed 32-bit
  var u =
    (bytes[offset]      ) |
    (bytes[offset + 1] << 8) |
    (bytes[offset + 2] << 16) |
    (bytes[offset + 3] << 24);
  return u | 0;
}

function readInt16LE(bytes, offset) {
  var val = (bytes[offset] | (bytes[offset + 1] << 8)) & 0xFFFF;
  if (val & 0x8000) val = val - 0x10000;
  return val;
}

/**
 * Read unsigned little-endian integer of arbitrary length (1..6) and
 * return as **decimal string** to avoid overflow for length > 4.
 * Implements decimal string arithmetic: str = str * 256 + byte.
 */
function readUIntLE_asDecString(bytes, offset, length) {
  var str = "0";
  for (var i = length - 1; i >= 0; i--) {
    var b = bytes[offset + i];
    str = decMul(str, 256);
    str = decAddSmall(str, b);
  }
  return str;
}

// ---- Decimal string arithmetic (ES5) ----
function decMul(str, m) {
  var carry = 0, res = "", i;
  for (i = str.length - 1; i >= 0; i--) {
    var prod = (str.charCodeAt(i) - 48) * m + carry;
    res = String.fromCharCode(48 + (prod % 10)) + res;
    carry = (prod / 10) | 0;
  }
  while (carry > 0) {
    res = String.fromCharCode(48 + (carry % 10)) + res;
    carry = (carry / 10) | 0;
  }
  // trim leading zeros
  i = 0;
  while (i < res.length - 1 && res.charAt(i) === "0") i++;
  return res.slice(i);
}

function decAddSmall(str, addend) {
  var carry = addend, res = "", i;
  for (i = str.length - 1; i >= 0; i--) {
    var sum = (str.charCodeAt(i) - 48) + carry;
    res = String.fromCharCode(48 + (sum % 10)) + res;
    carry = (sum / 10) | 0;
  }
  while (carry > 0) {
    res = String.fromCharCode(48 + (carry % 10)) + res;
    carry = (carry / 10) | 0;
  }
  // trim leading zeros
  i = 0;
  while (i < res.length - 1 && res.charAt(i) === "0") i++;
  return res.slice(i);
}