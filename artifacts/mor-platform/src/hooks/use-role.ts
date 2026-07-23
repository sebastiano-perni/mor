// Re-export from the shared RoleContext so every component
// that calls useRole() shares the same state instance.
export { useRole } from "@/contexts/role-context";
