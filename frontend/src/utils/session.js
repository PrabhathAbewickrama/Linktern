export function getStoredUser() {
  const rawUser = localStorage.getItem("user");

  if (!rawUser || rawUser === "undefined" || rawUser === "null") {
    return null;
  }

  try {
    return JSON.parse(rawUser);
  } catch (error) {
    console.warn("Invalid user data found in localStorage. Clearing it.", error);
    localStorage.removeItem("user");
    return null;
  }
}
