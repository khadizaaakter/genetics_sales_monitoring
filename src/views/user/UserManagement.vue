<template>
  <MainLayout>
    <div class="p-6">
      <div class="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 class="text-2xl font-semibold text-gray-800">User List</h1>
        </div>
        <div class="flex flex-wrap items-center gap-2">
          <a-button
            type="flex items-center gap-1 bg-blue-400 text-white border-blue-500 hover:!bg-blue-500 hover:!text-white hover:!border-blue-500"
            class="flex items-center gap-1 bg-[#2d2d61]"
            @click="exportToExcel"
          >
            <FileExcelOutlined /> Excel Export
          </a-button>
          <a-button
            class="flex items-center gap-1 bg-purple-400 text-white border-purple-500 hover:!bg-purple-500 hover:!text-white hover:!border-purple-500"
            :disabled="isSyncing"
            @click="handleSync"
          >
            <SyncOutlined :spin="isSyncing" /> Sync Users
          </a-button>

          <a-button
            type="primary"
            class="flex items-center gap-1 bg-[#2d2d61]"
            @click="openAddModal"
          >
            <PlusOutlined /> Add User
          </a-button>
        </div>
      </div>

      <div class="flex flex-wrap items-center gap-3 mb-4">
        <a-input-search
          v-model:value="searchInput"
          placeholder="Search by name, code, mobile..."
          :maxlength="SEARCH_MAX_LENGTH"
          allow-clear
          class="w-72"
          @paste="handleSearchPaste"
        />

        <a-select
          v-model:value="selectedRole"
          placeholder="Select Role"
          allow-clear
          class="w-48"
        >
          <a-select-option v-for="role in rolesList" :key="role.id" :value="role.name">
            {{ role.name }}
          </a-select-option>
        </a-select>

        <a-select
          v-model:value="selectedStatus"
          placeholder="Select Status"
          allow-clear
          class="w-40"
        >
          <a-select-option value="Y"> Active </a-select-option>

          <a-select-option value="N"> Inactive </a-select-option>
        </a-select>

        <a-select
          v-if="selectedRole === 'Dealer'"
          v-model:value="selectedRegister"
          placeholder="Select Register"
          allow-clear
          class="w-40"
        >
          <a-select-option value="Y"> Registered </a-select-option>

          <a-select-option value="N"> Not Registered </a-select-option>
        </a-select>

        <a-input
          v-model:value="staffIdFilter"
          placeholder="Enter Staff ID"
          allow-clear
          class="w-48"
        />
      </div>

      <!-- Table -->
      <div class="bg-white rounded-lg border border-gray-200 overflow-x-auto">
        <table class="min-w-full text-sm">
          <thead>
            <tr class="bg-[#f8f9fc] text-gray-600 font-semibold border-b border-gray-200">
              <th class="py-3 px-4 text-center w-16">SL</th>
              <th class="py-3 px-4">User ID</th>
              <th class="py-3 px-4">Name</th>
              <!-- <th class="py-3 px-4">Staff ID</th> -->
              <th class="py-3 px-4">Shop Name</th>
              <th class="py-3 px-4">Owner name</th>
              <th class="py-3 px-4">Register</th>
              <th class="py-3 px-4">Email</th>
              <th class="py-3 px-4">Mobile</th>
              <th class="py-3 px-4">Role</th>
              <!-- <th class="py-3 px-4">Permission</th> -->
              <th class="py-3 px-4 text-center w-28">Status</th>
              <th class="py-3 px-4">Actions</th>
            </tr>
          </thead>
          <tbody class="text-gray-800">
            <tr v-if="isLoading">
              <td colspan="10" class="py-6 text-center">
                <a-spin />
              </td>
            </tr>

            <tr v-else-if="filteredData().length === 0">
              <td colspan="10" class="py-6 text-center">
                <a-empty description="No users found" />
              </td>
            </tr>

            <tr
              v-for="(user, index) in paginatedData()"
              :key="user.id ?? index"
              class="border-b border-gray-100 hover:bg-gray-50"
            >
              <td class="text-center">
                {{ (currentPage - 1) * pageSize + index + 1 }}
              </td>
              <td class="text-center">{{ user?.user_id || "-" }}</td>
              <td class="text-center">{{ user?.name }}</td>
              <!-- <td class="text-center">{{ user?.staff_id || "-" }}</td> -->
              <td class="text-center">{{ user?.shop_name || "-" }}</td>
              <td class="text-center">{{ user?.owner_name || "-" }}</td>
              <td class="text-center">
                <a-tag
                  :color="isRegistered(user) ? 'green' : 'orange'"
                  class="capitalize rounded-full px-3"
                >
                  {{ isRegistered(user) ? "Yes" : "No" }}
                </a-tag>
              </td>
              <td class="text-center">{{ user?.email || "-" }}</td>
              <td class="text-center">{{ user?.mobile || "-" }}</td>
              <td class="text-center">
                {{ user?.roles?.map((r) => r.name).join(", ") || "-" }}
              </td>
              <!-- <td class="text-center">
                {{ user?.permissions?.map((p) => p.name).join(", ") || "-" }}
              </td> -->
              <td class="text-center">
                <a-tag
                  :color="user?.active === 'Y' ? 'green' : 'red'"
                  class="capitalize rounded-full px-3"
                >
                  {{ user?.active === "Y" ? "Active" : "Inactive" }}
                </a-tag>
              </td>
              <td class="py-3 px-4">
                <div class="flex justify-center gap-2">
                  <a-button
                    size="small"
                    class="bg-blue-50 text-blue-600 border-blue-100 hover:bg-blue-100"
                    @click="openEditModal(user)"
                  >
                    <EditOutlined />
                  </a-button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Pagination -->
      <div v-if="filteredData().length > 0" class="flex justify-end mt-4">
        <a-pagination
          v-model:current="currentPage"
          :total="filteredData().length"
          :page-size="pageSize"
          :show-size-changer="false"
        />
      </div>

      <!-- Add/Edit user Modal -->
      <a-modal
        v-model:open="isUserModalOpen"
        :title="modalMode === 'edit' ? 'Edit User' : 'Add User'"
        :footer="null"
        :destroy-on-close="true"
        :width="720"
        @cancel="resetForm"
      >
        <a-form :model="form" layout="vertical" autocomplete="off" @finish="handleSubmit">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-x-4">
            <a-form-item
              label="Role"
              name="role"
              :rules="[{ required: true, message: 'Please select a role' }]"
            >
              <a-select
                v-model:value="form.role"
                :loading="rolesLoading"
                placeholder="Select role"
                @change="onRoleChange"
              >
                <a-select-option v-for="r in rolesList" :key="r.id" :value="r.name">
                  {{ r.name }}
                </a-select-option>
              </a-select>
            </a-form-item>

            <a-form-item
              label="Name"
              name="name"
              :rules="[{ required: true, message: 'Please enter name' }]"
            >
              <a-input v-model:value="form.name" placeholder="Enter name" />
            </a-form-item>

            <a-form-item
              v-if="!hideDealerInfo"
              label="Dealer Code"
              name="dealer_code"
              :rules="[{ required: true, message: 'Please enter dealer code' }]"
            >
              <a-input v-model:value="form.dealer_code" placeholder="Enter dealer code" />
            </a-form-item>

            <a-form-item
              v-if="!hideDealerInfo"
              label="Shop Name"
              name="shop_name"
              :rules="[{ required: false, message: 'Please enter shop name' }]"
            >
              <a-input v-model:value="form.shop_name" placeholder="Enter shop name" />
            </a-form-item>

            <a-form-item v-if="!hideDealerInfo" label="Owner Name" name="owner_name">
              <a-input v-model:value="form.owner_name" placeholder="Enter owner name" />
            </a-form-item>

            <a-form-item
              label="Mobile"
              name="mobile"
              :rules="[{ required: true, message: 'Please enter mobile number' }]"
            >
              <a-input v-model:value="form.mobile" placeholder="Enter mobile number" />
            </a-form-item>

            <a-form-item
              label="Email"
              name="email"
              :rules="[{ type: 'email', message: 'Please enter a valid email' }]"
            >
              <a-input
                v-model:value="form.email"
                placeholder="Enter email"
                autocomplete="off"
              />
            </a-form-item>

            <!-- Supervisor is handled by the backend for now -->
            <!-- <a-form-item
              v-if="roleParentMap[form.role]"
              label="Supervisor"
              name="supervisor"
              :rules="[
                {
                  required: true,
                  type: 'array',
                  message: `Please select a ${roleParentMap[form.role]}`,
                },
              ]"
            >
              <a-select
                v-model:value="form.supervisor"
                mode="multiple"
                :loading="supervisorLoading"
                :not-found-content="supervisorLoading ? null : 'No matches'"
                :placeholder="`Select ${roleParentMap[form.role]}`"
              >
                <a-select-option v-for="o in supervisorOptions" :key="o.id" :value="o.id">
                  {{ o.name }}
                </a-select-option>
              </a-select>
            </a-form-item> -->

            <a-form-item
              v-if="getRoleEndpoint(form.role) && form.role !== 'Customer'"
              label="Staff ID"
              name="staff_id"
              :rules="[
                {
                  required: true,
                  message:
                    modalMode === 'add'
                      ? 'Please enter staff ID'
                      : 'Please select a staff',
                },
              ]"
            >
              <a-input
                v-if="modalMode === 'add'"
                v-model:value="form.staff_id"
                placeholder="Enter Staff ID"
              />
              <a-select
                v-else
                v-model:value="form.staff_id"
                show-search
                :filter-option="false"
                :default-active-first-option="false"
                :show-arrow="false"
                :not-found-content="staffLoading ? null : 'No matches'"
                :loading="staffLoading"
                placeholder="Search by Staff ID"
                @search="handleStaffSearch"
                @change="onStaffChange"
              >
                <a-select-option
                  v-for="s in staffOptions"
                  :key="s.UserID"
                  :value="s.StaffID"
                >
                  {{ s.StaffID }} - {{ s.UserName }}
                </a-select-option>
              </a-select>
            </a-form-item>

            <a-form-item
              label="Password"
              name="password"
              :rules="
                modalMode === 'add'
                  ? [{ required: true, message: 'Please enter password' }]
                  : []
              "
            >
              <a-input-password
                v-model:value="form.password"
                :placeholder="
                  modalMode === 'edit'
                    ? 'Leave blank to keep current password'
                    : 'Enter password'
                "
                autocomplete="new-password"
              />
            </a-form-item>

            <a-form-item
              v-if="modalMode === 'edit'"
              label="Status"
              name="active"
              :rules="[{ required: true, message: 'Please select status' }]"
            >
              <a-select v-model:value="form.active">
                <a-select-option value="Y">Active</a-select-option>
                <a-select-option value="N">Inactive</a-select-option>
              </a-select>
            </a-form-item>
          </div>

          <div class="flex justify-end gap-2 mt-4">
            <a-button @click="closeUserModal" :disabled="isSubmitting"> Cancel </a-button>
            <a-button
              type="primary"
              html-type="submit"
              :loading="isSubmitting"
              class="bg-[#2d2d61]"
            >
              {{ modalMode === "edit" ? "Update" : "Save" }}
            </a-button>
          </div>
        </a-form>
      </a-modal>
    </div>
  </MainLayout>
