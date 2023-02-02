const path = require('path');
const fs = require('fs');

module.exports = class AppDataHelper {


    constructor(userDataPath) {
        this.appData = null;
        this.userDataPath = userDataPath
        this.dataPath = path.join(userDataPath, 'tuberyeets-data.json');
        this.defaultDataPath = path.resolve(__static, 'data/defaultData.json');
        this.defaultData = JSON.parse(fs.readFileSync(this.defaultDataPath, "utf8"));
        this.defaultData.sys_sep = path.sep;
    }

    //load data from the file, create it if it doesn't exist
    loadData() {
        if (!fs.existsSync(this.dataPath))
            fs.writeFileSync(this.dataPath, JSON.stringify(this.defaultData));
        this.appData = JSON.parse(fs.readFileSync(this.dataPath, "utf8"));
        console.log('[AppDataHelper] App Data loaded!');
    }

    saveData() {
        try {
            fs.writeFileSync(this.dataPath, JSON.stringify(this.appData));
        } catch (err) {
            console.log('Error writing App Data file:' + err.message);
        }
        console.log('[AppDataHelper] App Data saved!');
    }

    hasFieldData(field) {
        return this.appData.hasOwnProperty(field);
    }

    getFieldData(field)
    {
        return this.appData[field];
    }

    getAllData() {
        return this.appData;
    }

    setFieldData(field, value) {
        this.appData[field] = value;
    }

    setAllData(value) {
        this.appData = value;
    }



}