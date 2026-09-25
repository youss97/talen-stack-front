import * as yup from 'yup';

export const loginSchema = yup.object().shape({
  // Login/identifiant de connexion — plus nécessairement une adresse email valide (séparation
  // login/email : un login peut être "youssefmehri+hutchinson" par ex.), donc pas de .email().
  email: yup
    .string()
    .trim()
    .required('Login is required'),
  password: yup
    .string()
    .min(6, 'Password must be at least 6 characters')
    .required('Password is required'),
});

export type LoginFormData = yup.InferType<typeof loginSchema>;

export const forgotPasswordSchema = yup.object().shape({
  email: yup
    .string()
    .email('Please enter a valid email address')
    .required('Email is required'),
});

export type ForgotPasswordFormData = yup.InferType<typeof forgotPasswordSchema>;

export const resetPasswordSchema = yup.object().shape({
  newPassword: yup
    .string()
    .min(8, 'Password must be at least 8 characters')
    .required('Password is required'),
  confirmPassword: yup
    .string()
    .oneOf([yup.ref('newPassword')], 'Passwords must match')
    .required('Please confirm your password'),
});

export type ResetPasswordFormData = yup.InferType<typeof resetPasswordSchema>;
