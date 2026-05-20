import Cookies from "js-cookie";

export const getTokenConfig = () => {
  const token = Cookies.get("token");
  return { headers: { Authorization: `Bearer ${token}` } };
};
