import z from "zod";

const createTravelerValidationSchema = z.object({
    password: z.string().min(6, "Password must be at least 6 characters"),
    traveler: z.object({
        name: z.string().nonempty("Name is required"),
        email: z.string().email("Valid email is required"),
        bio: z.string().optional(),
        gender: z.enum(["MALE", "FEMALE", "OTHER"]).optional(),
        interests: z.array(z.string()).optional(),
        address: z.string().optional(),
        visitedCountries: z.array(z.string()).optional(),
    }),
});

export const UserValidation = {
    createTravelerValidationSchema,
};
