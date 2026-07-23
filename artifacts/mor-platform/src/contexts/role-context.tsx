import { createContext, useContext, useState, ReactNode } from "react";

type Role = "admin" | "user" | null;

interface RoleContextValue {
  role: Role;
  changeRole: (newRole: "admin" | "user") => void;
  clearRole: () => void;
}

const RoleContext = createContext<RoleContextValue | null>(null);

export function RoleProvider({ children }: { children: ReactNode }) {
  const [role, setRole] = useState<Role>(() => {
    const stored = localStorage.getItem("mor_role");
    return stored === "admin" || stored === "user" ? stored : null;
  });

  const changeRole = (newRole: "admin" | "user") => {
    localStorage.setItem("mor_role", newRole);
    setRole(newRole);
  };

  const clearRole = () => {
    localStorage.removeItem("mor_role");
    setRole(null);
  };

  return (
    <RoleContext.Provider value={{ role, changeRole, clearRole }}>
      {children}
    </RoleContext.Provider>
  );
}

export function useRole() {
  const ctx = useContext(RoleContext);
  if (!ctx) throw new Error("useRole must be used inside <RoleProvider>");
  return ctx;
}
