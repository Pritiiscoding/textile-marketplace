import "dotenv/config";
import { Resend } from "resend";

export const sendEmail = async ({ to, subject, html, text }) => {
  const apiKey = process.env.RESEND_API_KEY;

  if (!apiKey) {
    console.log("❌ RESEND_API_KEY is missing - email will be skipped");
    return { success: false, error: "Missing API key", mocked: true };
  }

  const resend = new Resend(apiKey);

  try {
    const { data, error } = await resend.emails.send({
      from: process.env.EMAIL_FROM || "onboarding@resend.dev",
      to: [to],
      subject,
      html: html || `<p>${text}</p>`,
    });

    console.log("Resend Response:", data);

    if (error) {
      console.error("Resend Error:", error);
      return { success: false, error, mocked: true };
    }

    return { success: true, data };
  } catch (err) {
    console.error("Exception:", err);
    return { success: false, error: err.message, mocked: true };
  }
};

export const sendOrderPlacedEmail = async (supplierEmail, order) => {
  return sendEmail({
    to: supplierEmail,
    subject: `New Bulk Order Received #${order._id.toString().slice(-6)}`,
    html: `
      <h2>New Order Received!</h2>
      <p>Order ID: <strong>#${order._id}</strong></p>
      <p>Total Amount: <strong>$${order.totalAmount}</strong></p>
      <p>Items count: <strong>${order.items.length}</strong></p>
      <p>Please log in to your supplier dashboard to accept and process this order.</p>
    `,
    text: `New order #${order._id} received with total amount $${order.totalAmount}.`,
  });
};

export const sendOrderStatusEmail = async (buyerEmail, order, status) => {
  const statusTitle = status.toUpperCase().replace(/_/g, " ");
  return sendEmail({
    to: buyerEmail,
    subject: `Order Update #${order._id.toString().slice(-6)} - ${statusTitle}`,
    html: `
      <h2>Order Status Updated</h2>
      <p>Your order <strong>#${order._id}</strong> status has changed to: <strong>${statusTitle}</strong>.</p>
      <p>Check your buyer portal for live tracking and updates.</p>
    `,
    text: `Your order #${order._id} status is now ${statusTitle}.`,
  });
};
