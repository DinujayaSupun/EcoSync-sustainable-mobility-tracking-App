const swaggerJsdoc = require("swagger-jsdoc");

const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Sustainability Project - Admin API Documentation",
      version: "1.0.0",
      description:
        "Complete API documentation for Admin endpoints in the Sustainability Commute Tracking System",
      contact: {
        name: "Admin Support",
        email: "admin@sustainability-project.com",
      },
      license: {
        name: "ISC",
        url: "https://opensource.org/licenses/ISC",
      },
    },
    servers: [
      {
        url: "http://localhost:5000",
        description: "Development server",
      },
      {
        url: "https://api.sustainability-project.com",
        description: "Production server",
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
          description: "Enter JWT token (obtained from /api/auth/login)",
        },
      },
      schemas: {
        User: {
          type: "object",
          properties: {
            _id: {
              type: "string",
              description: "User ID",
              example: "507f1f77bcf86cd799439011",
            },
            name: {
              type: "string",
              description: "User full name",
              example: "John Doe",
            },
            email: {
              type: "string",
              format: "email",
              description: "User email address",
              example: "john.doe@example.com",
            },
            faculty: {
              type: "string",
              description: "User faculty/department",
              example: "Engineering",
            },
            role: {
              type: "string",
              enum: ["user", "admin"],
              description: "User role",
              example: "user",
            },
            createdAt: {
              type: "string",
              format: "date-time",
              description: "Account creation date",
            },
          },
        },
        AdminStats: {
          type: "object",
          properties: {
            success: {
              type: "boolean",
              example: true,
            },
            totalUsers: {
              type: "integer",
              description: "Total number of registered users",
              example: 150,
            },
            totalCO2: {
              type: "number",
              format: "float",
              description: "Total CO2 saved in kg",
              example: 1234.56,
            },
            activeToday: {
              type: "integer",
              description: "Number of users active today",
              example: 45,
            },
            faculties: {
              type: "integer",
              description: "Number of unique faculties",
              example: 8,
            },
            facultyData: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  faculty: {
                    type: "string",
                    example: "Engineering",
                  },
                  students: {
                    type: "integer",
                    example: 45,
                  },
                },
              },
            },
          },
        },
        Trip: {
          type: "object",
          properties: {
            _id: {
              type: "string",
              example: "507f1f77bcf86cd799439011",
            },
            user: {
              type: "string",
              description: "User ID reference",
              example: "507f1f77bcf86cd799439011",
            },
            distance: {
              type: "number",
              description: "Trip distance in km",
              example: 15.5,
            },
            co2Saved: {
              type: "number",
              description: "CO2 saved in kg",
              example: 3.2,
            },
            mode: {
              type: "string",
              enum: ["bike", "walk", "bus", "train", "carpool"],
              example: "bike",
            },
            createdAt: {
              type: "string",
              format: "date-time",
            },
          },
        },
        EmailReport: {
          type: "object",
          required: ["email", "reportData"],
          properties: {
            email: {
              type: "string",
              format: "email",
              description: "Recipient email address",
              example: "admin@university.edu",
            },
            reportData: {
              type: "object",
              description: "Report data to include in email",
              properties: {
                totalUsers: {
                  type: "integer",
                  example: 150,
                },
                totalCO2: {
                  type: "number",
                  example: 1234.56,
                },
                period: {
                  type: "string",
                  example: "January 2026",
                },
              },
            },
          },
        },
        AIInsightsRequest: {
          type: "object",
          required: ["prompt", "data"],
          properties: {
            prompt: {
              type: "string",
              description: "Question or analysis request",
              example: "What are the top 3 faculties by CO2 savings?",
            },
            data: {
              type: "object",
              description: "Context data for AI analysis",
              example: {
                totalUsers: 150,
                totalCO2: 1234.56,
                faculties: ["Engineering", "Science", "Arts"],
              },
            },
          },
        },
        Error: {
          type: "object",
          properties: {
            success: {
              type: "boolean",
              example: false,
            },
            message: {
              type: "string",
              example: "Error message description",
            },
          },
        },
      },
    },
    security: [
      {
        bearerAuth: [],
      },
    ],
    tags: [
      {
        name: "Admin Statistics",
        description: "Dashboard statistics and analytics endpoints",
      },
      {
        name: "User Management",
        description: "CRUD operations for user management",
      },
      {
        name: "Reports",
        description: "Report generation and email delivery",
      },
      {
        name: "AI Insights",
        description: "AI-powered analytics and insights",
      },
    ],
  },
  apis: ["./routes/adminRoutes.js"],
};

const swaggerSpec = swaggerJsdoc(options);

module.exports = swaggerSpec;
