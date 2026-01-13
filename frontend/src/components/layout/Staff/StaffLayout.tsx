import { BaseLayout } from "../BaseLayout";
import { StaffSidebar } from "./StaffSidebar";

export function StaffLayout() {
  return (
    <BaseLayout
      sidebar={(props) => (
        <StaffSidebar
          mobileOpen={props.mobileOpen}
          onMobileClose={props.onMobileClose}
        />
      )}
    />
  );
}
