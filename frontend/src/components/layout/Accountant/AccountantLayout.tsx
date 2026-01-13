import { BaseLayout } from "../BaseLayout";
import { AccountantSidebar } from "./AccountantSidebar";

export function AccountantLayout() {
  return (
    <BaseLayout
      sidebar={(props) => (
        <AccountantSidebar
          mobileOpen={props.mobileOpen}
          onMobileClose={props.onMobileClose}
        />
      )}
    />
  );
}
