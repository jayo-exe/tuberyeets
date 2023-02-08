const path = require('path');
const fs = require('fs');
const uuid = require('uuid');
const BonkEventHelper = require('./helpers/bonkEventHelper');
const EventDataHelper = require('./helpers/eventDataHelper');

module.exports = class GameDataHelper {

    constructor(userDataPath,staticPath) {
        this.userDataPath = userDataPath;
        this.gameDataPath = path.join(this.userDataPath, 'gamedata');
        this.defaultGameDataPath = path.resolve(staticPath, 'data/defaultGameData.json');
        this.defaultGameData = JSON.parse(fs.readFileSync(this.defaultGameDataPath, "utf8"));
        this.bonkEventHelper = new BonkEventHelper(this);
        this.eventData = new EventDataHelper(this);
        this.gameId = null;
        this.gameDataFolder = null;
        this.dataPath = null;
        this.gameData = null;
    }

    checkGameFolder() {
        if (!fs.existsSync(this.gameDataPath))
            fs.mkdirSync(this.gameDataPath);

        const gamePath = path.join(this.gameDataPath, this.gameId.toString());
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
            this.gameData = JSON.parse(fs.readFileSync(this.dataPath, "utf8"));
            this.gameData.game_data_path = this.gameDataFolder;
            console.log('[GameDataHelper] Successfully Loaded game-specific data!');
            if(!this.hasFieldData('events')) {
                console.log("[GameDataHelper] Event Data store not found for this game! Creating...");
                this.setFieldData('events', {});
            }
            return true;
        } catch(err) {
            console.log('[GameDataHelper] Error reading Game Data file:' + err.message);
            return false;
        }
    }

    saveData() {
        try {
            fs.writeFileSync(this.dataPath, JSON.stringify(this.gameData));
            console.log('[GameDataHelper] Game Data saved!');
            return true;
        } catch (err) {
            console.log('[GameDataHelper] Error writing Game Data file:' + err.message);
            return false;
        }
    }

    hasFieldData(field) {
        return this.gameData.hasOwnProperty(field);
    }

    getFieldData(field)
    {
        return this.gameData[field];
    }

    getAllData() {
        return this.gameData;
    }

    setFieldData(field, value) {
        this.gameData[field] = value;
    }

    setAllData(value) {
        this.gameData = value;
    }

    checkFilename(folder, filename) {
        let append = "";

        while (fs.existsSync(this.gameDataPath + "/"+folder+"/" + filename.substr(0, filename.lastIndexOf(".")) + append + filename.substr(filename.lastIndexOf("."))))
            append = append == "" ? 2 : (append + 1);

        let finalFilename = filename.substr(0, filename.lastIndexOf(".")) + append + filename.substr(filename.lastIndexOf("."));
        return {
            filePath: this.gameDataPath + "/"+folder+"/" + finalFilename,
            filename: finalFilename
        };
    }

    uploadThrow(filePath, filename)
    {
        try {
            let fileInfo = this.checkFilename(this.gameId, "throws", filename);
            fs.copyFileSync(filePath, fileInfo.filePath);
            let throwItem = {
                "enabled": true,
                "location": fileInfo.filename,
                "weight": 1.0,
                "scale": 1.0,
                "sound": null,
                "volume": 1.0,
                "customs": []
            }
            console.log('[GameDataHelper] Successfully uploaded new item!');
            return {
                success: true,
                throw_item: throwItem
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
            let impactItem = {
                "enabled": false,
                "location": fileInfo.filename,
                "volume": 1.0,
                "customs": [],
            }
            console.log('[GameDataHelper] Successfully uploaded new sound!');
            return {
                success: true,
                impact_item: impactItem
            };
        } catch (err) {
            console.log('[GameDataHelper] Error uploading sound: ' + err.message);
            return { success: false };
        }
    }

    uploadDecal(filePath, filename, currentBonk)
    {
        try {
            let fileInfo = this.checkFilename(this.gameId, "decals", filename);
            fs.copyFileSync(filePath, fileInfo.filePath);
            let decalItem = {
                "enabled": true,
                "location": fileInfo.filename,
                "scale": 1,
                "duration": 0.25,
            }
            console.log('[GameDataHelper] Successfully uploaded new decal!');
            return {
                success: true,
                decal_item: decalItem,
                current_bonk: currentBonk
            };
        } catch (err) {
            console.log('[GameDataHelper] Error uploading decal: ' + err.message);
            return { success: false };
        }
    }
    uploadWindup(filePath, filename, currentBonk)
    {
        try {
            let fileInfo = this.checkFilename(this.gameId, "decals", filename);
            fs.copyFileSync(filePath, fileInfo.filePath);
            let windupItem = {
                "enabled": true,
                "location": fileInfo.filename,
                "volume": 1,
            }
            console.log('[GameDataHelper] Successfully uploaded new windup!');
            return {
                success: true,
                windup_item: windupItem,
                current_bonk: currentBonk
            };
        } catch (err) {
            console.log('[GameDataHelper] Error uploading windup: ' + err.message);
            return { success: false };
        }
    }
}