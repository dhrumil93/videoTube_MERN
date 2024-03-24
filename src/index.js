import mongoose from "mongoose";
import { DB_NAME } from "./constants";
// import { Express } from "express";

// const app = express()(async () => {
//   try {
//     await mongoose.connect(`${process.env.MONGODB_URI} / ${DB_NAME}`);
//     app.on("Error", (error) => {
//       console.log("Error:", error);
//       throw error;
//     });
//     app.listen(process.env.PORT, () => {
//       console.log(`App is listening on PORT ${process.env.PORT}`);
//     });
//   } catch (error) {
//     console.log("Error:", error);
//     throw err;
//   }
// })();
