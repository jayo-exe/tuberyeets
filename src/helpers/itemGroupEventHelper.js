module.exports = class ItemGroupEventHelper {
    constructor(gameDataHelper) {
        this.gameData = gameDataHelper;
    }

    getItemGroup(itemGroupId) {
        return this.gameData.read(`itemGroups.${itemGroupId}`);
    }

    getItemById(itemId) {
        let itemData = this.gameData.read(`throws`);

        if (!itemData.hasOwnProperty(itemId)) {
            return null;
        }

        let selectedItem = itemData[itemId];

        let soundData = this.gameData.read(`impacts`);
        let defaultSounds = Object.keys(soundData).reduce((previous, current) => {
            if (soundData[current].enabled) previous[current] = soundData[current];
            return previous;
        }, {});
        let defaultSoundIds = Object.keys(defaultSounds);
        let selectedSound = null;
        if(selectedItem.sound && soundData.hasOwnProperty(selectedItem.sound)) {
            selectedSound = soundData[selectedItem.sound];
        } else if(defaultSoundIds.length > 0) {
            selectedSound = soundData[defaultSoundIds[Math.floor(Math.random()*defaultSoundIds.length)]];
        }

        return {
            "image": selectedItem.location,
            "weight": selectedItem.weight,
            "scale": selectedItem.scale,
            "sound": selectedSound ? selectedSound.location : null,
            "volume": selectedItem.volume * (selectedSound ? selectedSound.volume : 1),
        };
    }

    // Acquire an image, sound, and associated properties for an item group
    getItemForGroup(itemGroupId) {
        let itemGroupData = this.gameData.read(`itemGroups.${itemGroupId}`);

        //Get item to use
        let itemData = this.gameData.read(`throws`);
        let defaultItems = Object.keys(itemData).reduce((previous, current) => {
            if (itemData[current].enabled) previous[current] = itemData[current];
            return previous;
        }, {});
        let defaultItemIds = Object.keys(defaultItems);
        let validItemIds = [];
        let selectedItem = null;
        itemGroupData.items.forEach((itemKey) => {
            if(itemData.hasOwnProperty(itemKey)) {
                validItemIds.push(itemKey);
            }
        });
        if (itemGroupData.items.length > 0) {
            selectedItem = itemData[validItemIds[Math.floor(Math.random()*validItemIds.length)]];
        } else if(defaultItemIds.length > 0) {
            selectedItem = itemData[defaultItemIds[Math.floor(Math.random()*defaultItemIds.length)]];
        }


        let soundData = this.gameData.read(`impacts`);
        let defaultSounds = Object.keys(soundData).reduce((previous, current) => {
            if (soundData[current].enabled) previous[current] = soundData[current];
            return previous;
        }, {});
        let defaultSoundIds = Object.keys(defaultSounds);
        let validSoundIds = [];
        let selectedSound = null;
        itemGroupData.sounds.forEach((soundKey) => {
            if(soundData.hasOwnProperty(soundKey)) {
                validSoundIds.push(soundKey);
            }
        });
        if (itemGroupData.sounds.length > 0) {
            selectedSound = soundData[validSoundIds[Math.floor(Math.random()*validSoundIds.length)]];
        } else if(selectedItem.sound && soundData.hasOwnProperty(selectedItem.sound)) {
            selectedSound = soundData[selectedItem.sound];
        } else if(defaultSoundIds.length > 0) {
            selectedSound = soundData[defaultSoundIds[Math.floor(Math.random()*defaultSoundIds.length)]];
        }


        return {
            "image": selectedItem.location,
            "weight": selectedItem.weight,
            "scale": selectedItem.scale,
            "sound": selectedSound ? selectedSound.location : null,
            "volume": selectedItem.volume * (selectedSound ? selectedSound.volume : 1),
            "impactDecal": null,
            "windupSound": null
        };
    }

// Acquire a set of images, sounds, and associated properties for an item group
    getItemsForGroup(itemGroupId,customCount=null)
    {
        let itemGroupData = this.gameData.read(`itemGroups.${itemGroupId}`);
        let itemsForGroup = [];
        if(customCount == null) customCount = itemGroupData.groupCount;
        for (let i = 0; i < customCount; i++) {
            console.log(itemGroupId,customCount,i);
            itemsForGroup.push(this.getItemForGroup(itemGroupId));
        }

        return itemsForGroup;
    }
}