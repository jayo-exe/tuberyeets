// TuberYeets BRIDGE Websocket Scripts

const queryString = window.location.search;
const urlParams = new URLSearchParams(queryString);
const urlPort = urlParams.get('port');
console.log("TuberYeets Port: " + urlPort);

let VTSAuthKey = '';
let VTSPort = 8000;

var socketBridge, bridgeIsOpen = false;
var isCalibrating = false;

var previousModelPosition = {
    "positionX": 0,
    "positionY": 0,
    "rotation": 0,
    "size": 0
};

function endCalibration()
{
    if (isCalibrating)
    {
        isCalibrating = false;
        document.querySelector("#guide").hidden = true;
        document.querySelector("#guideText").hidden = true;
        if (vTubeIsOpen)
        {
            var request = {
                "apiName": "VTubeStudioPublicAPI",
                "apiVersion": "1.0",
                "requestID": "9",
                "messageType": "MoveModelRequest",
                "data": {
                    "timeInSeconds": 0.5,
                    "valuesAreRelativeToModel": false,
                    "positionX": previousModelPosition.positionX,
                    "positionY": previousModelPosition.positionY,
                    "rotation": previousModelPosition.rotation,
                    "size": previousModelPosition.size
                }
            }
            socketVTube.onmessage = null;
            socketVTube.send(JSON.stringify(request));
        }
    }
}

var guideX = null, guideY = null, dragging_target = false;
document.onmousedown = function(e)
{
    dragging_target = true;
}

document.onmouseup = function(e)
{
    dragging_target = false;
}

document.onmousemove = function(e)
{
    if(!dragging_target) { return; }
    guideX = e.clientX;
    guideY = e.clientY;
    document.querySelector("#guide").style.left = (guideX - 25) + "px";
    document.querySelector("#guide").style.top = (guideY - 25) + "px";
}

