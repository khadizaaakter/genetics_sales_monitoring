<template>
  <MainLayout>
    <div class="p-6">
      <!-- Header -->
      <div class="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 class="text-2xl font-semibold text-gray-800">Product Categories</h1>
        </div>
        <a-button
          type="primary"
          class="flex items-center gap-1 bg-[#2d2d61]"
          @click="openAddModal"
        >
          <PlusOutlined /> Add Category
        </a-button>
      </div>

      <div
        class="flex flex-wrap items-center justify-between gap-3 mb-4 bg-white rounded-lg"
      >
        <a-input-search
          v-model:value="searchQuery"
          placeholder="Search category..."
          class="md:w-72 w-full"
          allow-clear
        />
      </div>

      <!-- Table -->
      <div class="bg-white rounded-lg border border-gray-200 overflow-x-auto">
        <table class="min-w-full text-sm">
          <thead>
            <tr class="bg-[#f8f9fc] text-gray-600 font-semibold border-b border-gray-200">
              <th class="py-3 px-4 text-center w-16">SL</th>
              <th class="py-3 px-4 text-left">Category</th>
              <th class="py-3 px-4 text-left">Discount Type</th>
              <th class="py-3 px-4 text-center w-28">Status</th>
              <th class="py-3 px-4 text-center w-32">Actions</th>
            </tr>
          </thead>
          <tbody class="text-gray-800">
            <tr v-if="isLoading">
              <td colspan="5" class="py-6 text-center">
                <a-spin />
              </td>
            </tr>

            <tr v-else-if="filteredData().length === 0">
              <td colspan="5" class="py-6 text-center">
                <a-empty description="No categories found" />
              </td>
            </tr>

            <tr
              v-for="(category, index) in paginatedData()"
              :key="category.CategoryID ?? index"
              class="border-b border-gray-100 hover:bg-gray-50"
            >
              <td class="py-2 px-4 text-center">
                {{ (currentPage - 1) * pageSize + index + 1 }}
              </td>
              <td class="py-2 px-4 font-medium">{{ category.Category ?? "-" }}</td>
              <td class="py-2 px-4">
                {{ category?.discount_type?.DiscountType ?? "-" }}
              </td>
              <td class="py-2 px-4 text-center">
                <a-tag
                  :color="category.Active === 'Y' ? 'green' : 'red'"
                  class="capitalize rounded-full px-3"
                >
                  {{ category.Active === "Y" ? "Active" : "Inactive" }}
                </a-tag>
              </td>
              <td class="py-2 px-4">
                <div class="flex justify-center gap-2">
                  <a-button
                    size="small"
                    class="bg-blue-50 text-blue-600 border-blue-100 hover:bg-blue-100"
                    @click="handleEdit(category)"
                  >
                    <EditOutlined />
                  </a-button>
                  <a-popconfirm
                    title="Delete this category?"
                    ok-text="Yes"
                    cancel-text="No"
                    @confirm="handleDelete(category.CategoryID)"
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

      <!-- Add Category Modal -->
      <a-modal
        v-model:open="isAddModalOpen"
        title="Add Category"
        :footer="null"
        :destroy-on-close="true"
        @cancel="resetForm"
      >
        <a-form :model="form" layout="vertical" @finish="createCategory">
          <a-form-item
            label="Category Name"
            name="Category"
            :rules="[{ required: true, message: 'Please enter category name' }]"
          >
            <a-input v-model:value="form.Category" placeholder="e.g. Mobile Phones" />
          </a-form-item>

          <a-form-item
            label="Discount Type"
            name="DiscountTypeID"
            :rules="[{ required: true, message: 'Please select a discount type' }]"
          >
            <a-select
              v-model:value="form.DiscountTypeID"
              placeholder="Select discount type"
            >
              <a-select-option
                v-for="dt in discountTypes"
                :key="dt.DiscountTypeID"
                :value="dt.DiscountTypeID"
              >
                {{ dt.DiscountType }}
              </a-select-option>
            </a-select>
          </a-form-item>

          <a-form-item label="Status" name="Active">
            <a-select v-model:value="form.Active">
              <a-select-option value="Y">Active</a-select-option>
              <a-select-option value="N">Inactive</a-select-option>
            </a-select>
          </a-form-item>

          <div class="flex justify-end gap-2 mt-4">
            <a-button @click="closeAddModal" :disabled="isSubmitting"> Cancel </a-button>
            <a-button
              type="primary"
              html-type="submit"
              :loading="isSubmitting"
              class="bg-[#2d2d61]"
            >
              Save
            </a-button>
          </div>
        </a-form>
      </a-modal>

      <!-- Edit category -->
      <a-modal
        v-model:open="isEditModalOpen"
        title="Edit Category"
        :footer="null"
        :destroy-on-close="true"
        @cancel="closeEditModal"
      >
        <a-form :model="form" layout="vertical" @finish="editCategory">
          <a-form-item
            label="Category Name"
            name="Category"
            :rules="[{ required: true, message: 'Please enter category name' }]"
          >
            <a-input v-model:value="form.Category" placeholder="Enter category name" />
          </a-form-item>

          <a-form-item
            label="Discount Type"
            name="DiscountTypeID"
            :rules="[{ required: true, message: 'Please select a discount type' }]"
          >
            <a-select
              v-model:value="form.DiscountTypeID"
              placeholder="Select discount type"
            >
              <a-select-option
                v-for="dt in discountTypes"
                :key="dt.DiscountTypeID"
                :value="dt.DiscountTypeID"
              >
                {{ dt.DiscountType }}
              </a-select-option>
            </a-select>
          </a-form-item>

          <a-form-item label="Status" name="Active">
            <a-select v-model:value="form.Active">
              <a-select-option value="Y">Active</a-select-option>
              <a-select-option value="N">Inactive</a-select-option>
            </a-select>
          </a-form-item>

          <div class="flex justify-end gap-2 mt-4">
            <a-button @click="closeEditModal" :disabled="isSubmitting"> Cancel </a-button>
            <a-button
              type="primary"
              html-type="submit"
              :loading="isSubmitting"
              class="bg-[#2d2d61]"
            >
              Update
            </a-button>
          </div>
        </a-form>
      </a-modal>
    </div>
  </MainLayout>
