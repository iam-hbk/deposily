"use client";

import React, { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { UploadCloud } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useUser } from "@/lib/supabase/hooks/useUser";
import Link from "next/link";
import { v4 as uuidv4 } from "uuid";
import { toast } from "sonner";
interface FileUploadProps {
  organizationId: number;
  organization_created_by: string;
  organization_name: string;
}

const supabase = createClient();

export function FileUpload({
  organizationId,
  organization_created_by,
  organization_name,
}: FileUploadProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileName, setFileName] = useState("");
  const [fileExt, setFileExt] = useState("");
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const { user } = useUser();
  const queryClient = useQueryClient();

  const uploadFile = async () => {
    if (!user || !selectedFile) {
      throw new Error("User is not logged in or no file selected");
    }

    const fileExt = selectedFile.name.split(".").pop();
    const filePath =
      `${organization_created_by}/${organizationId}-${organization_name}/${fileName || uuidv4()}.${fileExt}`
        .trimStart()
        .replace(/[^a-z0-9_.-\/]/gi, "-");

    const { error: uploadError, data } = await supabase.storage
      .from("organization-files")
      .upload(filePath, selectedFile, {
        cacheControl: "3600",
        upsert: false,
        metadata: {
          organization_id: organizationId.toString(),
          uploaded_by: user.id,
          uploaded_at: new Date().toISOString(),
          original_name: selectedFile.name,
        },
      });

    if (uploadError) {
      throw new Error("Error uploading file");
    }

    const {
      data: { publicUrl },
    } = supabase.storage.from("organization-files").getPublicUrl(data.path);

    if (!publicUrl) {
      throw new Error("Error getting public URL");
    }

    const { error: insertError } = await supabase
      .from("bank-statements")
      .insert({
        file_path: publicUrl,
        file_type: selectedFile.type,
        organization_id: organizationId,
        processed: false,
        uploaded_at: new Date().toISOString(),
        uploaded_by: user.id,
      });

    if (insertError) {
      throw new Error("Error inserting record");
    }

    return "File uploaded successfully";
  };

  const mutation = useMutation({
    mutationFn: uploadFile,
    onSuccess: () => {
      toast.success("File uploaded successfully");
      queryClient.invalidateQueries({
        queryKey: ["bank-statements", organizationId],
      });
      handleClose();
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      setSelectedFile(acceptedFiles[0]);
      setFileName(acceptedFiles[0].name.split(".").shift() || "");
      setFileExt(acceptedFiles[0].name.split(".").pop() || "");
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop });

  const handleClose = () => {
    setIsOpen(false);
    setSelectedFile(null);
    setFileName("");
    setFileExt("");
    setUploadProgress(0);
  };

  const handleUpload = () => {
    if (selectedFile) {
      mutation.mutate();
    } else {
      toast.error("Please select a file first");
    }
  };

  if (!user) {
    return (
      <Button asChild>
        <Link href="/sign-in">Please login to upload files</Link>
      </Button>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
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
            {selectedFile && (
              <div className="mt-4 flex flex-row items-center">
                <Input
                  id="fileName"
                  value={fileName}
                  onChange={(e) => setFileName(e.target.value)}
                  className="mt-1"
                />
                <span className="mx-2 text-gray-500">.{fileExt}</span>
              </div>
            )}
            {uploadProgress > 0 && (
              <Progress value={uploadProgress} className="mt-4" />
            )}
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button onClick={handleClose} variant="outline">
              Cancel
            </Button>
            <Button
              onClick={handleUpload}
              disabled={!selectedFile || mutation.isPending}
            >
              {mutation.isPending ? "Uploading..." : "Upload"}
            </Button>
          </CardFooter>
        </Card>
      </DialogContent>
    </Dialog>
  );
}
