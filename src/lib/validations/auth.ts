import { z } from 'zod';

// Regex para validação de senha
const passwordRegex = {
  number: /\d/,
  lower: /[a-z]/,
  upper: /[A-Z]/,
  special: /[!@#$%^&*(),.?":{}|<>]/,
};

// Esquema de senha com validações detalhadas
const passwordSchema = z
  .string()
  .min(8, 'A senha deve ter no mínimo 8 caracteres')
  .regex(passwordRegex.number, 'A senha deve conter pelo menos um número')
  .regex(passwordRegex.lower, 'A senha deve conter pelo menos uma letra minúscula')
  .regex(passwordRegex.upper, 'A senha deve conter pelo menos uma letra maiúscula')
  .regex(passwordRegex.special, 'A senha deve conter pelo menos um caractere especial');

export const loginSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'A senha deve ter no mínimo 6 caracteres'),
});

export const forgotPasswordSchema = z.object({
  email: z.string().email('Email inválido'),
});

export const resetPasswordSchema = z
  .object({
    password: passwordSchema,
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'As senhas não coincidem',
    path: ['confirmPassword'],
  });

export const registerSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório'),
  email: z.string().email('Email inválido'),
  phone: z.string()
    .min(14, 'Telefone inválido')
    .max(15, 'Telefone inválido')
    .regex(/^\(\d{2}\) \d{5}-\d{4}$/, 'Formato inválido. Use (00) 00000-0000'),
  apartment_complex_name: z.string().min(1, 'Nome do condomínio é obrigatório'),
  password: passwordSchema,
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'As senhas não coincidem',
  path: ['confirmPassword'],
});

export type LoginFormData = z.infer<typeof loginSchema>;
export type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>;
export type RegisterFormData = z.infer<typeof registerSchema>;