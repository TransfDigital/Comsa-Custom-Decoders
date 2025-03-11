var batches = [
    [
        {
            "key": "energy_act_cons",
            "name": "Energia activa consumida",
            "unit": "Wh",
            "scaleFactor": 1000
        },
        {
            "key": "energy_act_prod",
            "name": "Energia activa produida",
            "unit": "Wh",
            "scaleFactor": 1000
        },
        {
            "key": "energy_react_cons",
            "name": "Energia reactiva consumida",
            "unit": "VArh",
            "scaleFactor": 1000
        }
    ]
]

// Chirpstack v4
function decodeUplink(input) {
    var decoded = eastronDecode(input.bytes);
    return { data: decoded };
}

// Chirpstack v3
function Decode(fPort, bytes) {
    return eastronDecode(bytes);
}

// The Things Network
function Decoder(bytes, port) {
    return eastronDecode(bytes);
}

function eastronDecode(bytes) {
    var decoded = {};
    var serialNumber = readUInt32BE(bytes.slice(0, 4));
    var batchNumber = bytes[4];
    var responseBytes = bytes[5];
    for (var i = 0; i < responseBytes / 4; i++) {
        key = batches[batchNumber][i].key;
        varName = batches[batchNumber][i].name;
        unit = batches[batchNumber][i].unit;
        scaleFactor = batches[batchNumber][i].scaleFactor;
        bytePos = 6 + i * 4;
        reading = readFloat32BE(bytes.slice(bytePos, bytePos + 4));
        decoded[key] = {
            "name": varName,
            "unit": unit,
            "value": reading * scaleFactor
        };
    }
    var crc = bytes.slice(26);

    return decoded;
}

function readUInt32BE(bytes) {
    var value = (bytes[0] << 24) + (bytes[1] << 16) + (bytes[2] << 8) + bytes[3];
    return (value & 0xffffffff) >>> 0;
}

function readFloat32BE(bytes) {
    var intVal = (bytes[0] << 24) | (bytes[1] << 16) | (bytes[2] << 8) | bytes[3];
    return int32ToFloat(intVal);
}

function int32ToFloat(intVal) {
    // Extract sign, exponent, and fraction
    var sign = (intVal >>> 31) ? -1 : 1;
    var exponent = ((intVal >>> 23) & 0xFF) - 127;
    var fraction = intVal & 0x7FFFFF;

    if (exponent === 128) {
        return fraction === 0 ? (sign * Infinity) : NaN;
    }

    if (exponent === -127) {
        // Subnormal numbers
        return sign * Math.pow(2, -126) * (fraction / Math.pow(2, 23));
    }

    // Normalized numbers
    return sign * Math.pow(2, exponent) * (1 + fraction / Math.pow(2, 23));
}