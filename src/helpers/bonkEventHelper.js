module.exports = class BonkEventHelper {
    constructor(gameDataHelper) {
        this.gameData = gameDataHelper;
    }

    getCustomBonk(customName) {
        return this.gameData.read(`customBonks.${customName}`);
    }

    hasActiveImage()
    {
        let throwsData = this.gameData.read(`throws`);
        if (throwsData == null || throwsData.length == 0) return false;

        for (let i = 0; i < throwsData.length; i++)
        {
            if (throwsData[i].enabled) return true;
        }
        return false;
    }

    hasActiveImageCustom(customName)
    {
        if (this.gameData.read(`customBonks.${customName}.itemsOverride`)) return this.hasActiveImage();

        let throwsData = this.gameData.read(`throws`);
        if (throwsData == null || throwsData.length == 0) return false;

        for (let i = 0; i < throwsData.length; i++)
        {
            if (throwsData[i].customs.includes(customName)) return true;
        }
        return false;
    }

    hasActiveImpactDecal(customName)
    {
        let decalsData = this.gameData.read(`customBonks.${customName}.impactDecals`);
        if (decalsData == null || decalsData.length == 0) return false;

        for (let i = 0; i < decalsData.length; i++)
        {
            if (decalsData[i].enabled) return true;
        }
        return false;
    }

    hasActiveWindupSound(customName)
    {
        let windupsData = this.gameData.read(`customBonks.${customName}.windupSounds`);
        if (windupsData == null || windupsData.length == 0) return false;

        for (let i = 0; i < windupsData.length; i++)
        {
            if (windupsData[i].enabled) return true;
        }
        return false;
    }

    hasActiveSound()
    {
        let impactsData = this.gameData.read(`impacts`);
        if (impactsData == null || impactsData.length == 0) return false;

        for (let i = 0; i < impactsData.length; i++)
        {
            if (impactsData[i].enabled) return true;
        }
        return false;
    }

    hasActiveSoundCustom(customName)
    {
        if (this.gameData.read(`customBonks.${customName}.soundsOverride`)) return this.hasActiveSound();

        let impactsData = this.gameData.read(`impacts`);
        if (impactsData == null || impactsData.length == 0) return false;

        for (let i = 0; i < impactsData.length; i++)
        {
            if (impactsData[i].customs.includes(customName)) return true;
        }
        return false;
    }

    // Acquire a random image, sound, and associated properties
    getImageWeightScaleSoundVolume()
    {
        let index;
        let throwsData = this.gameData.read(`throws`);
        let impactsData = this.gameData.read(`impacts`);
        do {
            index = Math.floor(Math.random() * throwsData.length);
        } while (!throwsData[index].enabled);

        let soundIndex = -1;
        if (this.hasActiveSound())
        {
            do {
                soundIndex = Math.floor(Math.random() * impactsData.length);
            } while (!impactsData[soundIndex].enabled);
        }

        return {
            "location": throwsData[index].location,
            "weight": throwsData[index].weight,
            "scale": throwsData[index].scale,
            "sound": throwsData[index].sound != null ? throwsData[index].sound : soundIndex != -1 ? impactsData[soundIndex].location : null,
            "volume": throwsData[index].volume * (soundIndex != -1 ? impactsData[soundIndex].volume : 1)
        };
    }

    // Acquire a set of images, sounds, and associated properties for a default barrage
    getImagesWeightsScalesSoundsVolumes(customAmount)
    {
        let getImagesWeightsScalesSoundsVolumes = [];

        let count = customAmount == null ? this.gameData.read('barrageCount') : customAmount;
        for (let i = 0; i < count; i++) {
            getImagesWeightsScalesSoundsVolumes.push(this.getImageWeightScaleSoundVolume());
        }

        return getImagesWeightsScalesSoundsVolumes;
    }

    // Acquire an image, sound, and associated properties for a custom bonk
    getCustomImageWeightScaleSoundVolume(customName)
    {
        let index;
        let throwsData = this.gameData.read(`throws`);
        let impactsData = this.gameData.read(`impacts`);
        let bonkData = this.gameData.read(`customBonks.${customName}`);
        if (bonkData.itemsOverride && this.hasActiveImageCustom(customName))
        {
            do {
                index = Math.floor(Math.random() * throwsData.length);
            } while (!throwsData[index].customs.includes(customName));
        }
        else
        {
            do {
                index = Math.floor(Math.random() * throwsData.length);
            } while (!throwsData[index].enabled);
        }

        let soundIndex = -1;
        if (bonkData.soundsOverride && this.hasActiveSoundCustom(customName))
        {
            do {
                soundIndex = Math.floor(Math.random() * impactsData.length);
            } while (!impactsData[soundIndex].customs.includes(customName));
        }
        else if (this.hasActiveSound())
        {
            do {
                soundIndex = Math.floor(Math.random() * impactsData.length);
            } while (!impactsData[soundIndex].enabled);
        }

        let impactDecalIndex = -1;
        if (this.hasActiveImpactDecal(customName))
        {
            do {
                impactDecalIndex = Math.floor(Math.random() * bonkData.impactDecals.length);
            } while (!bonkData.impactDecals[impactDecalIndex].enabled);
        }

        let windupSoundIndex = -1;
        if (this.hasActiveWindupSound(customName))
        {
            do {
                windupSoundIndex = Math.floor(Math.random() * bonkData.windupSounds.length);
            } while (!bonkData.windupSounds[windupSoundIndex].enabled);
        }

        return {
            "location": throwsData[index].location,
            "weight": throwsData[index].weight,
            "scale": throwsData[index].scale,
            "sound": throwsData[index].sound != null ? throwsData[index].sound : (soundIndex !== -1 ? impactsData[soundIndex].location : null),
            "volume": throwsData[index].volume * (soundIndex !== -1 ? impactsData[soundIndex].volume : 1),
            "impactDecal": impactDecalIndex !== -1 ? bonkData.impactDecals[impactDecalIndex] : null,
            "windupSound": windupSoundIndex !== -1 ? bonkData.windupSounds[windupSoundIndex] : null
        };
    }

// Acquire a set of images, sounds, and associated properties for a custom bonk
    getCustomImagesWeightsScalesSoundsVolumes(customName,customCount=null)
    {
        let bonkData = this.gameData.read(`customBonks.${customName}`);
        let getImagesWeightsScalesSoundsVolumes = [];
        if(customCount == null) customCount = bonkData.barrageCount;

        for (let i = 0; i < customCount; i++) {
            getImagesWeightsScalesSoundsVolumes.push(this.getCustomImageWeightScaleSoundVolume(customName));
        }

        return getImagesWeightsScalesSoundsVolumes;
    }
}