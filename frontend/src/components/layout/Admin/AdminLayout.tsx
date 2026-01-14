import { BaseLayout } from "../BaseLayout";
import { AdminSidebar } from "./AdminSidebar";

export function AdminLayout() {
  return (
    <BaseLayout
      sidebar={(props) => (
        <AdminSidebar
          mobileOpen={props.mobileOpen}
          onMobileClose={props.onMobileClose}
        />
      )}
    />
  );
}
