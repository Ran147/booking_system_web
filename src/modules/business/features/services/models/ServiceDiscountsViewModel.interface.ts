import type { ServiceDiscount } from "@/domain";
import type { Nullable } from "@/types";
import type { ServiceDetail } from "./ServiceDetail.interface";
import type { DiscountType } from "../constants/ServiceDiscount.constants";

export interface DiscountFormState {
  readonly endsAt: string;
  readonly startsAt: string;
  readonly type: DiscountType;
  readonly value: number | "";
}

export interface ServiceDiscountsViewModel {
  readonly currency: string;
  readonly discounts: readonly ServiceDiscount[];
  readonly formError: Nullable<string>;
  readonly formState: DiscountFormState;
  readonly handleAddDiscount: () => Promise<void>;
  readonly handleFormChange: <Key extends keyof DiscountFormState>(
    field: Key,
    value: DiscountFormState[Key],
  ) => void;
  readonly handleRemoveDiscount: (index: number) => Promise<void>;
  readonly handleRetryLoad: () => void;
  readonly isAddPending: boolean;
  readonly isLoading: boolean;
  readonly isLoadError: boolean;
  readonly isReadOnly: boolean;
  readonly isRemovePending: boolean;
  readonly loadErrorMessageKey: Nullable<string>;
  readonly service: Nullable<ServiceDetail>;
  readonly timeZone: string;
}
