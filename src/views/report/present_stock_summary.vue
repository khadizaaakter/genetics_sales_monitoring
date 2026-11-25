<template>
  <MainLayout>
    <div class="p-0">
      <div class="flex flex-wrap items-center justify-end gap-3 mb-1">
        <a-button
          type="primary"
          class="flex items-center gap-1 bg-[#2d2d61]"
          :disabled="isLoading || !stockList.length"
          @click="exportToExcel"
        >
          <FileExcelOutlined /> Export to Excel
        </a-button>
      </div>

      <!-- Filter bar -->
      <div
        class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 bg-white rounded-lg mb-4"
      >
        <div>
          <label class="block text-sm font-medium text-gray-600 mb-1">Created By</label>
          <a-input
            v-model:value="createdBy"
            placeholder="User ID"
            :maxlength="20"
            allow-clear
            @press-enter="loadReport"
          />
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-600 mb-1">Created Date</label>
          <a-date-picker
            v-model:value="createdDate"
            class="w-full"
            placeholder="Date"
            value-format="YYYY-MM-DD"
          />
        </div>
        <div class="flex items-end gap-2">
          <a-button
            type="primary"
            class="bg-[#2d2d61]"
            :loading="isLoading"
            @click="loadReport"
          >
            Submit
          </a-button>
          <a-button @click="resetFilters" :disabled="isLoading">Reset</a-button>
        </div>
      </div>

      <!-- Table -->
      <div class="bg-white rounded-lg border border-gray-200 overflow-x-auto">
        <table class="stock-table min-w-full text-sm">
          <thead>
            <tr class="bg-[#f8f9fc] text-gray-600 font-semibold border-b border-gray-200">
              <th class="py-3 px-3 text-center w-12">SL</th>
              <th class="py-3 px-3 text-left">Dealer Code</th>
              <th class="py-3 px-3 text-left">Dealer Name</th>
              <th class="py-3 px-3 text-left">Created By</th>
              <th class="py-3 px-3 text-right">Total Items</th>
              <th class="py-3 px-3 text-left">Created Date</th>
              <!-- <th class="py-3 px-3 text-left">Created By Name</th> -->
            </tr>
          </thead>
          <tbody class="text-gray-800">
            <tr v-if="isLoading">
              <td colspan="6" class="py-6 text-center">
                <a-spin />
              </td>
            </tr>
            <tr v-else-if="!stockList.length">
              <td colspan="6" class="py-6 text-center">
                <a-empty description="No stock entries found" />
              </td>
            </tr>
            <template v-else>
              <tr
                v-for="(row, index) in pagedRows()"
                :key="`${row.CreatedBy}-${row.DealerCode}-${row.CreatedDate}-${index}`"
                class="border-b border-gray-100 hover:bg-gray-50"
              >
                <td class="py-1 px-3 text-center">
                  {{ (currentPage - 1) * pageSize + index + 1 }}
                </td>
                <td class="py-1 px-3">{{ row?.DealerCode || "-" }}</td>
                <td class="py-1 px-3">{{ row?.DealerName || "-" }}</td>
                <td class="py-1 px-3">{{ row?.CreatedBy || "-" }}</td>
                <td class="py-1 px-3 text-right">{{ toNumber(row?.TotalItems) }}</td>
                <td class="py-1 px-3">{{ formatDate(row?.CreatedDate) }}</td>
                <!-- <td class="py-1 px-3">{{ row?.CreatedByName || "-" }}</td> -->
              </tr>
              <tr class="bg-[#f8f9fc] font-semibold">
                <td colspan="5" class="py-1 px-3 text-right">Total</td>
                <td class="py-1 px-3 text-right">{{ totalItems() }}</td>
              </tr>
            </template>
          </tbody>
        </table>
      </div>

      <!-- Pagination -->
      <div v-if="stockList.length" class="flex justify-end mt-4">
        <a-pagination
          :current="currentPage"
          :page-size="pageSize"
          :total="stockList.length"
          :show-size-changer="true"
          :page-size-options="['10', '20', '50', '100']"
          @change="handlePageChange"
        />
      </div>
    </div>
  </MainLayout>
</template>

