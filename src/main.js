import Vue from 'vue'
import App from './App.vue'
import router from './router'
import { BootstrapVue } from 'bootstrap-vue'

Vue.config.productionTip = false;

Vue.use(BootstrapVue)
import 'bootstrap/dist/css/bootstrap.css';
import 'bootstrap-vue/dist/bootstrap-vue.css';

import vSelect from 'vue-select';
import 'vue-select/dist/vue-select.css';

//import custom styles
import '../public/style.css';
import '../public/style-new.scss';
import '../public/style-cc2.scss';
import '../public/vselect-theme.scss';

Vue.component('v-select', vSelect);

Vue.prototype.$agentStatus = {
  "statusData": {},
  "setData": function(data) {
    this.statusData = data;
  },
  "getStatus": function(agent) {
    if(this.statusData.hasOwnProperty(agent)) {
      return this.statusData[agent];
    }
    return null;
  }
}

Vue.prototype.$appData = {
  "read": function(field) {
    return window.ipc.invoke('APP_CRUD', 'read', {field:field});
  },
  "readSync": function(field) {
    return window.ipc.sendSync('APP_CRUD_SYNC', 'read', {field:field});
  },
  "update": function(field, value, create=false) {
    return window.ipc.invoke('APP_CRUD', 'update', {field:field, value:value, create:create});
  },
  "updateSync": function(field, value, create=false) {
    return window.ipc.sendSync('APP_CRUD_SYNC', 'update', {field:field, value:value, create:create});
  },
  "delete": function(field) {
    return window.ipc.invoke('APP_CRUD', 'delete', {field:field});
  },
  "deleteSync": function(field) {
    return window.ipc.sendSync('APP_CRUD_SYNC', 'delete', {field:field});
  },
  "getAgentDetails": function() {
    return window.ipc.invoke('GET_AGENT_DETAILS');
  },
  "getAgentSettings": function(agentKey) {
    return window.ipc.invoke('GET_AGENT_SETTINGS', {agentKey:agentKey});
  },
  "getOverlayPath": function() {
    return window.ipc.invoke('GET_OVERLAY_PATH');
  },
  "hasAgentSettingField": function(agentKey, field) {
    return window.ipc.invoke('HAS_AGENT_SETTING_FIELD', {agentKey:agentKey, field:field});
  },
  "getAgentSettingField": function(agentKey, field) {
    return window.ipc.invoke('GET_AGENT_SETTING_FIELD', {agentKey:agentKey, field:field});
  },
  "setAgentSettingField": function(agentKey, field, value) {
    return window.ipc.invoke('SET_AGENT_SETTING_FIELD', {agentKey:agentKey, field:field, value:value});
  },
  "enableAgent": function(agentKey) {
    return window.ipc.invoke('ENABLE_AGENT', {agentKey:agentKey});
  },
  "disableAgent": function(agentKey) {
    return window.ipc.invoke('DISABLE_AGENT', {agentKey:agentKey});
  },
  "restartAgent": function(agentKey) {
    return window.ipc.invoke('RESTART_AGENT', {agentKey:agentKey});
  },
}

Vue.prototype.$gameData = {
  "read": function(field) {
    return window.ipc.invoke('GAME_CRUD', 'read', {field:field});
  },
  "readSync": function(field) {
    return window.ipc.sendSync('GAME_CRUD_SYNC', 'read', {field:field});
  },
  "update": function(field, value, create=false) {
    return window.ipc.invoke('GAME_CRUD', 'update', {field:field, value:value, create:create});
  },
  "updateSync": function(field, value, create=false) {
    return window.ipc.sendSync('GAME_CRUD_SYNC', 'update', {field:field, value:value, create:create});
  },
  "delete": function(field) {
    return window.ipc.invoke('GAME_CRUD', 'delete', {field:field});
  },
  "deleteSync": function(field) {
    return window.ipc.sendSync('GAME_CRUD_SYNC', 'delete', {field:field});
  },
  "uploadItem": function(filePath, filename) {
    return window.ipc.invoke('UPLOAD_ITEM', {filePath:filePath, filename:filename});
  },
  "uploadSound": function(filePath, filename) {
    return window.ipc.invoke('UPLOAD_SOUND', {filePath:filePath, filename:filename});
  },
  "uploadDecal": function(filePath, filename,itemGroupId) {
    return window.ipc.invoke('UPLOAD_DECAL', {filePath:filePath, filename:filename, itemGroupId:itemGroupId});
  },
  "uploadWindup": function(filePath, filename, itemGroupId) {
    return window.ipc.invoke('UPLOAD_WINDUP', {filePath:filePath, filename:filename, itemGroupId:itemGroupId});
  },
  "createItemGroup": function() {
    return window.ipc.invoke('CREATE_ITEM_GROUP');
  },
  "clearItemGroup": function(itemGroupId) {
    return window.ipc.invoke('CLEAR_ITEM_GROUP', {itemGroupId:itemGroupId});
  },
  "createTrigger": function(agentKey, eventKey) {
    return window.ipc.invoke('CREATE_TRIGGER', {agentKey:agentKey, eventKey:eventKey});
  },
  "getEventTypes": function() {
    return window.ipc.invoke('GET_EVENT_TYPES');
  },
  "getEventSettings": function(agentKey, eventKey) {
    return window.ipc.invoke('GET_EVENT_SETTINGS', {agentKey:agentKey, eventKey:eventKey});
  },
  "createTriggerCommand": function(triggerId, scriptName, agentKey, actionKey) {
    return window.ipc.invoke('CREATE_COMMAND', {triggerId:triggerId, scriptName:scriptName, agentKey:agentKey, actionKey:actionKey});
  },
  "getActionTypes": function() {
    return window.ipc.invoke('GET_ACTION_TYPES');
  },
  "getActionSettings": function(agentKey, actionKey) {
    return window.ipc.invoke('GET_ACTION_SETTINGS', {agentKey:agentKey, actionKey:actionKey});
  },
  "getCommandDetails": function(agentKey, actionKey, values) {
    return window.ipc.invoke('GET_COMMAND_DETAILS', {agentKey:agentKey, actionKey:actionKey, values:values});
  },
}

new Vue({
  router,
  render: h => h(App)
}).$mount('#app')
