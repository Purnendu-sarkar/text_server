import z from "zod";

const createTravelPlanValidationSchema = z.object({
    destination: z.string().nonempty("Destination is required"),
    startDate: z.coerce.date({ message: "Valid start date is required" }),
    endDate: z.coerce.date({ message: "Valid end date is required" }),
    budget: z.number().positive("Budget must be positive"),
    travelType: z.enum(["ADVENTURE", "LEISURE", "BUSINESS", "FAMILY", "SOLO"]),
    itinerary: z.string().optional(),
    description: z.string().optional(),
});

const updateTravelPlanValidationSchema = createTravelPlanValidationSchema.partial()

const sendRequestValidationSchema = z.object({
    message: z.string().optional(),
});

const updateRequestStatusValidationSchema = z.object({
    status: z.enum(["ACCEPTED", "REJECTED"]),
});

export const TravelPlanValidation = {
    createTravelPlanValidationSchema,
    updateTravelPlanValidationSchema,
    sendRequestValidationSchema,
    updateRequestStatusValidationSchema
};