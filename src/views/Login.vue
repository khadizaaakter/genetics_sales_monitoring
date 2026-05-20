<template>
  <div class="flex justify-center items-center h-screen bg-gray-100">
    <div
      class="flex flex-col md:flex-row w-full h-full bg-white overflow-hidden shadow-lg"
    >
      <!-- Left side (Image section) -->
      <div class="hidden md:flex md:w-1/2 h-full login-image-side">
        <img
          src="/img/5017953.jpg"
          alt="Login Illustration"
          class="w-full h-full object-contain"
        />
      </div>

      <!-- Right side (Login form section) -->
      <div
        class="flex flex-col justify-center items-center login relative w-full md:w-1/2 px-8 lg:px-20"
      >
        <img src="/src/assets/images/logo.png" class="w-16 mb-8" alt="" />
        <h2 class="text-[#2d2d61] font-bold text-lg">Welcome!</h2>
        <h1 class="text-3xl font-bold mb-6 text-[#2d2d61] uppercase">
        Genetics SALES monitoring
        </h1>

        <!-- Loading Spinner -->
        <div
          v-if="isLoading"
          class="absolute inset-0 bg-black bg-opacity-50 flex justify-center items-center z-10"
        >
          <div class="loader"></div>
        </div>

        <a-form
          v-if="!isLoading"
          @finish="handleLogin(data, $router)"
          :model="data"
          class="w-full max-w-sm"
        >
          <label>
            <h2 class="capitalize font-semibold tracking-wider">User ID</h2>
          </label>
          <a-input
            v-model:value="data.user_id"
            placeholder="User ID"
            class="border border-gray-300 rounded-lg mb-3"
          />

          <label>
            <h2 class="capitalize font-semibold tracking-wider">password</h2>
          </label>
          <a-input-password
            v-model:value="data.password"
            id="password"
            placeholder="PASSWORD"
            class="border border-gray-300 rounded-lg mb-3"
          />
          <a href="" class="text-slate-500 flex text-end justify-end w-full"
            >Forgot password?</a
          >

          <a-form-item>
            <a-button
              :loading="isLoading"
              htmlType="submit"
              block
              class="bg-[#2d2d61] text-white font-semibold rounded-lg mt-3"
              style="width: 150px"
            >
              Login
            </a-button>
          </a-form-item>
        </a-form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { reactive } from "vue";
import { useLoginStore } from "../stores/login.js";
import { storeToRefs } from "pinia";

const loginStore = useLoginStore();
const { handleLogin } = loginStore;

const { isLoading } = storeToRefs(loginStore);

const data = reactive({
  user_id: "",
  password: "",
});
</script>

<style scoped>
.login-image-side {
  overflow: hidden;
}

.login {
  background: #ffffff;
  height: 100%;
}

.ant-input,
.ant-input-password,
button {
  height: 2.5rem !important;
}

.loader {
  border: 8px solid rgba(255, 255, 255, 0.3);
  border-top: 8px solid white;
  border-radius: 50%;
  width: 50px;
  height: 50px;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% {
    transform: rotate(0deg);
  }

  100% {
    transform: rotate(360deg);
  }
}
</style>
