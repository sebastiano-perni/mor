import { useState, useEffect } from "react";

export function useRole() {
  const [role, setRole] = useState<"admin" | "user" | null>(() => {
    const stored = localStorage.getItem("mor_role");
    return (stored === "admin" || stored === "user") ? stored : null;
  });

  const changeRole = (newRole: "admin" | "user") => {
    localStorage.setItem("mor_role", newRole);
    setRole(newRole);
  };

  const clearRole = () => {
    localStorage.removeItem("mor_role");
    setRole(null);
  };

  return { role, changeRole, clearRole };
}
