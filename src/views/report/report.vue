<template>
  <MainLayout>
    <div class="p-0">
      <div class="flex flex-wrap items-center justify-between gap-3 mb-1">
        <h1 class="text-2xl font-semibold text-gray-800">Dealer Wise LA Sales Report</h1>
        <a-button
          type="primary"
          class="flex items-center gap-1 bg-[#2d2d61]"
          :disabled="loading || !filteredRows().length"
          @click="exportToExcel"
        >
          <FileExcelOutlined /> Export to Excel
        </a-button>
      </div>

      <!-- Filter bar -->
      <div
        class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 bg-white rounded-lg mb-4"
      >
        <div>
          <label class="block text-sm font-medium text-gray-600 mb-1">Product Code</label>
          <a-input
            v-model:value="productCodeInput"
            placeholder="Enter a Product Code"
            :maxlength="SEARCH_MAX_LENGTH"
            allow-clear
            @paste="handleProductCodePaste"
          />
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-600 mb-1">LA ID</label>
          <a-input
            v-model:value="laidInput"
            placeholder="Enter LA ID"
            :maxlength="SEARCH_MAX_LENGTH"
            allow-clear
            @paste="handleLaidPaste"
            @press-enter="loadReport"
          />
        </div>
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
            :loading="loading"
            @click="loadReport"
          >
            Load
          </a-button>
          <a-button @click="resetFilters" :disabled="loading">Reset</a-button>
        </div>
      </div>

      <!-- Table -->
      <div class="bg-white rounded-lg border border-gray-200 overflow-x-auto">
        <table class="report-table min-w-full text-sm">
          <thead>
            <tr class="bg-[#f8f9fc] text-gray-600 font-semibold border-b border-gray-200">
              <th class="py-3 px-3 text-center w-12">SL</th>
              <th class="py-3 px-3 text-left">LA ID</th>
              <th class="py-3 px-3 text-left">LA</th>
              <th class="py-3 px-3 text-left">Buying Date</th>
              <th class="py-3 px-3 text-left">Product Code</th>
              <th class="py-3 px-3 text-left">Product Name</th>
              <th class="py-3 px-3 text-right">Quantity</th>
              <th class="py-3 px-3 text-right">Price</th>
              <th class="py-3 px-3 text-right">Payment</th>
              <th class="py-3 px-3 text-right">Due</th>
              <th class="py-3 px-3 text-right">Discount</th>
              <th class="py-3 px-3 text-right">Bonus Qty</th>
            </tr>
          </thead>
          <tbody class="text-gray-800">
            <tr v-if="loading">
              <td colspan="12" class="py-6 text-center">
                <a-spin />
              </td>
            </tr>
            <tr v-else-if="!filteredRows().length">
              <td colspan="12" class="py-6 text-center">
                <a-empty description="No records found" />
              </td>
            </tr>
            <tr
              v-for="(r, index) in paginatedRows()"
              :key="index"
              class="border-b border-gray-100 hover:bg-gray-50"
            >
              <td class="py-2 px-3 text-center">
                {{ (currentPage - 1) * pageSize + index + 1 }}
              </td>
              <td class="py-2 px-3">{{ r.LAID }}</td>
              <td class="py-2 px-3">{{ r.LA }}</td>
              <td class="py-2 px-3">{{ formatDate(r.BuyingDate) }}</td>
              <td class="py-2 px-3">{{ r.ProductCode }}</td>
              <td class="py-2 px-3">{{ r.ProductName }}</td>
              <td class="py-2 px-3 text-right">
                {{ formatNumber(r.Quantity) }}
              </td>
              <td class="py-2 px-3 text-right">{{ formatNumber(r.Price) }}</td>
              <td class="py-2 px-3 text-right">
                {{ formatNumber(r.Payment) }}
              </td>
              <td class="py-2 px-3 text-right">{{ formatNumber(r.Due) }}</td>
              <td class="py-2 px-3 text-right">
                {{ r.DiscountAmount != null ? formatNumber(r.DiscountAmount) : "-" }}
              </td>
              <td class="py-2 px-3 text-right">
                {{ r.BonusQty != null ? formatNumber(r.BonusQty) : "-" }}
              </td>
            </tr>
          </tbody>
          <tfoot v-if="filteredRows().length">
            <tr class="bg-gray-50 font-semibold border-t border-gray-300">
              <td class="py-3 px-3 text-right" colspan="6">Total</td>
              <td class="py-3 px-3 text-right">
                {{ formatNumber(sumField("Quantity")) }}
              </td>
              <td class="py-3 px-3 text-right">
                {{ formatNumber(sumField("Price")) }}
              </td>
              <td class="py-3 px-3 text-right">
                {{ formatNumber(sumField("Payment")) }}
              </td>
              <td class="py-3 px-3 text-right">
                {{ formatNumber(sumField("Due")) }}
              </td>
              <td class="py-3 px-3 text-right">
                {{ formatNumber(sumField("DiscountAmount")) }}
              </td>
              <td class="py-3 px-3 text-right">
                {{ formatNumber(sumField("BonusQty")) }}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>

      <!-- Pagination -->
      <div v-if="filteredRows().length" class="flex justify-end mt-4">
        <a-pagination
          v-model:current="currentPage"
          v-model:page-size="pageSize"
          :total="filteredRows().length"
          :show-size-changer="true"
          :page-size-options="['10', '20', '50', '100']"
        />
      </div>
    </div>
  </MainLayout>
