import { defineStore } from "pinia";
import axios from "axios";
import Cookies from "js-cookie";
import { apiBase } from "@/config";
import { showNotification } from "@/utilities/notification";

export const useLoginStore = defineStore("loginStore", {
  state: () => ({
    isLoading: false,
    userInfo: null,
  }),
  actions: {
    async handleLogin(data, router) {
      this.isLoading = true;
      try {
        console.log("Logging in with:", data);
        const res = await axios.post(`${apiBase}/login`, data);
        this.isLoading = false;

        const payload = res?.data;
        const isSuccess =
          payload?.status === 1 ||
          payload?.status === "success" ||
          !!payload?.token;

        if (isSuccess && payload?.token) {
          if (payload?.role === "Customer") {
            showNotification(
              "error",
              "Customers are not allowed to login."
            );
            return;
          }

          Cookies.set("token", payload.token, { expires: null });
          localStorage.setItem("name", payload?.name ?? "");
          localStorage.setItem("email", payload?.email ?? "");
          localStorage.setItem(
            "staff_id",
            payload?.staff_id ?? payload?.dealer_code ?? ""
          );
          localStorage.setItem(
            "user_permissions",
            JSON.stringify(
              payload?.user?.all_permissions?.map((item) => item?.name) ?? []
            )
          );

          showNotification(
            "success",
            payload?.message || "Login successful! Welcome back."
          );
          router.push({ name: "dashboard" });
        } else {
          showNotification(
            "error",
            payload?.message || "Login failed. Please try again."
          );
        }
      } catch (error) {
        this.userInfo = null;
        this.isLoading = false;
        Cookies.remove("token");
        const errorMessage =
          error?.response?.data?.message || "An unexpected error occurred.";
        console.error("Login error:", errorMessage); // Log the error message
        showNotification("error", errorMessage);
      }
    },

    // logout(router) {},
  },
});
