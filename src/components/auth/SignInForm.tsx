"use client";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import { useRouter } from "next/navigation";
import Input from "@/components/form/input/InputField";
import Label from "@/components/form/Label";
import Button from "@/components/ui/button/Button";
import { EyeCloseIcon, EyeIcon } from "@/icons";
import { useLoginMutation } from "@/lib/services/authApi";
import { loginSchema } from "@/validations/authValidation";
import type { ApiError } from "@/types/auth";

interface LoginFormInputs {
  email: string;
  password: string;
}

export default function SignInForm() {
  const router = useRouter();
  const [login, { isLoading }] = useLoginMutation();

  const [showPassword, setShowPassword] = useState(false);
  const [apiError, setApiError] = useState<string>("");

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormInputs>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: yupResolver(loginSchema) as any,
    mode: "onSubmit",
  });

  const onSubmit = async (data: LoginFormInputs) => {
    setApiError("");

    try {
      const response = await login(data).unwrap();
      console.log('🔐 Connexion réussie:', response);

      // Si l'utilisateur est un client manager, rediriger vers "Mes offres"
      const userRoleCode = response.user?.role?.code;
      if (userRoleCode?.startsWith('CLIENT_MANAGER_')) {
        console.log('👤 Client Manager détecté, redirection vers /my-requests');
        router.push('/my-requests');
        return;
      }

      // Sinon, rediriger vers le premier chemin autorisé ou dashboard par défaut
      const firstFeaturePath = response.user?.features?.[0]?.pages?.[0]?.path;
      const redirectPath = firstFeaturePath || "/dashboard";
      
      console.log('🎯 Redirection vers:', redirectPath);
      
      // S'assurer que la redirection va vers l'application admin
      const adminPath = redirectPath.startsWith('/') ? redirectPath : `/${redirectPath}`;
      router.push(adminPath);
    } catch (error) {
      const err = error as ApiError;
      console.error('❌ Erreur de connexion:', err);
      setApiError(err?.data?.message || "Échec de la connexion. Veuillez vérifier vos identifiants.");
    }
  };

  return (
    <div className="flex flex-col flex-1 lg:w-1/2 w-full">
      <div className="flex flex-col justify-center flex-1 w-full max-w-md mx-auto px-4 py-8">
        <div>
          <div className="mb-8">
            <h1 className="mb-2 font-semibold text-gray-800 text-title-sm dark:text-white/90 sm:text-title-md">
              Connexion
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Entrez votre email et mot de passe pour vous connecter
            </p>
          </div>
          <div>
            <form onSubmit={handleSubmit(onSubmit)}>
              <div className="space-y-5">
                {apiError && (
                  <div className="p-3 text-sm text-red-500 bg-red-50 dark:bg-red-900/20 rounded-lg">
                    {apiError}
                  </div>
                )}
                <div>
                  <Label>
                    Email <span className="text-error-500">*</span>{" "}
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
                <div>
                  <Label>
                    Mot de passe <span className="text-error-500">*</span>{" "}
                  </Label>
                  <div className="relative">
                    <Input
                      type={showPassword ? "text" : "password"}
                      placeholder="Entrez votre mot de passe"
                      {...register("password")}
                    />
                    <span
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute z-30 -translate-y-1/2 cursor-pointer right-4 top-1/2"
                    >
                      {showPassword ? (
                        <EyeIcon className="fill-gray-500 dark:fill-gray-400" />
                      ) : (
                        <EyeCloseIcon className="fill-gray-500 dark:fill-gray-400" />
                      )}
                    </span>
                  </div>
                  {errors.password && (
                    <p className="mt-1 text-sm text-red-500">{errors.password.message}</p>
                  )}
                </div>
                {/* <div className="flex items-center justify-end">
                  <Link
                    href="/reset-password"
                    className="text-sm text-brand-500 hover:text-brand-600 dark:text-brand-400"
                  >
                    Mot de passe oublié ?
                  </Link>
                </div> */}
                <div className="pt-2">
                  <Button className="w-full" size="sm" type="submit" disabled={isLoading}>
                    {isLoading ? "Connexion..." : "Se connecter"}
                  </Button>
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
