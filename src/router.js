import { createWebHistory, createRouter } from "vue-router";
import Cookies from "js-cookie";

import Login from "./views/Login.vue";
// import UpdatePassword from "./vews/UpdatePassword.vue";

import UserManagement from "./views/user/UserManagement.vue";
import Permission from "./views/user/Permission.vue";
import Role from "./views/user/Role.vue";
import EditRole from "./views/user/EditRole.vue";
import EditUser from "./views/user/EditUser.vue";
import UpdatePermission from "./views/user/UpdatePermission.vue";
import ProductCategory from "./views/Product Category/category_list.vue";
import Product_list from "./views/product/product_list.vue";

const routes = [
  {
    path: "/",
    name: "login",
    component: Login,
  },
  {
    path: "/user-management",
    name: "user-management",
    component: UserManagement,
  },
  {
    path: "/role",
    name: "role",
    component: Role,
  },
  {
    path: "/user-permission",
    name: "user-permission",
    component: Permission,
  },
  // product category
  {
    path: "/product-category",
    name: "product-category",
    component: ProductCategory,
  },
  {
    path: "/product-list",
    name: "product-list",
    component: Product_list,
  },
  {
    path: "/update-user-permission/:id",
    name: "update-user-permission",
    component: UpdatePermission,
  },
  {
    path: "/user-role",
    name: "user-role",
    component: Role,
  },

  {
    path: "/user-edit/:id",
    name: "user-edit",
    component: EditUser,
  },

  {
    path: "/user-role-edit/:id",
    name: "user-role-edit",
    component: EditRole,
  },

  

  {
    path: "/:catchAll(.*)",
    redirect: "/",
  },
];

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: routes,
});
router.beforeEach((to, from, next) => {
  const token = Cookies.get("token");
  if (to.path === "/" && !token) {
    next();
  } else if (to.path === "/" && token) {
    next("/product-category");
  } else if (token) {
    next();
  } else {
    next("/");
  }
});

export default router;
