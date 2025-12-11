import { Gender } from "../../../generated/prisma/enums";

export type CreateTravelerInput = {
    password: string;
    traveler: {
        name: string;
        email: string;
        bio?: string;
        gender?: Gender;
        interests?: string[];
        address?: string;
        visitedCountries?: string[];
        profilePhoto?: string;
    };
};

export type UpdateTravelerProfileInput = {
    name?: string;
    bio?: string;
    gender?: Gender;
    interests?: string[];
    address?: string;
    visitedCountries?: string[];
    profilePhoto?: string;
};
