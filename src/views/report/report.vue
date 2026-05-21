<template>
  <MainLayout>
    <div class="p-6">
      <h1 class="text-2xl font-semibold text-gray-800 mb-4">
        Dealer Wise LA Buying Report
      </h1>

      <!-- Filter bar -->
      <div
        class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 bg-white rounded-lg mb-4"
      >
        <div>
          <label class="block text-sm font-medium text-gray-600 mb-1"
            >Dealer Code <span class="text-red-500">*</span></label
          >
          <a-input
            v-model:value="dealerCode"
            placeholder="Enter a Dealer Code"
            allow-clear
            @press-enter="loadReport"
          />
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-600 mb-1"
            >LA ID</label
          >
          <a-input
            v-model:value="laid"
            placeholder="Enter LA ID"
            allow-clear
            @press-enter="loadReport"
          />
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-600 mb-1"
            >From Date</label
          >
          <a-date-picker
            v-model:value="fromDate"
            class="w-full"
            placeholder="From"
            value-format="YYYY-MM-DD"
          />
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-600 mb-1"
            >To Date</label
          >
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
        <table class="min-w-full text-sm">
          <thead>
            <tr
              class="bg-[#f8f9fc] text-gray-600 font-semibold border-b border-gray-200"
            >
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
            <tr v-else-if="!rows.length">
              <td colspan="12" class="py-6 text-center">
                <a-empty
                  :description="
                    hasLoadedOnce
                      ? 'No records for this dealer'
                      : 'Enter a dealer code and click Load'
                  "
                />
              </td>
            </tr>
            <tr
              v-for="(r, index) in rows"
              :key="index"
              class="border-b border-gray-100 hover:bg-gray-50"
            >
              <td class="py-2 px-3 text-center">{{ index + 1 }}</td>
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
          <tfoot v-if="rows.length">
            <tr class="bg-gray-50 font-semibold border-t border-gray-300">
              <td class="py-3 px-3 text-right" colspan="6">Total</td>
              <td class="py-3 px-3 text-right">
                {{ formatNumber(totals.quantity) }}
              </td>
              <td class="py-3 px-3 text-right">
                {{ formatNumber(totals.price) }}
              </td>
              <td class="py-3 px-3 text-right">
                {{ formatNumber(totals.payment) }}
              </td>
              <td class="py-3 px-3 text-right">
                {{ formatNumber(totals.due) }}
              </td>
              <td class="py-3 px-3 text-right">
                {{ formatNumber(totals.discount) }}
              </td>
              <td class="py-3 px-3 text-right">
                {{ formatNumber(totals.bonus) }}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  </MainLayout>
</template>

<script setup>
import { ref, computed } from "vue";
import axios from "axios";
import Cookies from "js-cookie";
import MainLayout from "@/components/layout/MainLayout.vue";
import { apiBase } from "@/config";
import { showNotification } from "@/utilities/notification";

const dealerCode = ref("");
const laid = ref("");
const fromDate = ref(null);
const toDate = ref(null);
const rows = ref([]);
const loading = ref(false);
const hasLoadedOnce = ref(false);

const resetFilters = () => {
  dealerCode.value = "";
  laid.value = "";
  fromDate.value = null;
  toDate.value = null;
  rows.value = [];
  hasLoadedOnce.value = false;
};

const sumField = (field) =>
  rows.value.reduce((acc, r) => acc + (Number(r?.[field]) || 0), 0);

const totals = computed(() => ({
  quantity: sumField("Quantity"),
  price: sumField("Price"),
  payment: sumField("Payment"),
  due: sumField("Due"),
  discount: sumField("DiscountAmount"),
  bonus: sumField("BonusQty"),
}));

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
  const code = dealerCode.value?.trim();
  if (!code) {
    showNotification("error", "Please enter a dealer code");
    return;
  }

  loading.value = true;
  hasLoadedOnce.value = true;
  try {
    const token = Cookies.get("token");
    const payload = { dealer_code: code };
    if (laid.value?.trim()) payload.laid = laid.value.trim();
    if (fromDate.value) payload.from_date = fromDate.value;
    if (toDate.value) payload.to_date = toDate.value;

    const res = await axios.post(
      `${apiBase}/dealer_wise_la_buying_seman_list`,
      payload,
      {
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      }
    );
    rows.value = Array.isArray(res?.data?.data) ? res.data.data : [];
    if (!rows.value.length) {
      showNotification(
        "info",
        res?.data?.message || "No records for this dealer"
      );
    }
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
</script>