</template>

<script setup>
import { ref, onMounted, watch } from "vue";
import axios from "axios";
import MainLayout from "@/components/layout/MainLayout.vue";
import { PlusOutlined, EditOutlined, DeleteOutlined } from "@ant-design/icons-vue";
import { apiBase } from "@/config";
import { getTokenConfig } from "@/utilities/tokenConfig";
import { showNotification } from "@/utilities/notification";

const searchQuery = ref("");
const isLoading = ref(false);
const categories = ref([]);

const currentPage = ref(1);
const pageSize = ref(10);

const isAddModalOpen = ref(false);
const isEditModalOpen = ref(false);
const isSubmitting = ref(false);
const editingCategoryId = ref(null);
const form = ref({
  Category: "",
  DiscountTypeID: undefined,
  Active: "Y",
});

const discountTypes = ref([]);

const fetchDiscountTypes = async () => {
  try {
    const res = await axios.get(`${apiBase}/discount_type`, getTokenConfig());
    if (res?.data?.status === 1 || res?.data?.status === "success") {
      discountTypes.value = res?.data?.data ?? [];
    } else {
      discountTypes.value = [];
    }
  } catch (error) {
    discountTypes.value = [];
    showNotification(
      "error",
      error?.response?.data?.message || error?.message || "Failed to load discount types."
    );
  }
};

const fetchCategories = async () => {
  isLoading.value = true;
  try {
    const res = await axios.get(`${apiBase}/product_category`, getTokenConfig());
    if (res?.data?.status === 1 || res?.data?.status === "success") {
      categories.value = res?.data?.data ?? [];
    } else {
      categories.value = [];
      showNotification("error", res?.data?.message || "Failed to load categories.");
    }
  } catch (error) {
    categories.value = [];
    showNotification(
      "error",
      error?.response?.data?.message || error?.message || "Failed to load categories."
    );
  } finally {
    isLoading.value = false;
  }
};

