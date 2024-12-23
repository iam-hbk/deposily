import { createClient } from "@/lib/supabase/server";
import NotificationsDropdown from "./notifications-dropdown";
import { type Notification } from "./notifications-dropdown";

const getNotifications = async (userId: string) => {
  const supabase = createClient();
  const { data: notifications } = await supabase
    .from("notifications")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(10);

  return (notifications || []).map(n => ({
    ...n,
    read: n.read ?? false,
    data: n.data || {},
  })) as Notification[];
};

export default async function NotificationsDropdownWrapper({
  userId,
}: {
  userId: string;
}) {
  const notifications = await getNotifications(userId);
  
  return (
    <NotificationsDropdown 
      notifications={notifications} 
      userId={userId} 
    />
  );
} 