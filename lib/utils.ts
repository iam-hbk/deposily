import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { redirect } from "next/navigation";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Redirects to a specified path with an encoded message as a query parameter.
 * @param {('error' | 'success')} type - The type of message, either 'error' or 'success'.
 * @param {string} path - The path to redirect to.
 * @param {string} message - The message to be encoded and added as a query parameter.
 * @returns {never} This function doesn't return as it triggers a redirect.
 */
export function encodedRedirect(
  type: "error" | "success",
  path: string,
  message: string
) {
  return redirect(`${path}?${type}=${encodeURIComponent(message)}`);
}

// export function generatePayerData(count: number = 10): Array<
//   Database["public"]["Tables"]["payers"]["Row"] & {
//     lastPaymentDate: Date | null;
//     paymentStatus: "paid" | "pending" | "owing";
//   }
// > {
//   const statuses: Array<"paid" | "pending" | "owing"> = [
//     "paid",
//     "pending",
//     "owing",
//   ];

//   return Array.from({ length: count }, () => {
//     // Random date within last 30 days or null (20% chance of null)
//     const lastPaymentDate =
//       Math.random() > 0.2
//         ? new Date(
//             Date.now() - Math.floor(Math.random() * 30) * 24 * 60 * 60 * 1000
//           )
//         : null;

//     // 30% chance of null last name
//     const lastName =
//       Math.random() > 0.3
//         ? [
//             "Smith",
//             "Johnson",
//             "Williams",
//             "Brown",
//             "Jones",
//             "Garcia",
//             "Miller",
//             "Davis",
//           ][Math.floor(Math.random() * 8)]
//         : null;

//     return {
//       email: `user${Math.floor(Math.random() * 10000)}@example.com`,
//       first_name: [
//         "James",
//         "Mary",
//         "John",
//         "Patricia",
//         "Robert",
//         "Jennifer",
//         "Michael",
//         "Linda",
//       ][Math.floor(Math.random() * 8)],
//       last_name: lastName,
//       phone_number: `+1${Math.floor(Math.random() * 900 + 100)}${Math.floor(Math.random() * 900 + 100)}${Math.floor(Math.random() * 9000 + 1000)}`,
//       user_id: `usr_${Math.random().toString(36).substring(2, 15)}`,
//       lastPaymentDate,
//       paymentStatus: statuses[Math.floor(Math.random() * statuses.length)],
//     };
//   });
// }
