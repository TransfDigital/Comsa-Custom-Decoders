/**
 * Payload Decoder for Multiple Platforms (Chirpstack v4 & v3, TTN) adapted for CSER IoT Platform. Rev 09/07/2024 - MRV
 *
 * Copyright 2024 COMSA Service Facility Management
 *
 * @product WS558
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

    for (var i = 0; i < bytes.length; ) {
        var channel_id = bytes[i++];
        var channel_type = bytes[i++];
        // SWITCH STATUS
        if (channel_id === 0x08 && channel_type === 0x31) {
            var switchFlags = bytes[i + 1];

            // output all switch status
            for (var idx = 0; idx < 8; idx++) {
                var switchTag = "switch_" + (idx + 1);
                decoded[switchTag] = {
                    "value": (switchFlags >> idx) & (1 === 1) ? 1 : 0,
                    "unit": "-",
                    "name": "Estat entrada" + (idx + 1)
                };
            }
            i += 2;
        } else {
            break;
        }
    }

    return decoded;
}

/* ******************************************
 * bytes to number
 ********************************************/
function readUInt8(bytes) {
    return bytes & 0xff;
}

function readInt8(bytes) {
    var ref = readUInt8(bytes);
    return ref > 0x7f ? ref - 0x100 : ref;
}

function readUInt16LE(bytes) {
    var value = (bytes[1] << 8) + bytes[0];
    return value & 0xffff;
}

function readInt16LE(bytes) {
    var ref = readUInt16LE(bytes);
    return ref > 0x7fff ? ref - 0x10000 : ref;
}

function readUInt32LE(bytes) {
    var value = (bytes[3] << 24) + (bytes[2] << 16) + (bytes[1] << 8) + bytes[0];
    return value & 0xffffffff;
}

function readInt32LE(bytes) {
    var ref = readUInt32LE(bytes);
    return ref > 0x7fffffff ? ref - 0x100000000 : ref;
}
