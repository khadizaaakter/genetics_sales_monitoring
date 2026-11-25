<template>
  <!-- Mobile backdrop -->
  <transition name="sb-fade">
    <div
      v-if="mobileSidebarOpen && !isDesktop"
      class="sb-backdrop"
      @click="closeMobileSidebar"
    ></div>
  </transition>

  <aside
    class="sb"
    :class="{ 'sb--collapsed': isSidebarCollapsed(), 'sb--open': mobileSidebarOpen }"
    aria-label="Main navigation"
  >
    <!-- Brand -->
    <div class="sb-brand">
      <router-link :to="{ name: 'product-category' }" class="sb-brand-link">
        <img :src="logo" alt="ACI" class="sb-logo" />
        <span class="sb-brand-text">
          <span class="sb-brand-title">Genetics Sales</span>
          <span class="sb-brand-sub">Monitoring</span>
        </span>
      </router-link>
      <button
        v-if="!isDesktop"
        type="button"
        class="sb-close"
        aria-label="Close menu"
        @click="closeMobileSidebar"
      >
        <CloseOutlined />
      </button>
    </div>

    <!-- Navigation -->
    <nav class="sb-nav">
      <template v-for="section in navSections" :key="section.key">
        <div v-if="canSee(section.permissions)" class="sb-section">
          <div class="sb-section-title">
            <span>{{ section.title }}</span>
          </div>

          <ul class="sb-list">
            <template v-for="item in section.items" :key="item.key">
              <li v-if="canSee(item.permissions)">
                <!-- Single link -->
                <a-tooltip
                  v-if="!item.children"
                  :title="isSidebarCollapsed() ? item.label : ''"
                  placement="right"
                >
                  <router-link
                    :to="{ name: item.route }"
                    class="sb-link"
                    :class="{ 'is-active': isItemActive(item) }"
                    @click="closeMobileSidebar"
                  >
                    <span class="sb-icon"><component :is="item.icon" /></span>
                    <span class="sb-label">{{ item.label }}</span>
                  </router-link>
                </a-tooltip>

                <!-- Group: collapsed => flyout -->
                <a-popover
                  v-else-if="isSidebarCollapsed()"
                  placement="rightTop"
                  overlay-class-name="sb-flyout"
                  :arrow="false"
                >
                  <template #content>
                    <div class="sb-flyout-title">{{ item.label }}</div>
                    <router-link
                      v-for="child in item.children"
                      :key="child.key"
                      :to="{ name: child.route }"
                      class="sb-flyout-link"
                      :class="{ 'is-active': isRouteActive(child.route) }"
                    >
                      {{ child.label }}
                    </router-link>
                  </template>
                  <button
                    type="button"
                    class="sb-link"
                    :class="{ 'is-active': isGroupActive(item) }"
                  >
                    <span class="sb-icon"><component :is="item.icon" /></span>
                    <span class="sb-label">{{ item.label }}</span>
                  </button>
                </a-popover>

                <!-- Group: expanded => accordion -->
                <template v-else>
                  <button
                    type="button"
                    class="sb-link"
                    :class="{ 'is-parent-active': isGroupActive(item) }"
                    :aria-expanded="isSubmenuOpen(item.key)"
                    @click="toggleSubmenu(item.key)"
                  >
                    <span class="sb-icon"><component :is="item.icon" /></span>
                    <span class="sb-label">{{ item.label }}</span>
                    <RightOutlined
                      class="sb-caret"
                      :class="{ 'is-open': isSubmenuOpen(item.key) }"
                    />
                  </button>
                  <div class="sb-sub" :class="{ 'is-open': isSubmenuOpen(item.key) }">
                    <ul class="sb-sub-inner">
                      <li v-for="child in item.children" :key="child.key">
                        <router-link
                          :to="{ name: child.route }"
                          class="sb-sublink"
                          :class="{ 'is-active': isRouteActive(child.route) }"
                          @click="closeMobileSidebar"
                        >
                          {{ child.label }}
                        </router-link>
                      </li>
                    </ul>
                  </div>
                </template>
              </li>
            </template>
          </ul>
        </div>
      </template>
    </nav>

    <!-- Footer -->
    <div class="sb-footer">
      <a-tooltip :title="isSidebarCollapsed() ? 'Logout' : ''" placement="right">
        <button type="button" class="sb-link sb-logout" @click="logoutUser(router)">
          <span class="sb-icon"><LogoutOutlined /></span>
          <span class="sb-label">Logout</span>
        </button>
      </a-tooltip>
    </div>
  </aside>
</template>

