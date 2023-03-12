const path = require('path');
const fs = require('fs');
const uuid = require('uuid');
const BonkEventHelper = require('./bonkEventHelper');
const EventDataHelper = require('./eventDataHelper');

module.exports = class GameDataHelper {

    constructor(userFilesPath,staticPath) {
        this.data = null;
        this.userFilesPath = userFilesPath;
        this.dataPath = null;
        this.folderPath = path.join(this.userFilesPath, 'gamedata');
        this.defaultDataPath = path.resolve(staticPath, 'data/defaultData.json');
        this.defaultData = JSON.parse(fs.readFileSync(this.defaultDataPath, "utf8"));
        this.statusCallback = null;
        this.bonkDefaultsCallback = null;
        this.autoSaveTimeout = null;

        this.bonkEventHelper = new BonkEventHelper(this);
        this.eventData = new EventDataHelper(this);
        this.gameId = null;
        this.gameDataFolder = null;

    }

    setAgentRegistry(agentRegistry) {
        this.agentRegistry = agentRegistry;
    }

    checkGameFolder() {
        if (!fs.existsSync(this.folderPath))
            fs.mkdirSync(this.folderPath);

        const gamePath = path.join(this.folderPath, this.gameId.toString());
        if (!fs.existsSync(gamePath))
            fs.mkdirSync(gamePath);

        if (!fs.existsSync(gamePath +'/throws/'))
            fs.mkdirSync(gamePath +'/throws/');
        if (!fs.existsSync(gamePath +'/decals/'))
            fs.mkdirSync(gamePath +'/decals/');
        if (!fs.existsSync(gamePath +'/impacts/'))
            fs.mkdirSync(gamePath +'/impacts/');
        if (!fs.existsSync(gamePath +'/windups/'))
            fs.mkdirSync(gamePath +'/windups/');
        if (!fs.existsSync(gamePath +'/data.json'))
            fs.writeFileSync(gamePath +'/data.json', JSON.stringify(this.defaultGameData));
        this.gameDataFolder = gamePath;
        this.dataPath = gamePath +'/data.json';
    }

    loadData(gameId) {
        this.gameId = gameId;
        console.log('[GameDataHelper] Attempting to load game-specific data...');
        this.checkGameFolder();
        try {
            this.data = JSON.parse(fs.readFileSync(this.dataPath, "utf8"));
            this.data.game_data_path = this.gameDataFolder;
            console.log('[GameDataHelper] Successfully Loaded game-specific data!');
            if(this.statusCallback) this.statusCallback("ok (loaded)");
            if(!this.has('events')) {
                console.log("[GameDataHelper] Event Data store not found for this game! Creating...");
                this.update('events', {}, true);
            }

            return true;
        } catch(err) {
            console.log('[GameDataHelper] Error reading Game Data file:' + err.message);
            return false;
        }
    }

    saveData() {
        try {
            fs.writeFileSync(this.dataPath, JSON.stringify(this.data));
            console.log('[GameDataHelper] Game Data saved!');
            return true;
        } catch (err) {
            console.log('[GameDataHelper] Error writing Game Data file:' + err.message);
            return false;
        }
    }

    touchAutosave() {
        if(this.statusCallback) this.statusCallback("changed");
        clearTimeout(this.autoSaveTimeout);
        this.autoSaveTimeout = setTimeout(() => {
            if(this.statusCallback) this.statusCallback("saving");
            this.saveData();
            if(this.statusCallback) this.statusCallback("ok (saved)");
        },2000);
    }

    has(field) {
        let pathArr = field.split(".");
        let targetItem = pathArr.pop();
        let focusObject = this.data;

        pathArr.forEach((pathItem) => {
            if(!focusObject.hasOwnProperty(pathItem)) return false;
            focusObject = focusObject[pathItem];
        });

        if(!focusObject.hasOwnProperty(targetItem)) return false;
        return true;
    }

    read(field)
    {
        let pathArr = field.split(".");
        let targetItem = pathArr.pop();
        let focusObject = this.data;

        pathArr.forEach((pathItem) => {
            if(!focusObject.hasOwnProperty(pathItem)) return undefined;
            focusObject = focusObject[pathItem];
        });

        if(focusObject === null || !focusObject.hasOwnProperty(targetItem)) return undefined;
        return focusObject[targetItem];
    }

    update(field, value, create=false) {
        let pathArr = field.split(".");
        let targetField = pathArr.pop();
        let focusObject = this.data;

        pathArr.forEach((pathItem) => {
            if(!focusObject.hasOwnProperty(pathItem)) {
                if(!create) return false;
                focusObject[pathItem] = {};
            }
            focusObject = focusObject[pathItem];
        });

        if(!focusObject.hasOwnProperty(targetField)) {
            if (!create) return false;
            focusObject[targetField] = {};
        }

        focusObject[targetField] = value;
        this.touchAutosave();
        return true;
    }

    delete(field)
    {
        let pathArr = field.split(".");
        let targetItem = pathArr.pop();
        let focusObject = this.data;
        pathArr.forEach((pathItem) => {
            if(!focusObject.hasOwnProperty(pathItem)) {
                return false;
            }
            focusObject = focusObject[pathItem];
        });

        if(!focusObject.hasOwnProperty(targetItem)) {
            return false;
        }
        delete focusObject[targetItem];
        this.touchAutosave();
        return true;
    }

    getAllData() {
        return this.data;
    }

    setAllData(value) {
        this.data = value;
        this.touchAutosave();
    }

    checkFilename(folder, filename) {
        let append = "";

        while (fs.existsSync(this.gameDataFolder + "/"+folder+"/" + filename.substr(0, filename.lastIndexOf(".")) + append + filename.substr(filename.lastIndexOf("."))))
            append = append == "" ? 2 : (append + 1);

        let finalFilename = filename.substr(0, filename.lastIndexOf(".")) + append + filename.substr(filename.lastIndexOf("."));
        let returnval = {
            filePath: this.gameDataFolder + "/"+folder+"/" + finalFilename,
            filename: finalFilename
        };
        console.log(returnval);
        return returnval;
    }

    uploadThrow(filePath, filename)
    {
        try {
            let fileInfo = this.checkFilename("throws", filename);
            console.log(fileInfo);
            console.log('Filepath: ' + filePath);
            fs.copyFileSync(filePath, fileInfo.filePath);
            let throwId = uuid.v1();
            let throwItem = {
                "id": throwId,
                "enabled": true,
                "location": fileInfo.filename,
                "weight": 1.0,
                "scale": 1.0,
                "sound": null,
                "volume": 1.0,
                "customs": []
            }
            this.update(`throws.${throwId}`, throwItem, true);
            console.log('[GameDataHelper] Successfully uploaded new item!');
            return {
                success: true,
                item: throwItem
            };
        } catch (err) {
            console.log('[GameDataHelper] Error uploading item: ' + err.message);
            return { success: false };
        }
    }

    uploadImpact(filePath, filename)
    {
        try {
            let fileInfo = this.checkFilename("impacts", filename);
            fs.copyFileSync(filePath, fileInfo.filePath);
            let impactId = uuid.v1();
            let impactItem = {
                "id": impactId,
                "enabled": false,
                "location": fileInfo.filename,
                "volume": 1.0,
                "customs": [],
            }
            this.update(`impacts.${impactId}`, impactItem, true);
            console.log('[GameDataHelper] Successfully uploaded new sound!');
            return {
                success: true,
                item: impactItem
            };
        } catch (err) {
            console.log('[GameDataHelper] Error uploading sound: ' + err.message);
            return { success: false };
        }
    }

    createCustomBonk() {
        let bonkDefaults = this.bonkDefaultsCallback();
        let bonkId = uuid.v1();
        let customBonkItem = {
            "id": bonkId,
            "name": "New Bonk",
            "barrageCount": 1,
            "barrageFrequencyOverride": false,
            "barrageFrequency": bonkDefaults.barrageFrequency,
            "throwDurationOverride": false,
            "throwDuration": bonkDefaults.throwDuration,
            "throwAngleOverride": false,
            "throwAngleMin": bonkDefaults.throwAngleMin,
            "throwAngleMax": bonkDefaults.throwAngleMax,
            "spinSpeedOverride": false,
            "spinSpeedMin": bonkDefaults.spinSpeedMin,
            "spinSpeedMax": bonkDefaults.spinSpeedMax,
            "itemsOverride": false,
            "soundsOverride": false,
            "impactDecals": [],
            "windupSounds": [],
            "windupDelay": 0,
            "throwAway": false
        }

        for(const [key, item] of Object.entries(this.read('throws'))) {
            if (item.enabled) {
                let customs = this.read(`throws.${key}.customs`);
                customs.push(bonkId);
                this.update(`throws.${key}.customs`, customs);
            }
        }
        for(const [key, item] of Object.entries(this.read('impacts'))) {
            if (item.enabled) {
                let customs = this.read(`impacts.${key}.customs`);
                customs.push(bonkId);
                this.update(`impacts.${key}.customs`, customs);
            }
        }

        this.update(`customBonks.${bonkId}`, customBonkItem, true);
        console.log('[GameDataHelper] Successfully created new bonk!');
        return {
            success: true,
            item: customBonkItem,
        };
    }

    clearCustomBonk(bonkId) {
        for(const [key, item] of Object.entries(this.read('throws'))) {
            let customs = this.read(`throws.${key}.customs`);
            if(customs.includes(bonkId)) {
                customs.splice(customs.indexOf(bonkId),1);
                this.update(`throws.${key}.customs`, customs);
            }
        }
        for(const [key, item] of Object.entries(this.read('impacts'))) {
            let customs = this.read(`impacts.${key}.customs`);
            if(customs.includes(bonkId)) {
                customs.splice(customs.indexOf(bonkId),1);
                this.update(`impacts.${key}.customs`, customs);
            }
        }
    }

    uploadDecal(filePath, filename, bonkId)
    {
        try {
            let fileInfo = this.checkFilename("decals", filename);
            fs.copyFileSync(filePath, fileInfo.filePath);
            let decalId = uuid.v1();
            let decalItem = {
                "id": decalId,
                "enabled": true,
                "location": fileInfo.filename,
                "scale": 1,
                "duration": 0.25,
            }
            this.update(`customBonks.${bonkId}.impactDecals.${decalId}`, decalItem, true);
            console.log('[GameDataHelper] Successfully uploaded new decal!');
            return {
                success: true,
                item: decalItem,
            };
        } catch (err) {
            console.log('[GameDataHelper] Error uploading decal: ' + err.message);
            return { success: false };
        }
    }
    uploadWindup(filePath, filename, bonkId)
    {
        try {
            let fileInfo = this.checkFilename("decals", filename);
            fs.copyFileSync(filePath, fileInfo.filePath);
            let windupId = uuid.v1();
            let windupItem = {
                "id": windupId,
                "enabled": true,
                "location": fileInfo.filename,
                "volume": 1,
            }
            this.update(`customBonks.${bonkId}.windupSounds.${windupId}`, windupItem, true);
            console.log('[GameDataHelper] Successfully uploaded new windup!');
            return {
                success: true,
                item: windupItem,
            };
        } catch (err) {
            console.log('[GameDataHelper] Error uploading windup: ' + err.message);
            return { success: false };
        }
    }
}