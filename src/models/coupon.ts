import mongoose from "mongoose";

const schema = new mongoose.Schema({
    code: {
        type: String,
        required: [true, "Please Enter The Coupon code"],
        unique: true
    },
    amount: {
        type: Number,
        required: [true, "Please Enter The Discount Amoount"]
    },
})

export const Coupon = mongoose.model("Coupon", schema)