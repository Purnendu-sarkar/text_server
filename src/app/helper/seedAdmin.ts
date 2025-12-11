/* eslint-disable no-console */
import bcrypt from "bcryptjs";
import { prisma } from "../../lib/prisma";
import config from "../config";

export const seedAdmin = async () => {
    try {
        const adminEmail = process.env.ADMIN_EMAIL;
        const adminPassword = process.env.ADMIN_PASSWORD;

        if (!adminEmail || !adminPassword) {
            console.log("⚠️ ADMIN_EMAIL or ADMIN_PASSWORD missing in .env");
            return;
        }

        // Check if admin already exists in USER table
        const isAdminExist = await prisma.user.findUnique({
            where: { email: adminEmail },
        });

        if (isAdminExist) {
            console.log("✔️ Admin already exists. Skipping creation.");
            return;
        }

        console.log("⏳ Creating default admin...");

        const hashedPassword = await bcrypt.hash(
            adminPassword,
            config.bcrypt_salt_rounds
        );

        // Prisma Transaction → creates User + Admin
        await prisma.$transaction(async (tx) => {
            // 1️⃣ Create User
            await tx.user.create({
                data: {
                    email: adminEmail,
                    password: hashedPassword,
                    role: "ADMIN",
                    status: "ACTIVE",
                },
            });

            // 2️⃣ Create Admin Profile
            await tx.admin.create({
                data: {
                    name: "Super Admin",
                    email: adminEmail,
                    profilePhoto: null,
                    contactNumber: null,
                },
            });
        });

        console.log("🎉 Admin created successfully!");
    } catch (error) {
        console.log("❌ Error creating admin:", error);
    }
};
