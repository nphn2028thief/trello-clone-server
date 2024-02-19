import { Response } from "express";
import createHttpError from "http-errors";

const responseServer = {
  message: (res: Response, message: string) => {
    return res.send({
      message,
    });
  },
  unauthorized: (res: Response, message?: string) => {
    const err = createHttpError.Unauthorized(message || "Unauthorized");
    return res.status(err.status).send({
      message: err.message,
      code: err.status,
    });
  },
  success: (res: Response, message?: string, key?: any, data?: any) => {
    return res.json({
      message,
      [key]: data,
    });
  },
  badRequest: (res: Response, message?: string) => {
    const err = createHttpError.BadRequest(message || "Invalid data!");
    return res.status(err.status).send({
      message: err.message,
    });
  },
  forbidden: (res: Response, message?: string) => {
    const err = createHttpError.Forbidden(message || "Forbidden!");
    return res.status(err.status).send({
      message: err.message,
    });
  },
  notFound: (res: Response, message?: string) => {
    const err = createHttpError.NotFound(message || "Not found!");
    return res.status(err.status).send({
      message: err.message,
      code: err.status,
    });
  },
  conflict: (res: Response, message: string) => {
    const err = createHttpError.Conflict(message);
    return res.status(err.status).send({
      message: err.message,
      code: err.status,
    });
  },
  timeout: (res: Response, message?: string) => {
    return res.status(440).send({
      message: message || "Login session is expired, please login again!",
      code: res.status(440),
    });
  },
  error: (res: Response, message?: string, jwtError?: string) => {
    const err = createHttpError.InternalServerError(
      message || "Oops! Something went wrong!"
    );

    return res.status(err.status).send({
      message: err.message,
      code: err.status,
      jwtError,
    });
  },
};

export default responseServer;
