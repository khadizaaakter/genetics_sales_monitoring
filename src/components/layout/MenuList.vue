<template>
  <a-menu
    class=""
    v-model:selectedKeys="selectedKeys"
    :open-keys="openKeys"
    theme="dark"
    mode="inline"
  >
    <a-menu-item key="evaluation-criteria" v-if="hasPermission('kra')">
      <router-link :to="{ name: 'evaluation-criteria' }"> </router-link>
      <UserOutlined />
      <span>Evaluation Criteria</span>
    </a-menu-item>
    <a-menu-item
      key="behavioural-factor"
      v-if="hasPermission('behavioural-factor')"
    >
      <router-link
        :to="{ name: 'behavioural-factor' }"
        class="flex items-center"
      >
        <ProfileOutlined />
        <span>Behavioural Factor</span>
      </router-link>
    </a-menu-item>
    <a-menu-item key="kra" v-if="hasPermission('kra')">
      <router-link :to="{ name: 'kra' }" class="flex items-center">
        <ProfileOutlined />
        <span>KRA</span>
      </router-link>
    </a-menu-item>
    <a-menu-item key="kpis" v-if="hasPermission('kpis')">
      <router-link :to="{ name: 'kpis' }" class="flex items-center">
        <ProfileOutlined />
        <span>KPIS</span>
      </router-link>
    </a-menu-item>
    <a-menu-item
      key="evalution-degree"
      v-if="hasPermission('evalution-degree')"
    >
      <router-link :to="{ name: 'evalution-degree' }" class="flex items-center">
        <ProfileOutlined />
        <span> 360&#176; Evaluation</span>
      </router-link>
    </a-menu-item>

    <!-- <a-sub-menu key="" disabled>
      <template #title>
        <ProfileOutlined />
        <span>PMS Control Panel</span>
      </template>
      <a-menu-item key="">
        <router-link :to="{ name: '' }">
          KPI Ach. Entry Permission
        </router-link>
      </a-menu-item>
      <a-menu-item key="">
        <router-link :to="{ name: '' }">
          360&#176; Evaluation Permission
        </router-link>
      </a-menu-item>
      <a-menu-item key="">
        <router-link :to="{ name: '' }">
          Values Assessment Permission
        </router-link>
      </a-menu-item>
    </a-sub-menu> -->

    <a-menu-item key="copy-kpi" v-if="hasPermission('copy-kpi')">
      <router-link :to="{ name: 'copy-kpi' }"> </router-link>
      <ProfileOutlined />
      <span>Copy KPI</span>
    </a-menu-item>

    <!-- <a-menu-item key="" disabled>
      <router-link :to="{ name: '' }"> </router-link>
      <ProfileOutlined />
      <span>Project Management</span>
    </a-menu-item> -->

    <!-- <a-menu-item key="" disabled>
      <router-link :to="{ name: '' }"> </router-link>
      <ProfileOutlined />
      <span>Strategy Map Mapping</span>
    </a-menu-item> -->

    <!-- <a-menu-item key="user-management" >
      <router-link :to="{ name: 'user-management' }">
        <team-outlined />
        <span>Role Management</span>
      </router-link>
    </a-menu-item> -->

    <!-- product category  -->
    <a-menu-item key="product-category">
      <router-link :to="{ name: 'product-category' }">
        <AppstoreOutlined />
        <span>Product Category</span>
      </router-link>
    </a-menu-item>
    <!-- product list -->
    <a-menu-item key="product-list">
      <router-link :to="{ name: 'product-list' }">
        <UnorderedListOutlined />
        <span>Product List</span>
      </router-link>
    </a-menu-item>

    <a-menu-item @click="handleLogout($router)" key="18">
      <logout-outlined />
      <span>Logout</span>
    </a-menu-item>
  </a-menu>
</template>

<script setup>
import { useRoute } from "vue-router";
import Cookies from "js-cookie";
import {
  ProfileOutlined,
  UserOutlined,
  TeamOutlined,
  LogoutOutlined,
  AppstoreOutlined,
  UnorderedListOutlined,
} from "@ant-design/icons-vue";
import { ref, watch } from "vue";

const route = useRoute();

const selectedKeys = ref([route?.name]);
const openKeys = ref([]);

// Get and store user permissions
const user_permissions = ref(
  JSON.parse(localStorage.getItem("user_permissions") || "[]")
);

// Function to check if user has a permission
const hasPermission = (permission) => {
  return user_permissions.value.includes(permission);
};

const handleLogout = (router) => {
  Cookies.remove("token");
  localStorage.removeItem("staff_id");
  localStorage.removeItem("name");
  localStorage.removeItem("user_permissions");
  // localStorage.clear();
  router.push({ name: "login" });
};

watch(
  () => route?.path,
  () => {
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
  background: #355bb4 !important;
  border-left: 5px solid #50b8e4 !important;
}

.ant-menu-sub {
  background: transparent !important;
}
/* .bg {
  background-color: #292e66 !important;
} */

/* element.style {
  background-color: #2d2d61;
} */
</style>
