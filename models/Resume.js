const mongoose = require("mongoose");

const ResumeSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
  },

  fileName: String,

  analysis: Object,

  createdAt: {
    type: Date,
    default: Date.now
  }
});

 module.exports = mongoose.model("Resume", ResumeSchema);