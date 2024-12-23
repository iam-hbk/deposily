import { createClient } from "./supabase/server";

export async function createPaymentNotification({
  userId,
  payerName,
  amount,
  organizationName,
}: {
  userId: string;
  payerName: string;
  amount: number;
  organizationName: string;
}) {
  const supabase = createClient();

  const { error } = await supabase.from("notifications").insert({
    user_id: userId,
    type: "payment",
    title: "New Payment Received",
    message: `${payerName} paid ${amount.toLocaleString("en-US", {
      style: "currency",
      currency: "ZAR",
    })} to ${organizationName}`,
    data: {
      payerName,
      amount,
      organizationName,
    },
  });

  if (error) {
    console.error("Error creating notification:", error);
    throw new Error("Failed to create notification");
  }
}
