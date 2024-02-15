import express, { NextFunction, Request, Response } from "express";
import cors from "cors";
import dotenv from "dotenv";
import createHttpError from "http-errors";
import morgan from "morgan";

import envConfig from "./configs/envConfig";
import routes from "./routes";
import connectToDB from "./configs/database";

dotenv.config();

const app = express();

app.use(express.json({ limit: "100mb" }));
app.use(cors());
app.use(morgan("tiny"));

app.use("/api/", routes());

connectToDB();

app.use((_req, res, next) => {
  res.status(400);
  next(createHttpError[400]("This route does not exist!"));
});

app.use(
  (
    err: createHttpError.HttpError,
    _req: Request,
    res: Response,
    next: NextFunction
  ) => {
    return res.json({
      status: err.status,
      message: err.message,
    });
  }
);

app.listen(envConfig.port, () => {
  console.log(`Server app listening on port ${envConfig.port}`);
});
