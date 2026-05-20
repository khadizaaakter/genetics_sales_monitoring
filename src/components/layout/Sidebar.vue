<template>
  <a-layout-sider
    v-model:collapsed="collapsed"
    collapsible
    class="overflow-y-auto whitespace-nowrap bg"
  >
    <div
      class="text-uppercase advance text-white text-xl py-4 text-center px-2 logo-text ps-4"
    >
      <router-link :to="{ name: 'product-category' }"
        >Genetics Sales <span class="font-bold">Monitoring</span>
      </router-link>
    </div>
    <div
      class="text-uppercase pms text-white text-2xl py-4 text-center px-2 logo-text ps-4"
    >
      <!-- <span class="font-bold">PMS</span> -->
    </div>
    <MenuList />
  </a-layout-sider>
</template>

<script setup>
import { useRoute } from "vue-router";
import MenuList from "./MenuList.vue";

import { ref, watch } from "vue";

const route = useRoute();

const collapsed = ref(false);
const openKeys = ref([]);

watch(
  () => route?.path,
  () => {
    // console.log(route?.path);
    openKeys.value = [route?.path?.split("/")?.at(1)];
  },
  { immediate: true }
);
</script>

<style>
.ant-menu {
  padding: 0 !important;
}

.ant-menu-item {
  border-radius: 0 !important;
}

.ant-menu-item-selected {
  background: #152a5a !important;
  border-left: 5px solid #50b8e4 !important;
}

.ant-menu-sub {
  background: transparent !important;
}

.ant-layout-sider-has-trigger {
  flex: 0 0 400px !important;
  max-width: 400px !important;
  min-width: 400px !important;
  width: 400px !important;
}

.ant-layout-sider-has-trigger .ant-layout-sider-trigger {
  width: 250px !important;
}

.ant-layout-sider-collapsed {
  flex: 0 0 400px !important;
  max-width: 4100px !important;
  min-width: 400px !important;
  width: 400px !important;
}

.ant-layout-sider-collapsed .ant-layout-sider-trigger {
  width: 400px !important;
}

.ant-menu-title-content {
  display: flex;
  align-items: center;
}

.ant-layout-sider-has-trigger .pms {
  display: none;
}

.ant-layout-sider-collapsed .advance {
  display: none;
}

.ant-layout-sider-collapsed .pms {
  display: block;
}

.bg {
  background-color: #292e66 !important;
}
</style>
