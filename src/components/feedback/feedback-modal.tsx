"use client";

import { useState, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useSession } from "next-auth/react";
import { Bug, Lightbulb, MessageCircle, X, ImagePlus, Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalTitle,
  ModalDescription,
  ModalBody,
  ModalFooter,
} from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { useUser } from "@/contexts";
import { cn } from "@/lib/utils";

const feedbackSchema = z.object({
  type: z.enum(["bug", "suggestion", "other"]),
  description: z
    .string()
    .min(10)
    .max(2000),
});

type FeedbackFormData = z.infer<typeof feedbackSchema>;

interface FeedbackModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function FeedbackModal({ open, onOpenChange }: FeedbackModalProps) {
  const t = useTranslations("feedback");
  const tc = useTranslations("common");
  const { data: session } = useSession();
  const { profile } = useUser();
  const { success, error: showError } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const feedbackTypes = [
    { value: "bug", label: t("bug"), icon: Bug, color: "text-red-400" },
    { value: "suggestion", label: t("suggestion"), icon: Lightbulb, color: "text-amber-400" },
    { value: "other", label: t("other"), icon: MessageCircle, color: "text-blue-400" },
  ] as const;

  const [attachments, setAttachments] = useState<string[]>([]);
  const [uploadingFiles, setUploadingFiles] = useState<File[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const userName = profile?.name || session?.user?.name || "";
  const userEmail = session?.user?.email || "";

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = useForm<FeedbackFormData>({
    resolver: zodResolver(feedbackSchema),
    defaultValues: {
      type: "bug",
      description: "",
    },
  });

  const selectedType = watch("type");

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const remainingSlots = 3 - attachments.length;
    if (remainingSlots <= 0) {
      showError(tc("error"), t("maxAttachments"));
      return;
    }

    const filesToUpload = Array.from(files).slice(0, remainingSlots);

    for (const file of filesToUpload) {
      if (!file.type.startsWith("image/")) {
        showError(tc("error"), t("onlyImages"));
        continue;
      }

      if (file.size > 5 * 1024 * 1024) {
        showError(tc("error"), t("maxFileSize"));
        continue;
      }

      setUploadingFiles((prev) => [...prev, file]);

      try {
        const formData = new FormData();
        formData.append("file", file);

        const response = await fetch("/api/feedback/upload", {
          method: "POST",
          body: formData,
        });

        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error || t("uploadError"));
        }

        const data = await response.json();
        setAttachments((prev) => [...prev, data.url]);
      } catch (err) {
        showError(tc("error"), err instanceof Error ? err.message : tc("retry"));
      } finally {
        setUploadingFiles((prev) => prev.filter((f) => f !== file));
      }
    }

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const removeAttachment = (index: number) => {
    setAttachments((prev) => prev.filter((_, i) => i !== index));
  };

  const onSubmit = async (data: FeedbackFormData) => {
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...data,
          attachments,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || t("submitError"));
      }

      success(tc("success"), t("subtitle"));
      reset();
      setAttachments([]);
      onOpenChange(false);
    } catch (err) {
      showError(tc("error"), err instanceof Error ? err.message : tc("retry"));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    reset();
    setAttachments([]);
    onOpenChange(false);
  };

  return (
    <Modal open={open} onOpenChange={handleClose}>
      <ModalContent className="max-w-lg">
        <ModalHeader>
          <ModalTitle>{t("title")}</ModalTitle>
          <ModalDescription>
            {t("subtitle")}
          </ModalDescription>
        </ModalHeader>

        <form onSubmit={handleSubmit(onSubmit)}>
          <ModalBody className="space-y-6">
            {/* User info (read-only) */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1.5">
                  {t("nameLabel")}
                </label>
                <div className="h-11 px-4 flex items-center bg-white/5 rounded-xl text-gray-300">
                  {userName || t("userLabel")}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1.5">
                  {t("emailLabel")}
                </label>
                <div className="h-11 px-4 flex items-center bg-white/5 rounded-xl text-gray-300 truncate">
                  {userEmail}
                </div>
              </div>
            </div>

            {/* Feedback type selector */}
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">
                {t("feedbackType")}
              </label>
              <div className="grid grid-cols-3 gap-2">
                {feedbackTypes.map(({ value, label, icon: Icon, color }) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setValue("type", value)}
                    className={cn(
                      "flex flex-col items-center gap-2 p-3 rounded-xl border transition-all",
                      selectedType === value
                        ? "bg-white/10 border-[var(--color-primary)]"
                        : "bg-white/5 border-white/10 hover:bg-white/10"
                    )}
                  >
                    <Icon className={cn("w-5 h-5", color)} />
                    <span className="text-sm text-gray-300">{label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1.5">
                {t("descriptionLabel")}
              </label>
              <textarea
                {...register("description")}
                placeholder={
                  selectedType === "bug"
                    ? t("bugPlaceholder")
                    : selectedType === "suggestion"
                    ? t("suggestionPlaceholder")
                    : t("otherPlaceholder")
                }
                rows={4}
                className={cn(
                  "w-full px-4 py-3 bg-white/5 rounded-xl border transition-colors resize-none",
                  "placeholder:text-gray-500 text-gray-200",
                  "focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]",
                  errors.description ? "border-red-500" : "border-white/10"
                )}
              />
              {errors.description && (
                <p className="text-sm text-red-400 mt-1">
                  {errors.description.type === "too_small"
                    ? t("descriptionMinLength")
                    : errors.description.type === "too_big"
                    ? t("descriptionMaxLength")
                    : errors.description.message}
                </p>
              )}
              <p className="text-xs text-gray-500 mt-1">
                {watch("description")?.length || 0}/2000 {t("characters")}
              </p>
            </div>

            {/* Attachments */}
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">
                {t("attachments")}
              </label>

              {/* Attachment previews */}
              {attachments.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-3">
                  {attachments.map((url, index) => (
                    <div key={index} className="relative group">
                      <img
                        src={url}
                        alt={t("attachmentLabel", { index: index + 1 })}
                        className="w-16 h-16 object-cover rounded-lg border border-white/10"
                      />
                      <button
                        type="button"
                        onClick={() => removeAttachment(index)}
                        className="absolute -top-2 -right-2 p-1 bg-red-500 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="w-3 h-3 text-white" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Uploading indicators */}
              {uploadingFiles.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-3">
                  {uploadingFiles.map((file, index) => (
                    <div
                      key={index}
                      className="w-16 h-16 flex items-center justify-center bg-white/5 rounded-lg border border-white/10"
                    >
                      <Loader2 className="w-5 h-5 text-gray-400 animate-spin" />
                    </div>
                  ))}
                </div>
              )}

              {/* Upload button */}
              {attachments.length < 3 && (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadingFiles.length > 0}
                  className={cn(
                    "flex items-center gap-2 px-4 py-2 rounded-xl border border-dashed transition-colors",
                    "text-gray-400 hover:text-gray-300 hover:border-white/20",
                    uploadingFiles.length > 0 && "opacity-50 cursor-not-allowed"
                  )}
                >
                  <ImagePlus className="w-4 h-4" />
                  <span className="text-sm">{t("addImage")}</span>
                </button>
              )}

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                onChange={handleFileSelect}
                className="hidden"
              />

              <p className="text-xs text-gray-500 mt-2">
                {t("attachmentHint")}
              </p>
            </div>
          </ModalBody>

          <ModalFooter>
            <Button
              type="button"
              variant="secondary"
              onClick={handleClose}
              disabled={isSubmitting}
            >
              {tc("cancel")}
            </Button>
            <Button
              type="submit"
              isLoading={isSubmitting}
              disabled={uploadingFiles.length > 0}
            >
              {t("sendFeedbackButton")}
            </Button>
          </ModalFooter>
        </form>
      </ModalContent>
    </Modal>
  );
}
