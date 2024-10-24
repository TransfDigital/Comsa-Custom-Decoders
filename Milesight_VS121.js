/**
 * Payload Decoder for Multiple Platforms (Chirpstack v4 & v3, TTN) adapted for CSER IoT Platform. Rev 27/08/2024 - MRV
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
            decoded.nPeople = {
                "value": nPeople,
                "unit": "people",
                "name": "Nombre persones"
            };
            decoded.occupancy = {
                "value": nPeople > 0,
                "unit": "-",
                "name": "Ocupació"
            };
            i += 4;
        }
        // PEOPLE IN/OUT
        else if (channel_id === 0x05 && channel_type === 0xcc) {
            decoded.nPeople_in = {
                "value": readInt16LE(bytes.slice(i, i + 2)),
                "unit": "people",
                "name": "Nombre persones entrant"
            };
            decoded.nPeople_out = {
                "value": readInt16LE(bytes.slice(i + 2, i + 4)),
                "unit": "people",
                "name": "Nombre persones sortint"
            };
            i += 4;
        }
        // TOTAL IN/OUT
        else if (channel_id === 0x0d && channel_type === 0xcc) {
            var people_in = readUInt16LE(bytes.slice(i, i + 2));
            var people_out = readUInt16LE(bytes.slice(i + 2, i + 4));
            decoded.nPeople_in_acc = {
                "value": people_in,
                "unit": "people",
                "name": "Nombre persones entrant acumulat"
            };
            decoded.nPeople_out_acc = {
                "value": people_out,
                "unit": "people",
                "name": "Nombre persones sortint acumulat"
            };
            decoded.nPeople = {
                "value": people_in - people_out,
                "unit": "people",
                "name": "Nombre persones"
            };
            i += 4;
        }
        // PEOPLE MAX
        else if (channel_id === 0x06 && channel_type === 0xcd) {
            decoded.nPeople_max = {
                "value": bytes[i],
                "unit": "people",
                "name": "Nombre persones maxim"
            };
            i += 1;
        }
        // REGION COUNTER
        else if (channel_id === 0x07 && channel_type === 0xd5) {
            var nPeople_region = bytes[i];
            decoded.nPeople = {
                "value": nPeople_region,
                "unit": "people",
                "name": "Nombre persones"
            };
            decoded.occupancy = {
                "value": nPeople_region > 0,
                "unit": "-",
                "name": "Ocupació"
            };
            // decoded.nPeople_R2 = {
            //     "value": bytes[i + 1],
            //     "unit": "people",
            //     "name": "Nombre persones regio 2"
            // };
            // decoded.nPeople_R3 = {
            //     "value": bytes[i + 2],
            //     "unit": "people",
            //     "name": "Nombre persones regio 3"
            // };
            // decoded.nPeople_R4 = {
            //     "value": bytes[i + 3],
            //     "unit": "people",
            //     "name": "Nombre persones regio 4"
            // };
            // decoded.nPeople_R5 = {
            //     "value": bytes[i + 4],
            //     "unit": "people",
            //     "name": "Nombre persones regio 5"
            // };
            // decoded.nPeople_R6 = {
            //     "value": bytes[i + 5],
            //     "unit": "people",
            //     "name": "Nombre persones regio 6"
            // };
            // decoded.nPeople_R7 = {
            //     "value": bytes[i + 6],
            //     "unit": "people",
            //     "name": "Nombre persones regio 7"
            // };
            // decoded.nPeople_R8 = {
            //     "value": bytes[i + 7],
            //     "unit": "people",
            //     "name": "Nombre persones regio 8"
            // };
            i += 8;
        }
        // REGION COUNTER
        else if (channel_id === 0x08 && channel_type === 0xd5) {
            // decoded.nPeople_R9 = {
            //     "value": bytes[i],
            //     "unit": "people",
            //     "name": "Nombre persones regio 9"
            // };
            // decoded.nPeople_R10 = {
            //     "value": bytes[i + 1],
            //     "unit": "people",
            //     "name": "Nombre persones regio 10"
            // };
            // decoded.nPeople_R11 = {
            //     "value": bytes[i + 2],
            //     "unit": "people",
            //     "name": "Nombre persones regio 11"
            // };
            // decoded.nPeople_R12 = {
            //     "value": bytes[i + 3],
            //     "unit": "people",
            //     "name": "Nombre persones regio 12"
            // };
            // decoded.nPeople_R13 = {
            //     "value": bytes[i + 4],
            //     "unit": "people",
            //     "name": "Nombre persones regio 13"
            // };
            // decoded.nPeople_R14 = {
            //     "value": bytes[i + 5],
            //     "unit": "people",
            //     "name": "Nombre persones regio 14"
            // };
            // decoded.nPeople_R15 = {
            //     "value": bytes[i + 6],
            //     "unit": "people",
            //     "name": "Nombre persones regio 15"
            // };
            // decoded.nPeople_R16 = {
            //     "value": bytes[i + 7],
            //     "unit": "people",
            //     "name": "Nombre persones regio 16"
            // };
            i += 8;
        }
        // TIMESTAMP
        else if (channel_id === 0x0f && channel_type === 0x85) {
            // decoded.timestamp = {
            //     "value": readUInt32LE(bytes.slice(i, i + 4)),
            //     "unit": "unix_s",
            //     "name": "Timestamp unix segons"
            // };
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
