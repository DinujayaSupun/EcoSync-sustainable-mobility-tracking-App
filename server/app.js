require("dotenv").config();

const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const carbonRoutes = require("./routes/carbon.routes");
const errorHandler = require("./middlewires/error.middlewire");

const app = express();

app.use(cors());
app.use(express.json());

app.use("/api/carbon", carbonRoutes);

app.get("/", (req, res) => {
  res.send("Carbon Accounting Engine Backend Running 🚀");
});

app.use(errorHandler);

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log("Connected to MongoDB");
    app.listen(process.env.PORT || 5000, () => {
      console.log(`Server running on port ${process.env.PORT || 5000}`);
    });
  })
  .catch((err) => {
    console.error("Database connection failed:", err);
  });

module.exports = app;
