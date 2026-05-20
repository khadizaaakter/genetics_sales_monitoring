<template>
  <div>
    <header class="flex gap-4 justify-end mb-4">
      <div class="">
        <a-input-search placeholder="FAQ" class="md:min-w-[200px] w-full">
        </a-input-search>
      </div>
      <div class="">
        <a-select
          show-search
          :filter-option="filterOption"
          v-model:value="selectedBusiness"
          :options="store.BusinessList"
          class="md:min-w-[200px] w-full"
          placeholder="Select Business"
        >
        </a-select>
      </div>
      <div class="">
        <a-select
          show-search
          :filter-option="filterOption"
          v-model:value="selecteddepartment"
          :options="store.departmentlist"
          class="md:min-w-[200px] w-full"
          placeholder="Select Department"
        >
        </a-select>
      </div>
    </header>
  </div>
</template>

<script setup>
import { onMounted, ref } from "vue";
import { useConsumerBrands } from "../../stores/consumerBrands";

const filterOption = (input, option) => {
  return option.label.toLowerCase().includes(input.toLowerCase());
};

const selectedBusiness = ref();
const selecteddepartment = ref();

const store = useConsumerBrands();

onMounted(() => {
  store.getBusiness();
  store.getdepartment();
});
</script>

<style lang="scss" scoped></style>
