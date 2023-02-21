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
import '../public/style-new.css';

Vue.component('v-select', vSelect)

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
  }
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
  "uploadThrow": function(filePath, filename) {
    return window.ipc.invoke('UPLOAD_THROW', {filePath:filePath, filename:filename});
  },
  "uploadImpact": function(filePath, filename) {
    return window.ipc.invoke('UPLOAD_IMPACT', {filePath:filePath, filename:filename});
  },
  "uploadDecal": function(filePath, filename,bonkId) {
    return window.ipc.invoke('UPLOAD_DECAL', {filePath:filePath, filename:filename, bonkId:bonkId});
  },
  "uploadWindup": function(filePath, filename, bonkId) {
    return window.ipc.invoke('UPLOAD_WINDUP', {filePath:filePath, filename:filename, bonkId:bonkId});
  },
  "createBonk": function() {
    return window.ipc.invoke('CREATE_BONK');
  },
  "clearBonk": function(bonkId) {
    return window.ipc.invoke('CLEAR_BONK', {bonkId:bonkId});
  },
}

new Vue({
  router,
  render: h => h(App)
}).$mount('#app')
