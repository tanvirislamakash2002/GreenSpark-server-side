import FormData from "form-data";
import axios from "axios";
import { prisma } from "../../lib/prisma";

// Core upload function to ImgBB
const uploadToImgbb = async (fileBuffer: Buffer, fileName?: string): Promise<string> => {
    if (!fileBuffer || fileBuffer.length === 0) {
        throw new Error("No file provided");
    }

    const formData = new FormData();
    const base64Image = fileBuffer.toString('base64');
    formData.append('image', base64Image);

    if (fileName) {
        const name = fileName.split('.')[0];
        formData.append('name', `greenspark_${Date.now()}_${name}`);
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
                image: true,
                role: true
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
                image: true,
                role: true
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

// Upload idea image
const uploadIdeaImage = async (ideaId: string, userId: string, fileBuffer: Buffer, fileName?: string) => {
    try {
        // Verify idea belongs to user
        const idea = await prisma.idea.findFirst({
            where: {
                id: ideaId,
                authorId: userId
            }
        });

        if (!idea) {
            return {
                success: false,
                message: "Idea not found or unauthorized"
            };
        }

        // Only allow image upload for ideas that are not yet approved
        if (idea.status === 'APPROVED') {
            return {
                success: false,
                message: "Cannot modify approved ideas. Please contact admin."
            };
        }

        const imageUrl = await uploadToImgbb(fileBuffer, fileName);

        const updatedIdea = await prisma.idea.update({
            where: { id: ideaId },
            data: { imageUrl },
            select: {
                id: true,
                title: true,
                imageUrl: true,
                status: true
            }
        });

        return {
            success: true,
            message: "Idea image uploaded successfully",
            data: updatedIdea
        };
    } catch (error) {
        console.error("Idea image upload error:", error);
        return {
            success: false,
            message: error instanceof Error ? error.message : "Failed to upload idea image"
        };
    }
};

// Upload category image (admin only)
const uploadCategoryImage = async (categoryId: string, fileBuffer: Buffer, fileName?: string) => {
    try {
        // Verify category exists
        const category = await prisma.category.findUnique({
            where: { id: categoryId }
        });

        if (!category) {
            return {
                success: false,
                message: "Category not found"
            };
        }

        const imageUrl = await uploadToImgbb(fileBuffer, fileName);

        // Note: You may need to add an imageUrl field to your Category model
        // For now, this is a placeholder. Add imageUrl to Category model if needed.
        // const updatedCategory = await prisma.category.update({
        //     where: { id: categoryId },
        //     data: { imageUrl }
        // });

        return {
            success: true,
            message: "Category image uploaded successfully",
            data: {
                categoryId,
                url: imageUrl
            }
        };
    } catch (error) {
        console.error("Category image upload error:", error);
        return {
            success: false,
            message: error instanceof Error ? error.message : "Failed to upload category image"
        };
    }
};

export const uploadService = {
    uploadToImgbb,
    uploadAvatar,
    removeAvatar,
    uploadIdeaImage,
    uploadCategoryImage,
};