</template>

<script setup>
import MainLayout from "@/components/layout/MainLayout.vue";
import axios from "axios";
import Cookies from "js-cookie";
import { ref, reactive, computed, onMounted, watch } from "vue";
import { apiBase } from "@/config";
import { getTokenConfig } from "@/utilities/tokenConfig";
import { showNotification } from "@/utilities/notification";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";

import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  SyncOutlined,
  FileExcelOutlined,
} from "@ant-design/icons-vue";

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

// Digits only, so a pasted "017-1234 5678" matches a stored "01712345678".
const digitsOnly = (value) => String(value ?? "").replace(/\D/g, "");
const isPhoneLike = (value) =>
  /^[\d\s()+-]+$/.test(value) && digitsOnly(value).length >= 3;

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

const userList = ref([]);
const isLoading = ref(false);
const currentPage = ref(1);
const pageSize = ref(14);

const isUserModalOpen = ref(false);
const isSubmitting = ref(false);
const modalMode = ref("add");
const editingUserId = ref(null);

const rolesList = ref([]);
const rolesLoading = ref(false);

const roleSearchEndpoints = {
  Customer: "search_customer",
  MO: "search_mo",
  AM: "search_am",
};

const getRoleEndpoint = (role) => roleSearchEndpoints[role] || null;

