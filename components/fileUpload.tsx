"use client";
import { FileRejection } from "react-dropzone";
import React, { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader, UploadCloud } from "lucide-react";
import { useUser } from "@/lib/supabase/hooks/useUser";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Progress } from "@/components/ui/progress";

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_FILE_TYPES = [
  "application/pdf",
  "text/csv",
  "application/vnd.ms-excel",
];

const schema = z.object({
  fileName: z.string().min(1, "File name is required"),
  processFile: z.boolean().default(true),
  file: z
    .custom<File>((file) => file instanceof File, "Please select a file")
    .refine(
      (file) => file.size <= MAX_FILE_SIZE,
      `File size should be less than ${MAX_FILE_SIZE / 1024 / 1024}MB`
    )
    .refine(
      (file) => ALLOWED_FILE_TYPES.includes(file.type),
      "File type not supported. Please upload a PDF, CSV, or Excel file"
    ),
});

type FormData = z.infer<typeof schema>;

interface FileUploadProps {
  organizationId: number;
}

export function FileUpload({ organizationId }: FileUploadProps) {
  const [isOpen, setIsOpen] = useState(false);
  const { user } = useUser();
  const queryClient = useQueryClient();
  const router = useRouter();
  const [uploadProgress, setUploadProgress] = useState(0);

  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      fileName: "",
      processFile: false,
      file: undefined,
    },
  });

  const uploadMutation = useMutation({
    mutationFn: async (data: FormData) => {
      if (!data.file || !user) {
        throw new Error("Please select a file and ensure you're logged in");
      }

      const formData = new FormData();
      formData.append("file", data.file);
      formData.append("fileName", data.fileName);
      formData.append("processFile", data.processFile.toString());
      formData.append("orgCreatedBy", user.id);
      formData.append("orgName", user.email || "");

      try {
        const response = await fetch(
          `/api/organizations/${organizationId}/statements`,
          {
            method: "POST",
            body: formData,
          }
        );

        if (!response.ok) {
          throw new Error(`Upload failed: ${response.statusText}`);
        }
        return await response.json();
      } catch (error) {
        console.error("Upload error:", error);
        throw error;
      }
    },
    onSuccess: () => {
      toast.success("File uploaded successfully", {
        description:
          "You will be redirected to the extracted transactions page.",
        dismissible: true,
        duration: 10000,
      });
      handleClose();
      queryClient.invalidateQueries({
        queryKey: ["statements", organizationId],
      });
      router.push(`/dashboard/organizations/${organizationId}`);
    },
    onError: (error) => {
      console.log("the error is here", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to upload file"
      );
    },
  });

  const onDrop = useCallback(
    (acceptedFiles: File[], fileRejections: FileRejection[]) => {
      if (fileRejections.length > 0) {
        const errors = fileRejections.map(
          (rejection) =>
            `${rejection.file.name}: ${rejection.errors.map((e) => e.message).join(", ")}`
        );

        toast.error("File not accepted", {
          description: errors.join("\n"),
        });
        return;
      }

      if (acceptedFiles.length > 0) {
        const file = acceptedFiles[0];
        const nameWithoutExt = file.name.split(".").slice(0, -1).join(".");
        form.setValue("file", file);
        form.setValue("fileName", nameWithoutExt);
      }
    },
    [form]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    maxSize: MAX_FILE_SIZE,
    accept: {
      "application/pdf": [".pdf"],
      "text/csv": [".csv"],
      "application/vnd.ms-excel": [".xls", ".xlsx"],
    },
    maxFiles: 1,
  });

  const handleClose = () => {
    if (!uploadMutation.isPending) {
      setIsOpen(false);
      form.reset();
      setUploadProgress(0);
    }
  };

  const onSubmit = (data: FormData) => {
    uploadMutation.mutate(data);
  };

  if (!user) {
    return (
      <Button asChild variant="secondary">
        <Link href="/sign-in">Sign in to upload files</Link>
      </Button>
    );
  }

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => !uploadMutation.isPending && setIsOpen(open)}
    >
      <DialogTrigger asChild>
        <Button>
          <UploadCloud className="mr-2 w-4 h-4" /> Upload Bank Statement
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Upload Bank Statement</DialogTitle>
          <DialogDescription>
            Upload a PDF, CSV, or Excel file (max {MAX_FILE_SIZE / 1024 / 1024}
            MB)
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <Card className="w-full mx-auto border-0 shadow-none">
              <CardContent className="space-y-4">
                <div
                  {...getRootProps()}
                  className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
                    isDragActive
                      ? "border-primary bg-primary/5"
                      : "border-gray-300 hover:border-primary/50"
                  }`}
                >
                  <input {...getInputProps()} />
                  <UploadCloud className="mx-auto h-8 w-8 text-gray-400" />
                  <p className="mt-2 text-sm text-gray-600">
                    {isDragActive
                      ? "Drop the file here"
                      : "Drag and drop a file here, or click to select"}
                  </p>
                  <p className="mt-1 text-xs text-gray-500">
                    Supported formats: PDF, CSV, Excel
                  </p>
                </div>

                {form.watch("file") && (
                  <>
                    <FormField
                      control={form.control}
                      name="fileName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>File Name</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="processFile"
                      render={({ field }) => (
                        <FormItem className="space-y-0">
                          <FormControl>
                            <label className="flex flex-row items-start space-x-3 rounded-md border p-4 cursor-pointer hover:bg-accent">
                              <Checkbox
                                checked={field.value}
                                onCheckedChange={field.onChange}
                                className="mt-1"
                              />
                              <div className="space-y-1 leading-none">
                                <FormLabel className="font-normal">
                                  Process file immediately
                                </FormLabel>
                                <FormDescription>
                                  Extract transactions automatically after
                                  upload (may take a few minutes)
                                </FormDescription>
                              </div>
                            </label>
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </>
                )}

                {uploadMutation.isPending && (
                  <div className="space-y-2">
                    <Progress value={uploadProgress} className="w-full" />
                    <p className="text-sm text-center">
                      {uploadProgress < 100
                        ? `Uploading: ${uploadProgress}%`
                        : "Processing file..."}
                    </p>
                    <p className="text-xs text-center text-muted-foreground">
                      Please keep this window open
                    </p>
                  </div>
                )}
              </CardContent>

              <CardFooter className="flex justify-between">
                <Button
                  type="button"
                  onClick={handleClose}
                  variant="outline"
                  disabled={uploadMutation.isPending}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={!form.watch("file") || uploadMutation.isPending}
                >
                  {uploadMutation.isPending ? (
                    <>
                      <Loader className="mr-2 w-4 h-4 animate-spin" />
                      {uploadProgress < 100 ? "Uploading..." : "Processing..."}
                    </>
                  ) : (
                    "Upload"
                  )}
                </Button>
              </CardFooter>
            </Card>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
