import FormData from "form-data";
import axios from "axios";
import { prisma } from "../../lib/prisma";

// Core upload function
const uploadToImgbb = async (fileBuffer: Buffer, fileName?: string): Promise<string> => {
    if (!fileBuffer) {
        throw new Error("No file provided");
    }

    const formData = new FormData();
    const base64Image = fileBuffer.toString('base64');
    formData.append('image', base64Image);

    if (fileName) {
        const name = fileName.split('.')[0];
        formData.append('name', `upload_${Date.now()}_${name}`);
    }

    try {
        const response = await axios.post(
            `https://api.imgbb.com/1/upload?key=${process.env.IMGBB_API_KEY}`,
            formData,
            {
                headers: { ...formData.getHeaders() },
                timeout: 30000
            }
        );

        if (response.data.success) {
            return response.data.data.url;
        } else {
            throw new Error(response.data.error?.message || 'Upload failed');
        }
    } catch (error) {
        console.error("ImgBB upload error:", error);
        throw new Error(error instanceof Error ? error.message : "Upload service unavailable");
    }
};

// Upload avatar with user update
const uploadAvatar = async (userId: string, fileBuffer: Buffer, fileName?: string) => {
    try {
        const imageUrl = await uploadToImgbb(fileBuffer, fileName);

        const updatedUser = await prisma.user.update({
            where: { id: userId },
            data: { image: imageUrl },
            select: {
                id: true,
                name: true,
                email: true,
                image: true
            }
        });

        return {
            success: true,
            message: "Avatar uploaded successfully",
            data: {
                url: updatedUser.image,
                user: updatedUser
            }
        };
    } catch (error) {
        console.error("Avatar upload error:", error);
        return {
            success: false,
            message: error instanceof Error ? error.message : "Failed to upload avatar"
        };
    }
};

// Remove avatar
const removeAvatar = async (userId: string) => {
    try {
        const updatedUser = await prisma.user.update({
            where: { id: userId },
            data: { image: null },
            select: {
                id: true,
                name: true,
                email: true,
                image: true
            }
        });

        return {
            success: true,
            message: "Avatar removed successfully",
            data: {
                user: updatedUser
            }
        };
    } catch (error) {
        console.error("Avatar removal error:", error);
        return {
            success: false,
            message: error instanceof Error ? error.message : "Failed to remove avatar"
        };
    }
};

// Upload store logo for seller
const uploadStoreLogo = async (userId: string, fileBuffer: Buffer, fileName?: string) => {
    try {
        const imageUrl = await uploadToImgbb(fileBuffer, fileName);

        const updatedSeller = await prisma.seller.update({
            where: { userId },
            data: { storeLogo: imageUrl },
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        email: true
                    }
                }
            }
        });

        return {
            success: true,
            message: "Store logo uploaded successfully",
            data: {
                url: updatedSeller.storeLogo,
                seller: updatedSeller
            }
        };
    } catch (error) {
        console.error("Store logo upload error:", error);
        return {
            success: false,
            message: error instanceof Error ? error.message : "Failed to upload store logo"
        };
    }
};

// Upload product image
const uploadProductImage = async (medicineId: string, sellerId: string, fileBuffer: Buffer, fileName?: string) => {
    try {
        // Verify medicine belongs to seller
        const medicine = await prisma.medicine.findFirst({
            where: {
                id: medicineId,
                sellerId
            }
        });

        if (!medicine) {
            return {
                success: false,
                message: "Medicine not found or unauthorized"
            };
        }

        const imageUrl = await uploadToImgbb(fileBuffer, fileName);

        const updatedMedicine = await prisma.medicine.update({
            where: { id: medicineId },
            data: { imageUrl },
            select: {
                id: true,
                name: true,
                imageUrl: true,
                price: true
            }
        });

        return {
            success: true,
            message: "Product image uploaded successfully",
            data: updatedMedicine
        };
    } catch (error) {
        console.error("Product image upload error:", error);
        return {
            success: false,
            message: error instanceof Error ? error.message : "Failed to upload product image"
        };
    }
};

// Upload seller verification document
const uploadDocument = async (sellerId: string, fileBuffer: Buffer, fileName?: string, documentType?: string) => {
    try {
        const imageUrl = await uploadToImgbb(fileBuffer, fileName);

        const document = await prisma.sellerDocument.create({
            data: {
                sellerId,
                documentType: documentType || "BUSINESS_LICENSE",
                documentUrl: imageUrl,
                status: "PENDING"
            }
        });

        return {
            success: true,
            message: "Document uploaded successfully",
            data: document
        };
    } catch (error) {
        console.error("Document upload error:", error);
        return {
            success: false,
            message: error instanceof Error ? error.message : "Failed to upload document"
        };
    }
};

export const uploadService = {
    uploadToImgbb,
    uploadAvatar,
    removeAvatar,
    uploadStoreLogo,
    uploadProductImage,
    uploadDocument
};