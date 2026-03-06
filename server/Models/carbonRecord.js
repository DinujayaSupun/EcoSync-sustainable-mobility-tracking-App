// const mongoose = require("mongoose");

// const carbonRecordSchema = new mongoose.Schema(
//   {
//     userId: {
//       type: String,
//       required: true,
//       index: true,
//     },

//     vehicleType: {
//       type: String,
//       required: true,
//       enum: ["PETROL_CAR", "ELECTRIC_BIKE", "LUXURY_BUS", "TRAIN", "WALK"],
//     },

//     distance: {
//       type: Number,
//       required: true,
//       min: 0,
//     },

    emissionSaved: {
      type: Number,
      required: true,
      min: 0,
    },
    emissionProduced: {
      type: Number,
    },
    efficiencyScore: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true },
);

module.exports = mongoose.model("CarbonRecord", carbonRecordSchema);
//     emissionSaved: {
//       type: Number,
//       required: true,
//       min: 0,
//     },
//   },
//   { timestamps: true }
// );



// module.exports = mongoose.model("CarbonRecord", carbonRecordSchema);
