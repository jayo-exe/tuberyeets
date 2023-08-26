import Vue from 'vue'
import VueRouter from 'vue-router'
import ItemList from '../views/Library/Items/ItemList.vue'
import SoundList from '../views/Library/Sounds/SoundList.vue'
import ItemGroupList from '../views/Library/ItemGroups/ItemGroupList.vue'
import TriggerList from '../views/Triggers/TriggerList.vue'

Vue.use(VueRouter)

const routes = [
  {
    path: '/',
    name: 'home',
    redirect: { path: "/settings" }
  },
  {
    path: '/overlay/setup',
    name: 'overlay.setup',
    component: () => import(/* webpackChunkName: "calibration" */ '../views/CalibrationView.vue')
  },
  {
    path: '/overlay/items',
    name: 'overlay.items',
    component: ItemList
  },
  {
    path: '/overlay/sounds',
    name: 'overlay.sounds',
    component: SoundList
  },
  {
    path: '/overlay/item-groups',
    name: 'overlay.item-groups',
    component: ItemGroupList
  },
  {
    path: '/triggers',
    name: 'triggers',
    component: TriggerList
  },
  {
    path: '/settings',
    name: 'settings',
    component: () => import(/* webpackChunkName: "settings" */ '../views/Settings/SettingsView.vue')
  },
]

const router = new VueRouter({
  routes
})

export default router