function connectBridge()
{
    socketBridge = new WebSocket("ws://localhost:" + urlPort);
    socketBridge.onopen = function()
    {
        bridgeIsOpen = true;
        console.log("Connected to TuberYeets BRIDGE!");

        // Stop attempting to reconnect unless we lose connection
        clearInterval(tryConnectBridge);
        tryConnectBridge = setInterval(function()
        {
            if (socketBridge.readyState != 1)
            {
                bridgeIsOpen = false;
                console.log("Lost connection to TuberYeets BRIDGE!");
                endCalibration();
                clearInterval(tryConnectBridge);
                tryConnectBridge = setInterval(retryConnectBridge, 1000 * 3);
            }
        }, 1000 * 3);
        socketBridge.send(JSON.stringify({"type": "vtsRequest"}));
    };
    // Process incoming requests
    socketBridge.onmessage = function(event)
    {
        var data = JSON.parse(event.data);
        console.log(data);
        if (data.type == "vtsResponse") {
            VTSPort = data.port;
            VTSAuthKey = data.authKey;
            if(data.enabled === true && !vTubeIsOpen && (!socketVTube)) {
                connectVTube();
            }
        }
        else if (data.type == "calibrating")
        {
            if (guideX == null)
                guideX = window.innerWidth / 2;
            if (guideY == null)
                guideY = window.innerHeight / 2;
            if (data.stage >= 0 && data.stage != 4)
            {
                document.querySelector("#guide").hidden = false;
                document.querySelector("#guideText").hidden = false;
            }
            else
            {
                document.querySelector("#guide").hidden = true;
                document.querySelector("#guideText").hidden = true;
            }
            switch(data.stage)
            {
                // Stage -1 is storing current position information
                case -1:
                    var request = {
                        "apiName": "VTubeStudioPublicAPI",
                        "apiVersion": "1.0",
                        "requestID": "11",
                        "messageType": "CurrentModelRequest"
                    }
                    socketVTube.onmessage = function(event)
                    {
                        socketVTube.onmessage = null;
                        const modelPosition = JSON.parse(event.data).data.modelPosition;
                        previousModelPosition = {
                            "positionX": modelPosition.positionX,
                            "positionY": modelPosition.positionY,
                            "rotation": modelPosition.rotation,
                            "size": modelPosition.size
                        }
                    }
                    socketVTube.send(JSON.stringify(request));
                    break;
                // Stage 0 is calibrating at smallest size
                case 0:
                    isCalibrating = true;

                    var request = {
                        "apiName": "VTubeStudioPublicAPI",
                        "apiVersion": "1.0",
                        "requestID": "7",
                        "messageType": "MoveModelRequest",
                        "data": {
                            "timeInSeconds": 0.5,
                            "valuesAreRelativeToModel": false,
                            "rotation": 0,
                            "size": -100
                        }
                    }
                    socketVTube.onmessage = null;
                    socketVTube.send(JSON.stringify(request));
                    break;
                // Stage 1 is sending min size position information back
                case 1:
                    var request = {
                        "apiName": "VTubeStudioPublicAPI",
                        "apiVersion": "1.0",
                        "requestID": "8",
                        "messageType": "CurrentModelRequest"
                    }
                    socketVTube.onmessage = function(event)
                    {
                        const tempData = JSON.parse(event.data).data;
                        request = {
                            "type": "calibrating",
                            "stage": "min",
                            "positionX": tempData.modelPosition.positionX - (((guideX / window.innerWidth) * 2) - 1),
                            "positionY": tempData.modelPosition.positionY + (((guideY / window.innerHeight) * 2) - 1),
                            "size": tempData.modelPosition.size,
                            "modelID": tempData.modelID
                        }
                        socketVTube.onmessage = null;
                        socketBridge.send(JSON.stringify(request));
                    }
                    socketVTube.send(JSON.stringify(request));
                    break;
                // Stage 2 is calibrating at largest size
                case 2:
                    var request = {
                        "apiName": "VTubeStudioPublicAPI",
                        "apiVersion": "1.0",
                        "requestID": "9",
                        "messageType": "MoveModelRequest",
                        "data": {
                            "timeInSeconds": 0.5,
                            "valuesAreRelativeToModel": false,
                            "rotation": 0,
                            "size": 100
                        }
                    }
                    socketVTube.onmessage = null;
                    socketVTube.send(JSON.stringify(request));
                    break;
                // Stage 3 is sending max size position information back
                case 3:
                    var request = {
                        "apiName": "VTubeStudioPublicAPI",
                        "apiVersion": "1.0",
                        "requestID": "10",
                        "messageType": "CurrentModelRequest"
                    }
                    socketVTube.onmessage = function(event)
                    {
                        const tempData = JSON.parse(event.data).data;
                        request = {
                            "type": "calibrating",
                            "stage": "max",
                            "positionX": tempData.modelPosition.positionX - (((guideX / window.innerWidth) * 2) - 1),
                            "positionY": tempData.modelPosition.positionY + (((guideY / window.innerHeight) * 2) - 1),
                            "size": tempData.modelPosition.size,
                            "modelID": tempData.modelID
                        }
                        socketVTube.onmessage = null;
                        socketBridge.send(JSON.stringify(request));
                    }
                    socketVTube.send(JSON.stringify(request));
                    break;
                // Stage 4 is finishing calibration
                case 4:
                    endCalibration();
                    break;
            }
        }
        else if (!isCalibrating && vTubeIsOpen)
        {
            console.log('ping?');
            var request = {
                "apiName": "VTubeStudioPublicAPI",
                "apiVersion": "1.0",
                "requestID": "3",
                "messageType": "InputParameterListRequest"
            }
            socketVTube.onmessage = async function(event)
            {
                console.log('pong!');
                const tempData = JSON.parse(event.data).data;
                const paramInfo = tempData.defaultParameters;
                const modelID = tempData.modelID;
                
                const faceWidthMin = data.data[modelID + "Min"] == null ? 0 : data.data[modelID + "Min"][0];
                const faceHeightMin = data.data[modelID + "Min"] == null ? 0 : data.data[modelID + "Min"][1];
                const faceWidthMax = data.data[modelID + "Max"] == null ? 0 : data.data[modelID + "Max"][0];
                const faceHeightMax = data.data[modelID + "Max"] == null ? 0 : data.data[modelID + "Max"][1];

                data.data.parametersHorizontal = [];
                for (var i = 0; i < parametersH.length; i++)
                {
                    var value = 0, min = -30, max = 30;
                    for (var j = 0; j < paramInfo.length; j++)
                    {
                        if (paramInfo[j].name == parametersH[i])
                        {
                            value = paramInfo[j].value;
                            min = paramInfo[j].min;
                            max = paramInfo[j].max;
                            break;
                        }
                    }
                    data.data.parametersHorizontal[i] = [ parametersH[i], value, min, max ];
                }

                data.data.parametersVertical = [];
                for (var i = 0; i < parametersV.length; i++)
                {
                    var value = 0, min = -30, max = 30;
                    for (var j = 0; j < paramInfo.length; j++)
                    {
                        if (paramInfo[j].name == parametersV[i])
                        {
                            value = paramInfo[j].value;
                            min = paramInfo[j].min;
                            max = paramInfo[j].max;
                            break;
                        }
                    }
                    data.data.parametersVertical[i] = [ parametersV[i], value, min, max ];
                }

                console.log("Received " + data.type);
                var temp_data = {...data.data};

                switch(data.type)
                {
                    case "single":
                        bonk(data.image, data.weight, data.scale, data.sound, data.volume, data.data, data.game_data_path, faceWidthMin, faceWidthMax, faceHeightMin, faceHeightMax, null);
                        break;
                    case "barrage":
                        var i = 0;
                        const images = data.image;
                        const weights = data.weight;
                        const scales = data.scale;
                        const sounds = data.sound;
                        const volumes = data.volume;
                        const max = Math.min(images.length, sounds.length, weights.length);
                        console.log(data);
                        barrageTick(images, weights, scales, sounds, volumes, data.data, data.game_data_path, faceWidthMin, faceWidthMax, faceHeightMin, faceHeightMax, [], data.data.barrageFrequency * 1000, max, 0);
                        break;
                    case "timed":
                        break;
                    case "sound":
                        playSound(data.sound, data.volume, data.data.volume, data.game_data_path);
                        break;
                    default:
                        if (data.game_data.customBonks[data.type].barrageCountOverride)
                            temp_data.barrageCount = data.game_data.customBonks[data.type].barrageCount;
                        if (data.game_data.customBonks[data.type].barrageFrequencyOverride)
                            temp_data.barrageFrequency = data.game_data.customBonks[data.type].barrageFrequency;
                        if (data.game_data.customBonks[data.type].throwDurationOverride)
                            temp_data.throwDuration = data.game_data.customBonks[data.type].throwDuration;
                        if (data.game_data.customBonks[data.type].throwAway)
                            temp_data.throwAway = data.game_data.customBonks[data.type].throwAway;
                        if (data.game_data.customBonks[data.type].throwAngleOverride)
                        {
                            temp_data.throwAngleMin = data.game_data.customBonks[data.type].throwAngleMin;
                            temp_data.throwAngleMax = data.game_data.customBonks[data.type].throwAngleMax;
                        }
                        if (data.game_data.customBonks[data.type].spinSpeedOverride)
                        {
                            temp_data.spinSpeedMin = data.game_data.customBonks[data.type].spinSpeedMin;
                            temp_data.spinSpeedMax = data.game_data.customBonks[data.type].spinSpeedMax;
                        }

                        var i = 0;
                        const cImages = data.image;
                        const cWeights = data.weight;
                        const cScales = data.scale;
                        const cSounds = data.sound;
                        const cVolumes = data.volume;
                        const cImpactDecals = data.impactDecal;
                        var windupSound = data.windupSound[0];
                        const cMax = Math.min(cImages.length, cSounds.length, cWeights.length, cImpactDecals.length);

                        var windup, canPlayWindup;
                        if (windupSound != null)
                        {
                            windup = new Audio();
                            windup.src = game_folder + "/" + "windups/" + encodeURIComponent(windupSound.location);
                            windup.volume = windupSound.volume * data.data.volume;
                            canPlayWindup = false;
                            windup.oncanplaythrough = function() { canPlayWindup = true; }
                        }
                        else
                            canPlayWindup = true;

                        while (!canPlayWindup)
                            await new Promise(resolve => setTimeout(resolve, 10));
                            
                        if (windupSound != null)
                            windup.play();
                            
                        setTimeout(() => {
                            barrageTick(cImages, cWeights, cScales, cSounds, cVolumes, temp_data, data.game_data_path, faceWidthMin, faceWidthMax, faceHeightMin, faceHeightMax, cImpactDecals, temp_data.barrageFrequency * 1000, cMax, 0);
                        }, data.game_data.customBonks[data.type].windupDelay * 1000);
                        break;
                }
            }
            socketVTube.send(JSON.stringify(request));
        }
    }
}

