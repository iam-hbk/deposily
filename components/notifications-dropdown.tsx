"use client";

import { Bell, Check } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { formatDistanceToNow } from "date-fns";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

export type NotificationData = {
  payerName?: string;
  amount?: number;
  organizationName?: string;
};

export type Notification = {
  id: string;
  title: string;
  message: string;
  type: "payment" | "system" | "organization";
  read: boolean;
  data: NotificationData;
  created_at: string;
};

const NOTIFICATIONS_QUERY_KEY = (userId: string) =>
  ["notifications", userId] as const;

async function fetchNotifications(userId: string) {
  const response = await fetch(`/api/notifications?userId=${userId}`);
  if (!response.ok) {
    throw new Error("Failed to fetch notifications");
  }
  return response.json();
}

async function markAsRead(id: string) {
  const response = await fetch("/api/notifications/mark-as-read", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ id }),
  });
  if (!response.ok) {
    throw new Error("Failed to mark notification as read");
  }
  return response.json();
}

function NotificationsList({
  notifications,
  userId,
}: {
  notifications: Notification[];
  userId: string;
}) {
  const queryClient = useQueryClient();
  const markAsReadMutation = useMutation<
    void,
    Error,
    string,
    { previousNotifications: Notification[] | undefined }
  >({
    mutationFn: markAsRead,
    onMutate: async (id) => {
      await queryClient.cancelQueries({
        queryKey: NOTIFICATIONS_QUERY_KEY(userId),
      });
      const previousNotifications = queryClient.getQueryData<Notification[]>(
        NOTIFICATIONS_QUERY_KEY(userId)
      );
      queryClient.setQueryData<Notification[]>(
        NOTIFICATIONS_QUERY_KEY(userId),
        (old = []) =>
          old.map((notification) =>
            notification.id === id
              ? { ...notification, read: true }
              : notification
          )
      );
      return { previousNotifications };
    },
    onError: (err, id, context) => {
      if (context) {
        queryClient.setQueryData(
          NOTIFICATIONS_QUERY_KEY(userId),
          context.previousNotifications
        );
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({
        queryKey: NOTIFICATIONS_QUERY_KEY(userId),
      });
    },
  });

  return (
    <ScrollArea className="h-[300px]">
      {notifications.length === 0 ? (
        <div className="p-4 text-center text-sm text-gray-500">
          No notifications
        </div>
      ) : (
        <div className="divide-y">
          {notifications.map((notification) => (
            <div
              key={notification.id}
              className={`p-4 ${!notification.read ? "bg-muted/50" : ""}`}
            >
              <div className="flex justify-between gap-4">
                <div>
                  <p className="text-sm font-medium">{notification.title}</p>
                  <p className="text-sm text-gray-500">
                    {notification.message}
                  </p>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <p className="text-xs text-gray-500">
                    {formatDistanceToNow(new Date(notification.created_at), {
                      addSuffix: true,
                    })}
                  </p>
                  {!notification.read && (
                    <Button
                      onClick={() => markAsReadMutation.mutate(notification.id)}
                      variant="ghost"
                      size="sm"
                      className="h-6 px-2"
                      disabled={markAsReadMutation.isPending}
                    >
                      <Check className="h-3 w-3 mr-4" /> Read
                    </Button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </ScrollArea>
  );
}

export default function NotificationsDropdown({
  notifications: initialNotifications = [],
  userId,
}: {
  notifications: Notification[];
  userId: string;
}) {
  const [open, setOpen] = useState(false);
  const { data: notifications = initialNotifications } = useQuery<
    Notification[]
  >({
    queryKey: NOTIFICATIONS_QUERY_KEY(userId),
    queryFn: () => fetchNotifications(userId),
    enabled: true,
    // staleTime: 30000,
    // refetchOnWindowFocus: false,
  });

  const unreadCount = notifications.filter(
    (notification: Notification) => !notification.read
  ).length;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative"
          aria-label="Open notifications"
        >
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-red-500 text-white text-xs flex items-center justify-center">
              {unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[400px] p-0" align="end">
        <div className="flex items-center justify-between p-4 border-b">
          <h4 className="font-semibold">Notifications</h4>
        </div>
        <NotificationsList notifications={notifications} userId={userId} />
      </PopoverContent>
    </Popover>
  );
}
