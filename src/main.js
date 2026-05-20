import { createApp } from "vue";
import piniaPluginPersistedstate from "pinia-plugin-persistedstate";
import App from "./App.vue";
import Antd from "ant-design-vue";
import router from "./router";
import VueApexCharts from "vue3-apexcharts";
import Vue3Toastify from "vue3-toastify";
import "vue3-toastify/dist/index.css";

import "./style.css";
import "ant-design-vue/dist/reset.css";
import { createPinia } from "pinia";

const app = createApp(App);

const pinia = createPinia();
pinia.use(piniaPluginPersistedstate);

app
  .use(router)
  .use(Antd)
  .use(VueApexCharts)
  .use(pinia)
  .use(Vue3Toastify, {
    autoClose: 2000,
    position: "top-right",
  })
  .mount("#app");