connectBridge();
// Retry connection to TuberYeets BRIDGE every 3 seconds
var tryConnectBridge = setInterval(retryConnectBridge, 1000 * 3);

function retryConnectBridge()
{
    console.log("Retrying connection to TuberYeets BRIDGE...");
    connectBridge();
}

// VTube Studio API Scripts

var socketVTube;
var vTubeIsOpen = false;

function connectVTube()
{
    socketVTube = new WebSocket("ws://localhost:" + VTSPort);
    socketVTube.onopen = function()
    {
        console.log("Connected to VTube Studio!");

        clearInterval(tryConnectVTube);
        tryConnectVTube = setInterval(function()
        {
            if (socketVTube.readyState != 1)
            {
                vTubeIsOpen = false;
                console.log("Lost connection to VTube Studio!");
                endCalibration();
                clearInterval(tryConnectVTube);
                tryConnectVTube = setInterval(retryConnectVTube, 1000 * 3);
            }
        }, 1000 * 3);


        authorizeVTS(VTSAuthKey);
    };
}

// Retry connection to VTube Studio every 3 seconds
var tryConnectVTube;

function retryConnectVTube()
{
    console.log("Retrying connection to VTube Studio...");
    connectVTube();
}

function tryAuthorization()
{
    var request = {
        "apiName": "VTubeStudioPublicAPI",
        "apiVersion": "1.0",
        "requestID": "0",
        "messageType": "AuthenticationTokenRequest",
        "data": {
            "pluginName": "TuberYeets Overlay",
            "pluginDeveloper": "Jayo",
            "pluginIcon": "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"
        }
    }
    socketVTube.onmessage = function(event)
    {
        socketVTube.onmessage = null;
        var response = JSON.parse(event.data);
        if (response.messageType == "AuthenticationTokenResponse")
        {
            console.log("Received Authentication Token");
            clearInterval(tryAuthorize);
            authorizeVTS(response.data.authenticationToken);
        }
        else if (response.messageType == "APIError" && response.data.errorID == 50)
        {
            console.log("Authentication Declined");
            clearInterval(tryAuthorize);
        }
    }
    socketVTube.send(JSON.stringify(request));
}

