const path = require('path');
const fs = require('fs');
const uuid = require('uuid');

module.exports = class AppDataHelper {


    constructor(userDataPath) {
        this.data = null;
        this.userDataPath = userDataPath
        this.dataPath = path.join(userDataPath, 'tuberyeets-data.json');
        this.defaultDataPath = path.resolve(__static, 'data/defaultData.json');
        this.defaultData = JSON.parse(fs.readFileSync(this.defaultDataPath, "utf8"));
        this.statusCallback = null;
        this.autoSaveTimeout = null;

        this.defaultData.sys_sep = path.sep;
    }

    //load data from the file, create it if it doesn't exist
    loadData() {
        if (!fs.existsSync(this.dataPath))
            fs.writeFileSync(this.dataPath, JSON.stringify(this.defaultData));
        this.data = JSON.parse(fs.readFileSync(this.dataPath, "utf8"));
        console.log('[AppDataHelper] App Data loaded!');
    }

    saveData() {
        try {
            fs.writeFileSync(this.dataPath, JSON.stringify(this.data));
            console.log('[AppDataHelper] App Data saved!');
            return true;
        } catch (err) {
            console.log('Error writing App Data file:' + err.message);
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
            if(!focusObject.hasOwnProperty(pathItem)) return false;
            focusObject = focusObject[pathItem];
        });

        if(!focusObject.hasOwnProperty(targetItem)) return false;
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

}