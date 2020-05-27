import Vue from 'vue'
import App from './App.vue'
import router from '@config/router.js'
import store from '@config/store'
import '@config/extend.js'
import ElementUI from 'element-ui';
import 'element-ui/lib/theme-chalk/index.css';
Vue.use(ElementUI);
new Vue({
  store,
  router,
  render: h => h(App)
}).$mount('#app')
