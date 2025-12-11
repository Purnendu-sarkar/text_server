export type CreateReviewInput = {
  travelPlanId: string;
  revieweeId: string;   
  rating: number;     
  comment?: string;
};

export type UpdateReviewInput = {
  rating?: number;
  comment?: string;
};