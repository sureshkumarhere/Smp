import mongoose from "mongoose";
// if url will not be given then it will connect to that provided in the env file 
const connectDB = async (optionalUrl) => {
    try {
        // Replace <your_connection_string> with your actual MongoDB connection string
        // const connectionString = "mongodb://localhost:27017/your_database_name"; // Example for local MongoDB
        // const connectionString = "mongodb+srv://<username>:<password>@cluster0.mongodb.net/your_database_name?retryWrites=true&w=majority"; // Example for MongoDB Atlas

        // Connect to MongoDB
        const conn = await mongoose.connect(optionalUrl || process.env.MONGODB_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });
        console.log("")
        console.log("")
        console.log("")
        console.log("")

        console.log(`MongoDB Connected: ${conn.connection.host}`);
        return conn;
    } catch (error) {
        console.error(`Error connecting to MongoDB: ${error.message}`);
        process.exit(1); // Exit the process with a failure code
    }
};

export default connectDB;