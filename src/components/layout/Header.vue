<template>
  <header class="hd">
    <div class="hd-left">
      <button
        type="button"
        class="hd-toggle"
        :aria-label="isDesktop ? 'Toggle sidebar' : 'Open menu'"
        @click="toggleSidebar"
      >
        <MenuOutlined v-if="!isDesktop" />
        <MenuUnfoldOutlined v-else-if="sidebarCollapsed" />
        <MenuFoldOutlined v-else />
      </button>

      <div class="hd-titles">
        <nav class="hd-crumbs" aria-label="Breadcrumb">
          <router-link :to="{ name: 'dashboard' }" class="hd-crumb hd-crumb-home">
            <HomeOutlined />
          </router-link>
          <template v-for="crumb in currentPage().trail" :key="crumb">
            <RightOutlined class="hd-crumb-sep" />
            <span class="hd-crumb">{{ crumb }}</span>
          </template>
          <RightOutlined class="hd-crumb-sep" />
          <span class="hd-crumb hd-crumb-current">{{ currentPage().title }}</span>
        </nav>
        <h1 class="hd-title">{{ currentPage().title }}</h1>
      </div>
    </div>

    <div class="hd-right">
      <a-dropdown :trigger="['click']" placement="bottomRight">
        <button type="button" class="hd-user">
          <span class="hd-avatar">{{ initials() }}</span>
          <span class="hd-user-text">
            <span class="hd-user-name">{{ user.name || "User" }}</span>
            <span v-if="user.role" class="hd-user-role">{{ user.role }}</span>
          </span>
          <DownOutlined class="hd-user-caret" />
        </button>

        <template #overlay>
          <div class="hd-menu">
            <div class="hd-menu-profile">
              <span class="hd-avatar hd-avatar-lg">{{ initials() }}</span>
              <div class="hd-menu-profile-text">
                <div class="hd-menu-name">{{ user.name || "User" }}</div>
                <div v-if="user.email" class="hd-menu-email">{{ user.email }}</div>
                <span v-if="user.role" class="hd-menu-role">{{ user.role }}</span>
              </div>
            </div>
            <div class="hd-menu-divider"></div>
            <button type="button" class="hd-menu-item hd-menu-logout" @click="logoutUser(router)">
              <LogoutOutlined />
              <span>Logout</span>
            </button>
          </div>
        </template>
      </a-dropdown>
    </div>
  </header>
</template>

<script setup>
import { useRoute, useRouter } from "vue-router";
import {
  MenuOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  HomeOutlined,
  RightOutlined,
  DownOutlined,
  LogoutOutlined,
} from "@ant-design/icons-vue";
import { pageMeta } from "./navigation.js";
import { isDesktop, sidebarCollapsed, toggleSidebar, logoutUser } from "./useLayout.js";

const route = useRoute();
const router = useRouter();

const user = {
  name: localStorage.getItem("name") || "",
  email: localStorage.getItem("email") || "",
  role: localStorage.getItem("role") || "",
};

const prettify = (name) =>
  String(name || "")
    .replace(/[-_]+/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());

const currentPage = () =>
  pageMeta[route.name] || { title: prettify(route.name), trail: [] };

const initials = () => {
  const parts = user.name.trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return "U";
  return (parts[0][0] + (parts.length > 1 ? parts[parts.length - 1][0] : "")).toUpperCase();
};
</script>

<style scoped>
.hd {
  position: sticky;
  top: 0;
  z-index: 10;
  height: 64px;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 0 16px;
  background: rgba(255, 255, 255, 0.92);
  backdrop-filter: saturate(180%) blur(8px);
  border-bottom: 1px solid #e5e9f0;
}
@media (min-width: 768px) {
  .hd {
    padding: 0 24px;
  }
}

.hd-left {
  display: flex;
  align-items: center;
  gap: 14px;
  min-width: 0;
}

