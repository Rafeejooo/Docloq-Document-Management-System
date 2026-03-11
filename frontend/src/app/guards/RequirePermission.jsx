import useAuthStore from "@/app/store/auth.store";
import AccessDenied from "@/components/errors/AccessDenied";

/**
 * Route guard that checks whether the user has the required role.
 * Wrap admin-only (or role-restricted) page elements with this component.
 *
 * Usage:
 *   <RequirePermission roles={["admin","super_admin"]}>
 *     <RoleManagement />
 *   </RequirePermission>
 */
export default function RequirePermission({ children, roles = ["admin", "super_admin"] }) {
  const user = useAuthStore((s) => s.user);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  // Not logged in — let auth guard handle redirect
  if (!isAuthenticated || !user) return null;

  // Check role
  const allowed =
    typeof roles === "string"
      ? user.role === roles
      : Array.isArray(roles) && roles.includes(user.role);

  if (!allowed) return <AccessDenied />;

  return children;
}
