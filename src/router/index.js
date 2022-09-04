import Vue from 'vue'
import VueRouter from 'vue-router'
import LibraryView from '../views/LibraryView.vue'

Vue.use(VueRouter)

const routes = [
  {
    path: '/',
    name: 'library',
    component: LibraryView
  },
  {
    path: '/calibration',
    name: 'calibration',
    component: () => import(/* webpackChunkName: "calibration" */ '../views/CalibrationView.vue')
  },
  {
    path: '/settings',
    name: 'settings',
    component: () => import(/* webpackChunkName: "settings" */ '../views/SettingsView.vue')
  },
]

const router = new VueRouter({
  routes
})

export default router
