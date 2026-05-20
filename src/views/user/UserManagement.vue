<template>
  <MainLayout>
    <div class="md:px-10 md:pt-10 pb-4 relative z-20">
      <header class="flex gap-4 justify-end mb-4">
        <div class="">
          <a-input-search
            placeholder="FAQ"
            class="md:min-w-[200px] w-full"
            @search="onSearch"
          >
            <template #prefix>
              <i-mdi-magnify class="text-gray-400" />
            </template>
          </a-input-search>
        </div>
        <div class="">
          <a-select
            class="md:min-w-[200px] w-full"
            placeholder="Consumer Brands ltd."
          >
            <a-select-option value="1">Consumer Brands ltd.</a-select-option>
            <a-select-option value="2">Other Brand</a-select-option>
          </a-select>
        </div>
        <div class="">
          <a-select
            v-model:value="selectedCategory"
            class="md:min-w-[200px] w-full"
            placeholder="Salt"
          >
            <a-select-option value="1">Salt</a-select-option>
            <a-select-option value="2">Sugar</a-select-option>
          </a-select>
        </div>
      </header>
      <!-- logo area -->
      <Breadcrumb class="ms-32" :items="breadcrumbs" />
      <div
        class="border relative w-full py-3 bg-gradient-to-r from-[#4040A4] to-[#474775] px-12"
      >
        <div
          class="absolute size-16 -bottom-4 ring-8 ring-white left-12 rounded-full"
        >
          <router-link to="/overview">
            <img
              class="absolute size-16 -bottom left-18 rounded-full"
              src="/src/assets/images/aci-logo.png"
              alt="ACI Logo"
            />
          </router-link>
        </div>
      </div>
      <!-- main lay out -->
      <div class="md:flex justify-between mb-3 mt-4 md:my-6">
        <a-input
          v-model:value="searchQuery"
          placeholder="Search User..."
          class="px-4 rounded w-64"
          @input="handleSearch"
        />
        <div class="flex flex-wrap items-center gap-2 mt-2 md:mt-0">
          <a-button
            class="px-2.5 flex items-center gap-1"
            type="primary"
            @click="$router.push({ name: '' })"
          >
            <Icon icon="ic:outline-format-align-left" class="text-xl" /> Excel
            Format
          </a-button>
          <a-button
            class="px-2.5 flex items-center gap-1"
            type="primary"
            @click="$router.push({ name: '' })"
          >
            <Icon icon="lsicon:export-filled" class="text-xl" /> Import Excel
          </a-button>
          <a-button
            class="px-2.5 flex items-center gap-1"
            type="primary"
            @click="$router.push({ name: '' })"
          >
            <Icon icon="lsicon:export-filled" class="text-xl" /> Export Excel
          </a-button>
          <a-button
            class="px-2.5 flex items-center gap-1"
            type="primary"
            @click="$router.push({ name: 'user-role' })"
          >
            <Icon icon="eos-icons:role-binding-outlined" class="text-xl" /> Role
            List
          </a-button>
          <a-button
            class="px-2.5 flex items-center gap-1"
            type="primary"
            @click="$router.push({ name: 'user-permission' })"
          >
            <Icon icon="icon-park-twotone:permissions" class="text-xl" />
            Permissions List
          </a-button>
          <a-button
            class="px-2.5 flex items-center gap-1"
            type="primary"
            @click="isModalVisible = true"
          >
            <Icon icon="ic:baseline-plus" class="text-xl" /> Add New User
          </a-button>
        </div>

        <a-modal
          v-model:open="isModalVisible"
          title="Add New User"
          :footer="null"
        >
          <a-form @finish="createUser(form)" :model="form" class="space-y-4">
            <a-form-item
              label="Staff ID"
              :rules="[
                { required: true, message: 'Please input your Staff ID !' },
              ]"
            >
              <a-input
                v-model:value="form.staff_id"
                placeholder="Enter here..."
              />
            </a-form-item>
            <a-form-item
              label="Name"
              :rules="[
                { required: true, message: 'Please input your user name!' },
              ]"
            >
              <a-input v-model:value="form.name" placeholder="Enter here..." />
            </a-form-item>

            <a-form-item
              label="Email"
              :rules="[
                { required: true, message: 'Please input your user email!' },
              ]"
            >
              <a-input
                v-model:value="form.email"
                type="email"
                placeholder="example@demo.com"
              />
            </a-form-item>

            <a-form-item
              label="Password"
              :rules="[
                { required: true, message: 'Please input your user password!' },
              ]"
            >
              <a-input
                v-model:value="form.password"
                type="password"
                placeholder="Password"
              />
            </a-form-item>

            <a-form-item
              label="Select Role"
              :rules="[
                { required: true, message: 'Please input your user ID!' },
              ]"
            >
              <a-select v-model:value="form.roles" placeholder="Select Role">
                <a-select-option value="" v-if="isLoading"></a-select-option>
                <a-select-option
                  class="mb-2"
                  v-for="(role, index) in roleList"
                  :value="role?.name"
                  :key="index"
                  >{{ role?.name }}</a-select-option
                >
              </a-select>
            </a-form-item>

            <div class="flex justify-end">
              <a-button type="default" @click="handleCancel" class="mr-2"
                >Cancel</a-button
              >
              <a-button type="primary" htmlType="submit">Submit</a-button>
            </div>
          </a-form>
        </a-modal>
      </div>

      <div class="overflow-x-auto">
        <table class="min-w-full border border-gray-300">
          <thead>
            <tr
              class="bg-gray-100 text-gray-600 font-semibold border-b border-gray-300"
            >
              <th class="py-4 px-4">SL</th>
              <th class="py-4 px-4">Staff ID</th>
              <th class="py-4 px-4">Name</th>
              <th class="py-4 px-4">Email</th>
              <th class="py-4 px-4">Role</th>
              <th class="py-4 px-4">Permission</th>
              <th class="py-4 px-4">Status</th>
              <th class="py-4 ps-4 pe-6 text-center">Actions</th>
            </tr>
          </thead>
          <tbody class="bg-white text-gray-800">
            <tr v-if="isLoading" class="border-b border-gray-300">
              <td colspan="8" class="py-4 text-center"><a-spin /></td>
            </tr>

            <tr
              v-if="!isLoading && usersList?.length === 0"
              class="border-b border-gray-300"
            >
              <td colspan="5" class="py-4 text-center">
                <a-empty description="No Users Found" class="my-8" />
              </td>
            </tr>
            <tr
              v-for="(user, index) in usersList"
              :key="user?.id"
              class="border-b border-gray-300"
            >
              <td class="py-2 px-4">{{ index + 1 }}</td>
              <td class="py-2 px-4">{{ user?.staff_id }}</td>
              <td class="py-2 px-4">{{ user?.name }}</td>
              <td class="py-2 px-4">{{ user?.email }}</td>
              <td class="py-2 px-4">
                <div v-if="user?.roles?.length">
                  <span v-for="(role, index) in user?.roles" :key="index">
                    {{ role?.name
                    }}<span class="mr-1" v-if="index + 1 < user?.roles?.length"
                      >,</span
                    >
                  </span>
                </div>
                <div v-else>-</div>
              </td>
              <td class="py-2 px-4">
                <!-- Display all permissions here -->
                <div v-if="user?.permissions?.length">
                  <span
                    v-for="(permission, index) in user?.permissions"
                    :key="index"
                  >
                    {{ permission.name }}
                    <span
                      class="mr-1"
                      v-if="index + 1 < user.permissions.length"
                      >,
                    </span>
                  </span>
                </div>
                <div v-else>-</div>
              </td>
              <td class="py-2 px-4">{{ user?.status || "No Records" }}</td>
              <td class="text-center w-20 py-2">
                <div class="flex me-2">
                  <a-button
                    type="primary"
                    class="bg-blue-200 text-blue-700 edit-btn inline-flex justify-center items-center"
                    @click="handleEdit(user.id)"
                  >
                    <EditOutlined />
                  </a-button>
                  <a-popconfirm
                    title="Are you sure delete?"
                    @confirm="deleteUser(user?.id)"
                  >
                    <a-button
                      type="danger"
                      class="ml-2 bg-red-200 text-red-700 delete-btn inline-flex justify-center items-center"
                    >
                      <DeleteOutlined />
                    </a-button>
                  </a-popconfirm>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
        <a-pagination
          class="mt-8 mb-4"
          v-if="totalItems > itemsPerPage"
          :current="currentPage"
          :page-size="itemsPerPage"
          :total="totalItems"
          :show-size-changer="false"
          @change="handlePagination"
        />
      </div>
    </div>
  </MainLayout>
