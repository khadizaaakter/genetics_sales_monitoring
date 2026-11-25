<template>
  <div class="app-shell">
    <SidebarComponent />

    <div class="app-main">
      <HeaderComponent />

      <main class="app-content">
        <div class="app-card">
          <slot></slot>
        </div>
      </main>
    </div>
  </div>
</template>

<script setup>
import HeaderComponent from "./Header.vue";
import SidebarComponent from "./Sidebar.vue";
</script>

<style scoped>
.app-shell {
  display: flex;
  height: 100vh;
  height: 100dvh;
  overflow: hidden;
  background: #f4f6fa;
}

.app-main {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
}

.app-content {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  padding: 12px;
}
@media (min-width: 768px) {
  .app-content {
    padding: 20px 24px;
  }
}

.app-card {
  min-height: 100%;
  padding: 16px;
  background: #fff;
  border: 1px solid #e8ecf2;
  border-radius: 14px;
  box-shadow: 0 1px 2px rgba(15, 23, 42, 0.04);
}
@media (min-width: 768px) {
  .app-card {
    padding: 20px;
  }
}
</style>
