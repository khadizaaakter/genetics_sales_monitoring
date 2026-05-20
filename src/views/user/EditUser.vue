<template>
  <MainLayout>
    <div class="md:px-10 md:pt-10 pb-4 relative z-20">
      <div class="grid md:grid-cols-3 col-span-2 gap-3">
        <div class="bg-white text-center py-3 px-5 rounded-md mb-3">
          <h2 class="text-xl font-semibold mt-4">{{ userData?.name }}</h2>

          <!-- user details -->
          <div class="flex flex-wrap justify-center mt-2">
            <span
              v-for="(role, index) in userData?.roles"
              :key="index"
              class="bg-gray-200 text-gray-700 rounded-full px-3 py-1 text-sm font-medium"
            >
              {{ role?.name }}
            </span>
          </div>
          <hr class="my-3 md:block hidden" />
          <div class="text-left">
            <h3 class="text-lg font-semibold">Details</h3>
            <p><strong class="mr-1">Name:</strong> {{ userData?.name }}</p>
            <p><strong class="mr-1">Email:</strong> {{ userData?.email }}</p>
            <p>
              <strong class="mr-1">Roles:</strong>
              <span v-for="(role, index) in userData?.roles" :key="index">{{
                role?.name
              }}</span>
            </p>
            <p>
              <strong class="mr-1">Permissions:</strong>
              <span
                v-for="(permission, index) in userData?.permissions"
                :key="index"
              >
                {{ permission?.name }}
                <span v-if="index < userData?.permissions?.length - 1">, </span>
              </span>
            </p>
          </div>
        </div>
        <div class="col-span-2">
          <!-- update user -->
          <div class="mb-3 bg-white py-3 px-5 rounded-md">
            <h2 class="text-xl font-semibold mb-3">Update User</h2>
            <form @submit.prevent="updateUser(formData)">
              <div class="mb-3">
                <label class="block mb-1">Name</label>
                <input
                  v-model="formData.name"
                  placeholder="Enter Name"
                  class="w-full border p-2 rounded-md"
                  required
                />
              </div>
              <div class="mb-3">
                <label class="block mb-1">Email</label>
                <input
                  v-model="formData.email"
                  placeholder="Enter Email"
                  type="email"
                  class="w-full border p-2 rounded-md"
                  required
                />
              </div>
              <div class="mb-3">
                <label class="block mb-1">Password</label>
                <input
                  v-model="formData.password"
                  placeholder="Enter passowrd"
                  type="password"
                  class="w-full border p-2 rounded-md"
                />
              </div>

              <div class="mb-3">
                <label class="block mb-1">Roles</label>
                <div v-for="role in roleList" :key="role?.id">
                  <label
                    :for="role?.id"
                    class="flex items-center space-x-2 px-2 py-1 rounded-md cursor-pointer hover:bg-gray-100"
                  >
                    <input
                      type="checkbox"
                      :id="role?.id"
                      :value="role?.name"
                      v-model="formData.roles"
                      class="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <span class="text-sm font-medium text-gray-700">{{
                      role?.name
                    }}</span>
                  </label>
                </div>
              </div>
              <div class="flex gap-2">
                <button
                  type="submit"
                  class="bg-blue-600 text-white px-4 py-2 rounded"
                >
                  Submit
                </button>
                <!-- <Button type="primary" htmlType="submit">Submit</Button> -->
                <Button @click="router.go(-1)">Previous</Button>
              </div>
            </form>
          </div>

          <!-- assifn permission -->
          <div class="mb-3 bg-white py-3 px-5 rounded-md">
            <h2 class="text-xl font-semibold mb-3">Update Permissions</h2>
            <form @submit.prevent="assignPermission">
              <div class="mb-3">
                <label class="gap-x-2 mb-1 ms-2 flex items-center">
                  <input
                    type="checkbox"
                    v-model="isAll"
                    @change="toggleSelectAll"
                    class="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <span class="text-sm text-gray-700 font-bold"
                    >Select All</span
                  >
                </label>
                <div v-for="permission in permissionList" :key="permission?.id">
                  <label
                    :for="permission?.id"
                    class="flex items-center space-x-2 px-2 py-1 rounded-md cursor-pointer hover:bg-gray-100"
                  >
                    <input
                      type="checkbox"
                      :id="permission?.id"
                      :value="permission?.name"
                      v-model="permissions"
                      class="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <span class="text-sm font-medium text-gray-700">{{
                      permission?.name
                    }}</span>
                  </label>
                </div>
              </div>
              <div class="flex gap-2">
                <button
                  type="submit"
                  class="bg-blue-600 text-white px-4 py-2 rounded"
                >
                  Submit
                </button>
                <Button @click="router.go(-1)">Previous</Button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
    <div class="corder absolute bottom-0 right-0">
      <img class="w-48" :src="cornerImg" alt="" />
    </div>
  </MainLayout>
