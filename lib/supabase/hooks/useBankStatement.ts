import { createClient } from "@/lib/supabase/client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

const supabase = createClient();

export function useUploadBankStatement() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (file: File) => {
      const { data, error } = await supabase.storage
        .from("bank-statements")
        .upload(file.name, file);
      if (error) {
        throw error;
      }
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bank-statements"] });
    },
  });
}

export function useGetOrganizationBankStatements(organization_id: number) {
  return useQuery({
    queryKey: ["bank-statements", organization_id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("bank-statements")
        .select("*")
        .eq("organization_id", organization_id);
      if (error) {
        throw error;
      }
      return data;
    },
  });
}
