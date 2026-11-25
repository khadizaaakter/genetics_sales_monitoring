<template>
  <MainLayout>
    <div class="p-0">
      <!-- Header -->
      <div class="flex flex-wrap items-center justify-end gap-3 mb-4">
        <div class="flex flex-wrap gap-2">
          <a-button
            class="flex items-center gap-1"
            :loading="isExporting"
            :disabled="isLoading || total === 0"
            @click="exportToExcel"
          >
            <FileExcelOutlined /> Export to Excel
          </a-button>
          <a-button
            type="primary"
            class="flex items-center gap-1 bg-[#2d2d61]"
            @click="openAddModal"
          >
            <PlusOutlined /> Add LA
          </a-button>
        </div>
      </div>

      <!-- Filters -->
      <div class="flex flex-wrap items-center gap-3 mb-4">
        <a-input-search
          v-model:value="searchInput"
          placeholder="Search LA, mobile, village, dealer, area..."
          :maxlength="100"
          class="md:w-80 w-full"
          allow-clear
          @search="applySearchNow"
        />

        <a-select
          v-model:value="dealerFilter"
          class="md:w-64 w-full"
          placeholder="All Dealers"
          allow-clear
          show-search
          :options="dealerOptions"
          :filter-option="filterOption"
        />

        <a-select v-model:value="statusFilter" class="md:w-40 w-full">
          <a-select-option value="all">All Status</a-select-option>
          <a-select-option value="Y">Active</a-select-option>
          <a-select-option value="N">Inactive</a-select-option>
        </a-select>
      </div>

      <!-- Table -->
      <div class="bg-white rounded-lg border border-gray-200 overflow-x-auto">
        <table class="la-table min-w-full text-sm">
          <thead>
            <tr class="bg-[#f8f9fc] text-gray-600 font-semibold border-b border-gray-200">
              <th class="py-3 px-3 text-center w-14">SL</th>
              <th class="py-3 px-3 text-left">LA Name</th>
              <th class="py-3 px-3 text-left">Mobile No</th>
              <th class="py-3 px-3 text-left">District</th>
              <th class="py-3 px-3 text-left">Upazilla</th>
              <th class="py-3 px-3 text-left">Union</th>
              <th class="py-3 px-3 text-left">Village</th>
              <th class="py-3 px-3 text-left">Dealer</th>
              <th class="py-3 px-3 text-center w-24">Status</th>
              <th class="py-3 px-3 text-center w-28">Actions</th>
            </tr>
          </thead>
          <tbody class="text-gray-800">
            <tr v-if="isLoading">
              <td colspan="10" class="py-6 text-center"><a-spin /></td>
            </tr>

            <tr v-else-if="laList.length === 0">
              <td colspan="10" class="py-6 text-center">
                <a-empty description="No LA found" />
              </td>
            </tr>

            <template v-else>
              <tr
                v-for="(la, index) in laList"
                :key="la.LAID"
                class="border-b border-gray-100 hover:bg-gray-50"
              >
                <td class="py-2 px-3 text-center">
                  {{ (currentPage - 1) * pageSize + index + 1 }}
                </td>
                <td class="py-2 px-3 font-medium">{{ la.LA || "-" }}</td>
                <td class="py-2 px-3">{{ la.MobileNo || "-" }}</td>
                <td class="py-2 px-3">{{ la.DistrictName || la.DistrictCode || "-" }}</td>
                <td class="py-2 px-3">{{ la.UpazillaName || la.UpazillaCode || "-" }}</td>
                <td class="py-2 px-3">{{ la.UnionName || la.UnionCode || "-" }}</td>
                <td class="py-2 px-3">{{ la.Village || "-" }}</td>
                <td class="py-2 px-3">
                  {{ [la.DealerName, la.DealerCode].filter(Boolean).join(" - ") || "-" }}
                </td>
                <td class="py-2 px-3 text-center">
                  <a-tag
                    :color="la.Active === 'Y' ? 'green' : 'red'"
                    class="rounded-full px-3"
                  >
                    {{ la.Active === "Y" ? "Active" : "Inactive" }}
                  </a-tag>
                </td>
                <td class="py-2 px-3">
                  <div class="flex justify-center gap-2">
                    <a-button
                      size="small"
                      class="bg-blue-50 text-blue-600 border-blue-100 hover:bg-blue-100"
                      @click="openEditModal(la)"
                    >
                      <EditOutlined />
                    </a-button>
                    <a-popconfirm
                      title="Delete this LA?"
                      ok-text="Yes"
                      cancel-text="No"
                      @confirm="handleDelete(la.LAID)"
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
            </template>
          </tbody>
        </table>
      </div>

      <!-- Pagination -->
      <div
        v-if="total > 0"
        class="flex flex-wrap items-center justify-between gap-2 mt-4"
      >
        <span class="text-sm text-gray-500">Total {{ total }} LA</span>
        <a-pagination
          v-model:current="currentPage"
          v-model:pageSize="pageSize"
          :total="total"
          :page-size-options="['15', '30', '50', '100']"
          show-size-changer
          @change="fetchLaList"
        />
      </div>

      <!-- Add / Edit Modal -->
      <a-modal
        v-model:open="isModalOpen"
        :title="editingId ? 'Edit LA' : 'Add LA'"
        :footer="null"
        :destroy-on-close="true"
        width="640px"
        @cancel="closeModal"
      >
        <a-form ref="formRef" :model="form" :rules="rules" layout="vertical" @finish="submitForm">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-x-4">
            <a-form-item label="LA Name" name="LA">
              <a-input v-model:value="form.LA" :maxlength="50" placeholder="Enter LA name" />
            </a-form-item>

            <a-form-item label="Mobile No" name="MobileNo">
              <a-input v-model:value="form.MobileNo" :maxlength="11" placeholder="01XXXXXXXXX" />
            </a-form-item>

            <a-form-item label="District" name="DistrictCode">
              <a-select
                v-model:value="form.DistrictCode"
                placeholder="Select district"
                show-search
                :options="districtOptions"
                :filter-option="filterOption"
                @change="onDistrictChange"
              />
            </a-form-item>

            <a-form-item label="Upazilla" name="UpazillaCode">
              <a-select
                v-model:value="form.UpazillaCode"
                placeholder="Select upazilla"
                show-search
                :options="upazillaOptions"
                :filter-option="filterOption"
                :loading="isUpazillaLoading"
                :disabled="!form.DistrictCode"
                @change="onUpazillaChange"
              />
            </a-form-item>

            <a-form-item label="Union" name="UnionCode">
              <a-select
                v-model:value="form.UnionCode"
                placeholder="Select union"
                show-search
                :options="unionOptions"
                :filter-option="filterOption"
                :loading="isUnionLoading"
                :disabled="!form.UpazillaCode"
              />
            </a-form-item>

            <a-form-item label="Village" name="Village">
              <a-input v-model:value="form.Village" :maxlength="250" placeholder="Enter village" />
            </a-form-item>

            <a-form-item label="Dealer" name="DealerCode">
              <a-select
                v-model:value="form.DealerCode"
                placeholder="Select dealer"
                show-search
                :options="dealerOptions"
                :filter-option="filterOption"
              />
            </a-form-item>

            <a-form-item label="Status" name="Active">
              <a-select v-model:value="form.Active">
                <a-select-option value="Y">Active</a-select-option>
                <a-select-option value="N">Inactive</a-select-option>
              </a-select>
            </a-form-item>
          </div>

          <div class="flex justify-end gap-2 mt-2">
            <a-button :disabled="isSubmitting" @click="closeModal">Cancel</a-button>
            <a-button
              type="primary"
              html-type="submit"
              :loading="isSubmitting"
              class="bg-[#2d2d61]"
            >
              {{ editingId ? "Update" : "Save" }}
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
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  FileExcelOutlined,
} from "@ant-design/icons-vue";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import { apiBase } from "@/config";
import { getTokenConfig } from "@/utilities/tokenConfig";
import { showNotification } from "@/utilities/notification";

