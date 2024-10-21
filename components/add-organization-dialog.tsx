"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, MoveRight, Plus } from "lucide-react";
import { toast } from "sonner";
import { TablesInsert } from "@/lib/supabase/database.types";

const organizationSchema = z.object({
  name: z.string().min(2, {
    message: "Organization name must be at least 2 characters.",
  }),
  type: z.enum(["educational", "non-profit", "corporate", "government"], {
    required_error: "Please select an organization type.",
  }),
});

type OrganizationForm = z.infer<typeof organizationSchema>;

export function AddOrganizationModal() {
  const [open, setOpen] = useState(false);
  const supabase = createClient();
  const queryClient = useQueryClient();

  const form = useForm<OrganizationForm>({
    resolver: zodResolver(organizationSchema),
    defaultValues: {
      name: "",
      type: undefined,
    },
  });

  const createOrganization = async (data: OrganizationForm) => {
    const newOrg: TablesInsert<"organizations"> = {
      name: data.name,
      type: data.type,
      // Other fields will be automatically handled by Supabase
    };

    const { data: createdOrg, error } = await supabase
      .from("organizations")
      .insert([newOrg])
      .select();

    if (error) throw error;
    return createdOrg[0];
  };

  const mutation = useMutation({
    mutationFn: createOrganization,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["organizations"] });
      setOpen(false);
      form.reset();
      toast.success("Organization created", {
        description: "Your new organization has been successfully created.",
      });
      console.log("Organization created:", data);
    },
    onError: (error) => {
      toast.error("Error", {
        description:
          "There was an error creating the organization. Please try again.",
      });
      console.error("Error creating organization:", error);
    },
  });

  const onSubmit = (data: OrganizationForm) => {
    mutation.mutate(data);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="self-end" variant="outline">
          <Plus className="mr-2 h-4 w-4" /> New Organization
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Create New Organization</DialogTitle>
          <DialogDescription>
            Enter the details for your new organization
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Type</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select organization type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="educational">Educational</SelectItem>
                      <SelectItem value="non-profit">Non-Profit</SelectItem>
                      <SelectItem value="corporate">Corporate</SelectItem>
                      <SelectItem value="government">Government</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="submit" disabled={mutation.isPending}>
                {mutation.isPending ? (
                  <>
                    <Loader2 className="animate-spin mr-2 h-4 w-4" />
                    Creating
                  </>
                ) : (
                  <>
                    Create Organization
                    <MoveRight className="ml-2 h-4 w-4" />
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