function authorizeVTS(token) {
    request = {
        "apiName": "VTubeStudioPublicAPI",
        "apiVersion": "1.0",
        "requestID": "1",
        "messageType": "AuthenticationRequest",
        "data": {
            "pluginName": "TuberYeets Overlay",
            "pluginDeveloper": "Jayo",
            "authenticationToken": token
        }
    }
    socketVTube.onmessage = function(event)
    {
        socketVTube.onmessage = null;
        response = JSON.parse(event.data);
        if (response.data.authenticated) {
            if (bridgeIsOpen) {
                var request =
                socketBridge.send(JSON.stringify({
                    "type": "vtsAuth",
                    "authKey": token
                }));
            }
            vTubeIsOpen = true;
        } else {
            tryAuthorization();
            tryAuthorize = setInterval(tryAuthorization, 1000 * 6);
        }
    }
    socketVTube.send(JSON.stringify(request));
}

// Report status of VTube studio connection once a second
setInterval(() => {
    if (bridgeIsOpen)
    {
        var request = {
            "type": "status",
            "connectedBonkerVTube": vTubeIsOpen
        }
        socketBridge.send(JSON.stringify(request));
    }
}, 1000);

// Check status of VTS on TuberYeets
setInterval(() => {
    if (bridgeIsOpen && !vTubeIsOpen)
    {
        socketBridge.send(JSON.stringify({"type": "vtsRequest"}));
    }
}, 5000);

