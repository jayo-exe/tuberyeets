import Vue from 'vue'
import App from './App.vue'
import router from './router'
import { BootstrapVue } from 'bootstrap-vue'

Vue.config.productionTip = false

import 'bootstrap-vue/dist/bootstrap-vue.css'
Vue.use(BootstrapVue)

import vSelect from 'vue-select';
import 'vue-select/dist/vue-select.css';

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
  }
}

new Vue({
  router,
  render: h => h(App)
}).$mount('#app')
