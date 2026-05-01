import type { Feature } from "./role";

export interface SubscriptionPlanFeature {
  id: string;
  plan_id: string;
  feature_id: string;
  feature: Feature;
}

export interface SubscriptionPlan {
  id: string;
  name: string;
  description?: string;
  price: number;
  billing_cycle: "monthly" | "annual" | "one_time";
  is_active: boolean;
  created_at: string;
  updated_at: string;
  planFeatures: SubscriptionPlanFeature[];
}

export interface CreateSubscriptionPlanRequest {
  name: string;
  description?: string;
  price?: number;
  billing_cycle?: "monthly" | "annual" | "one_time";
  is_active?: boolean;
  featureIds: string[];
}

export interface UpdateSubscriptionPlanRequest extends Partial<CreateSubscriptionPlanRequest> {}
