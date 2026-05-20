<template>
  <MainLayout>
    <div class="md:px-10 md:pt-10 pb-4 relative z-20">
      <!-- Search and Add Permissions Section -->
      <div class="md:flex justify-between mb-3 mt-4 mt:mt-0">
        <a-input
          placeholder="Search Permission..."
          class="w-[300px]"
          @input="searchList($event.target.value)"
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
            <plus-outlined /> Add New Permission
          </a-button>
        </div>
      </div>

      <!-- Add permission modal start -->
      <a-modal
        v-model:visible="isModalVisible"
        title="Add New Permission"
        @cancel="handleCancel"
        :footer="null"
      >
        <a-form @finish="addNewPermissions" :model="form" class="space-y-4">
          <!-- Name Field -->
          <a-form-item
            label="Permission Name"
            :rules="[
              { required: true, message: 'Please input your permission name!' },
            ]"
          >
            <a-input
              v-model:value="form.name"
              placeholder="Enter permission name..."
            />
          </a-form-item>
          <!-- Submit and Cancel Buttons -->
          <div class="flex justify-end space-x-2">
            <a-button type="default" @click="handleCancel">Cancel</a-button>
            <a-button type="primary" html-type="submit">Submit</a-button>
          </div>
        </a-form>
      </a-modal>
      <!-- Add permission modal end -->

      <!-- Permissions Table -->
      <div class="overflow-x-auto mt-4">
        <table class="min-w-full border border-gray-300">
          <thead>
            <tr
              class="bg-gray-100 text-gray-600 font-semibold border-b border-gray-300"
            >
              <th class="py-4 px-4 text-left">Permission Name</th>
              <th class="py-4 px-4 text-center">Actions</th>
            </tr>
          </thead>
          <tbody class="bg-white text-gray-800">
            <tr v-if="isLoading" class="border-b border-gray-300">
              <td colspan="6" class="py-4 text-center"><a-spin /></td>
            </tr>
            <tr
              v-if="!isLoading && permissionList.length === 0"
              class="border-b border-gray-300"
            >
              <td colspan="5" class="py-4 text-center">
                <a-empty description="No Permissions Found" class="my-8" />
              </td>
            </tr>
            <tr
              v-for="(permission, index) in permissionList"
              :key="index"
              :class="{ 'bg-gray-50': index % 2 === 0 }"
              class="border-b border-gray-300"
            >
              <td class="py-2 px-4">{{ permission.name }}</td>
              <td class="text-center p-2 w-16">
                <div class="flex items-center gap-3">
                  <a-button
                    class="bg-blue-200 text-blue-700 delete-btn inline-flex items-center justify-center"
                    @click="
                      $router.push({
                        name: 'update-user-permission',
                        params: { id: permission?.id },
                        query: { name: permission?.name },
                      })
                    "
                  >
                    <EditOutlined />
                  </a-button>
                  <a-popconfirm
                    title="Are you sure delete?"
                    @confirm="deletePermission(permission.id)"
                  >
                    <a-button
                      class="bg-red-200 text-red-700 delete-btn inline-flex items-center justify-center"
                      type="text"
                      danger
                    >
                      <delete-outlined />
                    </a-button>
                  </a-popconfirm>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
    <div class="corder absolute bottom-0 right-0">
      <img class="w-48" :src="cornerImg" alt="" />
    </div>
  </MainLayout>
</template>

<script setup>
import { onMounted, ref } from "vue";
import { useRouter } from "vue-router";
import MainLayout from "@/components/layout/MainLayout.vue";
import {
  LeftOutlined,
  PlusOutlined,
  DeleteOutlined,
  EditOutlined,
} from "@ant-design/icons-vue";
import cornerImg from "@/assets/images/corner.png";
import { apiBase } from "../../config";
import { showNotification } from "../../utilities/notification";
import Cookies from "js-cookie";
import axios from "axios";

const router = useRouter();

const isModalVisible = ref(false);
const isEditModalVisible = ref(false);
const form = ref({ name: "" });
const isLoading = ref(false);
const permissionList = ref([]);
const backupList = ref([]);
const isDeleting = ref({});

// Search
const searchList = (query) => {
  permissionList.value = query
    ? backupList.value.filter((permission) =>
        permission.name.toLowerCase().includes(query.toLowerCase())
      )
    : backupList.value;
};

// permission list
const getPermission = async () => {
  isLoading.value = true;
  const token = Cookies.get("token");
  const config = {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  };
  try {
    const response = await axios.get(`${apiBase}/permissions`, config);
    if (response?.status == 200 && response?.data?.status === "Success") {
      permissionList.value = response?.data?.permissions;
      backupList.value = response?.data?.permissions;
      isLoading.value = false;
    }
  } catch (error) {
    console.error("Error fetching permissions:", error);
    permissionList.value = [];
    showNotification(
      "error",
      error?.message || "An error occurred while fetching data."
    );
    isLoading.value = false;
  }
};

// add new permission
const addNewPermissions = async () => {
  isLoading.value = true;
  const token = Cookies.get("token");
  const config = {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  };

  const payload = {
    name: form.value.name,
  };

  try {
    const response = await axios.post(
      `${apiBase}/permissions`,
      payload,
      config
    );
    console.log("API Response:", response);

    if (response?.status === 200 && response?.data?.status === "Success") {
      showNotification("success", response?.data?.message);
      form.value.name = "";
      isModalVisible.value = false;
      getPermission();
    }
  } catch (error) {
    console.error("Error adding permission:", error);
  } finally {
    isLoading.value = false;
  }
};

// Delete Permission Function
const deletePermission = async (id) => {
  isDeleting.value = true;
  const token = Cookies.get("token");
  const config = {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  };
  try {
    const response = await axios.delete(`${apiBase}/permissions/${id}`, config);
    if (response?.status === 200 && response?.data?.status === "Success") {
      showNotification("info", response?.data?.message);
      getPermission();
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

// Close Modal
const handleCancel = () => {
  isModalVisible.value = false;
  form.value.name = ""; // Clear form
};

// Navigate Back
const goBack = () => {
  router.back();
};

onMounted(() => {
  getPermission();
});
</script>

<style scoped>
.ant-modal-body {
  background-color: #f9f9f9;
}

.ant-input,
.ant-select-selector {
  background-color: #f3f4f6;
  border-radius: 5px;
  border: 1px solid #d1d5db;
}

.delete-btn:hover {
  background-color: #fca5a5 !important;
}
</style>