</template>

<script setup>
import MainLayout from "@/components/layout/MainLayout.vue";
import { onMounted, ref } from "vue";
import { Icon } from "@iconify/vue";
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
} from "@ant-design/icons-vue";
import { useRouter } from "vue-router";
import { apiBase } from "../../config";
import { showNotification } from "../../utilities/notification";
import Cookies from "js-cookie";
import axios from "axios";
import { getTokenConfig } from "../../utilities/tokenConfig";

const router = useRouter();
const isLoading = ref(false);

const isModalVisible = ref(false);
const usersList = ref([]);
const backupList = ref([]);
const permissionList = ref([]);
const roleList = ref([]);
const isDeleting = ref(false);

const form = ref({
  staff_id: "",
  name: "",
  email: "",
  password: "",
  roles: "",
});

const currentPage = ref(1);
const itemsPerPage = ref(10);
const totalItems = ref(0);
const searchQuery = ref(" ");

// fetch users
const fetchUsers = async () => {
  isLoading.value = true;
  try {
    const response = await axios.get(
      `${apiBase}/user_list?page=${currentPage.value}&limit=${itemsPerPage.value}&search=${searchQuery.value}`,
      getTokenConfig()
    );
    console.log(response.data.users);
    if (response?.status == 200 && response?.data?.status === "success") {
      usersList.value = response?.data?.users?.data;
      backupList.value = response?.data?.users;
      totalItems.value = response?.data?.users?.total; // Set total items
      console.log(usersList.value);
      isLoading.value = false;
    }
  } catch (error) {
    usersList.value = [];
    console.log(error);
    showNotification("error", error?.message);
    isLoading.value = false;
  }
};

