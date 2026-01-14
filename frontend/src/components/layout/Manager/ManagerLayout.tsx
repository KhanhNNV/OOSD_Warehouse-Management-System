import { BaseLayout } from "../BaseLayout";
import { ManagerSidebar } from "./ManagerSidebar";

export function ManagerLayout() {
  return (
    <BaseLayout
      sidebar={(props) => (
        <ManagerSidebar
          mobileOpen={props.mobileOpen}
          onMobileClose={props.onMobileClose}
        />
      )}
    />
  );
}
