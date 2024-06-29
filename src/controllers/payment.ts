import { stripe } from "../app.js";
import { TryCatch } from "../middlewares/error.js";
import { Coupon } from "../models/coupon.js";
import ErrorHandler from "../utils/utility-class.js";

// USER CLICKS ON PAY NOW
export const createPaymentIntent = TryCatch(async (req, res, next) => {
  const { amount } = req.body;

  if (!amount)
    return next(new ErrorHandler("Please enter amount", 400));

  // check this
  // the amount which we are getting is in paisa so we multiply it by 100
  const paymentIntent = await stripe.paymentIntents.create({amount: Number(amount) * 100, currency: "inr"})

  return res.status(201).json({
    success: true,
    clientSecret: paymentIntent.client_secret,
  });
});

// TO CREATE NEW COUPON
export const newCoupon = TryCatch(async (req, res, next) => {
  const { coupon, amount } = req.body;

  if (!coupon || !amount)
    return next(new ErrorHandler("Please enter both coupon and amount", 400));

  await Coupon.create({ code: coupon, amount });

  return res.status(201).json({
    success: true,
    message: `Coupon ${coupon} Created Successfully`,
  });
});

// TO CHECK COUPON VALID OR NOT
export const applyDiscount = TryCatch(async (req, res, next) => {
  const { coupon } = req.query;

  const discount = await Coupon.findOne({ code: coupon });

  console.log(discount, "discount");

  if (!discount) return next(new ErrorHandler("Invalid coupon code", 400));

  return res.status(200).json({
    success: true,
    discount: discount.amount,
  });
});

// TO CHECK ADMIN ALL COUPON
// if want then do caching here
export const allCoupons = TryCatch(async (req, res, next) => {
  const coupons = await Coupon.find({});

  return res.status(200).json({
    success: true,
    coupons,
  });
});

// DELETE COUPON
export const deleteCoupon = TryCatch(async (req, res, next) => {
  const { id } = req.params;

  const coupon = await Coupon.findByIdAndDelete(id);

  if (!coupon) return next(new ErrorHandler("Invalid Coupon ID", 400));

  return res.status(200).json({
    success: true,
    message: `Coupon ${coupon.code} Deleted Successfully`,
  });
});
