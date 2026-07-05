<template>
  <MainLayout>
    <div class="p-6">
      <!-- Header -->
      <div class="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 class="text-2xl font-semibold text-gray-800">Product List</h1>
        </div>
        <a-button
          type="primary"
          class="flex items-center gap-1 bg-[#2d2d61]"
          @click="openAddModal"
        >
          <PlusOutlined /> Add Product
        </a-button>
      </div>

      <div
        class="flex flex-wrap items-center justify-between gap-3 mb-4 bg-white rounded-lg"
      >
        <a-input-search
          v-model:value="searchQuery"
          placeholder="Search product name or code..."
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
              <th class="py-3 px-4 text-left">Product Code</th>
              <th class="py-3 px-4 text-left">Product Name</th>
              <th class="py-3 px-4 text-left">Category</th>
              <th class="py-3 px-4 text-left">Discount Type</th>
              <th class="py-3 px-4 text-center w-28">Status</th>
              <th class="py-3 px-4 text-center w-32">Actions</th>
            </tr>
          </thead>
          <tbody class="text-gray-800">
            <tr v-if="isLoading">
              <td colspan="7" class="py-6 text-center">
                <a-spin />
              </td>
            </tr>

            <tr v-else-if="filteredData().length === 0">
              <td colspan="7" class="py-6 text-center">
                <a-empty description="No products found" />
              </td>
            </tr>

            <tr
              v-for="(product, index) in paginatedData()"
              :key="product.ProductID ?? index"
              class="border-b border-gray-100 hover:bg-gray-50"
            >
              <td class="py-2 px-4 text-center">
                {{ (currentPage - 1) * pageSize + index + 1 }}
              </td>
              <td class="py-2 px-4">{{ product.ProductCode ?? "-" }}</td>
              <td class="py-2 px-4 font-medium">{{ product.ProductName ?? "-" }}</td>
              <td class="py-2 px-4">{{ product?.category?.Category ?? "-" }}</td>
              <td class="py-0 px-4">
                {{ product?.category?.discount_type?.DiscountType ?? "-" }}
              </td>
              <td class="py-0 px-4 text-center">
                <a-tag
                  :color="product.Active === 'Y' ? 'green' : 'red'"
                  class="capitalize rounded-full px-3"
                >
                  {{ product.Active === "Y" ? "Active" : "Inactive" }}
                </a-tag>
              </td>
              <td class="py-0 px-4">
                <div class="flex justify-center gap-2">
                  <a-button
                    size="small"
                    class="bg-blue-50 text-blue-600 border-blue-100 hover:bg-blue-100"
                    @click="handleEdit(product)"
                  >
                    <EditOutlined />
                  </a-button>
                  <a-popconfirm
                    title="Delete this product?"
                    ok-text="Yes"
                    cancel-text="No"
                    @confirm="handleDelete(product.ProductID)"
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

      <!-- Add product Modal -->
      <a-modal
        v-model:open="isAddModalOpen"
        title="Add Product"
        :footer="null"
        :destroy-on-close="true"
        @cancel="resetForm"
      >
        <a-form :model="form" layout="vertical" @finish="createProduct">
          <a-form-item
            label="Product Code"
            name="ProductCode"
            :rules="[{ required: true, message: 'Please enter product code' }]"
          >
            <a-input v-model:value="form.ProductCode" placeholder="Enter product code" />
          </a-form-item>

          <a-form-item
            label="Product Name"
            name="ProductName"
            :rules="[{ required: true, message: 'Please enter product name' }]"
          >
            <a-input v-model:value="form.ProductName" placeholder="Enter product name" />
          </a-form-item>

          <a-form-item
            label="Category"
            name="CategoryID"
            :rules="[{ required: true, message: 'Please select a category' }]"
          >
            <a-select v-model:value="form.CategoryID" placeholder="Select category">
              <a-select-option
                v-for="c in categories"
                :key="c.CategoryID"
                :value="c.CategoryID"
              >
                {{ c.Category }}
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

      <!-- Edit product -->
      <a-modal
        v-model:open="isEditModalOpen"
        title="Edit Product"
        :footer="null"
        :destroy-on-close="true"
        @cancel="closeEditModal"
      >
        <a-form :model="form" layout="vertical" @finish="editProduct">
          <a-form-item
            label="Product Code"
            name="ProductCode"
            :rules="[{ required: true, message: 'Please enter product code' }]"
          >
            <a-input v-model:value="form.ProductCode" placeholder="Enter product code" />
          </a-form-item>

          <a-form-item
            label="Product Name"
            name="ProductName"
            :rules="[{ required: true, message: 'Please enter product name' }]"
          >
            <a-input v-model:value="form.ProductName" placeholder="Enter product name" />
          </a-form-item>

          <a-form-item
            label="Category"
            name="CategoryID"
            :rules="[{ required: true, message: 'Please select a category' }]"
          >
            <a-select v-model:value="form.CategoryID" placeholder="Select category">
              <a-select-option
                v-for="c in categories"
                :key="c.CategoryID"
                :value="c.CategoryID"
              >
                {{ c.Category }}
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
const products = ref([]);

