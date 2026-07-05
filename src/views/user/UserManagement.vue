<template>
  <MainLayout>
    <div class="p-6">
      <div class="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 class="text-2xl font-semibold text-gray-800">User List</h1>
        </div>
        <a-button
          type="primary"
          class="flex items-center gap-1 bg-[#2d2d61]"
          @click="openAddModal"
        >
          <PlusOutlined /> Add User
        </a-button>
      </div>
      <div
        class="flex flex-wrap items-center justify-between gap-3 mb-4 bg-white rounded-lg"
      >
        <a-input-search
          v-model:value="searchQuery"
          placeholder="Search users..."
          class="md:w-72 w-full"
          allow-clear
        />
      </div>

      <!-- Table -->
      <div class="bg-white rounded-lg border border-gray-200 overflow-x-auto">
        <table class="min-w-full text-sm">
          <thead>
            <tr class="bg-[#f8f9fc] text-gray-600 font-semibold border-b border-gray-200">
              <th class="py-3 px-4 text-center w-16">ID</th>
              <th class="py-3 px-4">Name</th>
              <th class="py-3 px-4">Staff ID</th>
              <th class="py-3 px-4">Shop Name</th>
              <th class="py-3 px-4">Owner name</th>
              <th class="py-3 px-4">Dealer Code</th>
              <th class="py-3 px-4">Email</th>
              <th class="py-3 px-4">Mobile</th>
              <th class="py-3 px-4">Role</th>
              <!-- <th class="py-3 px-4">Permission</th> -->
              <th class="py-3 px-4">Actions</th>
            </tr>
          </thead>
          <tbody class="text-gray-800">
            <tr v-if="isLoading">
              <td colspan="9" class="py-6 text-center">
                <a-spin />
              </td>
            </tr>

            <tr v-else-if="filteredData().length === 0">
              <td colspan="9" class="py-6 text-center">
                <a-empty description="No users found" />
              </td>
            </tr>

            <tr
              v-for="(user, index) in paginatedData()"
              :key="user.id ?? index"
              class="border-b border-gray-100 hover:bg-gray-50"
            >
              <td class="text-center">
                {{ user?.id }}
              </td>
              <td class="text-center">{{ user?.name }}</td>
              <td class="text-center">{{ user?.staff_id || "-" }}</td>
              <td class="text-center">{{ user?.shop_name || "-" }}</td>
              <td class="text-center">{{ user?.owner_name || "-" }}</td>
              <td class="text-center">{{ user?.user_id || "-" }}</td>
              <td class="text-center">{{ user?.email || "-" }}</td>
              <td class="text-center">{{ user?.mobile || "-" }}</td>
              <td class="text-center">
                {{ user?.roles?.map((r) => r.name).join(", ") || "-" }}
              </td>
              <!-- <td class="text-center">
                {{ user?.permissions?.map((p) => p.name).join(", ") || "-" }}
              </td> -->
              <td class="py-3 px-4">
                <div class="flex justify-center gap-2">
                  <a-button
                    size="small"
                    class="bg-blue-50 text-blue-600 border-blue-100 hover:bg-blue-100"
                    @click="openEditModal(user)"
                  >
                    <EditOutlined />
                  </a-button>
                  <a-popconfirm
                    title="Delete this User?"
                    ok-text="Yes"
                    cancel-text="No"
                    @confirm="handleDelete(user.id)"
                  >
                    <a-button
                      size="small"
                      class="bg-red-50 text-red-600 border-red-100 hover:bg-red-100"
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
              v-if="getRoleEndpoint(form.role) && form.role !== 'Customer'"
              label="Staff ID"
              name="staff_id"
              :rules="[{ required: true, message: 'Please select a staff' }]"
            >
              <a-select
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
              label="Name"
              name="name"
              :rules="[{ required: true, message: 'Please enter name' }]"
            >
              <a-input v-model:value="form.name" placeholder="Enter name" />
            </a-form-item>

            <a-form-item
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
            </a-form-item>

            <a-form-item label="Dealer Code" name="dealer_code">
              <a-input v-model:value="form.dealer_code" placeholder="Enter dealer code" />
            </a-form-item>

            <a-form-item label="Shop Name" name="shop_name">
              <a-input v-model:value="form.shop_name" placeholder="Enter shop name" />
            </a-form-item>

            <a-form-item label="Owner Name" name="owner_name">
              <a-input v-model:value="form.owner_name" placeholder="Enter owner name" />
            </a-form-item>

            <a-form-item label="Mobile" name="mobile">
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

            <a-form-item
              label="Password"
              name="password"
              :rules="
                modalMode === 'add'
                  ? [
                      { required: true, message: 'Please enter password' },
                      { min: 6, message: 'Password must be at least 6 characters' },
                    ]
                  : [{ min: 6, message: 'Password must be at least 6 characters' }]
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
import { ref, reactive, onMounted, watch } from "vue";
import { apiBase } from "@/config";
import { getTokenConfig } from "@/utilities/tokenConfig";
import { showNotification } from "@/utilities/notification";
import { PlusOutlined, EditOutlined, DeleteOutlined } from "@ant-design/icons-vue";

