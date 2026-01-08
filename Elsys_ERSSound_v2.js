/**
 * Payload Decoder for Multiple Platforms (Chirpstack v4 & v3, TTN) adapted for CSER IoT Platform v2. Rev 08/01/2026 - MRV
 *
 * Copyright 2026 COMSA Service Facility Management
 *
 * @product Elsys ERS Sound
 */

var TYPE_TEMP         = 0x01; //temp 2 bytes -3276.8°C -->3276.7°C
var TYPE_RH           = 0x02; //Humidity 1 byte  0-100%
var TYPE_ACC          = 0x03; //acceleration 3 bytes X,Y,Z -128 --> 127 +/-63=1G
var TYPE_LIGHT        = 0x04; //Light 2 bytes 0-->65535 Lux
var TYPE_MOTION       = 0x05; //No of motion 1 byte  0-255
var TYPE_CO2          = 0x06; //Co2 2 bytes 0-65535 ppm 
var TYPE_VDD          = 0x07; //VDD 2byte 0-65535mV
var TYPE_ANALOG1      = 0x08; //VDD 2byte 0-65535mV
var TYPE_GPS          = 0x09; //3bytes lat 3bytes long binary
var TYPE_PULSE1       = 0x0A; //2bytes relative pulse count
var TYPE_PULSE1_ABS   = 0x0B;  //4bytes no 0->0xFFFFFFFF
var TYPE_EXT_TEMP1    = 0x0C;  //2bytes -3276.5C-->3276.5C
var TYPE_EXT_DIGITAL  = 0x0D;  //1bytes value 1 or 0
var TYPE_EXT_DISTANCE = 0x0E;  //2bytes distance in mm
var TYPE_ACC_MOTION   = 0x0F;  //1byte number of vibration/motion
var TYPE_IR_TEMP      = 0x10;  //2bytes internal temp 2bytes external temp -3276.5C-->3276.5C
var TYPE_OCCUPANCY    = 0x11;  //1byte data
var TYPE_WATERLEAK    = 0x12;  //1byte data 0-255 
var TYPE_GRIDEYE      = 0x13;  //65byte temperature data 1byte ref+64byte external temp
var TYPE_PRESSURE     = 0x14;  //4byte pressure data (hPa)
var TYPE_SOUND        = 0x15;  //2byte sound data (peak/avg)
var TYPE_PULSE2       = 0x16;  //2bytes 0-->0xFFFF
var TYPE_PULSE2_ABS   = 0x17;  //4bytes no 0->0xFFFFFFFF
var TYPE_ANALOG2      = 0x18;  //2bytes voltage in mV
var TYPE_EXT_TEMP2    = 0x19;  //2bytes -3276.5C-->3276.5C
var TYPE_EXT_DIGITAL2 = 0x1A;  // 1bytes value 1 or 0 
var TYPE_EXT_ANALOG_UV= 0x1B; // 4 bytes signed int (uV)
var TYPE_TVOC         = 0x1C;  // 2bytes 0-->65535 ppb
var TYPE_DEBUG        = 0x3D;  // 4bytes debug 

// Chirpstack v4
function decodeUplink(input) {
    var decoded = DecodeElsysPayload(input.bytes);
    return { data: decoded };
}

// Chirpstack v3
function Decode(fPort, bytes) {
    return DecodeElsysPayload(bytes);
}

// The Things Network
function Decoder(bytes, port) {
    return DecodeElsysPayload(bytes);
}

function DecodeElsysPayload(data){
    var obj = new Object();
    for(i=0;i<data.length;i++){
        //console.log(data[i]);
        switch(data[i]){
            case TYPE_TEMP: //Temperature
                var temp=(data[i+1]<<8)|(data[i+2]);
                obj.temperature=bin16dec(temp)/10;
                i+=2;
            break;
            case TYPE_RH: //Humidity
                obj.relHumidity=data[i+1];
                i+=1;
            break;
            case TYPE_LIGHT: //Light
                obj.light=(data[i+1]<<8)|(data[i+2]);
                i+=2;
            break;
            case TYPE_MOTION: //Motion sensor(PIR)
                obj.motion=data[i+1];
                i+=1;
            break;
            case TYPE_CO2: //CO2
                obj.co2=(data[i+1]<<8)|(data[i+2]);
                i+=2;
            break;
            case TYPE_VDD: //Battery level
                obj.battery_vdd=(data[i+1]<<8)|(data[i+2]);
                i+=2;
            break;
            case TYPE_SOUND: //Sound
                obj.sound_peak=data[i+1];
                obj.sound_avg=data[i+2];
                i+=2;
            break;
            default: //somthing is wrong with data
                i=data.length;
            break;
        }
    }
    return obj;
}

function bin16dec(bin) {
    var num=bin&0xFFFF;
    if (0x8000 & num)
        num = - (0x010000 - num);
    return num;
}
function bin8dec(bin) {
    var num=bin&0xFF;
    if (0x80 & num) 
        num = - (0x0100 - num);
    return num;
}
function hexToBytes(hex) {
    for (var bytes = [], c = 0; c < hex.length; c += 2)
        bytes.push(parseInt(hex.substr(c, 2), 16));
    return bytes;
}