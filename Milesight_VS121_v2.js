/**
 * Payload Decoder for Multiple Platforms (Chirpstack v4 & v3, TTN) adapted for CSER IoT Platform v2. Rev 08/01/2026 - MRV
 *
 * Copyright 2024 COMSA Service Facility Management
 *
 * @product Milesight VS121
 */

// Chirpstack v4
function decodeUplink(input) {
    var decoded = milesightDeviceDecode(input.bytes);
    return { data: decoded };
}

// Chirpstack v3
function Decode(fPort, bytes) {
    return milesightDeviceDecode(bytes);
}

// The Things Network
function Decoder(bytes, port) {
    return milesightDeviceDecode(bytes);
}

function milesightDeviceDecode(bytes) {
    var decoded = {};

    for (i = 0; i < bytes.length; ) {
        var channel_id = bytes[i++];
        var channel_type = bytes[i++];

        // PROTOCOL VESION
        if (channel_id === 0xff && channel_type === 0x01) {
            // decoded.protocol_version = bytes[i];
            i += 1;
        }
        // SERIAL NUMBER
        else if (channel_id === 0xff && channel_type === 0x08) {
            // decoded.sn = readSerialNumber(bytes.slice(i, i + 6));
            i += 6;
        }
        // HARDWARE VERSION
        else if (channel_id === 0xff && channel_type === 0x09) {
            // decoded.hardware_version = readVersion(bytes.slice(i, i + 2));
            i += 2;
        }
        // FIRMWARE VERSION
        else if (channel_id === 0xff && channel_type === 0x1f) {
            // decoded.firmware_version = readVersion(bytes.slice(i, i + 4));
            i += 4;
        }
        // PEOPLE COUNTER
        else if (channel_id === 0x04 && channel_type === 0xc9) {
            var nPeople = bytes[i];
            decoded.nPeople = nPeople;
            decoded.occupancy = nPeople > 0;
            i += 4;
        }
        // PEOPLE IN/OUT
        else if (channel_id === 0x05 && channel_type === 0xcc) {
            decoded.nPeople_in = readInt16LE(bytes.slice(i, i + 2));
            decoded.nPeople_out = readInt16LE(bytes.slice(i + 2, i + 4));
            i += 4;
        }
        // TOTAL IN/OUT
        else if (channel_id === 0x0d && channel_type === 0xcc) {
            var people_in = readUInt16LE(bytes.slice(i, i + 2));
            var people_out = readUInt16LE(bytes.slice(i + 2, i + 4));
            decoded.nPeople_in_acc = people_in;
            decoded.nPeople_out_acc = people_out;
            decoded.nPeople = people_in - people_out;
            i += 4;
        }
        // PEOPLE MAX
        else if (channel_id === 0x06 && channel_type === 0xcd) {
            decoded.nPeople_max = bytes[i];
            i += 1;
        }
        // REGION COUNTER
        else if (channel_id === 0x07 && channel_type === 0xd5) {
            var nPeople_region = bytes[i];
            decoded.nPeople = nPeople_region;
            decoded.occupancy = nPeople_region > 0;
            i += 8;
        }
        // REGION COUNTER
        else if (channel_id === 0x08 && channel_type === 0xd5) {
            i += 8;
        }
        // TIMESTAMP
        else if (channel_id === 0x0f && channel_type === 0x85) {
            i += 4;
        }
        // A FLOW
        else if (channel_id === 0x09 && channel_type === 0xda) {
            i += 8;
        }
        // B FLOW
        else if (channel_id === 0x0a && channel_type === 0xda) {
            i += 8;
        }
        // C FLOW
        else if (channel_id === 0x0b && channel_type === 0xda) {
            i += 8;
        }
        // D FLOW
        else if (channel_id === 0x0c && channel_type === 0xda) {
            i += 8;
        }
        // DWELL TIME
        else if (channel_id === 0x0e && channel_type === 0xe4) {
            i += 5;
        }
        //
        else {
            break;
        }
    }

    return decoded;
}

function readUInt16BE(bytes) {
    var value = (bytes[0] << 8) + bytes[1];
    return value & 0xffff;
}

function readInt16LE(bytes) {
    var ref = readUInt16LE(bytes);
    return ref > 0x7fff ? ref - 0x10000 : ref;
}

function readUInt16LE(bytes) {
    var value = (bytes[1] << 8) + bytes[0];
    return value & 0xffff;
}

function readUInt32LE(bytes) {
    var value = (bytes[3] << 24) + (bytes[2] << 16) + (bytes[1] << 8) + bytes[0];
    return (value & 0xffffffff) >>> 0;
}

function readVersion(bytes) {
    var temp = [];
    for (var idx = 0; idx < bytes.length; idx++) {
        temp.push((bytes[idx] & 0xff).toString(10));
    }
    return temp.join(".");
}

function readSerialNumber(bytes) {
    var temp = [];
    for (var idx = 0; idx < bytes.length; idx++) {
        temp.push(("0" + (bytes[idx] & 0xff).toString(16)).slice(-2));
    }
    return temp.join("");
}