const searchQuery = ref("");
const userList = ref([]);
const isLoading = ref(false);
const currentPage = ref(1);
const pageSize = ref(14);

const isUserModalOpen = ref(false);
const isSubmitting = ref(false);
const modalMode = ref("add"); // "add" | "edit"
const editingUserId = ref(null);

const rolesList = ref([]);
const rolesLoading = ref(false);

const roleSearchEndpoints = {
  Customer: "search_customer",
  MO: "search_mo",
  AM: "search_am",
};

const getRoleEndpoint = (role) => roleSearchEndpoints[role] || null;

// Hierarchy: AM -> MO -> Dealer. Selecting Dealer shows the MO list,
// selecting MO shows the AM list, selecting AM needs no parent list.
const roleParentMap = {
  Dealer: "MO",
  MO: "AM",
};

const supervisorOptions = ref([]);
const supervisorLoading = ref(false);

const fetchSupervisorList = async (parentRole) => {
  if (!parentRole) {
    supervisorOptions.value = [];
    return;
  }
  supervisorLoading.value = true;
  try {
    const token = Cookies.get("token");
    const formData = new FormData();
    formData.append("role", parentRole);
    const res = await axios.post(`${apiBase}/role_wise_mo_am_list`, formData, {
      headers: {
        Accept: "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    });
    supervisorOptions.value = Array.isArray(res?.data?.data) ? res.data.data : [];
  } catch (error) {
    console.error("Failed to fetch supervisor list", error?.response?.data || error);
    supervisorOptions.value = [];
  } finally {
    supervisorLoading.value = false;
  }
};

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
  supervisor: [],
  shop_name: "",
  owner_name: "",
  mobile: "",
  email: "",
  password: "",
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
  supervisorOptions.value = [];
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
      supervisor: Array.isArray(info?.supervisor) ? info.supervisor : [],
      shop_name: info?.shop_name || "",
      owner_name: info?.owner_name || "",
      mobile: info?.mobile || "",
      email: info?.email || "",
      password: "",
    });
    if (roleParentMap[primaryRole]) {
      fetchSupervisorList(roleParentMap[primaryRole]);
    }
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
  form.supervisor = [];
  form.name = "";
  selectedStaff.value = null;
  staffOptions.value = [];
  supervisorOptions.value = [];
  if (roleParentMap[form.role]) {
    fetchSupervisorList(roleParentMap[form.role]);
  }
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
    if (roleParentMap[form.role]) {
      payload.supervisor = form.supervisor;
    }
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
      shop_name: form.shop_name,
      owner_name: form.owner_name,
      mobile: form.mobile,
      role: form.role,
    };
    if (roleParentMap[form.role]) {
      payload.supervisor = form.supervisor;
    }
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

const filteredData = () => {
  const q = searchQuery.value.trim().toLowerCase();
  if (!q) return userList.value;
  return userList.value.filter((u) => {
    const fields = [
      u?.name,
      u?.shop_name,
      u?.owner_name,
      u?.email,
      u?.mobile,
      u?.dealer_code,
      u?.staff_id,
    ];
    return fields.some((f) =>
      String(f ?? "")
        .toLowerCase()
        .includes(q)
    );
  });
};

const paginatedData = () => {
  const start = (currentPage.value - 1) * pageSize.value;
  return filteredData().slice(start, start + pageSize.value);
};

watch(searchQuery, () => {
  currentPage.value = 1;
});

onMounted(() => {
  fetchUserList();
});
</script>
