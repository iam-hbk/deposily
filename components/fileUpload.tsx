"use client";

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

const schema = z.object({
  fileName: z.string().min(1, "File name is required"),
  processFile: z.boolean().default(true),
  file: z.instanceof(File).nullable(),
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
      file: null,
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

      const xhr = new XMLHttpRequest();
      return new Promise((resolve, reject) => {
        xhr.upload.addEventListener("progress", (event) => {
          if (event.lengthComputable) {
            const percentComplete = (event.loaded / event.total) * 100;
            setUploadProgress(percentComplete);
          }
        });

        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            resolve(JSON.parse(xhr.responseText));
          } else {
            reject(new Error(xhr.statusText));
          }
        };

        xhr.onerror = () => reject(new Error("Network Error"));

        xhr.open("POST", `/api/organizations/${organizationId}/statements`);
        xhr.send(formData);
      });
    },
    onSuccess: () => {
      toast.success("File uploaded successfully", {
        description:
          "You will be redirected to the extracted transactions page.",
        dismissible: true,
        duration: 10000,
      });
      handleClose();
      // Invalidate and refetch
      queryClient.invalidateQueries({
        queryKey: ["statements", organizationId],
      });
      // navigate to the organization main page
      router.push(`/dashboard/organizations/${organizationId}`);
    },
    onError: (error) => {
      toast.error(
        error instanceof Error ? error.message : "Failed to upload file"
      );
    },
  });

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      if (acceptedFiles.length > 0) {
        const file = acceptedFiles[0];
        const nameWithoutExt = file.name.split(".").slice(0, -1).join(".");
        form.setValue("file", file);
        form.setValue("fileName", nameWithoutExt);
      }
    },
    [form]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop });

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
      <Button asChild>
        <Link href="/sign-in">Please login to upload files</Link>
      </Button>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !uploadMutation.isPending && setIsOpen(open)}>
      <DialogTrigger asChild>
        <Button>
          <UploadCloud className="mr-2 w-4 h-4" /> Upload Bank Statement
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Upload Bank Statement</DialogTitle>
          <DialogDescription>
            Drag and drop a file or click to select one.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <Card className="w-full mx-auto border-0 shadow-none">
              <CardContent>
                <div
                  {...getRootProps()}
                  className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer ${
                    isDragActive ? "border-primary" : "border-gray-300"
                  }`}
                >
                  <input {...getInputProps()} />
                  <UploadCloud className="mx-auto h-8 w-8 text-gray-400" />
                  <p className="mt-2 text-sm text-gray-600">
                    {isDragActive
                      ? "Drop the file here"
                      : "Drag 'n' drop a file here, or click to select a file"}
                  </p>
                </div>
                {form.watch("file") && (
                  <div className="flex flex-col space-y-4 items-stretch justify-center">
                    <FormField
                      control={form.control}
                      name="fileName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>File Name</FormLabel>
                          <FormControl>
                            <Input {...field} className="mt-1" />
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
                            <label className="flex flex-row items-start space-x-2 rounded-md border border-destructive bg-destructive/5 p-4 cursor-pointer">
                              <Checkbox
                                checked={field.value}
                                onCheckedChange={field.onChange}
                                className="mt-1"
                              />
                              <div className="space-y-1 leading-none">
                                <FormLabel className="font-normal">
                                  Immediately process this file
                                </FormLabel>
                                <FormDescription>
                                  This will trigger the processing of the file
                                  immediately after upload and extraction of
                                  transactions will begin. It may take a few
                                  minutes to complete.
                                </FormDescription>
                              </div>
                            </label>
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </div>
                )}
                {uploadMutation.isPending && (
                  <div className="mt-4">
                    <Progress value={uploadProgress} className="w-full" />
                    <p className="text-sm text-center mt-2">
                      {uploadProgress < 100
                        ? `Uploading: ${Math.round(uploadProgress)}%`
                        : "Processing file... This may take a few minutes."}
                    </p>
                    <p className="text-xs text-center mt-1 text-muted-foreground">
                      Please keep this window open. We&apos;ll let you know when it&apos;s done!
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
                      <Loader className="mr-2 w-4 h-4 animate-spin" />{" "}
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
