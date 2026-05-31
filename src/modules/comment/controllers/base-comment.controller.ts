import { Response } from "express";

export const handleControllerError = (res: Response, error: any, message: string) => {
    console.error(`${message}:`, error);
    return res.status(500).json({
        success: false,
        message: "Internal server error",
    });
};

export const validateRequiredParams = (res: Response, params: { [key: string]: any }, required: string[]) => {
    for (const param of required) {
        if (!params[param]) {
            return res.status(400).json({
                success: false,
                message: `${param} is required`,
            });
        }
    }
    return null;
};

export const sendSuccessResponse = (res: Response, data: any, message?: string, status: number = 200) => {
    return res.status(status).json({
        success: true,
        ...(message && { message }),
        ...(data && { data }),
    });
};