function bonk(image, weight, scale, sound, volume, data, game_folder, faceWidthMin, faceWidthMax, faceHeightMin, faceHeightMax, impactDecal)
{
    if (vTubeIsOpen)
    {
        var request = {
            "apiName": "VTubeStudioPublicAPI",
            "apiVersion": "1.0",
            "requestID": "4",
            "messageType": "CurrentModelRequest"
        }
        socketVTube.onmessage = function(event)
        {
            const pos = JSON.parse(event.data).data.modelPosition;
            const throwAway = data.throwAway;
            if (pos != null)
            {
                const offsetX = faceWidthMin + (((pos.size + 100) / 200) * (faceWidthMax - faceWidthMin));
                const offsetY = faceHeightMin + (((pos.size + 100) / 200) * (faceHeightMax - faceHeightMin));
                const xPos = (parseFloat(pos.positionX - offsetX) + 1) / 2;
                const yPos = 1 - ((parseFloat(pos.positionY - offsetY) + 1) / 2);
                const fromLeft = Math.random() * 1.5 - 0.25 < xPos;
                const multH = fromLeft ? 1 : -1;
                const angle = ((Math.random() * (data.throwAngleMax - data.throwAngleMin)) + data.throwAngleMin) * multH;
                const sizeScale = data.itemScaleMin + (((pos.size + 100) / 200) * (data.itemScaleMax - data.itemScaleMin));
                const eyeState = data.closeEyes ? 1 : (data.openEyes ? 2 : 0);

                var audio, canPlayAudio;
                if (sound != null)
                {
                    audio = new Audio();
                    audio.src =  game_folder + "/" + "impacts/" + encodeURIComponent(sound);
                    audio.volume = volume * data.volume;
                    canPlayAudio = false;
                    audio.oncanplaythrough = function() { canPlayAudio = true; }
                }
                else
                    canPlayAudio = true;

                var impact, canShowImpact;
                if (impactDecal != null)
                {
                    impact = new Image();
                    impact.src = game_folder + "/" + "decals/" + encodeURIComponent(impactDecal.location);
                    canShowImpact = false;
                    impact.onload = function() { canShowImpact = true; }
                }
                else
                    canShowImpact = true;

                var img = new Image();
                if (image.startsWith("https://static-cdn.jtvnw.net/emoticons/v1/"))
                    img.src = image;
                else
                    img.src = game_folder + "/" + "throws/" + encodeURIComponent(image);

                img.onload = async function()
                {
                    // Don't do anything until both image and audio are ready
                    while (!canPlayAudio || !canShowImpact)
                        await new Promise(resolve => setTimeout(resolve, 10));

                    var randH = (((Math.random() * 100) - 50) * ((pos.size + 100) / 200));
                    var randV = (((Math.random() * 100) - 50) * ((pos.size + 100) / 200));

                    var root = document.createElement("div");
                    root.classList.add("thrown");
                    root.style.width = "100%";
                    root.style.height = "100%";
                    root.style.transformOrigin = (((pos.positionX + 1) / 2) * 100) + "% " + ((1 - ((pos.positionY + 1) / 2)) * 100) + "%";
                    root.style.transform = "rotate(" + pos.rotation + "deg)";
                    var pivot = document.createElement("div");
                    pivot.classList.add("thrown");
                    pivot.style.left = (window.innerWidth * xPos) - (img.width * scale * sizeScale / 2) + randH + "px";
                    pivot.style.top = (window.innerHeight * yPos) - (img.height * scale * sizeScale / 2) + randV + "px";
                    pivot.style.transform = "rotate(" + angle + "deg)";
                    var movement = document.createElement("div");
                    movement.classList.add("animated");
                    var animName = (throwAway ? "away" : "throw") + (fromLeft ? "Left" : "Right");
                    movement.style.animationName = animName;
                    movement.style.animationDuration = data.throwDuration + "s";
                    movement.style.animationDelay = (data.delay / 1000) + "s";
                    var thrown = document.createElement("img");
                    thrown.classList.add("animated");
                    thrown.src = game_folder + "/" + "throws/" + encodeURIComponent(image);
                    thrown.style.width = img.width * scale * sizeScale + "px";
                    thrown.style.height = img.height * scale * sizeScale + "px";
                    if (data.spinSpeedMax - data.spinSpeedMin == 0)
                        thrown.style.transform = "rotate(" + -angle + "deg)";
                    else
                    {
                        var animName = "spin" + (Math.random() < 0.5 ? "Clockwise " : "CounterClockwise ");
                        var preSpinSpeed = (parseFloat(data.spinSpeedMin) + (Math.random() * (parseFloat(data.spinSpeedMax) - parseFloat(data.spinSpeedMin))));
                        var finalSpinSpeed = (1 / preSpinSpeed);
                        console.log("MinSpeed determined: " + data.spinSpeedMin)
                        console.log("MaxSpeed determined: " + data.spinSpeedMax)
                        console.log("PreSpeed determined: " + preSpinSpeed)
                        console.log("SpinSpeed determined: " + finalSpinSpeed)
                        thrown.style.animation = animName + finalSpinSpeed + "s";
                        thrown.style.animationIterationCount = "infinite";
                    }
                    
                    movement.appendChild(thrown);
                    pivot.appendChild(movement);
                    root.appendChild(pivot);
                    document.querySelector("body").appendChild(root);
                    
                    if(!throwAway) {
                        setTimeout(function() { flinch(multH, angle, weight, data.parametersHorizontal, data.parametersVertical, data.returnSpeed, eyeState); }, data.throwDuration * 500, data.throwAngleMin, data.throwAngleMax);
                    }
                
                    if (sound != null)
                        var soundDelay = data.throwDuration * 500;
                        if(throwAway) {
                            soundDelay = 10;
                        }
                        setTimeout(function() { audio.play(); }, (soundDelay) + data.delay);
                
                    if (impactDecal != null)
                        setTimeout(function() {
                            const hit = document.createElement("img");
                            hit.classList.add("thrown");
                            hit.style.left = (window.innerWidth * xPos) - (impact.width * scale * sizeScale / 2) + randH + "px";
                            hit.style.top = (window.innerHeight * yPos) - (impact.height * scale * sizeScale / 2) + randV + "px";
                            hit.src = game_folder + "/" + "decals/" + encodeURIComponent(impactDecal.location);
                            hit.style.width = impact.width * impactDecal.scale * sizeScale + "px";
                            hit.style.height = impact.height * impactDecal.scale * sizeScale + "px";
                            document.querySelector("body").appendChild(hit);

                            setTimeout(function() { hit.remove(); }, impactDecal.duration * 1000);
                        }, (data.throwDuration * 500) + data.delay);
                    
                    setTimeout(function() { document.querySelector("body").removeChild(root); }, (data.throwDuration * 1000) + data.delay);
                }
            }
        }
        socketVTube.send(JSON.stringify(request));
    }
}

