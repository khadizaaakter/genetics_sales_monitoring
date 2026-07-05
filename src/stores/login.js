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
          const blockedRoles = ["customer", "dealer"];
          if (blockedRoles.includes(payload?.role?.toLowerCase())) {
            showNotification(
              "error",
              `${payload?.role || "User"} is not allowed to login.`
            );
            return;
          }

          Cookies.set("token", payload.token, { expires: null });
          localStorage.setItem("name", payload?.name ?? "");
          localStorage.setItem("email", payload?.email ?? "");
          localStorage.setItem("role", payload?.role ?? "");
          localStorage.setItem(
            "staff_id",
            payload?.staff_id ?? payload?.dealer_code ?? ""
          );

          const permissions = await this.fetchRolePermissions(
            payload?.role,
            payload?.token
          );
          localStorage.setItem(
            "user_permissions",
            JSON.stringify(permissions)
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

    async fetchRolePermissions(roleName, token) {
      if (!roleName) return [];
      try {
        const res = await axios.get(`${apiBase}/roles`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const roles = res?.data?.role ?? [];
        const matched = roles.find(
          (r) => r?.name?.toLowerCase() === roleName?.toLowerCase()
        );
        return matched?.permissions?.map((p) => p?.name) ?? [];
      } catch (error) {
        console.error("Failed to fetch role permissions:", error);
        return [];
      }
    },

    // logout(router) {},
  },
});