<template>
  <a-layout-header class="bg-blue-100" style="background: #e5e7eb; padding: 0px 15px">
    <nav class="flex lg:space-x-4 items-center justify-between lg:justify-end mt-4">
      <!-- Sidebar Toggle Icon -->
      <Icon class="size-7 text-gray-700 cursor-pointer block lg:hidden" icon="icon-park-outline:application-menu"
        @click="openSidebar" />

      <!-- Avatar and Name -->
      <div class="flex items-center gap-x-3">
        <!-- <div>
          <a-avatar class="bg-gray-400 me-2" :size="40">
            <template #icon>
              <img src="@/assets/images/vite.svg" alt="" />
            </template>
          </a-avatar>
          <span class="font-medium text-gray-700">{{ userInfo?.name || 'Guest' }}</span>
        </div>

        <a-button type="text" shape="circle" class="text-gray-700 flex items-center justify-center text-base">
          <template #icon>
            <Icon icon="mdi:bell" />
          </template>
        </a-button> -->

        <!-- Logout Button -->
        <a-button type="text" class="text-gray-700 flex gap-1 items-center text-base m-0 md:p-2" @click="handleLogout"
          style="margin: 0;">
          <template #icon>
            <Icon icon="mdi:logout" />
          </template>
          Logout
        </a-button>
      </div>
    </nav>

    <!-- Sidebar with Backdrop -->
    <div v-if="isSidebarOpen" class="fixed inset-0 z-50 flex">
      <!-- Backdrop -->
      <div class="fixed inset-0 bg-black opacity-50" @click="closeSidebar"></div>

      <!-- Sidebar Content -->
      <div class="relative w-64 bg-[#101c5a] h-full shadow-lg z-10">
        <button class="absolute top-2 right-2 text-white" @click="closeSidebar">
          <Icon icon="mdi:close" class="text-xl" />
        </button>
        <div class="p-4">
          <!-- Add your sidebar content here -->
          <p class="text-white font-bold">PMS</p>
          <Menu />
        </div>
      </div>
    </div>
  </a-layout-header>
</template>

<script setup>
import Menu from "./MenuList.vue";
import { useLoginStore } from "@/stores/login.js";
import { storeToRefs } from "pinia";
import { useRouter } from "vue-router";
import { ref } from "vue";
import { Icon } from "@iconify/vue";

const loginStore = useLoginStore();
const { userInfo } = storeToRefs(loginStore);
const router = useRouter();

// Sidebar open state
const isSidebarOpen = ref(false);

const openSidebar = () => {
  isSidebarOpen.value = true;
};

const closeSidebar = () => {
  isSidebarOpen.value = false;
};

// Logout handler
const handleLogout = () => {
  loginStore.logout(router);
};
</script>
