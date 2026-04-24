const mongoose = require("mongoose");

const interviewSchema = new mongoose.Schema(
    {
        application: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Application",
            required: true
        },
        slotOptions: [
            {
                type: Date,
                required: true
            }
        ],
        selectedSlot: {
            type: Date,
            default: null
        },
        interviewMode: {
            type: String,
            enum: ["Online", "Physical"],
            required: true
        },
        meetingLink: {
            type: String,
            default: ""
        },
        location: {
            type: String,
            default: ""
        },
        notes: {
            type: String,
            default: ""
        },
        status: {
            type: String,
            enum: ["Pending Student Selection", "Confirmed"],
            default: "Pending Student Selection"
        }
    },
    { timestamps: true }
);

module.exports = mongoose.model("Interview", interviewSchema);