const handleSearch = () => {
  currentPage.value = 1; // Reset to first page when searching
  fetchUsers();
};

const handlePagination = (page) => {
  currentPage.value = page;
  fetchUsers(page);
};

// get role
const getRole = async () => {
  isLoading.value = true;
  try {
    const response = await axios.get(`${apiBase}/roles`, getTokenConfig());
    if (response?.status == 200 && response?.data?.status == "Success") {
      roleList.value = response?.data?.role;
      isLoading.value = false;
    }
  } catch (error) {
    roleList.value == [];
    isLoading.value = false;
  }
};

// delete user
const deleteUser = async (id) => {
  isDeleting.value = true;
  try {
    const response = await axios.delete(
      `${apiBase}/user_delete/${id}`,
      getTokenConfig()
    );

    isDeleting.value = false;
    if (response?.status === 200 && response?.data?.status === "Success") {
      showNotification("info", response?.data?.message);
      fetchUsers();
    }
  } catch (error) {
    isDeleting.value = false;
    // Make sure to handle the error properly
    showNotification(
      "error",
      error?.response?.data?.message || "An error occurred."
    );
  }
};

// create user

const createUser = async (userInfo) => {
  isModalVisible.value = true;
  try {
    const response = await axios.post(
      `${apiBase}/register`,
      userInfo,
      getTokenConfig()
    );
    isLoading.value = false;
    if (response?.status == 201 && response?.data?.status === "success") {
      showNotification("success", response?.data?.message);
      fetchUsers();
      resetform();
    } else if (response?.status === 200) {
      showNotification("warning", "User already exists!");
    }
    isModalVisible.value = false;
  } catch (error) {
    isLoading.value = false;
    showNotification("error", error?.message);
    isModalVisible.value = false;
  }
};

// reset form
const resetform = () => {
  form.value = {
    staff_id: "",
    name: "",
    email: "",
    password: "",
    roles: "",
  };
};

const handleCancel = () => {
  form.value = { name: "", email: "", password: "", roles: "" }; // Reset form
  isModalVisible.value = false; // Close modal
};
const handleEdit = (id) => {
  router.push({ name: "user-edit", params: { id } });
};

onMounted(async () => {
  await fetchUsers();
  await getRole();
  // getPermission();

  // deleteUser();
});
</script>

<style scoped>
tr td {
  text-align: center;
}

.edit-btn:hover {
  background-color: #93c5fd !important;
  border-color: #93c5fd !important;
  color: #1d4ed8;
}

.delete-btn:hover {
  background-color: #fca5a5 !important;
}
</style>