function playSound(sound, volume, master_volume, game_folder)
{
    if (sound != null)
    {
        let audio = new Audio();
        audio.src =  game_folder + "/" + "impacts/" + encodeURIComponent(sound);
        audio.volume = volume * master_volume;
        audio.oncanplaythrough = function() { audio.play(); }
    }
}

function barrageTick(images, weights, scales, sounds, volumes, data, game_folder, faceWidthMin, faceWidthMax, faceHeightMin, faceHeightMax, impactDecals, bonkDelay, bonkCount, currentBonk) {
    console.log('current BonkDelay is ' + bonkDelay);
    let tickRate = bonkDelay + (Math.floor((Math.random() * bonkDelay * 1.5) - (bonkDelay * 0.75)));
    console.log('new Tickrate is ' + tickRate);
    bonk(images[currentBonk], weights[currentBonk], scales[currentBonk], sounds[currentBonk], volumes[currentBonk], data, game_folder, faceWidthMin, faceWidthMax, faceHeightMin, faceHeightMax, impactDecals[currentBonk]);
    currentBonk++;
    if (currentBonk < bonkCount)
    {
        setTimeout(function()
        {
            barrageTick(images, weights, scales, sounds, volumes, data, game_folder, faceWidthMin, faceWidthMax, faceHeightMin, faceHeightMax, impactDecals, bonkDelay, bonkCount, currentBonk);
        }, tickRate);
    }
}

