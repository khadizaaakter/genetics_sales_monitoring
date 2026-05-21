<template>
  <MainLayout>
    <div class="p-6">
      <h1 class="text-2xl font-semibold text-gray-800 mb-6">Dashboard</h1>

      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        <div
          v-for="tile in tiles"
          :key="tile.key"
          class="bg-white rounded-lg shadow-sm border border-gray-200 p-6 flex items-center justify-between"
        >
          <div>
            <p class="text-sm font-medium text-gray-500">{{ tile.label }}</p>
            <div class="mt-2 h-10 flex items-center">
              <a-spin v-if="tile.loading" size="small" />
              <p v-else class="text-3xl font-bold text-gray-800">
                {{ tile.count }}
              </p>
            </div>
          </div>
          <div
            class="rounded-full p-4 flex items-center justify-center"
            :class="tile.iconBg"
          >
            <component :is="tile.icon" :class="['text-2xl', tile.iconColor]" />
          </div>
        </div>
      </div>
    </div>
  </MainLayout>
</template>

<script setup>
import { reactive, computed, onMounted } from "vue";
import axios from "axios";
import MainLayout from "@/components/layout/MainLayout.vue";
import { apiBase } from "@/config";
import { getTokenConfig } from "@/utilities/tokenConfig";
import {
  AppstoreOutlined,
  FolderOutlined,
  UserOutlined,
} from "@ant-design/icons-vue";

const state = reactive({
  products: { count: 0, loading: false },
  categories: { count: 0, loading: false },
  dealers: { count: 0, loading: false },
});

const tiles = computed(() => [
  {
    key: "products",
    label: "Products",
    count: state.products.count,
    loading: state.products.loading,
    icon: AppstoreOutlined,
    iconBg: "bg-blue-100",
    iconColor: "text-blue-600",
  },
  {
    key: "categories",
    label: "Product Categories",
    count: state.categories.count,
    loading: state.categories.loading,
    icon: FolderOutlined,
    iconBg: "bg-green-100",
    iconColor: "text-green-600",
  },
  {
    key: "dealers",
    label: "Dealers",
    count: state.dealers.count,
    loading: state.dealers.loading,
    icon: UserOutlined,
    iconBg: "bg-purple-100",
    iconColor: "text-purple-600",
  },
]);

const fetchProducts = async () => {
  state.products.loading = true;
  try {
    const res = await axios.get(`${apiBase}/product`, getTokenConfig());
    const list = Array.isArray(res?.data?.data) ? res.data.data : [];
    state.products.count = list.length;
  } catch (err) {
    console.error("Failed to load products", err);
    state.products.count = 0;
  } finally {
    state.products.loading = false;
  }
};

const fetchCategories = async () => {
  state.categories.loading = true;
  try {
    const res = await axios.get(
      `${apiBase}/product_category`,
      getTokenConfig()
    );
    const list = Array.isArray(res?.data?.data) ? res.data.data : [];
    state.categories.count = list.length;
  } catch (err) {
    console.error("Failed to load categories", err);
    state.categories.count = 0;
  } finally {
    state.categories.loading = false;
  }
};

const fetchDealers = async () => {
  state.dealers.loading = true;
  try {
    const res = await axios.get(`${apiBase}/user_list`, getTokenConfig());
    const users = Array.isArray(res?.data?.users) ? res.data.users : [];
    state.dealers.count = users.length;
  } catch (err) {
    console.error("Failed to load users", err);
    state.dealers.count = 0;
  } finally {
    state.dealers.loading = false;
  }
};

onMounted(() => {
  fetchProducts();
  fetchCategories();
  fetchDealers();
});
</script>
