import { NextFunction, Request, Response } from "express"
import httpStatus from "http-status"
import { Prisma } from "../../generated/prisma/client";

const globalErrorHandler = (err: any, req: Request, res: Response, next: NextFunction) => {

    let statusCode: number = err.statusCode || httpStatus.INTERNAL_SERVER_ERROR;
    let success = false;
    let message = err.message || "Something went wrong!";
    let error = err;

    if (err instanceof Prisma.PrismaClientKnownRequestError) {
        if (err.code === "P2002") {
            // Unique constraint failed
            message = "Duplicate value detected. This record already exists.";
            error = err.meta;
            statusCode = httpStatus.CONFLICT;
        }

        if (err.code === "P1000") {
            // Database authentication failed
            message =
                "Database authentication failed. Please check your database credentials or connection settings.";
            error = err.meta;
            statusCode = httpStatus.BAD_GATEWAY;
        }

        if (err.code === "P2003") {
            // Foreign key constraint failed
            message =
                "Operation failed due to an invalid or missing related record. Please check your foreign key references.";
            error = err.meta;
            statusCode = httpStatus.BAD_REQUEST;
        }

        if (err.code === "P2025") {
            // Record not found
            message =
                `Requested ${err.meta?.modelName || "record"} not found. Please verify the provided ID or query parameters.`;
            error = err.meta;
            statusCode = httpStatus.NOT_FOUND;
        }
    } else if (err instanceof Prisma.PrismaClientValidationError) {
        message =
            "Invalid data input. Please ensure all required fields are correctly formatted.";
        error = err.message;
        statusCode = httpStatus.BAD_REQUEST;
    } else if (err instanceof Prisma.PrismaClientInitializationError) {
        message =
            "Failed to initialize database connection. Please verify your database server is running.";
        error = err.message;
        statusCode = httpStatus.SERVICE_UNAVAILABLE;
    } else if (err instanceof Prisma.PrismaClientUnknownRequestError) {
        message = "Unknown Prisma error occurred!",
            error = err.message
        error = err.message;
        statusCode = httpStatus.INTERNAL_SERVER_ERROR;
    }



    res.status(statusCode).json({
        success,
        message,
        error
    })
};

export default globalErrorHandler;