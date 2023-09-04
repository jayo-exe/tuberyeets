const path = require('path');
const fs = require('fs');
const uuid = require('uuid');
const ItemGroupEventHelper = require('./itemGroupEventHelper');
const EventDataHelper = require('./eventDataHelper');

module.exports = class GameDataHelper {

    constructor(userFilesPath,staticPath) {
        this.data = null;
        this.userFilesPath = userFilesPath;
        this.dataPath = null;
        this.folderPath = path.join(this.userFilesPath, 'gamedata');
        this.defaultData = {
            "profiledata_format_version": 3,
            "items": {},
            "sounds": {},
            "itemGroups": {},
            "triggers": {}
        };
        this.statusCallback = null;
        this.itemGroupDefaultsCallback = null;
        this.autoSaveTimeout = null;

        this.itemGroupEventHelper = new ItemGroupEventHelper(this);
        this.eventData = new EventDataHelper(this);
        this.gameId = null;
        this.packId = null;
        this.gameDataFolder = null;

    }

    log(...messages) {
        console.group(`${new Date().toISOString()} [GameDataHelper]`);
        for (const message of messages) {
            console.log(message);
        }
        console.groupEnd();
    }

    setAgentRegistry(agentRegistry) {
        this.agentRegistry = agentRegistry;
    }

    checkGameFolder() {
        const packPath = path.join(this.folderPath, this.gameId.toString(), this.packId.toString());
        let subfolders = ['items', 'decals', 'sounds', 'windups'];

        subfolders.forEach(subfolder => {
            if (!fs.existsSync(path.join(packPath, subfolder))) {
                fs.mkdirSync(path.join(packPath, subfolder),{recursive: true});
            }
        })

        let dataPath = path.join(packPath, 'data.json');
        if (!fs.existsSync(dataPath)) {
            fs.writeFileSync(dataPath, JSON.stringify(this.defaultData));
        }

        this.gameDataFolder = packPath;
        this.dataPath = dataPath;
    }

    loadData(gameId, packId) {
        this.gameId = gameId;
        this.packId = packId;
        this.log('Attempting to load game-pack-specific data...');
        this.checkGameFolder();
        try {
            this.data = JSON.parse(fs.readFileSync(this.dataPath, "utf8"));
            this.data.game_data_path = this.gameDataFolder;
            this.log('Successfully Loaded game-specific data!');
            if(this.statusCallback) this.statusCallback("ok (loaded)");
            if(!this.has('events')) {
                this.log("Event Data store not found for this game! Creating...");
                this.update('events', {}, true);
            }

            return true;
        } catch(err) {
            this.log('Error reading Game Data file:' + err.message);
            return false;
        }
    }

    saveData() {
        try {
            fs.writeFileSync(this.dataPath, JSON.stringify(this.data));
            this.log('Game Data saved!');
            return true;
        } catch (err) {
            this.log('Error writing Game Data file:' + err.message);
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

    checkFilename(folder, filename) {
        let append = "";

        while (fs.existsSync(this.gameDataFolder + "/"+folder+"/" + filename.substr(0, filename.lastIndexOf(".")) + append + filename.substr(filename.lastIndexOf("."))))
            append = append == "" ? 2 : (append + 1);

        let finalFilename = filename.substr(0, filename.lastIndexOf(".")) + append + filename.substr(filename.lastIndexOf("."));
        let returnval = {
            filePath: this.gameDataFolder + "/"+folder+"/" + finalFilename,
            filename: finalFilename
        };
        this.log(returnval);
        return returnval;
    }

    uploadItem(filePath, filename)
    {
        try {
            let fileInfo = this.checkFilename("items", filename);
            this.log(fileInfo);
            this.log('Filepath: ' + filePath);
            fs.copyFileSync(filePath, fileInfo.filePath);
            let throwId = uuid.v1();
            let throwItem = {
                "id": throwId,
                "enabled": true,
                "name": fileInfo.filename,
                "location": fileInfo.filename,
                "weight": 1.0,
                "scale": 1.0,
                "sound": null,
                "volume": 1.0,
                "customs": []
            }
            this.update(`items.${throwId}`, throwItem, true);
            this.log('Successfully uploaded new item!');
            return {
                success: true,
                item: throwItem
            };
        } catch (err) {
            this.log('Error uploading item: ' + err.message);
            return { success: false };
        }
    }

    uploadSound(filePath, filename)
    {
        try {
            let fileInfo = this.checkFilename("sounds", filename);
            fs.copyFileSync(filePath, fileInfo.filePath);
            let impactId = uuid.v1();
            let impactItem = {
                "id": impactId,
                "enabled": false,
                "location": fileInfo.filename,
                "volume": 1.0,
                "customs": [],
            }
            this.update(`sounds.${impactId}`, impactItem, true);
            this.log('Successfully uploaded new sound!');
            return {
                success: true,
                item: impactItem
            };
        } catch (err) {
            this.log('Error uploading sound: ' + err.message);
            return { success: false };
        }
    }

    createItemGroup() {
        let itemGroupDefaults = this.itemGroupDefaultsCallback();
        let itemGroupId = uuid.v1();
        let itemGroupItem = {
            "id": itemGroupId,
            "name": "New Group",
            "groupCount": 1,
            "groupFrequencyOverride": false,
            "groupFrequency": itemGroupDefaults.groupFrequency,
            "throwDurationOverride": false,
            "throwDuration": itemGroupDefaults.throwDuration,
            "throwAngleOverride": false,
            "throwAngleMin": itemGroupDefaults.throwAngleMin,
            "throwAngleMax": itemGroupDefaults.throwAngleMax,
            "spinSpeedOverride": false,
            "spinSpeedMin": itemGroupDefaults.spinSpeedMin,
            "spinSpeedMax": itemGroupDefaults.spinSpeedMax,
            "items": [],
            "sounds": [],
            "impactDecals": [],
            "windupSounds": [],
            "windupDelay": 0,
            "throwAway": false
        }

        this.update(`itemGroups.${itemGroupId}`, itemGroupItem, true);
        this.log('Successfully created new item group!');
        return {
            success: true,
            item: itemGroupItem,
        };
    }

    clearItemGroup(itemGroupId) {

    }

    uploadDecal(filePath, filename, itemGroupId)
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
            this.update(`itemGroups.${itemGroupId}.impactDecals.${decalId}`, decalItem, true);
            this.log('Successfully uploaded new decal!');
            return {
                success: true,
                item: decalItem,
            };
        } catch (err) {
            this.log('Error uploading decal: ' + err.message);
            return { success: false };
        }
    }
    uploadWindup(filePath, filename, itemGroupId)
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
            this.update(`itemGroups.${itemGroupId}.windupSounds.${windupId}`, windupItem, true);
            this.log('Successfully uploaded new windup!');
            return {
                success: true,
                item: windupItem,
            };
        } catch (err) {
            this.log('Error uploading windup: ' + err.message);
            return { success: false };
        }
    }
}