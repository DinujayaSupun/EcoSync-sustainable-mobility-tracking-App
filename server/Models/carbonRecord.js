const mongoose = require("mongoose");

const carbonRecordSchema = new mongoose.Schema(
    {
        userId: {
        type: String,
        required: true,
        },

        vehicleType: {
        type: String,
        required: true,
        enum: ["PETROL_CAR", "ELECTRIC_BIKE", "LUXURY_BUS", "TRAIN", "WALK"],
        },

        distance: {
        type: Number,
        required: true,
        min: 0,
        },

        emissionSaved: {
        type: Number,
        required: true,
        },

        date: {
        type: Date,
        default: Date.now,
        },
    },
    { timestamps: true }
);

module.exports = mongoose.model("CarbonRecord", carbonRecordSchema);