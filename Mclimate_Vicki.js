/**
 *  NOT TESTED!!!
 * Payload Decoder for Chirpstack v4 & TTN adapted for CSER IoT Platform. Rev 19/05/2025 - MRV
 *
 * Copyright 2024 COMSA Service Facility Management
 *
 * @product MClimate Vicki
 */

function decodeUplink(input) {
  var bytes = input.bytes;
  var data = {};
  var resultToPass = {};
  toBool = function (value) { return value == '1' };

  function merge_obj(obj1, obj2) {
      var obj3 = {};
      for (var attrname in obj1) { obj3[attrname] = obj1[attrname]; }
      for (var attrname2 in obj2) { obj3[attrname2] = obj2[attrname2]; }
      return obj3;
  }

  function handleKeepalive(bytes, data){
      tmp = ("0" + bytes[6].toString(16)).slice(-2);
      motorRange1 = tmp[1];
      motorRange2 = ("0" + bytes[5].toString(16)).slice(-2);
      motorRange = parseInt("0x" + motorRange1 + motorRange2, 16);

      motorPos2 = ("0" + bytes[4].toString(16)).slice(-2);
      motorPos1 = tmp[0];
      motorPosition = parseInt("0x" + motorPos1 + motorPos2, 16);

      batteryTmp = ("0" + bytes[7].toString(16)).slice(-2)[0];
      batteryVoltageCalculated = 2 + parseInt("0x" + batteryTmp, 16) * 0.1;

      let decbin = (number) => {
          if (number < 0) {
              number = 0xFFFFFFFF + number + 1
          }
          number = number.toString(2);
          return "00000000".slice(number.length) + number;
      }
      byte7Bin = decbin(bytes[7]);
      openWindow = byte7Bin[4];
      highMotorConsumption = byte7Bin[5];
      lowMotorConsumption = byte7Bin[6];
      brokenSensor = byte7Bin[7];
      byte8Bin = decbin(bytes[8]);
      childLock = byte8Bin[0];
      calibrationFailed = byte8Bin[1];
      attachedBackplate = byte8Bin[2];
      perceiveAsOnline = byte8Bin[3];
      antiFreezeProtection = byte8Bin[4];

      var sensorTemp = 0;
      if (Number(bytes[0].toString(16))  == 1) {
          sensorTemp = (bytes[2] * 165) / 256 - 40;
      }

      if (Number(bytes[0].toString(16)) == 81) {
          sensorTemp = (bytes[2] - 28.33333) / 5.66666;
      }
      // data.reason = Number(bytes[0].toString(16));
      data.temperature_set = {
          "name": "Temperatura consigna",
          "unit": "ºC",
          "value": Number(bytes[1])
      };
      data.temperature = {
          "name": "Temperatura interior",
          "unit": "ºC",
          "value": Number(sensorTemp.toFixed(2))
      };
      data.relHumidity = {
          "name": "Humitat relativa",
          "unit": "%",
          "value": Number(((bytes[3] * 100) / 256).toFixed(2))
      };
      data.motorRange = {
          "name": "Rang motor",
          "unit": "-",
          "value": motorRange
      };
      data.motorPosition = {
          "name": "Posicio motor",
          "unit": "-",
          "value": motorPosition
      };
      data.battery_vdd = {
          "name": "Bateria voltatge",
          "unit": "-",
          "value": Number(batteryVoltageCalculated.toFixed(2)) * 1000
      };
      data.windowOpen = {
          "name": "Finestra oberta",
          "unit": "-",
          "value": toBool(openWindow)
      };
      data.highMotorConsumption = {
          "name": "Consum elevat motor",
          "unit": "-",
          "value": toBool(highMotorConsumption)
      };
      data.lowMotorConsumption = {
          "name": "Consum baix motor",
          "unit": "-",
          "value": toBool(lowMotorConsumption)
      };
      data.brokenSensor = {
          "name": "Estat sensor",
          "unit": "-",
          "value": toBool(brokenSensor)
      };
      data.childLock = {
          "name": "Child Lock",
          "unit": "-",
          "value": toBool(childLock)
      };
      data.calibrationFailed = {
          "name": "Fallada calibracio",
          "unit": "-",
          "value": toBool(calibrationFailed)
      };
      // data.attachedBackplate = toBool(attachedBackplate);
      // data.perceiveAsOnline = toBool(perceiveAsOnline);
      data.freezeProtection = {
          "name": "Proteccio Antigel",
          "unit": "-",
          "value": toBool(antiFreezeProtection)
      };
      data.valveOpening = {
          "name": "Obertura valvula",
          "unit": "%",
          "value": motorRange != 0 ? Math.round((1-(motorPosition/motorRange))*100) : 0
      };
      return data;
  }
 
  function handleResponse(bytes, data){
      var commands = bytes.map(function(byte, i){
        return ("0" + byte.toString(16)).slice(-2); 
      });
      commands = commands.slice(0,-9);
      var command_len = 0;

      commands.map(function (command, i) {
          switch (command) {
              case '04':
                  {
                      command_len = 2;
                      var hardwareVersion = commands[i + 1];
                      var softwareVersion = commands[i + 2];
                      var dataK = { deviceVersions: { hardware: Number(hardwareVersion), software: Number(softwareVersion) } };
                      resultToPass = merge_obj(resultToPass, dataK);
                  }
              break;
              case '12':
                  {
                      command_len = 1;
                      var dataC = { keepAliveTime: parseInt(commands[i + 1], 16) };
                      resultToPass = merge_obj(resultToPass, dataC);
                  }
              break;
              case '13':
                  {
                      command_len = 4;
                      var enabled = toBool(parseInt(commands[i + 1], 16));
                      var duration = parseInt(commands[i + 2], 16) * 5;
                      var tmp = ("0" + commands[i + 4].toString(16)).slice(-2);
                      var motorPos2 = ("0" + commands[i + 3].toString(16)).slice(-2);
                      var motorPos1 = tmp[0];
                      var motorPosition = parseInt('0x' + motorPos1 + motorPos2, 16);
                      var delta = Number(tmp[1]);

                      var dataD = { openWindowParams: { enabled: enabled, duration: duration, motorPosition: motorPosition, delta: delta } };
                      resultToPass = merge_obj(resultToPass, dataD);
                  }
              break;
              case '14':
                  {
                      command_len = 1;
                      var dataB = { childLock: toBool(parseInt(commands[i + 1], 16)) };
                      resultToPass = merge_obj(resultToPass, dataB);
                  }
              break;
              case '15':
                  {
                      command_len = 2;
                      var dataA = { temperatureRangeSettings: { min: parseInt(commands[i + 1], 16), max: parseInt(commands[i + 2], 16) } };
                      resultToPass = merge_obj(resultToPass, dataA);
                  }
              break;
              case '16':
                  {
                      command_len = 2;
                      var data = { internalAlgoParams: { period: parseInt(commands[i + 1], 16), pFirstLast: parseInt(commands[i + 2], 16), pNext: parseInt(commands[i + 3], 16) } };
                      resultToPass = merge_obj(resultToPass, data);
                  }
              break;
              case '17':
                  {
                      command_len = 2;
                      var dataF = { internalAlgoTdiffParams: { warm: parseInt(commands[i + 1], 16), cold: parseInt(commands[i + 2], 16) } };
                      resultToPass = merge_obj(resultToPass, dataF);
                  }
              break;
              case '18':
                  {
                      command_len = 1;
                      var dataE = { operationalMode: parseInt(commands[i + 1], 16) };
                      resultToPass = merge_obj(resultToPass, dataE);
                  }
              break;
              case '19':
                  {
                      command_len = 1;
                      var commandResponse = parseInt(commands[i + 1], 16);
                      var periodInMinutes = commandResponse * 5 / 60;
                      var dataH = { joinRetryPeriod: periodInMinutes };
                      resultToPass = merge_obj(resultToPass, dataH);
                  }
              break;
              case '1b':
                  {
                      command_len = 1;
                      var dataG = { uplinkType: parseInt(commands[i + 1], 16) };
                      resultToPass = merge_obj(resultToPass, dataG);
                  }
              break;
              case '1d':
                  {
                      // get default keepalive if it is not available in data
                      command_len = 2;
                      var wdpC = commands[i + 1] == '00' ? false : parseInt(commands[i + 1], 16);
                      var wdpUc = commands[i + 2] == '00' ? false : parseInt(commands[i + 2], 16);
                      var dataJ = { watchDogParams: { wdpC: wdpC, wdpUc: wdpUc } };
                      resultToPass = merge_obj(resultToPass, dataJ);
                  }
              break;
              case '1f':
                  {
                      command_len = 1;
                      var data = {  primaryOperationalMode: commands[i + 1] };
                      resultToPass = merge_obj(resultToPass, data);
                  }
              break;
              case '21':
                  {
                      command_len = 6;
                      var data = {batteryRangesBoundaries:{ 
                          Boundary1: parseInt(commands[i + 1] + commands[i + 2], 16), 
                          Boundary2: parseInt(commands[i + 3] + commands[i + 4], 16), 
                          Boundary3: parseInt(commands[i + 5] + commands[i + 6], 16), 
                      }};
                      resultToPass = merge_obj(resultToPass, data);
                  }
              break;
              case '23':
                  {
                      command_len = 4;
                      var data = {batteryRangesOverVoltage:{ 
                          Range1: parseInt(commands[i + 2], 16), 
                          Range2: parseInt(commands[i + 3], 16), 
                          Range3: parseInt(commands[i + 4], 16), 
                      }};
                      resultToPass = merge_obj(resultToPass, data);
                  }
              break;
              case '27':
                  {
                      command_len = 1;
                      var data = {OVAC: parseInt(commands[i + 1], 16)};
                      resultToPass = merge_obj(resultToPass, data);
                  }
              break;
              case '28':
                  {
                      command_len = 1;
                      var data = { manualTargetTemperatureUpdate: parseInt(commands[i + 1], 16) };
                      resultToPass = merge_obj(resultToPass, data);

                  }
              break;
              case '29':
                  {
                      command_len = 2;
                      var data = { proportionalAlgoParams: { coefficient: parseInt(commands[i + 1], 16), period: parseInt(commands[i + 2], 16) } };
                      resultToPass = merge_obj(resultToPass, data);

                  }
              break;
              case '2b':
                  {
                      command_len = 1;
                      var data = { algoType: commands[i + 1] };
                      resultToPass = merge_obj(resultToPass, data);
                  }
              break;
              case '36':
                  {
                      command_len = 3;
                      var kp = parseInt(`${commands[i + 1]}${commands[i + 2]}${commands[i + 3]}`, 16) / 131072;
                      var data = { proportionalGain: Number(kp).toFixed(5) };
                      resultToPass = merge_obj(resultToPass, data);
                  }
              break;
              case '3d':
                  {
                      command_len = 3;
                      var ki = parseInt(`${commands[i + 1]}${commands[i + 2]}${commands[i + 3]}`, 16) / 131072;
                      var data = { integralGain: Number(ki).toFixed(5) };
                      resultToPass = merge_obj(resultToPass, data);
                  }
              break;
              case '3f':
                  {
                      command_len = 2;
                      var data = { integralValue : (parseInt(`${commands[i + 1]}${commands[i + 2]}`, 16))/10 };
                      resultToPass = merge_obj(resultToPass, data);
                  }
              break;
              case '40':
                  {
                      command_len = 1;
                      var data = { piRunPeriod : parseInt(commands[i + 1], 16) };
                      resultToPass = merge_obj(resultToPass, data);
                  }
              break;
              case '42':
                  {
                      command_len = 1;
                      var data = { tempHysteresis : parseInt(commands[i + 1], 16) };
                      resultToPass = merge_obj(resultToPass, data);
                  }
              break;
              case '44':
                  {
                      command_len = 2;
                      var data = { extSensorTemperature : (parseInt(`${commands[i + 1]}${commands[i + 2]}`, 16))/10 };
                      resultToPass = merge_obj(resultToPass, data);
                  }
              break;
              case '46':
                  {
                      command_len = 3;
                      var enabled = toBool(parseInt(commands[i + 1], 16));
                      var duration = parseInt(commands[i + 2], 16) * 5;
                      var delta = parseInt(commands[i + 3], 16) /10;

                      var data = { openWindowParams: { enabled: enabled, duration: duration, delta: delta } };
                      resultToPass = merge_obj(resultToPass, data);
                  }
              break;
              case '48':
                  {
                      command_len = 1;
                      var data = { forceAttach : parseInt(commands[i + 1], 16) };
                      resultToPass = merge_obj(resultToPass, data);
                  }
              break;
              case '4a':
                  {
                      command_len = 3;
                      var activatedTemperature = parseInt(commands[i + 1], 16)/10;
                      var deactivatedTemperature = parseInt(commands[i + 2], 16)/10;
                      var targetTemperature = parseInt(commands[i + 3], 16);

                      var data = { antiFreezeParams: { activatedTemperature, deactivatedTemperature, targetTemperature } };
                      resultToPass = merge_obj(resultToPass, data);
                  }
              break;
              case '4d':
                  {
                      command_len = 2;
                      var data = { piMaxIntegratedError : (parseInt(`${commands[i + 1]}${commands[i + 2]}`, 16))/10 };
                      resultToPass = merge_obj(resultToPass, data);
                  }
              break;
              case '50':
                  {
                      command_len = 2;
                      var data = { effectiveMotorRange: { minValveOpenness: 100 - parseInt(commands[i + 2], 16), maxValveOpenness: 100 - parseInt(commands[i + 1], 16) } };
                      resultToPass = merge_obj(resultToPass, data);
                  }
              break;
              case '52':
                  {
                      command_len = 2;
                      var data = { targetTemperatureFloat : (parseInt(`${commands[i + 1]}${commands[i + 2]}`, 16))/10 };
                      resultToPass = merge_obj(resultToPass, data);
                  }
              break;
              case '54':
                  {
                      command_len = 1;
                      var offset =  (parseInt(commands[i + 1], 16) - 28) * 0.176
                      var data = { temperatureOffset : offset };
                      resultToPass = merge_obj(resultToPass, data);
                  }
              break;
              default:
                  break;
          }
          commands.splice(i,command_len);
      });
      return resultToPass;
  }
  
  if (bytes[0].toString(16) == 1 || bytes[0].toString(16) == 129) {
      data = merge_obj(data, handleKeepalive(bytes, data));
  }else{
      data = merge_obj(data, handleResponse(bytes, data));
      bytes = bytes.slice(-9);
      data = merge_obj(data, handleKeepalive(bytes, data));
  }

  return {
      data: data
  };
}

