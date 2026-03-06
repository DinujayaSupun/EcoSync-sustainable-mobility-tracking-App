require("dotenv").config();

const express = require("express");
const cors = require("cors");
const carbonRoutes = require("./Routes/carbon.routes");
const errorHandler = require("./middleware/error.middlewire");

const app = express();

app.use(cors());
app.use(express.json());

app.use("/api/carbon", carbonRoutes);

app.get("/", (req, res) => {
  res.send("Carbon Accounting Engine Backend Running 🚀");
});

app.use(errorHandler);

module.exports = app;
