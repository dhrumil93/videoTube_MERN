import dotenv, { config } from "dotenv";

import { DB_NAME } from "./constants.js";
import connection from "./db/index.js";

dotenv.config({
  path: "/.env",
});

connection()
  .then(() => {
    app.listen(process.env.PORT || 8000, () => {
      console.log(`Server is running at port: ${process.env.PORT}`);
    });
  })
  .catch((err) => {
    console.log("MongoDB Connection Failed!!", err);
  });
