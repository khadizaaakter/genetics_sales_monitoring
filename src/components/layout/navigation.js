import {
  DashboardOutlined,
  ShoppingOutlined,
  SolutionOutlined,
  BarChartOutlined,
  TeamOutlined,
  IdcardOutlined,
  SafetyCertificateOutlined,
} from "@ant-design/icons-vue";

// `permissions` = visible when the user has ANY of the listed permissions.
// Mirrors the visibility rules of the previous sidebar menu exactly.
export const navSections = [
  {
    key: "main",
    title: "Main Menu",
    permissions: ["Dashboard", "Product"],
    items: [
      {
        key: "dashboard",
        label: "Dashboard",
        icon: DashboardOutlined,
        route: "dashboard",
        permissions: ["Dashboard"],
      },
      {
        key: "settings",
        label: "Product",
        icon: ShoppingOutlined,
        permissions: ["Product"],
        children: [
          { key: "product-category", label: "Product Category", route: "product-category" },
          { key: "product-list", label: "Product List", route: "product-list" },
        ],
      },
      {
        key: "la-info",
        label: "LA Info",
        icon: SolutionOutlined,
        route: "la-info",
        permissions: ["LA Info", "Product"],
      },
    ],
  },
  {
    key: "reports-section",
    title: "Reports",
    permissions: ["Report"],
    items: [
      {
        key: "reports",
        label: "Report",
        icon: BarChartOutlined,
        permissions: ["Report"],
        children: [
          { key: "report", label: "Dealer Wise LA Sales Report", route: "report" },
          { key: "registered-dealer", label: "Registered Dealer", route: "registered-dealer" },
          { key: "present_stock_summary", label: "Present Stock Summary", route: "present_stock_summary" },
        ],
      },
    ],
  },
  {
    key: "users",
    title: "User Management",
    permissions: ["User Manager", "Role", "Permissions"],
    items: [
      {
        key: "user-management",
        label: "User Manager",
        icon: TeamOutlined,
        route: "user-management",
        permissions: ["User Manager"],
        activeFor: ["user-edit"],
      },
      {
        key: "role",
        label: "Role",
        icon: IdcardOutlined,
        route: "role",
        permissions: ["Role"],
        activeFor: ["user-role", "user-role-edit"],
      },
      {
        key: "user-permission",
        label: "Permissions",
        icon: SafetyCertificateOutlined,
        route: "user-permission",
        permissions: ["Permissions"],
        activeFor: ["update-user-permission"],
      },
    ],
  },
];

// Page title + breadcrumb trail for the header, keyed by route name.
export const pageMeta = {
  dashboard: { title: "Dashboard", trail: ["Main Menu"] },
  "product-category": { title: "Product Category", trail: ["Main Menu", "Product"] },
  "product-list": { title: "Product List", trail: ["Main Menu", "Product"] },
  "la-info": { title: "LA Info", trail: ["Main Menu"] },
  report: { title: "Dealer Wise LA Sales Report", trail: ["Reports"] },
  "registered-dealer": { title: "Registered Dealer", trail: ["Reports"] },
  present_stock_summary: { title: "Present Stock Summary", trail: ["Reports"] },
  "user-management": { title: "User Manager", trail: ["User Management"] },
  "user-edit": { title: "Edit User", trail: ["User Management", "User Manager"] },
  role: { title: "Role", trail: ["User Management"] },
  "user-role": { title: "Role", trail: ["User Management"] },
  "user-role-edit": { title: "Edit Role", trail: ["User Management", "Role"] },
  "user-permission": { title: "Permissions", trail: ["User Management"] },
  "update-user-permission": { title: "Update Permission", trail: ["User Management", "Permissions"] },
};