const isOk = (res) => res?.data?.status === 1 || res?.data?.status === "success";

// First validation error from a Laravel 422 response, else its message.
const errorMessage = (error, fallback) => {
  const errors = error?.response?.data?.errors;
  if (errors) {
    const first = Object.values(errors)[0];
    if (Array.isArray(first) && first.length) return first[0];
  }
  return error?.response?.data?.message || error?.message || fallback;
};

const filterOption = (input, option) =>
  String(option?.label ?? "").toLowerCase().includes(input.toLowerCase());

// ---------------- List ----------------
const laList = ref([]);
const isLoading = ref(false);
const currentPage = ref(1);
const pageSize = ref(15);
const total = ref(0);

const searchInput = ref("");
const searchQuery = ref("");
const statusFilter = ref("all");
const dealerFilter = ref(undefined);

let searchTimer = null;
watch(searchInput, (value) => {
  clearTimeout(searchTimer);
  searchTimer = setTimeout(() => {
    searchQuery.value = String(value ?? "").trim();
  }, 400);
});

const applySearchNow = () => {
  clearTimeout(searchTimer);
  searchQuery.value = String(searchInput.value ?? "").trim();
};

watch([searchQuery, statusFilter, dealerFilter], () => {
  currentPage.value = 1;
  fetchLaList();
});