// Dealer code, shop name and owner name only apply to Dealer/Customer roles.
const hideDealerInfo = computed(() => ["MO", "AM"].includes(form.role));

// Supervisor is handled by the backend for now.
// Hierarchy: AM -> MO -> Dealer. Selecting Dealer shows the MO list,
// selecting MO shows the AM list, selecting AM needs no parent list.
// const roleParentMap = {
//   Dealer: "MO",
//   MO: "AM",
// };

// const supervisorOptions = ref([]);
// const supervisorLoading = ref(false);

// const fetchSupervisorList = async (parentRole) => {
//   if (!parentRole) {
//     supervisorOptions.value = [];
//     return;
//   }
//   supervisorLoading.value = true;
//   try {
//     const token = Cookies.get("token");
//     const formData = new FormData();
//     formData.append("role", parentRole);
//     const res = await axios.post(`${apiBase}/role_wise_mo_am_list`, formData, {
//       headers: {
//         Accept: "application/json",
//         ...(token ? { Authorization: `Bearer ${token}` } : {}),
//       },
//     });
//     supervisorOptions.value = Array.isArray(res?.data?.data) ? res.data.data : [];
//   } catch (error) {
//     console.error("Failed to fetch supervisor list", error?.response?.data || error);
//     supervisorOptions.value = [];
//   } finally {
//     supervisorLoading.value = false;
//   }
// };

