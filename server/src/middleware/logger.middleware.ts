import { Request, Response, NextFunction } from "express";

export const loggerMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const start = Date.now();

  console.log("\n========== REQUEST ==========");
  console.log("Time:", new Date().toISOString());
  console.log("Method:", req.method);
  console.log("URL:", req.originalUrl);
  console.log("Params:", req.params);
  console.log("Query:", req.query);
  console.log("Body:", req.body);

  res.on("finish", () => {
    const duration = Date.now() - start;

    console.log("---------- RESPONSE ----------");
    console.log("Status:", res.statusCode);
    console.log("Duration:", `${duration}ms`);
    console.log("==============================\n");
  });

  next();
};
