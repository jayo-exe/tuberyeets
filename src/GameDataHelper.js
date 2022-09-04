module.exports = class GameDataHelper {

    constructor() {
        this.gameData = null;
    }

    getGameData(gameData) {
        return this.gameData;
    }

    setGameData(gameData) {
        this.gameData = gameData;
    }

    // ----
// Data
// ----
// Get requested data, waiting for any current writes to finish first
    getData(field)
    {
        return this.gameData[field];
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