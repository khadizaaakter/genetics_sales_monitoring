<template>
  <MainLayout>
    <div class="p-0">
      <div class="flex flex-wrap items-center justify-end gap-3 mb-1">
        <a-button
          type="primary"
          class="flex items-center gap-1 bg-[#2d2d61]"
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
          <label class="block text-sm font-medium text-gray-600 mb-1">From Date</label>
          <a-date-picker
            v-model:value="fromDate"
            class="w-full"
            placeholder="From"
            value-format="YYYY-MM-DD"
          />
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-600 mb-1">To Date</label>
          <a-date-picker
            v-model:value="toDate"
            class="w-full"
            placeholder="To"
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
        <table class="dealer-table min-w-full text-sm">
          <thead>
            <tr class="bg-[#f8f9fc] text-gray-600 font-semibold border-b border-gray-200">
              <th class="py-3 px-3 text-center w-12">SL</th>
              <th class="py-3 px-3 text-left">Dealer Code</th>
              <th class="py-3 px-3 text-left">Name</th>
              <th class="py-3 px-3 text-left">Shop Name</th>
              <th class="py-3 px-3 text-left">Owner Name</th>
              <!-- <th class="py-3 px-3 text-left">Register</th> -->
              <th class="py-3 px-3 text-left">Email</th>
              <th class="py-3 px-3 text-left">Mobile</th>
              <th class="py-3 px-3 text-left">Registered Date</th>
            </tr>
          </thead>
          <tbody class="text-gray-800">
            <tr v-if="isLoading">
              <td colspan="9" class="py-6 text-center">
                <a-spin />
              </td>
            </tr>
            <tr v-else-if="!hasLoadedOnce">
              <td colspan="9" class="py-6 text-center">
                <a-empty
                  description="Select a date range and click submit to view the report"
                />
              </td>
            </tr>
            <tr v-else-if="!dealerList.length">
              <td colspan="9" class="py-6 text-center">
                <a-empty description="No registered dealers found" />
              </td>
            </tr>
            <tr
              v-for="(user, index) in dealerList"
              :key="user.id ?? index"
              class="border-b border-gray-100 hover:bg-gray-50"
            >
              <td class="py-1 px-3 text-center">
                {{ (currentPage - 1) * pageSize + index + 1 }}
              </td>
              <td class="py-1 px-3">{{ user?.dealer_code || "-" }}</td>
              <td class="py-1 px-3">{{ user?.name || "-" }}</td>
              <td class="py-1 px-3">{{ user?.shop_name || "-" }}</td>
              <td class="py-1 px-3">{{ user?.owner_name || "-" }}</td>
              <!-- <td class="text-center">
                <a-tag
                  :color="user?.active === 'Y' ? 'green' : 'orange'"
                  class="capitalize rounded-full px-3"
                >
                  {{ user?.active === "Y" ? "Yes" : "No" }}
                </a-tag>
              </td> -->
              <td class="py-1 px-3">{{ user?.email || "-" }}</td>
              <td class="py-1 px-3">{{ user?.mobile || "-" }}</td>
              <td class="py-1 px-3">{{ formatDate(user?.registration_date) }}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Pagination -->
      <div v-if="total" class="flex justify-end mt-4">
        <a-pagination
          :current="currentPage"
          :page-size="pageSize"
          :total="total"
          :show-size-changer="true"
          :page-size-options="['10', '20', '50', '100']"
          @change="handlePageChange"
          @show-size-change="handleSizeChange"
        />
      </div>
    </div>
  </MainLayout>
</template>

<script setup>
import { ref } from "vue";
import axios from "axios";
import MainLayout from "@/components/layout/MainLayout.vue";
import { apiBase } from "@/config";
import { getTokenConfig } from "@/utilities/tokenConfig";
import { showNotification } from "@/utilities/notification";
import { FileExcelOutlined } from "@ant-design/icons-vue";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";

const dealerList = ref([]);
const isLoading = ref(false);
const hasLoadedOnce = ref(false);
const currentPage = ref(1);
const pageSize = ref(18);
const total = ref(0);

const formatDate = (value) => {
  if (!value) return "-";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
};

const now = new Date();
const today = formatDate(now);
const lastDayOfMonth = formatDate(new Date(now.getFullYear(), now.getMonth() + 1, 0));

const fromDate = ref(today);
const toDate = ref(lastDayOfMonth);
const appliedFromDate = ref(today);
const appliedToDate = ref(lastDayOfMonth);

const loadReport = async () => {
  appliedFromDate.value = fromDate.value || null;
  appliedToDate.value = toDate.value || null;
  currentPage.value = 1;
  await fetchDealerReport(1);
  hasLoadedOnce.value = true;
};

const resetFilters = () => {
  fromDate.value = today;
  toDate.value = lastDayOfMonth;
  appliedFromDate.value = null;
  appliedToDate.value = null;
  currentPage.value = 1;
  dealerList.value = [];
  total.value = 0;
  hasLoadedOnce.value = false;
};

const fetchDealerReport = async (page = 1) => {
  isLoading.value = true;
  try {
    const res = await axios.get(`${apiBase}/registered_dealer_report`, {
      ...getTokenConfig(),
      params: {
        from_date: appliedFromDate.value,
        to_date: appliedToDate.value,
        per_page: pageSize.value,
        page,
      },
    });
    if (res?.data?.status === "success") {
      dealerList.value = res?.data?.data ?? [];
      total.value = res?.data?.total ?? 0;
      currentPage.value = res?.data?.current_page ?? page;
    } else {
      dealerList.value = [];
      total.value = 0;
      showNotification("error", res?.data?.message || "Failed to fetch dealer report");
    }
  } catch (error) {
    dealerList.value = [];
    total.value = 0;
    showNotification(
      "error",
      error?.response?.data?.message || error?.message || "Failed to fetch dealer report"
    );
  } finally {
    isLoading.value = false;
  }
};

const handlePageChange = (page, size) => {
  currentPage.value = page;
  pageSize.value = size;
  fetchDealerReport(page);
};

const handleSizeChange = (_current, size) => {
  pageSize.value = size;
  currentPage.value = 1;
  fetchDealerReport(1);
};

// Exports exactly the rows shown on screen (current filter + current page)
const exportToExcel = () => {
  if (!dealerList.value.length) {
    showNotification("warning", "No dealer data available to export.");
    return;
  }

  try {
    const excelData = dealerList.value.map((user) => ({
      "Dealer Code": user?.dealer_code || "-",
      Name: user?.name || "-",
      "Shop Name": user?.shop_name || "-",
      "Owner Name": user?.owner_name || "-",
      Email: user?.email || "-",
      Mobile: user?.mobile || "-",
      "Registered Date": formatDate(user?.registration_date),
    }));

    const worksheet = XLSX.utils.json_to_sheet(excelData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Registered Dealers");

    const excelBuffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
    const file = new Blob([excelBuffer], {
      type:
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8",
    });
    const range =
      appliedFromDate.value || appliedToDate.value
        ? `${appliedFromDate.value || "start"}_to_${appliedToDate.value || "end"}`
        : new Date().toISOString().split("T")[0];
    saveAs(file, `Registered_Dealers_${range}.xlsx`);
  } catch (error) {
    showNotification("error", error?.message || "Failed to export dealer report");
  }
};
</script>

<style scoped>
.dealer-table th,
.dealer-table td {
  border-right: 1px solid #e5e7eb;
}
.dealer-table th:last-child,
.dealer-table td:last-child {
  border-right: none;
}
</style>