const currentPage = ref(1);
const pageSize = ref(18);

const isAddModalOpen = ref(false);
const isEditModalOpen = ref(false);
const isSubmitting = ref(false);
const editingProductId = ref(null);
const form = ref({
  ProductCode: "",
  ProductName: "",
  CategoryID: "",
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

const fetchProducts = async () => {
  isLoading.value = true;
  try {
    const res = await axios.get(`${apiBase}/product`, getTokenConfig());
    if (res?.data?.status === 1 || res?.data?.status === "success") {
      products.value = res?.data?.data ?? [];
    } else {
      products.value = [];
      showNotification("error", res?.data?.message || "Failed to load products.");
    }
  } catch (error) {
    products.value = [];
    showNotification(
      "error",
      error?.response?.data?.message || error?.message || "Failed to load products."
    );
  } finally {
    isLoading.value = false;
  }
};

const filteredData = () => {
  const q = searchQuery.value.trim().toLowerCase();
  if (!q) return products.value;
  return products.value.filter(
    (p) =>
      p?.ProductName?.toLowerCase().includes(q) ||
      p?.ProductCode?.toLowerCase().includes(q)
  );
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
    ProductCode: "",
    ProductName: "",
    CategoryID: "",
    Active: "Y",
  };
};

const createProduct = async () => {
  isSubmitting.value = true;
  try {
    const res = await axios.post(
      `${apiBase}/product`,
      {
        ProductCode: form.value.ProductCode,
        ProductName: form.value.ProductName,
        CategoryID: form.value.CategoryID,
        Active: form.value.Active,
      },
      getTokenConfig()
    );

    if (res?.data?.status === 1 || res?.data?.status === "success") {
      showNotification("success", res?.data?.message || "Product created successfully.");
      isAddModalOpen.value = false;
      resetForm();
      await fetchProducts();
    } else {
      showNotification("error", res?.data?.message || "Failed to create product.");
    }
  } catch (error) {
    showNotification(
      "error",
      error?.response?.data?.message || error?.message || "Failed to create product."
    );
  } finally {
    isSubmitting.value = false;
  }
};
// fetch categories for select options
const categories = ref([]);
const fetchCategories = async () => {
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
  }
};
// handle edit
const handleEdit = (record) => {
  editingProductId.value = record.ProductID;
  form.value = {
    ProductCode: record.ProductCode ?? "",
    ProductName: record.ProductName ?? "",
    CategoryID: record.CategoryID != null ? Number(record.CategoryID) : undefined,
    Active: record.Active ?? "Y",
  };
  isEditModalOpen.value = true;
};

const closeEditModal = () => {
  isEditModalOpen.value = false;
  editingProductId.value = null;
  resetForm();
};

const editProduct = async () => {
  if (!editingProductId.value) return;
  isSubmitting.value = true;
  try {
    const res = await axios.put(
      `${apiBase}/product/${editingProductId.value}`,
      {
        ProductCode: form.value.ProductCode,
        ProductName: form.value.ProductName,
        CategoryID: form.value.CategoryID,
        Active: form.value.Active,
      },
      getTokenConfig()
    );

    if (res?.data?.status === 1 || res?.data?.status === "success") {
      showNotification("success", res?.data?.message || "Product updated successfully.");
      closeEditModal();
      await fetchProducts();
    } else {
      showNotification("error", res?.data?.message || "Failed to update product.");
    }
  } catch (error) {
    showNotification(
      "error",
      error?.response?.data?.message || error?.message || "Failed to update product."
    );
  } finally {
    isSubmitting.value = false;
  }
};

const handleDelete = async (id) => {
  try {
    const res = await axios.delete(`${apiBase}/product/${id}`, getTokenConfig());
    if (res?.data?.status === 1 || res?.data?.status === "success") {
      showNotification("success", res?.data?.message || "Product deleted successfully.");
      await fetchProducts();
    } else {
      showNotification("error", res?.data?.message || "Failed to delete product.");
    }
  } catch (error) {
    showNotification(
      "error",
      error?.response?.data?.message || error?.message || "Failed to delete product."
    );
  }
};

onMounted(() => {
  fetchProducts();
  fetchDiscountTypes();
  fetchCategories();
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