<script setup>
import { ref, onMounted } from "vue";
import axios from "axios";
import MainLayout from "@/components/layout/MainLayout.vue";
import { apiBase } from "@/config";
import { getTokenConfig } from "@/utilities/tokenConfig";
import { showNotification } from "@/utilities/notification";
import { FileExcelOutlined } from "@ant-design/icons-vue";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";

const stockList = ref([]);
const isLoading = ref(false);
const currentPage = ref(1);
const pageSize = ref(20);

const createdBy = ref("");
const createdDate = ref(null);
// Filters used for the rows currently shown, so the export matches the table
// even if the inputs were edited afterwards.
const appliedCreatedBy = ref("");
const appliedCreatedDate = ref(null);

const formatDate = (value) => {
  if (!value) return "-";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
};

const toNumber = (value) => (Number.isFinite(Number(value)) ? Number(value) : 0);

const totalItems = () =>
  stockList.value.reduce((sum, row) => sum + toNumber(row?.TotalItems), 0);

const pagedRows = () => {
  const start = (currentPage.value - 1) * pageSize.value;
  return stockList.value.slice(start, start + pageSize.value);
};

const fetchReport = async () => {
  isLoading.value = true;
  try {
    const res = await axios.post(
      `${apiBase}/stock_entry_report`,
      {
        created_by: appliedCreatedBy.value || null,
        created_date: appliedCreatedDate.value || null,
      },
      getTokenConfig()
    );
    if (res?.data?.status === 1) {
      stockList.value = res?.data?.data ?? [];
    } else {
      stockList.value = [];
      showNotification("error", res?.data?.message || "Failed to fetch stock summary");
    }
  } catch (error) {
    stockList.value = [];
    showNotification(
      "error",
      error?.response?.data?.message || error?.message || "Failed to fetch stock summary"
    );
  } finally {
    isLoading.value = false;
  }
};

const loadReport = () => {
  appliedCreatedBy.value = (createdBy.value || "").trim();
  appliedCreatedDate.value = createdDate.value || null;
  currentPage.value = 1;
  fetchReport();
};

const resetFilters = () => {
  createdBy.value = "";
  createdDate.value = null;
  loadReport();
};

const handlePageChange = (page, size) => {
  if (size !== pageSize.value) {
    pageSize.value = size;
    currentPage.value = 1;
    return;
  }
  currentPage.value = page;
};

// Exports every row of the current result (all pages), plus a total row.
const exportToExcel = () => {
  if (!stockList.value.length) {
    showNotification("warning", "No stock data available to export.");
    return;
  }

  try {
    const excelData = stockList.value.map((row) => ({
      "Dealer Code": row?.DealerCode || "-",
      "Dealer Name": row?.DealerName || "-",
      "Created By": row?.CreatedBy || "-",
      "Total Items": toNumber(row?.TotalItems),
      "Created Date": formatDate(row?.CreatedDate),
      // "Created By Name": row?.CreatedByName || "-",
    }));

    excelData.push({
      "Dealer Code": "",
      "Dealer Name": "Total",
      "Created By": "",
      "Total Items": totalItems(),
      "Created Date": "",
      // "Created By Name": "",
    });

    const worksheet = XLSX.utils.json_to_sheet(excelData);
    worksheet["!cols"] = [
      { wch: 14 }, // Dealer Code
      { wch: 30 }, // Dealer Name
      { wch: 14 }, // Created By
      { wch: 12 }, // Total Items
      { wch: 14 }, // Created Date
    ];
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Present Stock Summary");

    const excelBuffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
    const file = new Blob([excelBuffer], {
      type:
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8",
    });
    const suffix = appliedCreatedDate.value || new Date().toISOString().split("T")[0];
    saveAs(file, `Present_Stock_Summary_${suffix}.xlsx`);
  } catch (error) {
    showNotification("error", error?.message || "Failed to export stock summary");
  }
};

onMounted(() => {
  loadReport();
});
</script>

<style scoped>
.stock-table th,
.stock-table td {
  border-right: 1px solid #e5e7eb;
}
.stock-table th:last-child,
.stock-table td:last-child {
  border-right: none;
}
</style>
