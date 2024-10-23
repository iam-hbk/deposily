"use client";

import React from "react";
import {
  FileText,
  FileImage,
  FileAudio,
  FileVideo,
  FileCode,
  FileArchive,
  FileSpreadsheet,
  File,
  type LucideIcon,
} from "lucide-react";

export type SupportedExtension =
  | "txt"
  | "doc"
  | "docx"
  | "jpg"
  | "jpeg"
  | "png"
  | "gif"
  | "svg"
  | "mp3"
  | "wav"
  | "ogg"
  | "mp4"
  | "avi"
  | "mov"
  | "js"
  | "ts"
  | "jsx"
  | "tsx"
  | "html"
  | "css"
  | "pdf"
  | "zip"
  | "rar"
  | "7z"
  | "xls"
  | "xlsx"
  | "csv";

interface FileIconProps {
  extension: SupportedExtension;
  size?: number;
  className?: string;
}

type FileTypeConfig = {
  icon: LucideIcon;
  color: string;
};

const fileTypeConfigs: Record<SupportedExtension, FileTypeConfig> = {
  txt: { icon: FileText, color: "text-gray-500" },
  doc: { icon: FileText, color: "text-blue-500" },
  docx: { icon: FileText, color: "text-blue-500" },
  jpg: { icon: FileImage, color: "text-pink-500" },
  jpeg: { icon: FileImage, color: "text-pink-500" },
  png: { icon: FileImage, color: "text-pink-500" },
  gif: { icon: FileImage, color: "text-pink-500" },
  svg: { icon: FileImage, color: "text-orange-500" },
  mp3: { icon: FileAudio, color: "text-purple-500" },
  wav: { icon: FileAudio, color: "text-purple-500" },
  ogg: { icon: FileAudio, color: "text-purple-500" },
  mp4: { icon: FileVideo, color: "text-indigo-500" },
  avi: { icon: FileVideo, color: "text-indigo-500" },
  mov: { icon: FileVideo, color: "text-indigo-500" },
  js: { icon: FileCode, color: "text-yellow-500" },
  ts: { icon: FileCode, color: "text-blue-500" },
  jsx: { icon: FileCode, color: "text-cyan-500" },
  tsx: { icon: FileCode, color: "text-cyan-500" },
  html: { icon: FileCode, color: "text-red-500" },
  css: { icon: FileCode, color: "text-blue-500" },
  pdf: { icon: FileText, color: "text-red-500" },
  zip: { icon: FileArchive, color: "text-yellow-500" },
  rar: { icon: FileArchive, color: "text-yellow-500" },
  "7z": { icon: FileArchive, color: "text-yellow-500" },
  xls: { icon: FileSpreadsheet, color: "text-green-500" },
  xlsx: { icon: FileSpreadsheet, color: "text-green-500" },
  csv: { icon: FileSpreadsheet, color: "text-green-500" },
};

export function FileIconComponent({
  extension,
  size = 24,
  className = "",
}: FileIconProps) {
  const fileConfig = fileTypeConfigs[extension] || {
    icon: File,
    color: "text-gray-500",
  };
  const IconComponent = fileConfig.icon;

  return (
    <IconComponent size={size} className={`${fileConfig.color} ${className}`} />
  );
}