</template>

<script setup>
import { ref, watch, onMounted } from "vue";
import axios from "axios";
import Cookies from "js-cookie";
import MainLayout from "@/components/layout/MainLayout.vue";
import { apiBase } from "@/config";
import { showNotification } from "@/utilities/notification";
import { FileExcelOutlined } from "@ant-design/icons-vue";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";

// *Input is what the user is typing; *Query is the normalized value used for
// filtering, updated live as the user types.
const SEARCH_MAX_LENGTH = 15;
const productCodeInput = ref("");
const productCodeQuery = ref("");
const laidInput = ref("");
const laidQuery = ref("");

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

// Cleans pasted/typed text before applying the 15-char limit, so leading spaces
// or hidden characters don't eat into it. The trailing space is kept so the
// user can type a second word.
const limitSearchInput = (inputRef, queryRef) => (value) => {
  const raw = String(value ?? "");
  const cleaned = cleanText(raw);
  const trailingSpace = /\s$/.test(raw) && cleaned ? " " : "";
  const limited = (cleaned + trailingSpace).slice(0, SEARCH_MAX_LENGTH);

  if (limited !== raw) {
    inputRef.value = limited;
    return;
  }
  queryRef.value = normalizeText(limited);
};

watch(productCodeInput, limitSearchInput(productCodeInput, productCodeQuery));
watch(laidInput, limitSearchInput(laidInput, laidQuery));

// Pasting replaces the previous search instead of being inserted into it
// (and isn't blocked by maxlength when the box is already full).
const pasteIntoSearch = (inputRef) => (event) => {
  const pasted = event.clipboardData?.getData("text");
  if (!pasted) return;
  event.preventDefault();
  inputRef.value = cleanText(pasted).slice(0, SEARCH_MAX_LENGTH);
};

const handleProductCodePaste = pasteIntoSearch(productCodeInput);
const handleLaidPaste = pasteIntoSearch(laidInput);

const fromDate = ref(null);
const toDate = ref(null);
const rows = ref([]);
const loading = ref(false);
const hasLoadedOnce = ref(false);
const currentPage = ref(1);
const pageSize = ref(18);

// The API ignores a product code, so it is matched here against the loaded
// rows. LA ID and the dates are filtered by the API on Load.
const filteredRows = () => {
  const code = productCodeQuery.value;
  if (!code) return rows.value;
  return rows.value.filter((r) => normalizeText(r?.ProductCode).includes(code));
};