var parametersH = [ "FaceAngleX", "FaceAngleZ", "FacePositionX"], parametersV = [ "FaceAngleY" ];
function flinch(multH, angle, mag, paramH, paramV, returnSpeed, eyeState)
{
    var parameterValues = [];
    for (var i = 0; i < paramH.length; i++)
        parameterValues.push({ "id": paramH[i][0], "value": paramH[i][1] + (multH < 0 ? paramH[i][2] : paramH[i][3]) * mag });
    for (var i = 0; i < paramV.length; i++)
        parameterValues.push({ "id": paramV[i][0], "value": paramV[i][1] + (angle > 0 ? paramV[i][2] : paramV[i][3]) * Math.abs(angle) / 45 * mag });

    var request = {
        "apiName": "VTubeStudioPublicAPI",
        "apiVersion": "1.0",
        "requestID": "5",
        "messageType": "InjectParameterDataRequest",
        "data": {
            "parameterValues": parameterValues
        }
    }

    var weight = 1, done;
    socketVTube.onmessage = function()
    {
        weight -= returnSpeed;
        done = weight <= 0;
        if (done)
            weight = 0;

        parameterValues = [];
        for (var i = 0; i < paramH.length; i++)
            parameterValues.push({ "id": paramH[i][0], "weight": weight, "value": paramH[i][1] + (multH < 0 ? paramH[i][2] : paramH[i][3]) * mag });
        for (var i = 0; i < paramV.length; i++)
            parameterValues.push({ "id": paramV[i][0], "weight": weight, "value": paramV[i][1] + (multH * angle > 0 ? paramV[i][2] : paramV[i][3]) * Math.abs(angle) / 45 * mag });

        if (eyeState == 1)
        {
            parameterValues.push({ "id": "EyeOpenLeft", "weight": weight, "value": 0 });
            parameterValues.push({ "id": "EyeOpenRight", "weight": weight, "value": 0 });
        }
        else if (eyeState == 2)
        {
            parameterValues.push({ "id": "EyeOpenLeft", "weight": weight, "value": 1 });
            parameterValues.push({ "id": "EyeOpenRight", "weight": weight, "value": 1 });
        }

        request = {
            "apiName": "VTubeStudioPublicAPI",
            "apiVersion": "1.0",
            "requestID": "6",
            "messageType": "InjectParameterDataRequest",
            "data": {
                "parameterValues": parameterValues
            }
        }

        socketVTube.send(JSON.stringify(request));
        if (done)
            socketVTube.onmessage = null;
    };
    socketVTube.send(JSON.stringify(request));
}