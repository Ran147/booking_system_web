import type { ReactElement } from "react";
import { Outlet } from "react-router";
import { Spinner } from "@/components/common";
import { STRING } from "@/constants";
import { BUSINESS_GATE_STATE } from "@/modules/business/layout/constants/BusinessGateState.constants";
import { useBusinessStatusGateViewModel } from "@/modules/business/layout/hooks";
import { BusinessGateErrorScreen } from "./BusinessGateErrorScreen";
import { PendingApprovalScreen } from "../PendingApprovalScreen";
import { RejectedScreen } from "../RejectedScreen";

// Route element in front of BusinessLayout (D-1): a pending or rejected
// business never mounts the sidebar or any portal page (AC-KAN-39-07).
export const BusinessStatusGate = (): ReactElement => {
  const viewModel = useBusinessStatusGateViewModel();

  if (viewModel.gateState === BUSINESS_GATE_STATE.CHECKING) {
    return (
      <main className="flex min-h-svh items-center justify-center bg-background">
        <Spinner />
      </main>
    );
  }

  if (viewModel.gateState === BUSINESS_GATE_STATE.ERROR) {
    return (
      <BusinessGateErrorScreen
        message={viewModel.errorMessage ?? STRING.EMPTY}
        onRetry={viewModel.handleRetry}
      />
    );
  }

  if (viewModel.pendingApproval) {
    return (
      <PendingApprovalScreen
        details={viewModel.pendingApproval}
        isSigningOut={viewModel.isSigningOut}
        onSignOut={viewModel.handleSignOut}
      />
    );
  }

  if (viewModel.rejection) {
    return (
      <RejectedScreen
        details={viewModel.rejection}
        isSigningOut={viewModel.isSigningOut}
        onSignOut={viewModel.handleSignOut}
      />
    );
  }

  return <Outlet />;
};
