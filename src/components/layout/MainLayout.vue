<template>
  <a-layout class="h-screen overflow-hidden">
    <SidebarComponent />
    <a-layout>
      <HeaderComponent />

      <!--  -->

      <!-- <a-layout-content class="bg-white h-[80%] overflow-y-auto">
        <div class="bg-white h-[100%] overflow-y-auto rounded-3xl">
          <slot></slot>
        </div>
      </a-layout-content> -->

      <!--  -->

      <a-layout-content style="margin: 16px 0 0">
        <div class="p-5 bg-white h-full overflow-y-auto">
          <slot></slot>
        </div>
      </a-layout-content>

      <!--  -->
    </a-layout>
  </a-layout>
</template>

<script setup>
import HeaderComponent from "./Header.vue";
import SidebarComponent from "./Sidebar.vue";
</script>
