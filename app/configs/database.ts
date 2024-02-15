import mongoose from "mongoose";

import envConfig from "../configs/envConfig";

const connectToDB = async () => {
  try {
    await mongoose.connect(envConfig.databaseUrl, {
      dbName: "Trello-clone",
    });

    console.log("Connect Successfully!");
  } catch (error) {
    console.log("Connect Failure: ", error);
    process.exit(1);
  }
};

export default connectToDB;
