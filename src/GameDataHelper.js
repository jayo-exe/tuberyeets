const path = require('path');
const fs = require('fs');

module.exports = class GameDataHelper {

    constructor(userDataPath) {
        this.userDataPath = userDataPath;
        this.gameDataPath = path.join(this.userDataPath, 'gamedata');
        this.defaultGameDataPath = path.resolve(__static, 'data/defaultGameData.json');
        this.defaultGameData = JSON.parse(fs.readFileSync(this.defaultGameDataPath, "utf8"));

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

    getCustomBonk(customName) {
        if(this.gameData.customBonks.hasOwnProperty(customName)) {
            return this.gameData.customBonks[customName];
        }
        return false;
    }

    hasActiveImage()
    {
        if (this.gameData.throws == null || this.gameData.throws.length == 0)
            return false;

        var active = false;
        for (var i = 0; i < this.gameData.throws.length; i++)
        {
            if (this.gameData.throws[i].enabled)
            {
                active = true;
                break;
            }
        }
        return active;
    }

    hasActiveImageCustom(customName)
    {
        if (!this.gameData.customBonks[customName].itemsOverride)
            return this.hasActiveImage();

        if (this.gameData.throws == null || this.gameData.throws.length == 0)
            return false;

        var active = false;
        for (var i = 0; i < this.gameData.throws.length; i++)
        {
            if (this.gameData.throws[i].customs.includes(customName))
            {
                active = true;
                break;
            }
        }
        return active;
    }

    hasActiveImpactDecal(customName)
    {
        if (this.gameData.customBonks[customName].impactDecals == null || this.gameData.customBonks[customName].impactDecals.length == 0)
            return false;

        var active = false;
        for (var i = 0; i < this.gameData.customBonks[customName].impactDecals.length; i++)
        {
            if (this.gameData.customBonks[customName].impactDecals[i].enabled)
            {
                active = true;
                break;
            }
        }
        return active;
    }

    hasActiveWindupSound(customName)
    {
        if (this.gameData.customBonks[customName].windupSounds == null || this.gameData.customBonks[customName].windupSounds.length == 0)
            return false;

        var active = false;
        for (var i = 0; i < this.gameData.customBonks[customName].windupSounds.length; i++)
        {
            if (this.gameData.customBonks[customName].windupSounds[i].enabled)
            {
                active = true;
                break;
            }
        }
        return active;
    }

    hasActiveSound()
    {
        if (this.gameData.impacts == null || this.gameData.impacts.length == 0)
            return false;

        var active = false;
        for (var i = 0; i < this.gameData.impacts.length; i++)
        {
            if (this.gameData.impacts[i].enabled)
            {
                active = true;
                break;
            }
        }
        return active;
    }

    hasActiveSoundCustom(customName)
    {
        if (!this.gameData.customBonks[customName].soundsOverride)
            return this.hasActiveSound();

        if (this.gameData.impacts == null || this.gameData.impacts.length == 0)
            return false;

        var active = false;
        for (var i = 0; i < this.gameData.impacts.length; i++)
        {
            if (this.gameData.impacts[i].customs.includes(customName))
            {
                active = true;
                break;
            }
        }
        return active;
    }

    // Acquire a random image, sound, and associated properties
    getImageWeightScaleSoundVolume()
    {
        var index;
        do {
            index = Math.floor(Math.random() * this.gameData.throws.length);
        } while (!this.gameData.throws[index].enabled);

        var soundIndex = -1;
        if (this.hasActiveSound())
        {
            do {
                soundIndex = Math.floor(Math.random() * this.gameData.impacts.length);
            } while (!this.gameData.impacts[soundIndex].enabled);
        }

        return {
            "location": this.gameData.throws[index].location,
            "weight": this.gameData.throws[index].weight,
            "scale": this.gameData.throws[index].scale,
            "sound": this.gameData.throws[index].sound != null ? this.gameData.throws[index].sound : soundIndex != -1 ? this.gameData.impacts[soundIndex].location : null,
            "volume": this.gameData.throws[index].volume * (soundIndex != -1 ? this.gameData.impacts[soundIndex].volume : 1)
        };
    }

    // Acquire a set of images, sounds, and associated properties for a default barrage
    getImagesWeightsScalesSoundsVolumes(customAmount)
    {
        var getImagesWeightsScalesSoundsVolumes = [];

        var count = customAmount == null ? this.gameData.barrageCount : customAmount;
        for (var i = 0; i < count; i++)
            getImagesWeightsScalesSoundsVolumes.push(this.getImageWeightScaleSoundVolume());

        return getImagesWeightsScalesSoundsVolumes;
    }

    // Acquire an image, sound, and associated properties for a custom bonk
    getCustomImageWeightScaleSoundVolume(customName)
    {
        var index;
        if (this.gameData.customBonks[customName].itemsOverride && this.hasActiveImageCustom(customName))
        {
            do {
                index = Math.floor(Math.random() * this.gameData.throws.length);
            } while (!this.gameData.throws[index].customs.includes(customName));
        }
        else
        {
            do {
                index = Math.floor(Math.random() * this.gameData.throws.length);
            } while (!this.gameData.throws[index].enabled);
        }

        var soundIndex = -1;
        if (this.gameData.customBonks[customName].soundsOverride && this.hasActiveSoundCustom(customName))
        {
            do {
                soundIndex = Math.floor(Math.random() * this.gameData.impacts.length);
            } while (!this.gameData.impacts[soundIndex].customs.includes(customName));
        }
        else if (this.hasActiveSound())
        {
            do {
                soundIndex = Math.floor(Math.random() * this.gameData.impacts.length);
            } while (!this.gameData.impacts[soundIndex].enabled);
        }

        var impactDecalIndex = -1;
        if (this.hasActiveImpactDecal(customName))
        {
            do {
                impactDecalIndex = Math.floor(Math.random() * this.gameData.customBonks[customName].impactDecals.length);
            } while (!this.gameData.customBonks[customName].impactDecals[impactDecalIndex].enabled);
        }

        var windupSoundIndex = -1;
        if (this.hasActiveWindupSound(customName))
        {
            do {
                windupSoundIndex = Math.floor(Math.random() * this.gameData.customBonks[customName].windupSounds.length);
            } while (!this.gameData.customBonks[customName].windupSounds[windupSoundIndex].enabled);
        }

        return {
            "location": this.gameData.throws[index].location,
            "weight": this.gameData.throws[index].weight,
            "scale": this.gameData.throws[index].scale,
            "sound": this.gameData.throws[index].sound != null ? this.gameData.throws[index].sound : (soundIndex != -1 ? this.gameData.impacts[soundIndex].location : null),
            "volume": this.gameData.throws[index].volume * (soundIndex != -1 ? this.gameData.impacts[soundIndex].volume : 1),
            "impactDecal": impactDecalIndex != -1 ? this.gameData.customBonks[customName].impactDecals[impactDecalIndex] : null,
            "windupSound": windupSoundIndex != -1 ? this.gameData.customBonks[customName].windupSounds[windupSoundIndex] : null
        };
    }

// Acquire a set of images, sounds, and associated properties for a custom bonk
    getCustomImagesWeightsScalesSoundsVolumes(customName,customCount=null)
    {
        var getImagesWeightsScalesSoundsVolumes = [];
        if(customCount == null) {
            customCount = this.gameData.customBonks[customName].barrageCount;
        }
        for (var i = 0; i < customCount; i++)
            getImagesWeightsScalesSoundsVolumes.push(this.getCustomImageWeightScaleSoundVolume(customName));

        return getImagesWeightsScalesSoundsVolumes;
    }

}