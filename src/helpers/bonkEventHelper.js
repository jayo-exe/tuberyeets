module.exports = class BonkEventHelper {
    constructor(gameDataHelper) {
        this.gameData = gameDataHelper;
    }

    getCustomBonk(customName) {
        let data = this.gameData.getAllData();
        if(data.customBonks.hasOwnProperty(customName)) {
            return data.customBonks[customName];
        }
        return false;
    }

    hasActiveImage()
    {
        let data = this.gameData.getAllData();
        if (data.throws == null || data.throws.length == 0)
            return false;

        let active = false;
        for (let i = 0; i < data.throws.length; i++)
        {
            if (data.throws[i].enabled)
            {
                active = true;
                break;
            }
        }
        return active;
    }

    hasActiveImageCustom(customName)
    {
        let data = this.gameData.getAllData();
        if (!data.customBonks[customName].itemsOverride)
            return this.hasActiveImage();

        if (data.throws == null || data.throws.length == 0)
            return false;

        let active = false;
        for (let i = 0; i < data.throws.length; i++)
        {
            if (data.throws[i].customs.includes(customName))
            {
                active = true;
                break;
            }
        }
        return active;
    }

    hasActiveImpactDecal(customName)
    {
        let data = this.gameData.getAllData();
        if (data.customBonks[customName].impactDecals == null || data.customBonks[customName].impactDecals.length == 0)
            return false;

        let active = false;
        for (let i = 0; i < data.customBonks[customName].impactDecals.length; i++)
        {
            if (data.customBonks[customName].impactDecals[i].enabled)
            {
                active = true;
                break;
            }
        }
        return active;
    }

    hasActiveWindupSound(customName)
    {
        let data = this.gameData.getAllData();
        if (data.customBonks[customName].windupSounds == null || data.customBonks[customName].windupSounds.length == 0)
            return false;

        let active = false;
        for (let i = 0; i < data.customBonks[customName].windupSounds.length; i++)
        {
            if (data.customBonks[customName].windupSounds[i].enabled)
            {
                active = true;
                break;
            }
        }
        return active;
    }

    hasActiveSound()
    {
        let data = this.gameData.getAllData();
        if (data.impacts == null || data.impacts.length == 0)
            return false;

        let active = false;
        for (let i = 0; i < data.impacts.length; i++)
        {
            if (data.impacts[i].enabled)
            {
                active = true;
                break;
            }
        }
        return active;
    }

    hasActiveSoundCustom(customName)
    {
        let data = this.gameData.getAllData();
        if (!data.customBonks[customName].soundsOverride)
            return this.hasActiveSound();

        if (data.impacts == null || data.impacts.length == 0)
            return false;

        let active = false;
        for (let i = 0; i < data.impacts.length; i++)
        {
            if (data.impacts[i].customs.includes(customName))
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
        let data = this.gameData.getAllData();
        let index;
        do {
            index = Math.floor(Math.random() * data.throws.length);
        } while (!data.throws[index].enabled);

        let soundIndex = -1;
        if (this.hasActiveSound())
        {
            do {
                soundIndex = Math.floor(Math.random() * data.impacts.length);
            } while (!data.impacts[soundIndex].enabled);
        }

        return {
            "location": data.throws[index].location,
            "weight": data.throws[index].weight,
            "scale": data.throws[index].scale,
            "sound": data.throws[index].sound != null ? data.throws[index].sound : soundIndex != -1 ? data.impacts[soundIndex].location : null,
            "volume": data.throws[index].volume * (soundIndex != -1 ? data.impacts[soundIndex].volume : 1)
        };
    }

    // Acquire a set of images, sounds, and associated properties for a default barrage
    getImagesWeightsScalesSoundsVolumes(customAmount)
    {
        let data = this.gameData.getAllData();
        let getImagesWeightsScalesSoundsVolumes = [];

        let count = customAmount == null ? data.barrageCount : customAmount;
        for (let i = 0; i < count; i++)
            getImagesWeightsScalesSoundsVolumes.push(this.getImageWeightScaleSoundVolume());

        return getImagesWeightsScalesSoundsVolumes;
    }

    // Acquire an image, sound, and associated properties for a custom bonk
    getCustomImageWeightScaleSoundVolume(customName)
    {
        let data = this.gameData.getAllData();
        let index;
        if (data.customBonks[customName].itemsOverride && this.hasActiveImageCustom(customName))
        {
            do {
                index = Math.floor(Math.random() * data.throws.length);
            } while (!data.throws[index].customs.includes(customName));
        }
        else
        {
            do {
                index = Math.floor(Math.random() * data.throws.length);
            } while (!data.throws[index].enabled);
        }

        let soundIndex = -1;
        if (data.customBonks[customName].soundsOverride && this.hasActiveSoundCustom(customName))
        {
            do {
                soundIndex = Math.floor(Math.random() * data.impacts.length);
            } while (!data.impacts[soundIndex].customs.includes(customName));
        }
        else if (this.hasActiveSound())
        {
            do {
                soundIndex = Math.floor(Math.random() * data.impacts.length);
            } while (!data.impacts[soundIndex].enabled);
        }

        let impactDecalIndex = -1;
        if (this.hasActiveImpactDecal(customName))
        {
            do {
                impactDecalIndex = Math.floor(Math.random() * data.customBonks[customName].impactDecals.length);
            } while (!data.customBonks[customName].impactDecals[impactDecalIndex].enabled);
        }

        let windupSoundIndex = -1;
        if (this.hasActiveWindupSound(customName))
        {
            do {
                windupSoundIndex = Math.floor(Math.random() * data.customBonks[customName].windupSounds.length);
            } while (!data.customBonks[customName].windupSounds[windupSoundIndex].enabled);
        }

        return {
            "location": data.throws[index].location,
            "weight": data.throws[index].weight,
            "scale": data.throws[index].scale,
            "sound": data.throws[index].sound != null ? data.throws[index].sound : (soundIndex != -1 ? data.impacts[soundIndex].location : null),
            "volume": data.throws[index].volume * (soundIndex != -1 ? data.impacts[soundIndex].volume : 1),
            "impactDecal": impactDecalIndex != -1 ? data.customBonks[customName].impactDecals[impactDecalIndex] : null,
            "windupSound": windupSoundIndex != -1 ? data.customBonks[customName].windupSounds[windupSoundIndex] : null
        };
    }

// Acquire a set of images, sounds, and associated properties for a custom bonk
    getCustomImagesWeightsScalesSoundsVolumes(customName,customCount=null)
    {
        let data = this.gameData.getAllData();
        let getImagesWeightsScalesSoundsVolumes = [];
        if(customCount == null) {
            customCount = data.customBonks[customName].barrageCount;
        }
        for (let i = 0; i < customCount; i++)
            getImagesWeightsScalesSoundsVolumes.push(this.getCustomImageWeightScaleSoundVolume(customName));

        return getImagesWeightsScalesSoundsVolumes;
    }
}