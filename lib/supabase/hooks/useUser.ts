import { createClient } from "@/lib/supabase/client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { User } from "@supabase/supabase-js";

const supabase = createClient();
export function useUser() {
  const {
    data: user,
    isLoading,
    error,
  } = useQuery<User | null>({
    queryKey: ["user"],
    queryFn: async () => {
      const {
        data: { user },
        error,
      } = await supabase.auth.getUser();
      if (error) throw error;
      return user;
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 30, // 30 minutes
  });

  return {
    user,
    isLoading,
    error,
    isLoggedIn: !!user,
  };
}

export function useGetProfile(user: User) {
  if (!user) {
    throw new Error("User is not logged in");
  }

  return useQuery({
    queryKey: ["profile", user.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("first_name, last_name, phone")
        .eq("id", user?.id)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!user,
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 30, // 30 minutes
  });
}

export function useUpdateProfile(user: User) {
  const queryClient = useQueryClient();

  if (!user) {
    throw new Error("User is not logged in");
  }

  return useMutation({
    mutationFn: async (updatedProfile: {
      first_name: string;
      last_name: string;
    }) => {
      const { id, email } = user;
      if (!id || !email) {
        throw new Error("User ID or email is missing");
      }

      const { error } = await supabase.from("profiles").upsert({
        ...updatedProfile,
        id,
        email,
      });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["profile", user.id],
      });
      console.log("Profile updated successfully");
    },
    onError: (error) => {
      console.error("An error occurred while updating the profile", error);
    },
  });
}

export function useGetAnyAdminProfileById(id: string) {
  return useQuery({
    queryKey: ["profile", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("first_name, last_name, email")
        .eq("id", id)
        .eq("role", "admin")
        .single();

      if (error) throw error;
      return data;
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 30, // 30 minutes
  });
}