const fetchRoles = async () => {
  rolesLoading.value = true;
  try {
    const token = Cookies.get("token");
    const res = await axios.get(`${apiBase}/roles`, {
      headers: {
        Accept: "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    });
    rolesList.value = Array.isArray(res?.data?.role) ? res.data.role : [];
  } catch (error) {
    console.error("Failed to fetch roles", error?.response?.data || error);
    rolesList.value = [];
  } finally {
    rolesLoading.value = false;
  }
};

const defaultForm = () => ({
  role: undefined,
  staff_id: undefined,
  name: "",
  dealer_code: "",
  // supervisor: [],
  shop_name: "",
  owner_name: "",
  mobile: "",
  email: "",
  password: "",
  active: "Y",
});

const form = reactive(defaultForm());
const selectedStaff = ref(null);
const staffOptions = ref([]);
const staffLoading = ref(false);
let staffSearchTimer = null;

const resetForm = () => {
  Object.assign(form, defaultForm());
  selectedStaff.value = null;
  staffOptions.value = [];
  // supervisorOptions.value = [];
  modalMode.value = "add";
  editingUserId.value = null;
};

const openAddModal = () => {
  resetForm();
  isUserModalOpen.value = true;
  if (!rolesList.value.length) fetchRoles();
};

const isEditLoading = ref(false);

const openEditModal = async (user) => {
  resetForm();
  modalMode.value = "edit";
  editingUserId.value = user?.id ?? null;
  isUserModalOpen.value = true;
  if (!rolesList.value.length) fetchRoles();

  isEditLoading.value = true;
  try {
    const res = await axios.get(`${apiBase}/user_show/${user.id}`, getTokenConfig());
    const info = res?.data?.result;
    const primaryRole = info?.role || info?.roles?.[0]?.name;
    Object.assign(form, {
      role: primaryRole,
      staff_id: info?.staff_id || undefined,
      name: info?.name || "",
      dealer_code: info?.user_id || "",
      shop_name: info?.shop_name || "",
      owner_name: info?.owner_name || "",
      mobile: info?.mobile || "",
      email: info?.email || "",
      password: "",
      active: info?.active === "N" ? "N" : "Y",
    });
  } catch (error) {
    showNotification(
      "error",
      error?.response?.data?.message || error?.message || "Failed to load user details"
    );
  } finally {
    isEditLoading.value = false;
  }
};

const closeUserModal = () => {
  isUserModalOpen.value = false;
};

const onRoleChange = () => {
  form.staff_id = undefined;
  form.dealer_code = "";
  form.shop_name = "";
  form.owner_name = "";
  form.name = "";
  selectedStaff.value = null;
  staffOptions.value = [];
};

const onStaffChange = (value) => {
  selectedStaff.value =
    form.role === "Customer"
      ? staffOptions.value.find((s) => s.UserID === value) ?? null
      : staffOptions.value.find((s) => s.StaffID === value) ?? null;
  if (selectedStaff.value) {
    form.dealer_code = selectedStaff.value.UserID ?? "";
    form.name = selectedStaff.value.UserName ?? "";
  } else {
    form.dealer_code = "";
    form.name = "";
  }
};

const handleStaffSearch = (keyword) => {
  if (staffSearchTimer) clearTimeout(staffSearchTimer);
  if (!getRoleEndpoint(form.role) || !keyword?.trim()) {
    staffOptions.value = [];
    return;
  }
  staffSearchTimer = setTimeout(() => searchStaff(keyword.trim()), 300);
};

const searchStaff = async (keyword) => {
  const endpoint = getRoleEndpoint(form.role);
  if (!endpoint) return;
  staffLoading.value = true;
  try {
    const token = Cookies.get("token");
    const res = await axios.post(
      `${apiBase}/${endpoint}`,
      { keyword },
      {
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      }
    );
    const list = Array.isArray(res?.data?.data) ? res.data.data : [];
    staffOptions.value = list;
    if (!list.length) {
      console.warn("Staff search returned no rows", {
        endpoint,
        keyword,
        response: res?.data,
      });
    }
  } catch (error) {
    console.error("Staff search failed", error?.response?.data || error);
    staffOptions.value = [];
  } finally {
    staffLoading.value = false;
  }
};

const createUser = async () => {
  isSubmitting.value = true;
  try {
    const payload = {
      name: form.name,
      dealer_code: form.dealer_code,
      shop_name: form.shop_name,
      owner_name: form.owner_name,
      mobile: form.mobile,
      email: form.email,
      password: form.password,
      role: form.role,
    };
    if (getRoleEndpoint(form.role) && form.role !== "Customer") {
      payload.staff_id = form.staff_id || "";
    }
    const res = await axios.post(`${apiBase}/register`, payload, {
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
    });
    if (res?.status === 200 || res?.status === 201) {
      showNotification("success", res?.data?.message || "User created");
      closeUserModal();
      fetchUserList();
    } else {
      showNotification("error", res?.data?.message || "Failed to create user");
    }
  } catch (error) {
    showNotification(
      "error",
      error?.response?.data?.message || error?.message || "Something went wrong"
    );
  } finally {
    isSubmitting.value = false;
  }
};

const updateUser = async () => {
  if (!editingUserId.value) return;
  isSubmitting.value = true;
  try {
    const payload = {
      name: form.name,
      email: form.email,
      dealer_code: form.dealer_code,
      // is_registered: form.is_registered,
      shop_name: form.shop_name,
      owner_name: form.owner_name,
      mobile: form.mobile,
      role: form.role,
      active: form.active,
    };
    if (getRoleEndpoint(form.role) && form.role !== "Customer") {
      payload.staff_id = form.staff_id || "";
    }
    if (form.password) {
      payload.password = form.password;
    }
    const res = await axios.put(
      `${apiBase}/user_update/${editingUserId.value}`,
      payload,
      getTokenConfig()
    );
    if (res?.status === 200 || res?.status === 201) {
      showNotification("success", res?.data?.message || "User updated");
      closeUserModal();
      fetchUserList();
    } else {
      showNotification("error", res?.data?.message || "Failed to update user");
    }
  } catch (error) {
    showNotification(
      "error",
      error?.response?.data?.message || error?.message || "Something went wrong"
    );
  } finally {
    isSubmitting.value = false;
  }
};

const handleSubmit = () => {
  if (modalMode.value === "edit") {
    updateUser();
  } else {
    createUser();
  }
};

const handleDelete = async (id) => {
  try {
    const res = await axios.delete(`${apiBase}/user_delete/${id}`, getTokenConfig());
    const ok =
      res?.status === 200 ||
      res?.status === 204 ||
      res?.data?.success === true ||
      res?.data?.status === "success";
    if (ok) {
      showNotification("success", res?.data?.message || "User deleted");
      await fetchUserList();
    } else {
      showNotification("error", res?.data?.message || "Failed to delete user");
    }
  } catch (error) {
    showNotification("error", error?.response?.data?.message || "Failed to delete user");
  }
};
const isSyncing = ref(false);

const handleSync = async () => {
  isSyncing.value = true;

  try {
    const res = await axios.get(`${apiBase}/sync-user-sdms`, getTokenConfig());

    if (res.data.status) {
      showNotification(
        "success",
        res.data.message || "User sync completed successfully."
      );
      showNotification(
        "info",
        `Dealer Synced: ${res.data.dealer_synced}
MO Synced: ${res.data.mo_synced}
AM Synced: ${res.data.am_synced}`
      );
      fetchUserList();
    } else {
      showNotification("error", res.data.message || "Failed to sync users.");
    }
  } catch (error) {
    console.error(error);

    showNotification(
      "error",
      error.response?.data?.message || error.message || "Failed to sync users."
    );
  } finally {
    isSyncing.value = false;
  }
};

const fetchUserList = async () => {
  isLoading.value = true;
  try {
    const res = await axios.get(`${apiBase}/user_list`, getTokenConfig());
    if (res?.data?.status === "success") {
      userList.value = res?.data?.users ?? [];
    } else {
      userList.value = [];
      showNotification("error", res?.data?.message || "Failed to fetch user list");
    }
  } catch (error) {
    userList.value = [];
    showNotification("error", "Failed to fetch user list");
  } finally {
    isLoading.value = false;
  }
};

// filtering user list
const selectedRole = ref(null);
const selectedStatus = ref(null);
const selectedRegister = ref(null);

// Backend sends is_registered as "1"/"0"
const isRegistered = (user) => String(user?.is_registered) === "1";
const staffIdFilter = ref("");

// const filteredData = () => {
//   const q = searchQuery.value.trim().toLowerCase();
//   if (!q) return userList.value;
//   return userList.value.filter((u) => {
//     const fields = [
//       u?.name,
//       u?.shop_name,
//       u?.owner_name,
//       u?.email,
//       u?.mobile,
//       u?.dealer_code,
//       u?.staff_id,
//     ];

//     const matchesRole =
//       !selectedRole.value || u?.roles?.some((r) => r.name === selectedRole.value);

//     return fields.some((f) =>
//       String(f ?? "")
//         .toLowerCase()
//         .includes(q)
//     );
//   });
// };

const filteredData = () => {
  const q = searchQuery.value;
  const qDigits = isPhoneLike(q) ? digitsOnly(q) : "";
  const staffQ = normalizeText(staffIdFilter.value);

  return userList.value.filter((u) => {
    // Search (partial, case-insensitive, whitespace-normalized)
    const matchesSearch =
      !q ||
      [
        u?.name,
        u?.shop_name,
        u?.owner_name,
        u?.email,
        u?.mobile,
        u?.user_id,
        u?.staff_id,
      ].some((field) => normalizeText(field).includes(q)) ||
      (!!qDigits && digitsOnly(u?.mobile).includes(qDigits));

    // Role Filter
    const matchesRole =
      !selectedRole.value || u?.roles?.some((role) => role.name === selectedRole.value);

    // Status Filter
    const matchesStatus =
      !selectedStatus.value ||
      (selectedStatus.value === "Y" ? u?.active === "Y" : u?.active !== "Y");

    // Register Filter
    const matchesRegister =
      !selectedRegister.value ||
      (selectedRegister.value === "Y" ? isRegistered(u) : !isRegistered(u));

    // Staff ID Filter
    const matchesStaff = !staffQ || normalizeText(u?.staff_id).includes(staffQ);

    return (
      matchesSearch && matchesRole && matchesStatus && matchesRegister && matchesStaff
    );
  });
};

// export to excel
const exportToExcel = () => {
  if (!filteredData().length) {
    showNotification("warning", "No user data available to export.");
    return;
  }

  const excelData = filteredData().map((user) => ({
    ID: user.id,
    "User ID": user.user_id || "-",
    Name: user.name,
    "Shop Name": user.shop_name || "-",
    "Owner Name": user.owner_name || "-",
    Registered: isRegistered(user) ? "Yes" : "No",
    Email: user.email || "-",
    Mobile: user.mobile || "-",
    Role: user.roles?.map((r) => r.name).join(", ") || "-",
    Status: user.active === "Y" ? "Active" : "Inactive",
  }));

  const worksheet = XLSX.utils.json_to_sheet(excelData);
  const workbook = XLSX.utils.book_new();

  XLSX.utils.book_append_sheet(workbook, worksheet, "Users");

  const excelBuffer = XLSX.write(workbook, {
    bookType: "xlsx",
    type: "array",
  });

  const file = new Blob([excelBuffer], {
    type:
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8",
  });

  saveAs(file, `Users_${new Date().toISOString().split("T")[0]}.xlsx`);
};

const paginatedData = () => {
  const start = (currentPage.value - 1) * pageSize.value;
  return filteredData().slice(start, start + pageSize.value);
};

// watch(searchQuery, () => {
//   currentPage.value = 1;
// });

watch(selectedRole, (role) => {
  if (role !== "Dealer") {
    selectedRegister.value = null;
  }
});

watch(
  [searchQuery, selectedRole, selectedStatus, selectedRegister, staffIdFilter],
  () => {
    currentPage.value = 1;
  }
);

onMounted(() => {
  fetchUserList();
  fetchRoles();
});
</script>
