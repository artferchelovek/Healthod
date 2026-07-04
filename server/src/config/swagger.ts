import swaggerJsdoc from "swagger-jsdoc";
import path from "path";

const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Healthod API",
      version: "1.0.0",
      description: "API documentation for Healthod backend",
    },
    servers: [
      {
        url: process.env.API_URL || "http://localhost:5000",
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
        },
      },
    },
  },
  apis: [path.join(process.cwd(), "src/routes/*.ts")],
};

const swaggerSpec = swaggerJsdoc(options);

export default swaggerSpec;