const paginatedRows = () => {
  const start = (currentPage.value - 1) * pageSize.value;
  return filteredRows().slice(start, start + pageSize.value);
};

// A narrower product code can leave the current page empty.
watch(productCodeQuery, () => {
  currentPage.value = 1;
});

const resetFilters = () => {
  productCodeInput.value = "";
  laidInput.value = "";
  fromDate.value = null;
  toDate.value = null;
  loadReport();
};

const sumField = (field) =>
  filteredRows().reduce((acc, r) => acc + (Number(r?.[field]) || 0), 0);

const formatDate = (value) => {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
};

const formatNumber = (value) => {
  const n = Number(value);
  if (!Number.isFinite(n)) return "-";
  return n.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
};

const loadReport = async () => {
  loading.value = true;
  hasLoadedOnce.value = true;
  try {
    const token = Cookies.get("token");
    const payload = {
      laid: laidQuery.value,
      from_date: fromDate.value || "",
      to_date: toDate.value || "",
    };

    const res = await axios.post(`${apiBase}/la_buying_seman_list`, payload, {
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    });
    rows.value = Array.isArray(res?.data?.data) ? res.data.data : [];
    currentPage.value = 1;
  } catch (err) {
    console.error("Report load failed", err?.response?.data || err);
    rows.value = [];
    showNotification(
      "error",
      err?.response?.data?.message || err?.message || "Failed to load report"
    );
  } finally {
    loading.value = false;
  }
};

const toNumberOrBlank = (value) => {
  const n = Number(value);
  return value != null && value !== "" && Number.isFinite(n) ? n : "";
};

// Exports every row matching the current filters (all pages), plus a total row.
const exportToExcel = () => {
  const data = filteredRows();
  if (!data.length) {
    showNotification("warning", "No report data available to export.");
    return;
  }

  try {
    const excelData = data.map((r) => ({
      "LA ID": r?.LAID ?? "",
      LA: r?.LA ?? "",
      "Buying Date": formatDate(r?.BuyingDate),
      "Product Code": r?.ProductCode ?? "",
      "Product Name": r?.ProductName ?? "",
      Quantity: toNumberOrBlank(r?.Quantity),
      Price: toNumberOrBlank(r?.Price),
      Payment: toNumberOrBlank(r?.Payment),
      Due: toNumberOrBlank(r?.Due),
      Discount: toNumberOrBlank(r?.DiscountAmount),
      "Bonus Qty": toNumberOrBlank(r?.BonusQty),
    }));

    excelData.push({
      "LA ID": "",
      LA: "",
      "Buying Date": "",
      "Product Code": "",
      "Product Name": "Total",
      Quantity: sumField("Quantity"),
      Price: sumField("Price"),
      Payment: sumField("Payment"),
      Due: sumField("Due"),
      Discount: sumField("DiscountAmount"),
      "Bonus Qty": sumField("BonusQty"),
    });

    const worksheet = XLSX.utils.json_to_sheet(excelData);
    worksheet["!cols"] = [
      { wch: 12 },
      { wch: 25 },
      { wch: 12 },
      { wch: 14 },
      { wch: 30 },
      { wch: 12 },
      { wch: 14 },
      { wch: 14 },
      { wch: 14 },
      { wch: 12 },
      { wch: 12 },
    ];
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Dealer Wise LA Sales");

    const excelBuffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
    const file = new Blob([excelBuffer], {
      type:
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8",
    });
    const range =
      fromDate.value || toDate.value
        ? `${fromDate.value || "start"}_to_${toDate.value || "end"}`
        : new Date().toISOString().split("T")[0];
    saveAs(file, `Dealer_Wise_LA_Sales_${range}.xlsx`);
  } catch (error) {
    showNotification("error", error?.message || "Failed to export report");
  }
};

onMounted(() => {
  loadReport();
});
</script>

<style scoped>
.report-table th,
.report-table td {
  border-right: 1px solid #e5e7eb;
}
.report-table th:last-child,
.report-table td:last-child {
  border-right: none;
}
</style>