</template>
<script setup>
import { ref, onMounted, watch } from "vue";
import MainLayout from "@/components/layout/MainLayout.vue";
import { useRouter, useRoute } from "vue-router";
import cornerImg from "@/assets/images/corner.png";
import axios from "axios";
import Cookies from "js-cookie";
import { showNotification } from "../../utilities/notification";
import { apiBase } from "../../config";

const router = useRouter();
const route = useRoute();
const { id } = route?.params;

const token = Cookies.get("token");
const config = {
  headers: {
    Authorization: `Bearer ${token}`,
  },
};

const userData = ref();
const formData = ref({
  name: "",
  email: "",
  password: "",
  roles: [],
});
const permissions = ref([]);
const permissionList = ref(null);
const roleList = ref();

// Fetch user details
const getDetails = async () => {
  try {
    const res = await axios.get(`${apiBase}/user_edit/${id}`, config);
    userData.value = res?.data?.user_info;
  } catch (err) {
    console.error(err);
  }
};

// Fetch role list
const getRoleList = async () => {
  try {
    const res = await axios.get(`${apiBase}/roles`, config);
    roleList.value = res?.data?.role;
  } catch (err) {
    console.error(err);
  }
};

// Fetch permissions
const getPermission = async () => {
  try {
    const res = await axios.get(`${apiBase}/permissions`, config);
    if (res?.status === 200 && res?.data?.status === "Success") {
      permissionList.value = res?.data?.permissions;
    }
  } catch (err) {
    console.error(err);
  }
};

// Assign permissions
const assignPermission = async () => {
  try {
    const res = await axios.put(
      `${apiBase}/assign_permission/${id}`,
      { permissions: permissions.value },
      config
    );
    if (res?.status === 201 && res?.data?.status === "success") {
      showNotification(
        "success",
        res?.data?.message || "Permissions updated successfully."
      );
    } else {
      showNotification(
        "error",
        res?.data?.message || "Failed to update permissions."
      );
    }
  } catch (err) {
    showNotification(
      "error",
      err?.response?.data?.message || "Error updating permissions."
    );
    console.error(err);
  }
};

// Update user
const updateUser = async (userInfo) => {
  try {
    const res = await axios.put(
      `${apiBase}/user_update/${id}`,
      userInfo,
      config
    );
    if (res?.status === 201 && res?.data?.status === "success") {
      showNotification("success", res?.data?.message);
    } else {
      showNotification("error", res?.data?.message?.email?.[0]);
    }
    router.go(-1);
  } catch (err) {
    showNotification("error", err?.message);
  }
};

onMounted(async () => {
  await getDetails();
  formData.value = {
    name: userData.value?.name,
    email: userData.value?.email,
    password: "",
    roles: userData.value?.roles?.map((item) => item?.name),
  };
  permissions.value = userData.value?.permissions?.map((item) => item?.name);
  await getRoleList();
  await getPermission();
});

const isAll = ref(false);

const toggleSelectAll = () => {
  if (isAll.value) {
    // Select all permission names
    permissions.value = permissionList.value.map((p) => p.name);
  } else {
    // Deselect all
    permissions.value = [];
  }
};

watch([permissions, permissionList], () => {
  if (permissionList.value && permissionList.value.length) {
    isAll.value = permissions.value.length === permissionList.value.length;
  }
});
</script>

<style scoped>
input:focus-visible {
  box-shadow: none;
  outline: none;
}
</style>
