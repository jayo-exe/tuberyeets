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
        this.autoSaveTimeout = null;

        this.bonkEventHelper = new BonkEventHelper(this);
        this.eventData = new EventDataHelper(this);
        this.gameId = null;
        this.gameDataFolder = null;

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
        this.checkGameFolder();
        try {
            this.data = JSON.parse(fs.readFileSync(this.dataPath, "utf8"));
            this.data.game_data_path = this.gameDataFolder;
            console.log('[GameDataHelper] Successfully Loaded game-specific data!');
            if(!this.has('events')) {
                console.log("[GameDataHelper] Event Data store not found for this game! Creating...");
                this.update('events', {}, true);
            }
            this.upgradeLegacyData();
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

        if(!focusObject.hasOwnProperty(targetItem)) return undefined;
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

    upgradeLegacyData() {
        let changes_made = false;
        for(const [bonkName, bonkItem] of Object.entries(this.data.customBonks)) {
            if(!bonkItem.hasOwnProperty('id')) {
                changes_made = true;
                let bonkId = uuid.v1();
                this.data.customBonks[bonkId] = bonkItem;
                this.data.customBonks[bonkId].id = bonkId;
                delete this.data.customBonks[bonkName];

                if(Array.isArray(this.data.customBonks[bonkId].impactDecals)) {
                    let decalsNew = {};
                    this.data.customBonks[bonkId].impactDecals.forEach((decalItem) => {
                        let decalId = uuid.v1();
                        decalsNew[decalId] = decalItem;
                        decalsNew[decalId].id = decalId;
                    });
                    this.data.customBonks[bonkId].impactDecals = decalsNew;
                }

                if(Array.isArray(this.data.customBonks[bonkId].windupSounds)) {
                    let windupsNew = {};
                    this.data.customBonks[bonkId].windupSounds.forEach((windupItem) => {
                        let windupId = uuid.v1();
                        windupsNew[windupId] = windupItem;
                        windupsNew[windupId].id = windupId;
                    });
                    this.data.customBonks[bonkId].windupSounds = windupsNew;
                }
            }
        }

        if(Array.isArray(this.data.impacts)) {
            changes_made = true;
            let impactsNew = {};
            this.data.impacts.forEach((impactItem) => {
                let impactId = uuid.v1();
                impactsNew[impactId] = impactItem;
                impactsNew[impactId].id = impactId;

                if(Array.isArray(impactsNew[impactId].customs)) {
                    let customsNew = [];
                    impactsNew[impactId].customs.forEach((customItem) => {
                        for(const [bonkId, bonkItem] of Object.entries(this.data.customBonks)) {
                            if(bonkItem.name === customItem) customsNew.push(bonkId);
                        }
                    });
                    impactsNew[impactId].customs = customsNew;
                }
            });
            this.data.impacts = impactsNew;
        }

        if(Array.isArray(this.data.throws)) {
            changes_made = true;
            let throwsNew = {};
            this.data.throws.forEach((throwItem) => {
                let throwId = uuid.v1();
                throwsNew[throwId] = throwItem;
                throwsNew[throwId].id = throwId;

                if(Array.isArray(throwsNew[throwId].customs)) {
                    let customsNew = [];
                    throwsNew[throwId].customs.forEach((customItem) => {
                        for(const [bonkId, bonkItem] of Object.entries(this.data.customBonks)) {
                            if(bonkItem.name === customItem) customsNew.push(bonkId);
                        }
                    });
                    throwsNew[throwId].customs = customsNew;
                }
            });
            this.data.throws = throwsNew;
        }

        for(const [eventName, eventItem] of Object.entries(this.data.crowdControlEvents)) {
            if(!eventItem.hasOwnProperty('id')) {
                changes_made = true;
                let eventId = uuid.v1();
                this.data.crowdControlEvents[eventId] = eventItem;
                this.data.crowdControlEvents[eventId].id = eventId;
                delete this.data.crowdControlEvents[eventName];

                for(const [bonkId, bonkItem] of Object.entries(this.data.customBonks)) {
                    if(bonkItem.name === this.data.crowdControlEvents[eventId].bonkType) this.data.crowdControlEvents[eventId].bonkId = bonkId;
                }
            }
        }

        if(changes_made) this.touchAutosave();
    }

    checkFilename(folder, filename) {
        let append = "";

        while (fs.existsSync(this.dataPath + "/"+folder+"/" + filename.substr(0, filename.lastIndexOf(".")) + append + filename.substr(filename.lastIndexOf("."))))
            append = append == "" ? 2 : (append + 1);

        let finalFilename = filename.substr(0, filename.lastIndexOf(".")) + append + filename.substr(filename.lastIndexOf("."));
        return {
            filePath: this.dataPath + "/"+folder+"/" + finalFilename,
            filename: finalFilename
        };
    }

    uploadThrow(filePath, filename)
    {
        try {
            let fileInfo = this.checkFilename(this.gameId, "throws", filename);
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
                throwItem: throwItem
            };
        } catch (err) {
            console.log('[GameDataHelper] Error uploading item: ' + err.message);
            return { success: false };
        }
    }

    uploadImpact(filePath, filename)
    {
        try {
            let fileInfo = this.checkFilename(this.gameId, "impacts", filename);
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
                impactItem: impactItem
            };
        } catch (err) {
            console.log('[GameDataHelper] Error uploading sound: ' + err.message);
            return { success: false };
        }
    }

    uploadDecal(filePath, filename, bonkId)
    {
        try {
            let fileInfo = this.checkFilename(this.gameId, "decals", filename);
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
                decalItem: decalItem,
            };
        } catch (err) {
            console.log('[GameDataHelper] Error uploading decal: ' + err.message);
            return { success: false };
        }
    }
    uploadWindup(filePath, filename, bonkId)
    {
        try {
            let fileInfo = this.checkFilename(this.gameId, "decals", filename);
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
                windupItem: windupItem,
            };
        } catch (err) {
            console.log('[GameDataHelper] Error uploading windup: ' + err.message);
            return { success: false };
        }
    }
}