import * as yup from "yup";

export const updateProfileSchema = yup.object({
  first_name: yup
    .string()
    .min(2, "Le prénom doit contenir au moins 2 caractères"),
  last_name: yup
    .string()
    .min(2, "Le nom doit contenir au moins 2 caractères"),
  phone: yup
    .string()
    .matches(/^[+]?[(]?[0-9]{1,4}[)]?[-\s.]?[(]?[0-9]{1,4}[)]?[-\s.]?[0-9]{1,9}$/, {
      message: "Numéro de téléphone invalide",
      excludeEmptyString: true,
    }),
  position: yup.string(),
  current_password: yup
    .string()
    .test(
      "required-with-new-password",
      "Le mot de passe actuel est requis pour changer le mot de passe",
      function (value) {
        const { new_password } = this.parent;
        if (new_password && !value) {
          return false;
        }
        return true;
      }
    ),
  new_password: yup
    .string()
    .test(
      "password-strength",
      "Le mot de passe doit contenir au moins 8 caractères, une majuscule, une minuscule, un chiffre et un caractère spécial",
      function (value) {
        if (!value) return true;
        const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
        return passwordRegex.test(value);
      }
    ),
}).partial();

export type UpdateProfileFormData = {
  first_name?: string;
  last_name?: string;
  phone?: string;
  position?: string;
  current_password?: string;
  new_password?: string;
  photo?: File;
};
