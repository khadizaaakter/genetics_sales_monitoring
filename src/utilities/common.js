export function formatNumber(number) {
  return new Intl.NumberFormat("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(number);
}
const PERMISSION_FREE_ROUTES = [
  "user-management",
  "product-category",
  "product-list",
];

export function hasPermission(route) {
  if (PERMISSION_FREE_ROUTES.includes(route?.name)) return true;
  const user_permissions = JSON.parse(localStorage.getItem("user_permissions"));
  return user_permissions?.some((item) => item == route?.name);
}
