// stores/users.js
import { defineStore } from "pinia";
import { showNotification } from "@/utilities/notification";
import axios from "axios";
import Cookies from "js-cookie";
import { apiBase } from "@/config";

export const useUserStore = defineStore("userStore", {
  state: () => ({
    isLoading: false,
    isDeleting: false,
  }),

  actions: {
    // Get all users
    async getUsers() {
      this.isLoading = true;
      try {
        const token = Cookies.get("token");
        const config = { headers: { Authorization: `Bearer ${token}` } };
        const response = await axios.get(`${apiBase}/user_list`, config);
        return response?.data?.users || [];
      } catch (error) {
        showNotification("error", error.message);
      } finally {
        this.isLoading = false;
      }
    },

    // Get user details by ID
    async getUserDetail(id) {
      this.isLoading = true;
      try {
        const token = Cookies.get("token");
        const config = { headers: { Authorization: `Bearer ${token}` } };
        const response = await axios.get(`${apiBase}/user_edit/${id}`, config);
        return response?.data?.user_info || {};
      } catch (error) {
        showNotification("error", error.message);
      } finally {
        this.isLoading = false;
      }
    },

    // Update user by ID
    async userUpdate(id, data) {
      this.isLoading = true;
      try {
        const token = Cookies.get("token");
        const config = { headers: { Authorization: `Bearer ${token}` } };
        const response = await axios.put(
          `${apiBase}/user_update/${id}`,
          data,
          config
        );
        if (response?.data?.status === "success") {
          showNotification("info", response?.data?.message);
          return true;
        }
      } catch (error) {
        showNotification("error", error.message);
      } finally {
        this.isLoading = false;
      }
    },

    // Delete user by ID
    async deleteUser(id) {
      this.isDeleting = true;
      try {
        const token = Cookies.get("token");
        const config = { headers: { Authorization: `Bearer ${token}` } };
        const response = await axios.delete(
          `${apiBase}/user_delete/${id}`,
          config
        );
        if (response?.data?.status === "Success") {
          showNotification("info", response?.data?.message);
          return true;
        }
      } catch (error) {
        showNotification("error", error.message);
      } finally {
        this.isDeleting = false;
      }
    },

    // Get roles list
    async getRoles() {
      this.isLoading = true;
      try {
        const token = Cookies.get("token");
        const config = { headers: { Authorization: `Bearer ${token}` } };
        const response = await axios.get(`${apiBase}/roles`, config);
        return response?.data?.role || [];
      } catch (error) {
        showNotification("error", error.message);
      } finally {
        this.isLoading = false;
      }
    },

    // Add a new role
    async addRole(data) {
      this.isLoading = true;
      try {
        const token = Cookies.get("token");
        const config = { headers: { Authorization: `Bearer ${token}` } };
        const response = await axios.post(`${apiBase}/roles`, data, config);
        if (response?.data?.status === "Success") {
          showNotification("info", response?.data?.message);
          return true;
        }
      } catch (error) {
        showNotification("error", error.message);
      } finally {
        this.isLoading = false;
      }
    },

    // Delete a role by ID
    async deleteRole(id) {
      this.isDeleting = true;
      try {
        const token = Cookies.get("token");
        const config = { headers: { Authorization: `Bearer ${token}` } };
        const response = await axios.delete(`${apiBase}/roles/${id}`, config);
        if (response?.data?.status === "Success") {
          showNotification("info", response?.data?.message);
          return true;
        }
      } catch (error) {
        showNotification("error", error.message);
      } finally {
        this.isDeleting = false;
      }
    },

    // Get permissions list
    async getPermission() {
      this.isLoading = true;
      try {
        const token = Cookies.get("token");
        const config = { headers: { Authorization: `Bearer ${token}` } };
        const response = await axios.get(`${apiBase}/permissions`, config);
        return response?.data?.permissions || [];
      } catch (error) {
        showNotification("error", error.message);
      } finally {
        this.isLoading = false;
      }
    },

    // Assign permissions to a user
    async assignPermission(id, permissions) {
      this.isLoading = true;
      try {
        const token = Cookies.get("token");
        const config = { headers: { Authorization: `Bearer ${token}` } };
        const response = await axios.put(
          `${apiBase}/assign_permission/${id}`,
          { permissions },
          config
        );
        if (response?.data?.status === "success") {
          showNotification("info", response?.data?.message);
          return true;
        }
      } catch (error) {
        showNotification("error", error.message);
      } finally {
        this.isLoading = false;
      }
    },
  },
  persist: true,
});
