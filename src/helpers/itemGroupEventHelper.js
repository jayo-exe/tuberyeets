module.exports = class ItemGroupEventHelper {
    constructor(gameDataHelper) {
        this.gameData = gameDataHelper;
    }

    log(...messages) {
        console.group(`${new Date().toISOString()} [GameDataHelper]`);
        for (const message of messages) {
            console.log(message);
        }
        console.groupEnd();
    }

    getItemGroup(itemGroupId) {
        return this.gameData.read(`itemGroups.${itemGroupId}`);
    }

    getItemById(itemId) {
        let itemData = this.gameData.read(`items`);

        if (!itemData.hasOwnProperty(itemId)) {
            return null;
        }

        let selectedItem = itemData[itemId];

        let soundData = this.gameData.read(`sounds`);
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

    getItemPoolForGroup(itemGroupId, itemGroupData, itemData) {

        let defaultItems = Object.keys(itemData).reduce((previous, current) => {
            if (itemData[current].enabled) previous[current] = itemData[current];
            return previous;
        }, {});
        let defaultItemIds = Object.keys(defaultItems);
        let validItemIds = [];
        let invalidItemIds = [];
        let selectedItem = null;
        Object.keys(itemGroupData.items).forEach((itemKey) => {
            if(itemData.hasOwnProperty(itemKey)) {
                for (var i = 0; i < itemGroupData.items[itemKey].chance; i++) {
                    validItemIds.push(itemKey);
                }
            } else {
                invalidItemIds.push(itemKey);
            }
        });

        if(invalidItemIds.length > 0) {
            invalidItemIds.forEach(itemId => {
                delete itemGroupData.items[itemId];
            });
            this.gameData.update(`itemGroups.${itemGroupId}.items`, itemGroupData.items);
        }

        if(validItemIds.length === 0) {
            return defaultItemIds;
        }
        return validItemIds;
    }

    getSoundPoolForGroup(itemGroupId, itemGroupData, soundData) {

        let defaultSounds = Object.keys(soundData).reduce((previous, current) => {
            if (soundData[current].enabled) previous[current] = soundData[current];
            return previous;
        }, {});

        let defaultSoundIds = Object.keys(defaultSounds);
        let invalidSoundIds = [];
        let validSoundIds = [];

        itemGroupData.sounds.forEach((soundKey) => {
            if(soundData.hasOwnProperty(soundKey)) {
                validSoundIds.push(soundKey);
            } else {
                invalidSoundIds.push(soundKey);
            }
        });

        if(invalidSoundIds.length > 0) {
            invalidSoundIds.forEach(soundId => {
                delete itemGroupData.sounds[soundId];
            });
            this.gameData.update(`itemGroups.${itemGroupId}.sounds`, itemGroupData.sounds);
        }

        if (validSoundIds.length === 0) {
            return defaultSoundIds;
        } else {
            return validSoundIds;
        }
    }

    // Acquire an image, sound, and associated properties for an item group
    getItemForGroup(itemGroupData, itemPool, itemData, soundPool, soundData, maxValue) {


        //Get item to use
        //create temporary pool without any items with value over maxValue, use this pool for selection
        let tempItemPool = [];
        itemPool.forEach(itemKey => {
           if(itemGroupData.items[itemKey].value <= maxValue) {
               tempItemPool.push(itemKey);
           }
        });

        let selectedItemId = '';
        if (tempItemPool.length > 0) {
            selectedItemId = tempItemPool[Math.floor(Math.random()*tempItemPool.length)];
        } else {
            return null;
        }

        let selectedSoundId = '';
        if (soundPool.length > 0) {
            selectedSoundId = soundPool[Math.floor(Math.random()*soundPool.length)];
        }

        //TODO: determine item scaling with size fuzzing

        return {
            "image": itemData[selectedItemId].location,
            "weight": itemData[selectedItemId].weight,
            "scale": itemData[selectedItemId].scale,
            "sound": selectedSoundId ? soundData[selectedSoundId].location : null,
            "volume": itemData[selectedItemId].volume * (selectedSoundId ? soundData[selectedSoundId].volume : 1),
            "value": itemGroupData.items[selectedItemId].value,
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
        let itemData = this.gameData.read(`items`);
        let itemPool = this.getItemPoolForGroup(itemGroupId, itemGroupData, itemData);
        let soundData = this.gameData.read(`sounds`);
        let soundPool = this.getSoundPoolForGroup(itemGroupId, itemGroupData, soundData);

        for (let i = 0; i < customCount; i++) {
            let newItem = this.getItemForGroup(itemGroupData, itemPool, itemData, soundPool, soundData, customCount - i)
            if(newItem) {
                itemsForGroup.push(newItem);
                i = (i + (newItem.value - 1));
                //this.log(`Item selected with a value of ${newItem.value}. Only need to find items for ${customCount - i} more units`);
            }
        }

        return itemsForGroup;
    }
}