const filteredData = () => {
  const q = searchQuery.value.trim().toLowerCase();
  if (!q) return categories.value;
  return categories.value.filter((c) => c?.Category?.toLowerCase().includes(q));
};

const paginatedData = () => {
  const start = (currentPage.value - 1) * pageSize.value;
  return filteredData().slice(start, start + pageSize.value);
};

watch(searchQuery, () => {
  currentPage.value = 1;
});

const openAddModal = () => {
  resetForm();
  isAddModalOpen.value = true;
};

const closeAddModal = () => {
  isAddModalOpen.value = false;
  resetForm();
};

const resetForm = () => {
  form.value = {
    Category: "",
    DiscountTypeID: undefined,
    Active: "Y",
  };
};

const createCategory = async () => {
  isSubmitting.value = true;
  try {
    const res = await axios.post(
      `${apiBase}/product_category`,
      {
        Category: form.value.Category,
        DiscountTypeID: form.value.DiscountTypeID,
        Active: form.value.Active,
      },
      getTokenConfig()
    );

    if (res?.data?.status === 1 || res?.data?.status === "success") {
      showNotification("success", res?.data?.message || "Category created successfully.");
      isAddModalOpen.value = false;
      resetForm();
      await fetchCategories();
    } else {
      showNotification("error", res?.data?.message || "Failed to create category.");
    }
  } catch (error) {
    showNotification(
      "error",
      error?.response?.data?.message || error?.message || "Failed to create category."
    );
  } finally {
    isSubmitting.value = false;
  }
};

const handleEdit = (record) => {
  editingCategoryId.value = record.CategoryID;
  form.value = {
    Category: record.Category ?? "",
    DiscountTypeID: record.DiscountTypeID ? Number(record.DiscountTypeID) : undefined,
    Active: record.Active ?? "Y",
  };
  isEditModalOpen.value = true;
};

const closeEditModal = () => {
  isEditModalOpen.value = false;
  editingCategoryId.value = null;
  resetForm();
};

const editCategory = async () => {
  if (!editingCategoryId.value) return;
  isSubmitting.value = true;
  try {
    const res = await axios.put(
      `${apiBase}/product_category/${editingCategoryId.value}`,
      {
        Category: form.value.Category,
        DiscountTypeID: form.value.DiscountTypeID,
        Active: form.value.Active,
      },
      getTokenConfig()
    );

    if (res?.data?.status === 1 || res?.data?.status === "success") {
      showNotification("success", res?.data?.message || "Category updated successfully.");
      closeEditModal();
      await fetchCategories();
    } else {
      showNotification("error", res?.data?.message || "Failed to update category.");
    }
  } catch (error) {
    showNotification(
      "error",
      error?.response?.data?.message || error?.message || "Failed to update category."
    );
  } finally {
    isSubmitting.value = false;
  }
};

const handleDelete = async (id) => {
  try {
    const res = await axios.delete(`${apiBase}/product_category/${id}`, getTokenConfig());

    if (res?.data?.status === 1 || res?.data?.status === "success") {
      showNotification("success", res?.data?.message || "Category deleted successfully.");
      await fetchCategories();
    } else {
      showNotification("error", res?.data?.message || "Failed to delete category.");
    }
  } catch (error) {
    showNotification(
      "error",
      error?.response?.data?.message || error?.message || "Failed to delete category."
    );
  }
};

onMounted(() => {
  fetchCategories();
  fetchDiscountTypes();
});
</script>

<style scoped>
:deep(.ant-table-thead > tr > th) {
  background: #f8f9fc !important;
  color: #4b5563 !important;
  font-weight: 600 !important;
}

:deep(.ant-table-tbody > tr:hover > td) {
  background: #f9fafb !important;
}
</style>
