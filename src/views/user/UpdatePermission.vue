<script setup>
import { ref, reactive, onMounted } from "vue";
import axios from "axios";
import Cookies from "js-cookie";
import MainLayout from "@/components/layout/MainLayout.vue";
import { apiBase } from "@/config";
import { showNotification } from "@/utilities/notification";
import { useRoute, useRouter } from "vue-router";

const route = useRoute();
const router = useRouter();
const emit = defineEmits(["update:isDrawerOpen"]);

const isLoading = ref(false);
const form = reactive({
  name: route.query?.name || "",
});

const permissionId = ref(route.params.id || null);

const reset = () => {
  emit("update:isDrawerOpen", false);
  form.name = "";
  router.push({ name: "user-permission" });
};

const addOrUpdatePermissions = async () => {
  if (!form.name?.trim()) {
    showNotification("error", "Permission name is required");
    return;
  }

  isLoading.value = true;
  try {
    const token = Cookies.get("token");
    const config = {
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    };

    const payload = { name: form.name };

    const res = permissionId.value
      ? await axios.put(
          `${apiBase}/permissions/${permissionId.value}`,
          payload,
          config
        )
      : await axios.post(`${apiBase}/permissions`, payload, config);

    if (
      (res.status === 200 || res.status === 201) &&
      res?.data?.status === "Success"
    ) {
      showNotification("success", res?.data?.message || "Permission saved");
      router.push({ name: "user-permission" });
    } else {
      showNotification("error", res?.data?.message || "Failed to save");
    }
  } catch (err) {
    console.error(err);
    showNotification(
      "error",
      err?.response?.data?.message || err?.message || "Something went wrong"
    );
  } finally {
    isLoading.value = false;
  }
};

const fetchPermissionData = async () => {
  if (!permissionId.value) return;
  try {
    const token = Cookies.get("token");
    const config = {
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${token}`,
      },
    };
    const res = await axios.get(
      `${apiBase}/permissions/${permissionId.value}/edit`,
      config
    );
    const permissionData = res?.data?.permission;
    if (permissionData?.name) {
      form.name = permissionData.name;
    }
  } catch (err) {
    console.error(err);
  }
};

onMounted(async () => {
  await fetchPermissionData();
});
</script>

<template>
  <MainLayout>
    <form
      @submit.prevent="addOrUpdatePermissions"
      class="bg-white p-6 md:p-8 space-y-8"
    >
      <h2
        class="text-xl font-semibold text-gray-800 border-b border-black pb-2"
      >
        Update Permission
      </h2>

      <!-- Permission Name Input -->
      <div class="space-y-2">
        <label for="name" class="block text-sm font-medium text-gray-700">
          Permission Name
        </label>
        <input
          id="name"
          v-model="form.name"
          type="text"
          placeholder="Enter permission name.."
          class="w-full border border-gray-300 rounded-xl p-3 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 placeholder-gray-400"
        />
      </div>

      <!-- Actions -->
      <div class="flex items-center justify-end gap-4 pt-4">
        <button
          type="button"
          @click="reset"
          class="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-xl hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-400"
        >
          Cancel
        </button>
        <button
          type="submit"
          class="flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-blue-600 rounded-xl hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-400"
          :disabled="isLoading"
        >
          <svg
            v-if="isLoading"
            class="w-4 h-4 animate-spin"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              class="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              stroke-width="4"
            ></circle>
            <path
              class="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8v8z"
            ></path>
          </svg>
          <span>Update</span>
        </button>
      </div>
    </form>
  </MainLayout>
</template>

<style scoped>
.scrollable-content {
  overflow-y: auto;
}
</style>