.hd-toggle {
  display: grid;
  place-items: center;
  width: 40px;
  height: 40px;
  flex-shrink: 0;
  border-radius: 10px;
  border: 1px solid #e5e9f0;
  background: #fff;
  color: #334155;
  font-size: 17px;
  transition: background-color 0.15s ease, color 0.15s ease, border-color 0.15s ease;
}
.hd-toggle:hover {
  background: #f1f5f9;
  color: #0f172a;
  border-color: #d5dbe5;
}
.hd-toggle:focus-visible,
.hd-user:focus-visible {
  outline: 2px solid #34d399;
  outline-offset: 2px;
}

.hd-titles {
  min-width: 0;
  display: flex;
  flex-direction: column;
  justify-content: center;
}
.hd-crumbs {
  display: none;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: #94a3b8;
  line-height: 1.2;
  white-space: nowrap;
  overflow: hidden;
}
@media (min-width: 640px) {
  .hd-crumbs {
    display: flex;
  }
}
.hd-crumb-home {
  color: #94a3b8;
  display: inline-flex;
}
.hd-crumb-home:hover {
  color: #0f1c3f;
}
.hd-crumb-sep {
  font-size: 8px;
  color: #cbd5e1;
}
.hd-crumb-current {
  color: #475569;
  font-weight: 500;
  overflow: hidden;
  text-overflow: ellipsis;
}
.hd-title {
  margin: 2px 0 0;
  font-size: 17px;
  font-weight: 650;
  color: #0f172a;
  line-height: 1.25;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.hd-right {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
}

.hd-user {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 4px;
  border-radius: 999px;
  background: transparent;
  transition: background-color 0.15s ease;
}
@media (min-width: 768px) {
  .hd-user {
    padding: 4px 12px 4px 4px;
  }
}
.hd-user:hover {
  background: #f1f5f9;
}
.hd-avatar {
  display: grid;
  place-items: center;
  width: 36px;
  height: 36px;
  flex-shrink: 0;
  border-radius: 50%;
  background: linear-gradient(135deg, #10b981 0%, #0f1c3f 100%);
  color: #fff;
  font-size: 13px;
  font-weight: 600;
  letter-spacing: 0.5px;
}
.hd-user-text {
  display: none;
  flex-direction: column;
  align-items: flex-start;
  line-height: 1.2;
  max-width: 180px;
}
@media (min-width: 768px) {
  .hd-user-text {
    display: flex;
  }
}
.hd-user-name {
  font-size: 13.5px;
  font-weight: 600;
  color: #0f172a;
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.hd-user-role {
  font-size: 11.5px;
  color: #64748b;
  text-transform: capitalize;
}
.hd-user-caret {
  display: none;
  font-size: 10px;
  color: #94a3b8;
}
@media (min-width: 768px) {
  .hd-user-caret {
    display: inline-flex;
  }
}

/* Dropdown (teleported, but scoped attrs are kept on slot content) */
.hd-menu {
  width: 260px;
  padding: 8px;
  background: #fff;
  border-radius: 12px;
  border: 1px solid #eef1f5;
  box-shadow: 0 12px 32px rgba(15, 23, 42, 0.14);
}
.hd-menu-profile {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px;
}
.hd-avatar-lg {
  width: 44px;
  height: 44px;
  font-size: 15px;
}
.hd-menu-profile-text {
  min-width: 0;
}
.hd-menu-name {
  font-size: 14px;
  font-weight: 600;
  color: #0f172a;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.hd-menu-email {
  font-size: 12px;
  color: #64748b;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.hd-menu-role {
  display: inline-block;
  margin-top: 4px;
  padding: 1px 8px;
  font-size: 11px;
  font-weight: 500;
  color: #047857;
  background: #ecfdf5;
  border-radius: 999px;
  text-transform: capitalize;
}
.hd-menu-divider {
  height: 1px;
  margin: 4px 0;
  background: #eef1f5;
}
.hd-menu-item {
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  padding: 9px 10px;
  border-radius: 8px;
  font-size: 13.5px;
  color: #334155;
  background: transparent;
  text-align: left;
  transition: background-color 0.15s ease, color 0.15s ease;
}
.hd-menu-logout:hover {
  background: #fef2f2;
  color: #dc2626;
}
</style>
