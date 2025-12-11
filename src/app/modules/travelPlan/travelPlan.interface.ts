import { TravelType } from "../../../generated/prisma/enums";

export type CreateTravelPlanInput = {
    destination: string;
    startDate: Date;
    endDate: Date;
    budget: number;
    travelType: TravelType;
    itinerary?: string;
    description?: string;
};

export type UpdateTravelPlanInput = {
    destination?: string;
    startDate?: Date;
    endDate?: Date;
    budget?: number;
    travelType?: TravelType;
    itinerary?: string;
    description?: string;
};

export type SendRequestInput = {
    message?: string;
};

export type UpdateRequestStatusInput = {
    status: 'ACCEPTED' | 'REJECTED';
};