<template>
  <MainLayout>
    <div class="md:px-10 md:pt-10 pb-4 relative z-20">
      <div class="md:flex justify-between mb-3 mt-4 mt:mt-0">
        <a-input-search
          v-model:value="searchInput"
          placeholder="Search by role or permission..."
          :maxlength="SEARCH_MAX_LENGTH"
          allow-clear
          class="w-[300px]"
          @paste="handleSearchPaste"
        />

        <div class="flex space-x-2 mt-2 md:mt-0">
          <a-button type="default" @click="goBack" class="flex items-center">
            <left-outlined /> Previous Page</a-button
          >
          <a-button
            class="flex items-center"
            type="primary"
            @click="isModalVisible = true"
          >
            <plus-outlined /> Add New Role
          </a-button>
        </div>
      </div>
      <!-- AddRole Modal -->
      <a-modal
        v-model:visible="isModalVisible"
        centered
        title="Create New Role"
        @cancel="handleCancel"
        :footer="null"
      >
        <form @submit.prevent="createRole">
          <div class="lg:grid grid-cols-3 gap-4 mt-3">
            <label for="name">Role Name</label>
            <input
              id="name"
              v-model="formData.name"
              type="text"
              placeholder="Enter role name.."
              class="px-4 py-2 border rounded col-span-2"
            />
            <label for="permissions">Select Permissions</label>
            <div class="col-span-2 h-36 overflow-auto">
              <p v-if="isLoading">Loading...</p>
              <p class="mb-1" v-for="item in permissionList" :key="item?.id">
                <label
                  ><input
                    type="checkbox"
                    :value="item?.name"
                    v-model="formData.permission"
                  />
                  <span class="align-baseline ml-2 capitalize">{{
                    item?.name
                  }}</span></label
                >
              </p>
            </div>
          </div>

          <!-- Submit and Cancel Buttons -->
          <div class="flex justify-end mt-4">
            <a-button @click="handleCancel" class="mr-2" type="default">
              Cancel
            </a-button>
            <a-button type="primary" html-type="submit"> Submit </a-button>
          </div>
        </form>
      </a-modal>

      <!-- Add/Edit Role Modal end -->

      <!-- Permissions Table -->
      <div class="overflow-x-auto">
        <table class="min-w-full border border-gray-300">
          <thead>
            <tr
              class="bg-gray-100 text-gray-600 font-semibold border-b border-gray-300"
            >
              <th class="py-4 px-4 text-left" colspan="2">Role</th>
              <th class="py-4 text-left">Permissions</th>
              <th class="py-4 px-4 text-center">Actions</th>
            </tr>
          </thead>
          <tbody class="bg-white text-gray-800">
            <tr v-if="isLoading" class="border-b border-gray-300">
              <td colspan="6" class="py-4 text-center"><a-spin /></td>
            </tr>
            <tr
              v-if="!isLoading && filteredRoles().length === 0"
              class="border-b border-gray-300"
            >
              <td colspan="5" class="py-4 text-center">
                <a-empty
                  :description="searchQuery ? 'No matching roles found' : 'No roles Found'"
                  class="my-8"
                />
              </td>
            </tr>
            <tr
              v-for="(role, index) in filteredRoles()"
              :key="index"
              :class="{ 'bg-gray-50': index % 2 === 0 }"
              class="border-b border-gray-300"
            >
              <td class="ps-4 py-2" colspan="2">{{ role.name }}</td>
              <td>
                <div v-if="!role?.permissions?.length">-</div>
                <div v-else>
                  <span
                    v-for="(permission, index) in role?.permissions"
                    :key="index"
                  >
                    {{ permission?.name
                    }}<span
                      class="mr-1"
                      v-if="index + 1 != role?.permissions?.length"
                      >,</span
                    >
                  </span>
                </div>
              </td>
              <td class="text-center py-2 w-16">
                <div class="flex justify-center gap-2">
                  <button
                    type="button"
                    class="edit_btn"
                    @click="
                      $router.push({
                        name: 'user-role-edit',
                        params: { id: role?.id },
                      })
                    "
                  >
                    <EditOutlined class="align-middle" />
                  </button>
                  <!-- <a-button class="bg-blue-200 text-blue-700 edit-btn inline-flex justify-center items-center"
                    type="link" @click="openModal(true, role)">
                    <EditOutlined />
                  </a-button> -->
                  <a-popconfirm
                    title="Are you sure delete?"
                    @confirm="deleteRole(role.id)"
                  >
                    <a-button
                      type="link"
                      danger
                      class="bg-red-200 text-red-700 delete-btn inline-flex justify-center items-center"
                    >
                      <DeleteOutlined />
                    </a-button>
                  </a-popconfirm>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
    <!-- <div class="corder absolute bottom-0 right-0">
      <img class="w-48" :src="cornerImg" alt="" />
    </div> -->
  </MainLayout>
</template>

<script setup>
import { onMounted, ref, watch } from "vue";
import MainLayout from "@/components/layout/MainLayout.vue";
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  LeftOutlined,
} from "@ant-design/icons-vue";
import cornerImg from "@/assets/images/corner.png";
import { useRouter } from "vue-router";
import { apiBase } from "../../config";
import { showNotification } from "../../utilities/notification";
import Cookies from "js-cookie";
import axios from "axios";

