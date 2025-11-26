/**
 * 
 * Payload Decoder for Multiple Platforms (Chirpstack v4 & v3, TTN) adapted for CSER IoT Platform v2. Rev 20/11/2025 - MRV
 *
 * Copyright 2025 COMSA Service Facility Management
 *
 * @product Adeunis Pulse v4
 */

// Chirpstack v4
function decodeUplink(input) {
    var decoded = parseFrame46(input.bytes);
    return { data: decoded };
}

// Chirpstack v3
function Decode(fPort, bytes) {
    return parseFrame46(bytes);
}

// The Things Network
function Decoder(bytes, port) {
    return parseFrame46(bytes);
}

function parseFrame46(bytes) {
    var decoded = {};
    var frameCode = bytes[0];
    if (frameCode === 0x46) {
            // decoded['frameCounter'] = (bytes[1] & 0xe0) >> 5;
            // decoded['hardwareError'] = false;
            // decoded['configurationDone'] = Boolean(bytes[1] & 0x01);
            decoded['battery_low'] = Boolean(bytes[1] & 0x02);
            decoded['pulse_a'] = bytes.readUInt32BE(2);
            decoded['pulse_b'] = bytes.readUInt32BE(6);
            if (bytes.length > 10)
                decoded['ts_unix'] = (bytes.readUInt32BE(10) + 1356998400) * 1000;
    }
    return decoded;
}

Object.prototype.readUInt32BE = function (offset) {
    var buffer = this;
    return ((buffer[offset] << 24) | (buffer[offset + 1] << 16) | (buffer[offset + 2] << 8) | buffer[offset + 3]) >>> 0;
};