/**
 * Payload Decoder for Multiple Platforms (Chirpstack v4 & v3, TTN) adapted for CSER IoT Platform. Rev 17/09/2024 - MRV
 *
 * Copyright 2024 COMSA Service Facility Management
 *
 * @product Milesight AM308(v2)
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
            // ℃
            decoded.temperature = {
                "value": readInt16LE(bytes.slice(i, i + 2)) / 10,
                "unit": "ºC",
                "name": "Temperatura"
            };
            i += 2;

            // ℉
            // decoded.temperature = readInt16LE(bytes.slice(i, i + 2)) / 10 * 1.8 + 32;
            // i +=2;
        }
        // HUMIDITY
        else if (channel_id === 0x04 && channel_type === 0x68) {
            decoded.relHumidity = {
                "value": bytes[i] / 2,
                "unit": "%",
                "name": "Humitat relativa"
            };
            i += 1;
        }
        // PIR
        else if (channel_id === 0x05 && channel_type === 0x00) {
            decoded.motion = {
                "value": bytes[i],
                "unit": "-",
                "name": "Moviment"
            };
            i += 1;
        }
        // LIGHT
        else if (channel_id === 0x06 && channel_type === 0xcb) {
            decoded.light_level = {
                "value": bytes[i],
                "unit": "-",
                "name": "Index iluminacio"
            };
            i += 1;
        }
        // CO2
        else if (channel_id === 0x07 && channel_type === 0x7d) {
            var co2 = readUInt16LE(bytes.slice(i, i + 2));
            if (co2 < 10000 && co2 > 100){
                decoded.co2 = {
                    "value": co2,
                    "unit": "ppm",
                    "name": "Concentracio CO2"
                };
            }
            i += 2;
        }
        // TVOC (iaq)
        else if (channel_id === 0x08 && channel_type === 0x7d) {
            decoded.tvoc_level = {
                "value": readUInt16LE(bytes.slice(i, i + 2)) / 100,
                "unit": "-",
                "name": "Index concentracio TVOC"
            };
            i += 2;
        }
        // TVOC (ug/m3)
        else if (channel_id === 0x08 && channel_type === 0xe6) {
            decoded.tvoc = {
                "value": readUInt16LE(bytes.slice(i, i + 2)),
                "unit": "ug/m3",
                "name": "Concentracio TVOC"
            };
            i += 2;
        }
        // PRESSURE
        else if (channel_id === 0x09 && channel_type === 0x73) {
            decoded.barPressure = {
                "value": readUInt16LE(bytes.slice(i, i + 2)) / 10,
                "unit": "hPa",
                "name": "Pressio barometrica"
            };
            i += 2;
        }
        // PM2.5
        else if (channel_id === 0x0b && channel_type === 0x7d) {
            decoded.pm25 = {
                "value": readUInt16LE(bytes.slice(i, i + 2)),
                "unit": "ug/m3",
                "name": "Concentracio PM2.5"
            };
            i += 2;
        }
        // PM10
        else if (channel_id === 0x0c && channel_type === 0x7d) {
            decoded.pm10 = {
                "value": readUInt16LE(bytes.slice(i, i + 2)),
                "unit": "ug/m3",
                "name": "Concentracio PM10"
            };
            i += 2;
        }
        // HISTORY DATA (AM308)
        else if (channel_id === 0x20 && channel_type === 0xce) {
            var data = {};
            data.timestamp = {
                "value": readUInt32LE(bytes.slice(i, i + 4)),
                "unit": "unix_s",
                "name": "Timestamp unix segons"
            };
            data.temperature = {
                "value": readInt16LE(bytes.slice(i + 4, i + 6)) / 10,
                "unit": "ºC",
                "name": "Temperatura"
            };
            data.relHumidity = {
                "value": readUInt16LE(bytes.slice(i + 6, i + 8)) / 2,
                "unit": "%",
                "name": "Humitat relativa"
            };
            data.occupancy = {
                "value": bytes[i + 8],
                "unit": "-",
                "name": "Ocupacio"
            };
            data.light_level = {
                "value": bytes[i + 9],
                "unit": "-",
                "name": "Index iluminacio"
            };
            var co2_value_ts = readUInt16LE(bytes.slice(i + 10, i + 12));
            if (co2_value_ts < 10000) {
                data.co2 = {
                    "value": co2_value_ts,
                    "unit": "ppm",
                    "name": "Concentracio CO2"
                };
            }
            data.co2 = {
                "value": readUInt16LE(bytes.slice(i + 10, i + 12)),
                "unit": "ppm",
                "name": "Concentracio CO2"
            };
            // unit: iaq
            data.tvoc_level = {
                "value": readUInt16LE(bytes.slice(i + 12, i + 14)) / 100,
                "unit": "-",
                "name": "Index concentracio TVOC"
            };
            data.barPressure = {
                "value": readUInt16LE(bytes.slice(i + 14, i + 16)) / 10,
                "unit": "hPa",
                "name": "Pressio barometrica"
            };
            data.pm25 = {
                "value": readUInt16LE(bytes.slice(i + 16, i + 18)),
                "unit": "ug/m3",
                "name": "Concentracio PM2.5"
            };
            data.pm10 = {
                "value": readUInt16LE(bytes.slice(i + 18, i + 20)),
                "unit": "ug/m3",
                "name": "Concentracio PM10"
            };
            i += 20;

            decoded.history = decoded.history || [];
            decoded.history.push(data);
        } 
        // HCHO
        else if (channel_id === 0x0a && channel_type === 0x7d) {
            i += 2;
        }
        // O3
        else if (channel_id === 0x0d && channel_type === 0x7d) {
            i += 2;
        }
        // BEEP
        else if (channel_id === 0x0e && channel_type === 0x01) {
            i += 1;
        } else {
            break;
        }
    }

    return decoded;
}

/* ******************************************
 * bytes to number
 ********************************************/
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
    return (value & 0xffffffff) >>> 0;
}

function readInt32LE(bytes) {
    var ref = readUInt32LE(bytes);
    return ref > 0x7fffffff ? ref - 0x100000000 : ref;
}

