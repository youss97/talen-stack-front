"use client";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import Input from "@/components/form/input/InputField";
import Label from "@/components/form/Label";
import Button from "@/components/ui/button/Button";
import LanguageSwitcher from "@/components/header/LanguageSwitcher";
import { useForgotPasswordMutation } from "@/lib/services/authApi";
import { forgotPasswordSchema, type ForgotPasswordFormData } from "@/validations/authValidation";

export default function ForgotPasswordForm() {
  const t = useTranslations("auth.forgotPassword");
  const [forgotPassword, { isLoading }] = useForgotPasswordMutation();
  const [apiError, setApiError] = useState<string>("");
  const [sent, setSent] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordFormData>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: yupResolver(forgotPasswordSchema) as any,
    mode: "onSubmit",
  });

  const onSubmit = async (data: ForgotPasswordFormData) => {
    setApiError("");
    try {
      await forgotPassword(data).unwrap();
      setSent(true);
    } catch {
      setApiError(t("genericError"));
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

          {sent ? (
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
                    {t("email")} <span className="text-error-500">*</span>{" "}
                  </Label>
                  <Input
                    placeholder="info@gmail.com"
                    type="email"
                    {...register("email")}
                  />
                  {errors.email && (
                    <p className="mt-1 text-sm text-red-500">{errors.email.message}</p>
                  )}
                </div>
                <div className="pt-2">
                  <Button className="w-full" size="sm" type="submit" disabled={isLoading}>
                    {isLoading ? t("submitting") : t("submit")}
                  </Button>
                </div>
                <div className="flex items-center justify-center">
                  <Link
                    href="/signin"
                    className="text-sm text-brand-500 hover:text-brand-600 dark:text-brand-400"
                  >
                    {t("backToSignin")}
                  </Link>
                </div>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
