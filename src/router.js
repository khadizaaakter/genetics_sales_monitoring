import { createWebHistory, createRouter } from "vue-router";
import Cookies from "js-cookie";

import Login from "./views/Login.vue";
// import UpdatePassword from "./vews/UpdatePassword.vue";

// Every page except Login is loaded on first visit, so the app only downloads
// the code (charts, Excel, etc.) of the page being opened.
const UserManagement = () => import("./views/user/UserManagement.vue");
const Permission = () => import("./views/user/Permission.vue");
const Role = () => import("./views/user/Role.vue");
const EditRole = () => import("./views/user/EditRole.vue");
const EditUser = () => import("./views/user/EditUser.vue");
const UpdatePermission = () => import("./views/user/UpdatePermission.vue");
const ProductCategory = () => import("./views/Product Category/category_list.vue");
const Product_list = () => import("./views/product/product_list.vue");
const Dashboard = () => import("./views/dashboard/dashboard.vue");
const LaInfoList = () => import("./views/la/la_info_list.vue");
const Report = () => import("./views/report/report.vue");
const RegisteredDealer = () => import("./views/report/registered_dealer.vue");
const PresentStockSummary = () => import("./views/report/present_stock_summary.vue");

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
    path: "/la-info",
    name: "la-info",
    component: LaInfoList,
  },
  {
    path: "/dashboard",
    name: "dashboard",
    component: Dashboard,
  },
  {
    path: "/report",
    name: "report",
    component: Report,
  },
  {
    path: "/present_stock_summary",
    name: "present_stock_summary",
    component: PresentStockSummary,
  },
  {
    path: "/registered-dealer-report",
    name: "registered-dealer",
    component: RegisteredDealer,
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
    next("/dashboard");
  } else if (token) {
    next();
  } else {
    next("/");
  }
});

export default router;
