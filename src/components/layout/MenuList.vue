<template>
  <a-menu
    class=""
    v-model:selectedKeys="selectedKeys"
    v-model:openKeys="openKeys"
    theme="dark"
    mode="inline"
  >
    <!-- ================= BASIC ================= -->
    <a-menu-item-group>
      <template #title>
        <span class="menu-group-title">Main Menu</span>
      </template>

      <!-- Settings submenu -->
      <a-sub-menu key="settings">
        <template #title>
          <span class="flex items-center">
            <SettingOutlined />
            <span class="ml-2">Product</span>
          </span>
        </template>
        <a-menu-item key="product-category">
          <router-link :to="{ name: 'product-category' }">
            <span>Product Category</span>
          </router-link>
        </a-menu-item>
        <a-menu-item key="product-list">
          <router-link :to="{ name: 'product-list' }">
            <span>Product List</span>
          </router-link>
        </a-menu-item>
      </a-sub-menu>
    </a-menu-item-group>

<!-- user -->
    <a-menu-item-group>
      <template #title>
        <span class="menu-group-title">User Management</span>
      </template>

      <a-menu-item key="user-management">
        <router-link :to="{ name: 'user-management' }">
          <SettingOutlined />
          <span>User Manager</span>
        </router-link>
      </a-menu-item>
      <a-menu-item key="role">
        <router-link :to="{ name: 'role' }">
          <SettingOutlined />
          <span>Role</span>
        </router-link>
      </a-menu-item>

      <a-menu-item key="user-permission">
        <router-link :to="{ name: 'user-permission' }">
          <SafetyOutlined />
          <span>Permissions</span>
        </router-link>
      </a-menu-item>
    </a-menu-item-group>

    <a-menu-item @click="handleLogout($router)" key="logout">
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
  LogoutOutlined,
  UnorderedListOutlined,
  SettingOutlined,
  DollarOutlined,
  BarChartOutlined,
  SafetyOutlined,
} from "@ant-design/icons-vue";
import { ref, watch } from "vue";

const route = useRoute();

const selectedKeys = ref([route?.name]);
const openKeys = ref([]);

// Map each child route name to its parent submenu key
const routeToSubmenu = {
  "product-category": "settings",
  "product-list": "settings",
};

const user_permissions = ref(
  JSON.parse(localStorage.getItem("user_permissions") || "[]")
);

const hasPermission = (permission) => {
  return user_permissions.value.includes(permission);
};

const handleLogout = (router) => {
  Cookies.remove("token");
  localStorage.removeItem("staff_id");
  localStorage.removeItem("name");
  localStorage.removeItem("user_permissions");
  router.push({ name: "login" });
};

watch(
  () => route?.name,
  (name) => {
    selectedKeys.value = [name];

    const parent = routeToSubmenu[name];
    if (parent && !openKeys.value.includes(parent)) {
      openKeys.value = [...openKeys.value, parent];
    }
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

/* Section group title (BASIC, REPORTS, MIS SETTINGS) */
.ant-menu-item-group-title {
  color: #ffffff !important;
  font-weight: 700 !important;
  letter-spacing: 1px;
  font-size: 13px !important;
  padding-top: 16px !important;
}

.menu-group-title {
  color: #ffffff;
  font-weight: 700;
  letter-spacing: 1px;
}

/* Bullet point for submenu items, like in the screenshot */
.ant-menu-sub .ant-menu-item .ant-menu-title-content::before {
  content: "•";
  color: #ffffff;
  margin-right: 10px;
  font-size: 18px;
  line-height: 1;
}
</style>