const isLoading = ref(false);
const router = useRouter();
const isModalVisible = ref(false);
const isEditMode = ref(false);
const isDeleting = ref({});
const permissionList = ref(null);

const formData = ref({
  name: "",
  permission: [],
});

const roles = ref([]);

// searchInput is what the user is typing; searchQuery is the normalized value
// used for filtering, updated live as the user types.
const SEARCH_MAX_LENGTH = 12;
const searchInput = ref("");
const searchQuery = ref("");

// Normalizes text for comparison: unicode-normalize, strip zero-width chars
// (common in copy-paste), collapse any whitespace (incl. NBSP/tabs/newlines)
// to a single space, trim, and lowercase.
const cleanText = (value) =>
  String(value ?? "")
    .normalize("NFKC")
    .replace(/[​-‍⁠﻿]/g, "")
    .replace(/\s+/g, " ")
    .trim();

const normalizeText = (value) => cleanText(value).toLowerCase();

watch(searchInput, (value) => {
  // Clean pasted/typed text before applying the 12-char limit, so leading
  // spaces or hidden characters don't eat into it. The trailing space is kept
  // so the user can type a second word.
  const raw = String(value ?? "");
  const cleaned = cleanText(raw);
  const trailingSpace = /\s$/.test(raw) && cleaned ? " " : "";
  const limited = (cleaned + trailingSpace).slice(0, SEARCH_MAX_LENGTH);

  if (limited !== raw) {
    searchInput.value = limited;
    return;
  }
  searchQuery.value = normalizeText(limited);
});

// Pasting replaces the previous search instead of being inserted into it
// (and isn't blocked by maxlength when the box is already full).
const handleSearchPaste = (event) => {
  const pasted = event.clipboardData?.getData("text");
  if (!pasted) return;
  event.preventDefault();
  searchInput.value = cleanText(pasted).slice(0, SEARCH_MAX_LENGTH);
};

// Search (partial, case-insensitive, whitespace-normalized) on role name and
// permission names. Filters from the full list, so the search stays applied
// after the list reloads.
const filteredRoles = () => {
  const q = searchQuery.value;
  if (!q) return roles.value;
  return roles.value.filter(
    (role) =>
      normalizeText(role?.name).includes(q) ||
      role?.permissions?.some((permission) =>
        normalizeText(permission?.name).includes(q)
      )
  );
};

// roll list
const fetchData = async () => {
  const token = Cookies.get("token");
  const config = {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  };
  isLoading.value = true;
  try {
    const response = await axios.get(`${apiBase}/roles`, config);
    isLoading.value = false;
    if (response?.status == 200 && response?.data?.status === "Success") {
      console.log(response?.data);
      roles.value = Array.isArray(response?.data?.role) ? response.data.role : [];
    }
  } catch (error) {
    isLoading.value = false;
    roles.value = [];
  }
};

const getPermission = async () => {
  const token = Cookies.get("token");
  const config = {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  };
  isLoading.value = true;
  try {
    const response = await axios.get(`${apiBase}/permissions`, config);
    if (response?.status == 200 && response?.data?.status === "Success") {
      isLoading.value = false;
      return response?.data?.permissions;
    }
  } catch (error) {
    isLoading.value = false;
    console.log(error);
    showNotification("error", error?.message);
  }
};

// create role
const createRole = async () => {
  const token = Cookies.get("token");
  const config = {
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  };

  const payload = {
    name: formData.value.name,
    permission: formData.value.permission,
  };

  try {
    const response = await axios.post(`${apiBase}/roles`, payload, config);

    if (response?.status === 200 && response?.data?.status === "Success") {
      showNotification("Success", response?.data?.message);
      isModalVisible.value = false;
      formData.value = { name: "", permission: [] };
      fetchData();
    } else {
      showNotification("Error", response?.data?.message || "An error occurred");
    }
  } catch (error) {
    console.error(error);
    showNotification("Error", error?.message || "Something went wrong");
  }
};

// delete role
const deleteRole = async (id) => {
  isDeleting.value = true;
  const token = Cookies.get("token");
  const config = {
    headers: {
      Accept: "application/json",
      Authorization: `Bearer ${token}`,
    },
  };
  try {
    const response = await axios.delete(`${apiBase}/roles/${id}`, config);
    if (response?.status == 200 && response?.data?.status === "Success") {
      showNotification("Success", response?.data?.message);
      fetchData();
    } else {
      showNotification(
        "Error",
        response?.data?.message || "Failed to delete role"
      );
    }
  } catch (error) {
    showNotification("Error", error?.message || "Something went wrong");
  } finally {
    isDeleting.value = false;
  }
};

const handleCancel = () => {
  isModalVisible.value = false;
  formData.value = { name: "", permission: [] };
};

// Navigate Back
const goBack = () => {
  router.back();
};
onMounted(async () => {
  await fetchData();
  permissionList.value = await getPermission();
});
</script>

<style scoped>
.edit-btn:hover {
  background-color: #93c5fd !important;
  border-color: #93c5fd !important;
  color: #1d4ed8;
}

.delete-btn:hover {
  background-color: #fca5a5 !important;
  color: #b91c1c !important;
}
</style>
