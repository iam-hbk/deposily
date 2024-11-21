"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useMutation } from "@tanstack/react-query";

const formSchema = z.object({
  first_name: z.string().min(2).max(50),
  last_name: z.string().min(2).max(50),
  email: z.string().email(),
  phone_number: z.string(),
  reference: z.string(),
});

interface NewPayerFormProps {
  reference: string | undefined;
  organizationId: number;
}

export function NewPayerForm({ reference, organizationId }: NewPayerFormProps) {
  const router = useRouter();
  const supabase = createClient();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      first_name: "",
      last_name: "",
      email: "",
      phone_number: "",
      reference: reference || "",
    },
  });

  const mutation = useMutation({
    mutationFn: async (values: z.infer<typeof formSchema>) => {
      // Check if reference already exists
      if (reference || values.reference) {
        const { data: existingRef } = await supabase
          .from("references")
          .select("*")
          .eq("reference_details", reference || values.reference)
          .eq("organization_id", organizationId)
          .single();

        if (existingRef) {
          throw new Error("This reference is already assigned to a payer");
        }
      }

      // Start a transaction
      await supabase.rpc("begin_transaction");

      try {
        // Create payer
        const { data: payer, error: payerError } = await supabase
          .from("payers")
          .insert({
            ...values,
          })
          .select()
          .single();

        if (payerError) throw payerError;

        // Create reference if provided
        if (reference || values.reference) {
          const { error: referenceError } = await supabase
            .from("references")
            .insert({
              payer_id: payer.user_id,
              organization_id: organizationId,
              reference_details: reference || values.reference,
            });

          if (referenceError) throw referenceError;
        }

        await supabase.rpc("commit_transaction");
        return payer;
      } catch (error) {
        await supabase.rpc("rollback_transaction");
        throw error;
      }
    },
    onSuccess: () => {
      toast.success("Payer created successfully");
      router.push(`/dashboard/organizations/${organizationId}`);
      router.refresh();
    },
    onError: (error) => {
      toast.error(
        error instanceof Error ? error.message : "Failed to create payer"
      );
      console.error(error);
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    mutation.mutate(values);
  }

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="grid grid-cols-2 gap-4"
      >
        <FormField
          control={form.control}
          name="first_name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>First name</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="last_name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Last name</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="phone_number"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Phone number</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="reference"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Reference</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" disabled={mutation.isPending}>
          {mutation.isPending ? "Creating..." : "Create Payer"}
        </Button>
      </form>
    </Form>
  );
}