function encodeDownlink(input) {
  var bytes = [];
  for (let key of Object.keys(input.data)) {
    switch (key) {
      case "setKeepAlive": {
        bytes.push(0x02);
        bytes.push(input.data.setKeepAlive);
        break;
      }
      case "getKeepAliveTime": {
        bytes.push(0x12);
        break;
      }
      case "recalibrateMotor": {
        bytes.push(0x03);
        break;
      }
      case "getDeviceVersions": {
        bytes.push(0x04);
        break;
      }
      case "setOpenWindow": {
        let enabled = Number(input.data.setOpenWindow.enabled);
        let closeTime = parseInt(input.data.setOpenWindow.closeTime / 5);
        let delta = parseInt(input.data.setOpenWindow.delta, 8);
        let motorPosition = input.data.setOpenWindow.motorPosition;
        let motorPositionFirstPart = motorPosition & 0xff;
        let motorPositionSecondPart = (motorPosition >> 8) & 0xff;
        bytes.push(0x06);
        bytes.push(enabled);
        bytes.push(closeTime);
        bytes.push(motorPositionFirstPart);
        bytes.push((motorPositionSecondPart << 4) | delta);
        break;
      }

      case "getOpenWindowParams": {
        bytes.push(0x13);
        break;
      }
      case "setChildLock": {
        bytes.push(0x07);
        bytes.push(Number(input.data.setChildLock));
        break;
      }
      case "getChildLock": {
        bytes.push(0x14);
        break;
      }
      case "setTemperatureRange": {
        bytes.push(0x08);
        bytes.push(input.data.setTemperatureRange.min);
        bytes.push(input.data.setTemperatureRange.max);
        break;
      }
      case "getTemperatureRange": {
        bytes.push(0x15);
        break;
      }
      case "forceClose": {
        bytes.push(0x0b);
        break;
      }
      case "setInternalAlgoParams": {
        bytes.push(0x0c);
        bytes.push(input.data.setInternalAlgoParams.pFirstLast);
        bytes.push(input.data.setInternalAlgoParams.pNext);
        break;
      }
      case "getInternalAlgoParams": {
        bytes.push(0x16);
        break;
      }
      case "setInternalAlgoTdiffParams": {
        bytes.push(0x1a);
        bytes.push(input.data.setInternalAlgoTdiffParams.cold);
        bytes.push(input.data.setInternalAlgoTdiffParams.warm);
        break;
      }
      case "getInternalAlgoTdiffParams": {
        bytes.push(0x17);
        break;
      }
      case "setOperationalMode": {
        bytes.push(0x0d);
        bytes.push(input.data.setOperationalMode);
        break;
      }
      case "getOperationalMode": {
        bytes.push(0x18);
        break;
      }
      case "setTargetTemperature": {
        bytes.push(0x0e);
        bytes.push(input.data.setTargetTemperature);
        break;
      }
      case "setExternalTemperature": {
        bytes.push(0x0f);
        bytes.push(input.data.setExternalTemperature);
        break;
      }
      case "setJoinRetryPeriod": {
        // period should be passed in minutes
        let periodToPass = (input.data.setJoinRetryPeriod * 60) / 5;
        periodToPass = int(periodToPass);
        bytes.push(0x10);
        bytes.push(periodToPass);
        break;
      }
      case "getJoinRetryPeriod": {
        bytes.push(0x19);
        break;
      }
      case "setUplinkType": {
        bytes.push(0x11);
        bytes.push(input.data.setUplinkType);
        break;
      }
      case "getUplinkType": {
        bytes.push(0x1b);
        break;
      }
      case "setTargetTemperatureAndMotorPosition": {
        bytes.push(0x31);
        bytes.push(
          input.data.setTargetTemperatureAndMotorPosition.motorPosition
        );
        bytes.push(
          input.data.setTargetTemperatureAndMotorPosition.targetTemperature
        );
        break;
      }
      case "setWatchDogParams": {
        bytes.push(0x1c);
        bytes.push(input.data.setWatchDogParams.confirmedUplinks);
        bytes.push(input.data.setWatchDogParams.unconfirmedUplinks);
        break;
      }
      case "getWatchDogParams": {
        bytes.push(0x1d);
        break;
      }
      case "setPrimaryOperationalMode": {
        bytes.push(0x1e);
        bytes.push(input.data.setPrimaryOperationalMode);
        break;
      }
      case "getPrimaryOperationalMode": {
        bytes.push(0x1f);
        break;
      }
      case "setProportionalAlgorithmParameters": {
        bytes.push(0x2a);
        bytes.push(input.data.setProportionalAlgorithmParameters.coefficient);
        bytes.push(input.data.setProportionalAlgorithmParameters.period);
        break;
      }
      case "getProportionalAlgorithmParameters": {
        bytes.push(0x29);
        break;
      }
      case "setTemperatureControlAlgorithm": {
        bytes.push(0x2c);
        bytes.push(input.data.setTemperatureControlAlgorithm);
        break;
      }
      case "getTemperatureControlAlgorithm": {
        bytes.push(0x2b);
        break;
      }
      case "setMotorPositionOnly": {
        let motorPosition = input.data.setMotorPositionOnly;
        let motorPositionFirstPart = motorPosition & 0xff;
        let motorPositionSecondPart = (motorPosition >> 8) & 0xff;
        bytes.push(0x2d);
        bytes.push(motorPositionSecondPart);
        bytes.push(motorPositionFirstPart);
        break;
      }
      case "deviceReset": {
        bytes.push(0x30);
        break;
      }
      case "setChildLockBehavior": {
        bytes.push(0x35);
        bytes.push(input.data.setChildLockBehavior);
        break;
      }
      case "getChildLockBehavior": {
        bytes.push(0x34);
        break;
      }
      case "setProportionalGain": {
        let kp = Math.round(input.data.setProportionalGain * 131072);
        let kpFirstPart = kp & 0xff;
        let kpSecondPart = (kp >> 8) & 0xff;
        let kpThirdPart = (kp >> 16) & 0xff;
        bytes.push(0x37);
        bytes.push(kpThirdPart);
        bytes.push(kpSecondPart);
        bytes.push(kpFirstPart);
        break;
      }
      case "getProportionalGain": {
        bytes.push(0x36);
        break;
      }
      case "setExternalTemperatureFloat": {
        let temp = input.data.setExternalTemperatureFloat * 10;
        let tempFirstPart = temp & 0xff;
        let tempSecondPart = (temp >> 8) & 0xff;
        bytes.push(0x3c);
        bytes.push(tempSecondPart);
        bytes.push(tempFirstPart);
        break;
      }
      case "setIntegralGain": {
        let ki = Math.round(input.data.setIntegralGain * 131072);

        let kiFirstPart = ki & 0xff;
        let kiSecondPart = (ki >> 8) & 0xff;
        let kiThirdPart = (ki >> 16) & 0xff;
        bytes.push(0x3e);
        bytes.push(kiThirdPart);
        bytes.push(kiSecondPart);
        bytes.push(kiFirstPart);
        break;
      }
      case "getIntegralGain": {
        bytes.push(0x3d);
        break;
      }
      case "setPiRunPeriod": {
        bytes.push(0x41);
        bytes.push(input.data.setPiRunPeriod);
        break;
      }
      case "getPiRunPeriod": {
        bytes.push(0x40);
        break;
      }
      case "setTempHysteresis": {
        let tempHysteresis = input.data.setTempHysteresis * 10;
        bytes.push(0x43);
        bytes.push(tempHysteresis);
        break;
      }
      case "getTempHysteresis": {
        bytes.push(0x42);
        break;
      }
      case "setOpenWindowPrecisely": {
        let enabledValue = input.data.setOpenWindowPrecisely.enabled ? 1 : 0;
        let duration = parseInt(input.data.setOpenWindowPrecisely.duration) / 5;
        let delta = input.data.setOpenWindowPrecisely.delta * 10

        bytes.push(0x45);
        bytes.push(enabledValue);
        bytes.push(duration);
        bytes.push(delta);
        break;
      }
      case "getOpenWindowPrecisely": {
        bytes.push(0x46);
        break;
      }
      case "setForceAttach": {
        bytes.push(0x47);
        bytes.push(input.data.setForceAttach);
        break;
      }
      case "getForceAttach": {
        bytes.push(0x48);
        break;
      }
      case "setValveOpenness": {
        bytes.push(0x4e);
        bytes.push(input.data.setValveOpenness);
      }
      case "sendCustomHexCommand": {
        let sendCustomHexCommand = input.data.sendCustomHexCommand;
        for (let i = 0; i < sendCustomHexCommand.length; i += 2) {
          const byte = parseInt(sendCustomHexCommand.substr(i, 2), 16);
          bytes.push(byte);
        }
        break;
      }
      default: {
      }
    }
  }

  return {
    bytes: bytes
  };
}