// Active search/filter values as API params (shared by list and export).
const filterParams = () => {
  const params = {};
  if (searchQuery.value) params.search = searchQuery.value;
  if (statusFilter.value !== "all") params.status = statusFilter.value;
  if (dealerFilter.value) params.dealer_code = dealerFilter.value;
  return params;
};

// Ignores responses from superseded requests (fast typing / paging).
let requestSeq = 0;

const fetchLaList = async () => {
  const seq = ++requestSeq;
  isLoading.value = true;
  try {
    const params = { ...filterParams(), page: currentPage.value, per_page: pageSize.value };

    const res = await axios.get(`${apiBase}/la_info_manage`, {
      ...getTokenConfig(),
      params,
    });
    if (seq !== requestSeq) return;

    if (isOk(res)) {
      laList.value = res.data.data ?? [];
      total.value = res.data.meta?.total ?? 0;
    } else {
      laList.value = [];
      total.value = 0;
      showNotification("error", res?.data?.message || "Failed to load LA list.");
    }
  } catch (error) {
    if (seq !== requestSeq) return;
    laList.value = [];
    total.value = 0;
    showNotification("error", errorMessage(error, "Failed to load LA list."));
  } finally {
    if (seq === requestSeq) isLoading.value = false;
  }
};

// ---------------- Excel export ----------------
const isExporting = ref(false);

