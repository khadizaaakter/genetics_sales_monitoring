import { ref } from "vue";
import Cookies from "js-cookie";

// Shared (module-level) layout UI state so it survives page navigation,
// since every page mounts its own <MainLayout>.

const COLLAPSE_KEY = "gsm_sidebar_collapsed";
const DESKTOP_QUERY = "(min-width: 1024px)";

const readCollapsed = () => {
  try {
    return localStorage.getItem(COLLAPSE_KEY) === "1";
  } catch {
    return false;
  }
};

export const sidebarCollapsed = ref(readCollapsed());
export const mobileSidebarOpen = ref(false);
export const isDesktop = ref(
  typeof window !== "undefined" ? window.matchMedia(DESKTOP_QUERY).matches : true
);

// Sub-menus that are currently expanded (kept across navigation)
export const openSubmenus = ref([]);

if (typeof window !== "undefined") {
  const mql = window.matchMedia(DESKTOP_QUERY);
  const onChange = (e) => {
    isDesktop.value = e.matches;
    if (e.matches) mobileSidebarOpen.value = false;
  };
  if (mql.addEventListener) mql.addEventListener("change", onChange);
  else mql.addListener(onChange);
}

export const isSidebarCollapsed = () => isDesktop.value && sidebarCollapsed.value;

export const toggleSidebar = () => {
  if (!isDesktop.value) {
    mobileSidebarOpen.value = !mobileSidebarOpen.value;
    return;
  }
  sidebarCollapsed.value = !sidebarCollapsed.value;
  try {
    localStorage.setItem(COLLAPSE_KEY, sidebarCollapsed.value ? "1" : "0");
  } catch {
    /* storage unavailable – ignore */
  }
};

export const closeMobileSidebar = () => {
  mobileSidebarOpen.value = false;
};

export const toggleSubmenu = (key) => {
  openSubmenus.value = openSubmenus.value.includes(key)
    ? openSubmenus.value.filter((k) => k !== key)
    : [...openSubmenus.value, key];
};

export const ensureSubmenuOpen = (key) => {
  if (key && !openSubmenus.value.includes(key)) {
    openSubmenus.value = [...openSubmenus.value, key];
  }
};

// Same logout behaviour the sidebar menu already used.
export const logoutUser = (router) => {
  Cookies.remove("token");
  localStorage.removeItem("staff_id");
  localStorage.removeItem("name");
  localStorage.removeItem("email");
  localStorage.removeItem("role");
  localStorage.removeItem("user_permissions");
  mobileSidebarOpen.value = false;
  router.push({ name: "login" });
};
