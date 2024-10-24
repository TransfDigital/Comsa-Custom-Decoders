/**
 * Payload Decoder for Multiple Platforms (Chirpstack v4 & v3, TTN) adapted for CSER IoT Platform. Rev 09/07/2024 - MRV
 *
 * Copyright 2024 COMSA Service Facility Management
 *
 * @product WT101
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
        // BATTERY
        if (channel_id === 0x01 && channel_type === 0x75) {
            decoded.battery = {
                "value": bytes[i],
                "unit": "%",
                "name": "Bateria"
            };
            i += 1;
        }
        // TEMPERATURE
        else if (channel_id === 0x03 && channel_type === 0x67) {
            decoded.temperature = {
                "value": readInt16LE(bytes.slice(i, i + 2)) / 10,
                "unit": "ºC",
                "name": "Temperatura"
            };
            i += 2;
        }
        // TEMPERATURE TARGET
        else if (channel_id === 0x04 && channel_type === 0x67) {
            decoded.temperature_set = {
                "value": readInt16LE(bytes.slice(i, i + 2)) / 10,
                "unit": "ºC",
                "name": "Temperatura consigna"
            };
            i += 2;
        }
        // VALVE OPENING
        else if (channel_id === 0x05 && channel_type === 0x92) {
            decoded.valveOpening = {
                "value": readUInt8(bytes[i]),
                "unit": "%",
                "name": "Obertura valvula"
            };
            i += 1;
        }
        // INSTALLATION STATUS --> 0 alarm off, 1 alarm on
        else if (channel_id === 0x06 && channel_type === 0x00) {
            decoded.tamper = {
                "value": bytes[i],
                "unit": "",
                "name": "Estat instalacio"
            };
            i += 1;
        }
        // OPEN WINDOW DECTECTION --> 0 window closed, 1 window opened
        else if (channel_id === 0x07 && channel_type === 0x00) {
            decoded.windowOpen = {
                "value": bytes[i],
                "unit": "-",
                "name": "Finestra oberta"
            };
            i += 1;
        }
        // MOTOR STORKE CALIBRATION STATUS
        else if (channel_id === 0x08 && channel_type === 0xe5) {
            decoded.calibrationResult = {
                "value": readMotorCalibration(bytes[i]),
                "unit": "-",
                "name": "Calibracio motor"
            };
            i += 1;
        }
        // MOTOR STROKE
        else if (channel_id === 0x09 && channel_type === 0x90) {
            decoded.motorStroke = {
                "value": readUInt16LE(bytes.slice(i, i + 2)),
                "unit": "-",
                "name": "Parell motor"
            };
            i += 2;
        }
        // FROST PROTECTION --> 0 not activated, 1 activated
        else if (channel_id === 0x0a && channel_type === 0x00) {
            decoded.freezeProtection = {
                "value": bytes[i],
                "unit": "-",
                "name": "Antigel"
            };
            i += 1;
        }
        // MOTOR CURRENT POSTION
        else if (channel_id === 0x0b && channel_type === 0x90) {
            decoded.motorPosition = {
                "value": readUInt16LE(bytes.slice(i, i + 2)),
                "unit": "-",
                "name": "Posicio motor"
            };
            i += 2;
        } else {
            break;
        }
    }

    if (["motorPosition", "motorStroke"].every(includesKey, Object.keys(decoded))){
        decoded.valveOpening = {
            "value": (1 - decoded.motorPosition.value / decoded.motorStroke.value) * 100,
            "unit": "%",
            "name": "Obertura valvula"           
        };
    }

    return decoded;
}

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

function readMotorCalibration(type) {
    switch (type) {
        case 0x00:
            return "success";
        case 0x01:
            return "fail: out of range";
        case 0x02:
            return "fail: uninstalled";
        case 0x03:
            return "calibration cleared";
        case 0x04:
            return "temperature control disabled";
        default:
            return "unknown";
    }
}

function includesKey(key) {
    return this.indexOf(key) > -1;
}