const formatDate = (value) => {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return String(value);
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${mm}-${dd}`;
};

// Exports every row matching the current search/filters (all pages).
const exportToExcel = async () => {
  isExporting.value = true;
  try {
    const res = await axios.get(`${apiBase}/la_info_manage`, {
      ...getTokenConfig(),
      params: { ...filterParams(), export: 1 },
    });
    if (!isOk(res)) {
      showNotification("error", res?.data?.message || "Failed to export LA info.");
      return;
    }

    const rows = res.data.data ?? [];
    if (!rows.length) {
      showNotification("warning", "No LA data available to export.");
      return;
    }

    const excelData = rows.map((la, index) => ({
      SL: index + 1,
      "LA ID": la.LAID,
      "LA Name": la.LA || "",
      // Kept as text so Excel doesn't drop the leading 0
      "Mobile No": String(la.MobileNo ?? "").trim(),
      District: la.DistrictName || la.DistrictCode || "",
      Upazilla: la.UpazillaName || la.UpazillaCode || "",
      Union: la.UnionName || la.UnionCode || "",
      Village: la.Village || "",
      "Dealer Code": la.DealerCode || "",
      "Dealer Name": la.DealerName || "",
      Status: la.Active === "Y" ? "Active" : "Inactive",
      "Created Date": formatDate(la.CreatedDate),
      "Updated Date": formatDate(la.UpdatedDate),
    }));

    const worksheet = XLSX.utils.json_to_sheet(excelData);
    worksheet["!cols"] = [
      { wch: 6 }, { wch: 8 }, { wch: 25 }, { wch: 14 }, { wch: 16 }, { wch: 18 },
      { wch: 18 }, { wch: 20 }, { wch: 12 }, { wch: 28 }, { wch: 10 }, { wch: 13 },
      { wch: 13 },
    ];
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "LA Info");

    const excelBuffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
    const file = new Blob([excelBuffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8",
    });
    saveAs(file, `LA_Info_${formatDate(new Date())}.xlsx`);
  } catch (error) {
    showNotification("error", errorMessage(error, "Failed to export LA info."));
  } finally {
    isExporting.value = false;
  }
};

// ---------------- Dropdown data ----------------
const districtOptions = ref([]);
const dealerOptions = ref([]);
const upazillaOptions = ref([]);
const unionOptions = ref([]);
const isUpazillaLoading = ref(false);
const isUnionLoading = ref(false);

const fetchOptions = async () => {
  try {
    const res = await axios.get(`${apiBase}/la_info_options`, getTokenConfig());
    if (isOk(res)) {
      districtOptions.value = (res.data.data?.districts ?? []).map((d) => ({
        value: String(d.DistrictCode),
        label: d.DistrictName,
      }));
      dealerOptions.value = (res.data.data?.dealers ?? []).map((d) => ({
        value: String(d.DealerCode),
        label: d.DealerName ? `${d.DealerName} (${d.DealerCode})` : String(d.DealerCode),
      }));
    }
  } catch (error) {
    showNotification("error", errorMessage(error, "Failed to load form options."));
  }
};

const fetchUpazillas = async (districtCode) => {
  upazillaOptions.value = [];
  if (!districtCode) return;
  isUpazillaLoading.value = true;
  try {
    const res = await axios.post(
      `${apiBase}/upazilla`,
      { DistrictCode: districtCode },
      getTokenConfig()
    );
    upazillaOptions.value = (res?.data?.upazilla ?? []).map((u) => ({
      value: String(u.UpazillaCode),
      label: u.UpazillaName,
    }));
  } catch (error) {
    showNotification("error", errorMessage(error, "Failed to load upazillas."));
  } finally {
    isUpazillaLoading.value = false;
  }
};

const fetchUnions = async (upazillaCode) => {
  unionOptions.value = [];
  if (!upazillaCode) return;
  isUnionLoading.value = true;
  try {
    const res = await axios.post(
      `${apiBase}/union`,
      { UpazillaCode: upazillaCode },
      getTokenConfig()
    );
    unionOptions.value = (res?.data?.union ?? []).map((u) => ({
      value: String(u.UnionCode),
      label: u.UnionName,
    }));
  } catch (error) {
    showNotification("error", errorMessage(error, "Failed to load unions."));
  } finally {
    isUnionLoading.value = false;
  }
};

const onDistrictChange = (value) => {
  form.value.UpazillaCode = undefined;
  form.value.UnionCode = undefined;
  unionOptions.value = [];
  fetchUpazillas(value);
};

const onUpazillaChange = (value) => {
  form.value.UnionCode = undefined;
  fetchUnions(value);
};

// ---------------- Form ----------------
const formRef = ref();
const isModalOpen = ref(false);
const isSubmitting = ref(false);
const editingId = ref(null);

const emptyForm = () => ({
  LA: "",
  MobileNo: "",
  DistrictCode: undefined,
  UpazillaCode: undefined,
  UnionCode: undefined,
  Village: "",
  DealerCode: undefined,
  Active: "Y",
});
const form = ref(emptyForm());

const rules = {
  LA: [{ required: true, whitespace: true, message: "Please enter LA name" }],
  MobileNo: [
    { required: true, message: "Please enter mobile number" },
    {
      pattern: /^01[3-9]\d{8}$/,
      message: "Enter a valid 11-digit mobile number (e.g. 017XXXXXXXX)",
    },
  ],
  DistrictCode: [{ required: true, message: "Please select district" }],
  UpazillaCode: [{ required: true, message: "Please select upazilla" }],
  UnionCode: [{ required: true, message: "Please select union" }],
  DealerCode: [{ required: true, message: "Please select dealer" }],
  Active: [{ required: true, message: "Please select status" }],
};

const toStr = (v) => (v === null || v === undefined || v === "" ? undefined : String(v).trim());

const openAddModal = () => {
  editingId.value = null;
  form.value = emptyForm();
  upazillaOptions.value = [];
  unionOptions.value = [];
  isModalOpen.value = true;
};

const openEditModal = async (la) => {
  editingId.value = la.LAID;
  form.value = {
    LA: la.LA ?? "",
    MobileNo: String(la.MobileNo ?? "").trim(),
    DistrictCode: toStr(la.DistrictCode),
    UpazillaCode: toStr(la.UpazillaCode),
    UnionCode: toStr(la.UnionCode),
    Village: la.Village ?? "",
    DealerCode: toStr(la.DealerCode),
    Active: la.Active === "N" ? "N" : "Y",
  };
  isModalOpen.value = true;
  await fetchUpazillas(form.value.DistrictCode);
  await fetchUnions(form.value.UpazillaCode);
};

const closeModal = () => {
  isModalOpen.value = false;
  editingId.value = null;
  form.value = emptyForm();
};

const submitForm = async () => {
  isSubmitting.value = true;
  const payload = {
    ...form.value,
    LA: form.value.LA.trim(),
    Village: form.value.Village?.trim() || null,
  };

  try {
    const res = editingId.value
      ? await axios.put(`${apiBase}/la_info_manage/${editingId.value}`, payload, getTokenConfig())
      : await axios.post(`${apiBase}/la_info_manage`, payload, getTokenConfig());

    if (isOk(res)) {
      showNotification(
        "success",
        res.data.message || (editingId.value ? "LA updated successfully." : "LA created successfully.")
      );
      if (!editingId.value) currentPage.value = 1;
      closeModal();
      await fetchLaList();
    } else {
      showNotification("error", res?.data?.message || "Failed to save LA.");
    }
  } catch (error) {
    showNotification("error", errorMessage(error, "Failed to save LA."));
  } finally {
    isSubmitting.value = false;
  }
};

const handleDelete = async (id) => {
  try {
    const res = await axios.delete(`${apiBase}/la_info_manage/${id}`, getTokenConfig());
    if (isOk(res)) {
      showNotification("success", res.data.message || "LA deleted successfully.");
      // Step back a page if the last row on this page was removed.
      if (laList.value.length === 1 && currentPage.value > 1) currentPage.value -= 1;
      await fetchLaList();
    } else {
      showNotification("error", res?.data?.message || "Failed to delete LA.");
    }
  } catch (error) {
    showNotification("error", errorMessage(error, "Failed to delete LA."));
  }
};

onMounted(() => {
  fetchLaList();
  fetchOptions();
});
</script>

<style scoped>
.la-table th,
.la-table td {
  border-right: 1px solid #e5e7eb;
  white-space: nowrap;
}

.la-table th:last-child,
.la-table td:last-child {
  border-right: none;
}
</style>
