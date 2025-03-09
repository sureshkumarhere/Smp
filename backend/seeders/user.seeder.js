// this file creates fake user data


import mongoose from "mongoose";
// import faker from "faker";
import { faker } from '@faker-js/faker';

import { hash } from "bcrypt";
import User from "../models/User.model.js";





const seedUsers = async (count = 10) => {
    try {
        //await User.deleteMany(); // Clear existing users
        
        let users = [];
        for (let i = 0; i < count; i++) {
            const regNo = faker.number.int({ min: 10000000, max: 99999999 }).toString();
            const password = await hash("password123", 10);
            
            users.push({
                name: faker.person.fullName(),
                email: `user${i}@mnnit.ac.in`,
                regNo,
                password,
                isVerified: true,
                mentorInGroup: [],
                studentInGroup: [],
                avatar: {
                    public_id: faker.string.uuid(),
                    url: faker.image.url(),
                },
                isAdmin: false,
            });
        }
        
        await User.insertMany(users);
        console.log(`${count} users added successfully.`);
    } catch (error) {
        console.error("Error seeding users:", error);
    } finally {
        mongoose.connection.close();
    }
};




export default seedUsers;
