/**
 * Payload Decoder for Multiple Platforms (Chirpstack v4 & v3, TTN) adapted for CSER IoT Platform. Rev 09/07/2024 - MRV
 *
 * Copyright 2024 COMSA Service Facility Management
 *
 * @product VS133
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

total_in_chns = [0x03, 0x06, 0x09, 0x0c];
total_out_chns = [0x04, 0x07, 0x0a, 0x0d];
period_chns = [0x05, 0x08, 0x0b, 0x0e];

function milesightDeviceDecode(bytes) {
    var decoded = {};
    var is_acc_in = false;
    var is_acc_out = false;
    var nPeople = 0;

    for (var i = 0; i < bytes.length; ) {
        var channel_id = bytes[i++];
        var channel_type = bytes[i++];

        // LINE TOTAL IN
        if (includes(total_in_chns, channel_id) && channel_type === 0xd2) {
            if (channel_id == 0x03)
                people_in = readUInt32LE(bytes.slice(i, i + 4));
                decoded["nPeople_in_acc"] = {
                    "value": people_in,
                    "unit": "people",
                    "name": "Nombre persones entrant acumulat"
                };
                nPeople += people_in;
                is_acc_in = true;
            i += 4;
        }
        // LINE TOTAL OUT
        else if (includes(total_out_chns, channel_id) && channel_type === 0xd2) {
            if (channel_id == 0x04)
                people_out = readUInt32LE(bytes.slice(i, i + 4));
                decoded["nPeople_out_acc"] = {
                    "value": people_out,
                    "unit": "people",
                    "name": "Nombre persones sortint acumulat"
                };
                nPeople -= people_out;
                is_acc_out = true;
            i += 4;
        }

        // LINE PERIOD
        else if (includes(period_chns, channel_id) && channel_type === 0xcc) {
            if (channel_id == 0x05){
                decoded["nPeople_in"] = {
                    "value": readUInt16LE(bytes.slice(i, i + 2)),
                    "unit": "people",
                    "name": "Nombre persones entrant"
                };
                decoded["nPeople_out"] = {
                    "value": readUInt16LE(bytes.slice(i + 2, i + 4)),
                    "unit": "people",
                    "name": "Nombre persones sortint"
                };
            }
            i += 4;
        }
        // REGION COUNT
        else if (channel_id === 0x0f && channel_type === 0xe3) {
            i += 4;
        }
        // REGION DWELL TIME
        else if (channel_id === 0x10 && channel_type === 0xe4) {
            i += 5;
        } else {
            break;
        }
    }

    if (is_acc_in && is_acc_out){
        decoded["nPeople"] = {
            "value": nPeople,
            "unit": "people",
            "name": "Nombre persones"
        };
    }

    return decoded;
}

function readUInt8(bytes) {
    return bytes & 0xff;
}

function readUInt16LE(bytes) {
    var value = (bytes[1] << 8) + bytes[0];
    return value & 0xffff;
}

function readUInt32LE(bytes) {
    var value = (bytes[3] << 24) + (bytes[2] << 16) + (bytes[1] << 8) + bytes[0];
    return (value & 0xffffffff) >>> 0;
}

function includes(datas, value) {
    var size = datas.length;
    for (var i = 0; i < size; i++) {
        if (datas[i] == value) {
            return true;
        }
    }
    return false;
}