<script setup>
import { watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import { CloseOutlined, LogoutOutlined, RightOutlined } from "@ant-design/icons-vue";
import logo from "@/assets/images/aci-logo.png";
import { navSections } from "./navigation.js";
import {
  isDesktop,
  mobileSidebarOpen,
  openSubmenus,
  isSidebarCollapsed,
  closeMobileSidebar,
  toggleSubmenu,
  ensureSubmenuOpen,
  logoutUser,
} from "./useLayout.js";

const route = useRoute();
const router = useRouter();

const readPermissions = () => {
  try {
    return JSON.parse(localStorage.getItem("user_permissions") || "[]");
  } catch {
    return [];
  }
};
const userPermissions = readPermissions();

const canSee = (permissions) =>
  !permissions || permissions.some((p) => userPermissions.includes(p));

const isRouteActive = (name) => route.name === name;

const isItemActive = (item) =>
  isRouteActive(item.route) || (item.activeFor || []).includes(route.name);

const isGroupActive = (item) =>
  (item.children || []).some((child) => isRouteActive(child.route));

const isSubmenuOpen = (key) => openSubmenus.value.includes(key);

// Keep the parent group of the current page expanded
watch(
  () => route.name,
  () => {
    navSections.forEach((section) =>
      section.items.forEach((item) => {
        if (isGroupActive(item)) ensureSubmenuOpen(item.key);
      })
    );
  },
  { immediate: true }
);
</script>

<style scoped>
.sb {
  --sb-bg: #0f1c3f;
  --sb-bg-2: #0b1530;
  --sb-text: #a7b1c9;
  --sb-muted: #64708f;
  --sb-hover: rgba(255, 255, 255, 0.06);
  --sb-active-bg: rgba(52, 211, 153, 0.14);
  --sb-accent: #34d399;
  --sb-border: rgba(255, 255, 255, 0.07);

  position: fixed;
  inset: 0 auto 0 0;
  z-index: 1001;
  width: 272px;
  display: flex;
  flex-direction: column;
  background: linear-gradient(180deg, var(--sb-bg) 0%, var(--sb-bg-2) 100%);
  color: var(--sb-text);
  transform: translateX(-100%);
  transition: transform 0.25s ease, width 0.25s ease;
  box-shadow: none;
  white-space: nowrap;
}

.sb--open {
  transform: translateX(0);
  box-shadow: 0 20px 50px rgba(2, 6, 23, 0.45);
}

@media (min-width: 1024px) {
  .sb {
    position: relative;
    z-index: 20;
    transform: none;
    width: 264px;
    flex-shrink: 0;
    box-shadow: none;
  }
  .sb--collapsed {
    width: 76px;
  }
}

/* Backdrop */
.sb-backdrop {
  position: fixed;
  inset: 0;
  z-index: 1000;
  background: rgba(15, 23, 42, 0.55);
  backdrop-filter: blur(2px);
}
.sb-fade-enter-active,
.sb-fade-leave-active {
  transition: opacity 0.2s ease;
}
.sb-fade-enter-from,
.sb-fade-leave-to {
  opacity: 0;
}

/* Brand */
.sb-brand {
  height: 64px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 18px;
  border-bottom: 1px solid var(--sb-border);
  flex-shrink: 0;
}
.sb-brand-link {
  display: flex;
  align-items: center;
  gap: 12px;
  min-width: 0;
  color: #fff;
}
.sb-logo {
  width: 38px;
  height: 38px;
  flex-shrink: 0;
  border-radius: 50%;
  background: #fff;
  padding: 2px;
}
.sb-brand-text {
  display: flex;
  flex-direction: column;
  line-height: 1.15;
  overflow: hidden;
  transition: opacity 0.2s ease;
}
.sb-brand-title {
  font-size: 15px;
  font-weight: 700;
  color: #fff;
  letter-spacing: 0.2px;
}
.sb-brand-sub {
  font-size: 11px;
  font-weight: 500;
  color: var(--sb-accent);
  text-transform: uppercase;
  letter-spacing: 1.6px;
}
.sb-close {
  display: grid;
  place-items: center;
  width: 32px;
  height: 32px;
  border-radius: 8px;
  color: var(--sb-text);
  font-size: 14px;
}
.sb-close:hover {
  background: var(--sb-hover);
  color: #fff;
}

/* Nav */
.sb-nav {
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
  padding: 12px 12px 16px;
  scrollbar-width: thin;
  scrollbar-color: rgba(255, 255, 255, 0.15) transparent;
}
.sb-nav::-webkit-scrollbar {
  width: 6px;
}
.sb-nav::-webkit-scrollbar-thumb {
  background-color: rgba(255, 255, 255, 0.15) !important;
  border: none;
}
.sb-nav::-webkit-scrollbar-track {
  background: transparent !important;
  border: none;
}

.sb-section + .sb-section {
  margin-top: 10px;
}
.sb-section-title {
  padding: 12px 12px 8px;
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 1.1px;
  color: var(--sb-muted);
  height: 34px;
  position: relative;
}

.sb-list,
.sb-sub-inner {
  list-style: none;
  margin: 0;
  padding: 0;
}
.sb-list > li + li {
  margin-top: 2px;
}

.sb-link {
  position: relative;
  display: flex;
  align-items: center;
  gap: 12px;
  width: 100%;
  min-height: 42px;
  padding: 8px 12px;
  border-radius: 10px;
  color: var(--sb-text);
  font-size: 14px;
  font-weight: 500;
  text-align: left;
  background: transparent;
  transition: background-color 0.15s ease, color 0.15s ease;
}
.sb-link:hover {
  background: var(--sb-hover);
  color: #fff;
}
.sb-link:focus-visible,
.sb-sublink:focus-visible {
  outline: 2px solid var(--sb-accent);
  outline-offset: -2px;
}
.sb-link.is-active {
  background: var(--sb-active-bg);
  color: #fff;
}
.sb-link.is-active::before {
  content: "";
  position: absolute;
  left: -12px;
  top: 8px;
  bottom: 8px;
  width: 4px;
  border-radius: 0 4px 4px 0;
  background: var(--sb-accent);
}
.sb-link.is-active .sb-icon,
.sb-link.is-parent-active .sb-icon {
  color: var(--sb-accent);
}
.sb-link.is-parent-active {
  color: #fff;
}

.sb-icon {
  display: grid;
  place-items: center;
  width: 20px;
  flex-shrink: 0;
  font-size: 17px;
  transition: color 0.15s ease;
}
.sb-label {
  flex: 1;
  line-height: 1.3;
  white-space: normal;
  overflow-wrap: anywhere;
  transition: opacity 0.2s ease;
}
.sb-caret {
  font-size: 10px;
  color: var(--sb-muted);
  transition: transform 0.2s ease;
}
.sb-caret.is-open {
  transform: rotate(90deg);
}

/* Accordion */
.sb-sub {
  display: grid;
  grid-template-rows: 0fr;
  transition: grid-template-rows 0.25s ease;
}
.sb-sub.is-open {
  grid-template-rows: 1fr;
}
.sb-sub-inner {
  overflow: hidden;
  margin-left: 21px;
  padding-left: 12px;
  border-left: 1px solid var(--sb-border);
}
.sb-sub.is-open .sb-sub-inner {
  padding-top: 4px;
  padding-bottom: 4px;
}
.sb-sublink {
  position: relative;
  display: block;
  padding: 8px 12px;
  margin: 1px 0;
  border-radius: 8px;
  font-size: 13.5px;
  line-height: 1.35;
  color: var(--sb-text);
  white-space: normal;
  overflow-wrap: anywhere;
  transition: background-color 0.15s ease, color 0.15s ease;
}
.sb-sublink:hover {
  color: #fff;
  background: var(--sb-hover);
}
.sb-sublink.is-active {
  color: #fff;
  font-weight: 600;
  background: var(--sb-active-bg);
}
.sb-sublink.is-active::before {
  content: "";
  position: absolute;
  left: -15px;
  top: 50%;
  width: 6px;
  height: 6px;
  margin-top: -3px;
  border-radius: 50%;
  background: var(--sb-accent);
  box-shadow: 0 0 0 3px rgba(52, 211, 153, 0.25);
}

/* Footer */
.sb-footer {
  padding: 12px;
  border-top: 1px solid var(--sb-border);
  flex-shrink: 0;
}
.sb-logout:hover {
  background: rgba(248, 113, 113, 0.12);
  color: #fca5a5;
}

/* Collapsed (desktop only) */
.sb--collapsed .sb-brand {
  justify-content: center;
  padding: 0;
}
.sb--collapsed .sb-brand-text,
.sb--collapsed .sb-label,
.sb--collapsed .sb-caret {
  display: none;
}
.sb--collapsed .sb-section-title span {
  display: none;
}
.sb--collapsed .sb-section-title::after {
  content: "";
  position: absolute;
  left: 14px;
  right: 14px;
  top: 50%;
  height: 1px;
  background: var(--sb-border);
}
.sb--collapsed .sb-section:first-child .sb-section-title {
  height: 8px;
  padding: 0;
}
.sb--collapsed .sb-section:first-child .sb-section-title::after {
  display: none;
}
.sb--collapsed .sb-link {
  justify-content: center;
  padding: 0;
}
.sb--collapsed .sb-sub {
  display: none;
}
</style>

<style>
/* Flyout for grouped items when the sidebar is collapsed (teleported, so unscoped) */
.sb-flyout .ant-popover-inner {
  padding: 8px !important;
  border-radius: 12px !important;
  min-width: 220px;
  box-shadow: 0 12px 32px rgba(15, 23, 42, 0.18) !important;
}
.sb-flyout-title {
  padding: 6px 10px 8px;
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 1px;
  color: #94a3b8;
}
.sb-flyout-link {
  display: block;
  padding: 8px 10px;
  border-radius: 8px;
  font-size: 13.5px;
  color: #334155 !important;
  transition: background-color 0.15s ease;
}
.sb-flyout-link:hover {
  background: #f1f5f9;
  color: #0f172a !important;
}
.sb-flyout-link.is-active {
  background: #ecfdf5;
  color: #047857 !important;
  font-weight: 600;
}
</style>
