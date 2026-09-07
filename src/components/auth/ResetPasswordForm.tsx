"use client";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import { useTranslations } from "next-intl";
import { useSearchParams } from "next/navigation";
import { Link, useRouter } from "@/i18n/navigation";
import Input from "@/components/form/input/InputField";
import Label from "@/components/form/Label";
import Button from "@/components/ui/button/Button";
import LanguageSwitcher from "@/components/header/LanguageSwitcher";
import { EyeCloseIcon, EyeIcon } from "@/icons";
import { useResetPasswordMutation } from "@/lib/services/authApi";
import { resetPasswordSchema, type ResetPasswordFormData } from "@/validations/authValidation";
import type { ApiError } from "@/types/auth";

export default function ResetPasswordForm() {
  const t = useTranslations("auth.resetPassword");
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const [resetPassword, { isLoading }] = useResetPasswordMutation();
  const [showPassword, setShowPassword] = useState(false);
  const [apiError, setApiError] = useState<string>("");
  const [success, setSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ResetPasswordFormData>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: yupResolver(resetPasswordSchema) as any,
    mode: "onSubmit",
  });

  const onSubmit = async (data: ResetPasswordFormData) => {
    if (!token) return;
    setApiError("");
    try {
      await resetPassword({ token, newPassword: data.newPassword }).unwrap();
      setSuccess(true);
      setTimeout(() => router.push("/signin"), 2000);
    } catch (error) {
      const err = error as ApiError;
      setApiError(err?.data?.message || t("genericError"));
    }
  };

  return (
    <div className="flex flex-col flex-1 lg:w-1/2 w-full">
      <div className="flex flex-col justify-center flex-1 w-full max-w-md mx-auto px-4 py-8">
        <div>
          <div className="mb-6 flex justify-end">
            <LanguageSwitcher />
          </div>
          <div className="mb-8">
            <h1 className="mb-2 font-semibold text-gray-800 text-title-sm dark:text-white/90 sm:text-title-md">
              {t("title")}
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {t("subtitle")}
            </p>
          </div>

          {!token ? (
            <div className="space-y-5">
              <div className="p-3 text-sm text-red-500 bg-red-50 dark:bg-red-900/20 rounded-lg">
                {t("missingToken")}
              </div>
              <Link
                href="/forgot-password"
                className="text-sm text-brand-500 hover:text-brand-600 dark:text-brand-400"
              >
                {t("requestNewLink")}
              </Link>
            </div>
          ) : success ? (
            <div className="space-y-5">
              <div className="p-3 text-sm text-success-600 bg-success-50 dark:bg-success-500/10 rounded-lg">
                {t("successMessage")}
              </div>
              <Link
                href="/signin"
                className="text-sm text-brand-500 hover:text-brand-600 dark:text-brand-400"
              >
                {t("backToSignin")}
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit(onSubmit)}>
              <div className="space-y-5">
                {apiError && (
                  <div className="p-3 text-sm text-red-500 bg-red-50 dark:bg-red-900/20 rounded-lg">
                    {apiError}
                  </div>
                )}
                <div>
                  <Label>
                    {t("newPassword")} <span className="text-error-500">*</span>{" "}
                  </Label>
                  <div className="relative">
                    <Input
                      type={showPassword ? "text" : "password"}
                      placeholder={t("newPasswordPlaceholder")}
                      {...register("newPassword")}
                    />
                    <span
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute z-30 -translate-y-1/2 cursor-pointer end-4 top-1/2"
                    >
                      {showPassword ? (
                        <EyeIcon className="text-gray-500 dark:text-gray-400" />
                      ) : (
                        <EyeCloseIcon className="text-gray-500 dark:text-gray-400" />
                      )}
                    </span>
                  </div>
                  {errors.newPassword && (
                    <p className="mt-1 text-sm text-red-500">{errors.newPassword.message}</p>
                  )}
                </div>
                <div>
                  <Label>
                    {t("confirmPassword")} <span className="text-error-500">*</span>{" "}
                  </Label>
                  <Input
                    type={showPassword ? "text" : "password"}
                    placeholder={t("confirmPasswordPlaceholder")}
                    {...register("confirmPassword")}
                  />
                  {errors.confirmPassword && (
                    <p className="mt-1 text-sm text-red-500">{errors.confirmPassword.message}</p>
                  )}
                </div>
                <div className="pt-2">
                  <Button className="w-full" size="sm" type="submit" disabled={isLoading}>
                    {isLoading ? t("submitting") : t("submit")}
                  </Button>
                </div>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
