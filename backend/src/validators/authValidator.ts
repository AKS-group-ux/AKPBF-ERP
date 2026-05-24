import { z } from 'zod';

export const loginSchema = z.object({
  authMethod: z.enum(['email', 'id', 'phone']),
  email: z.string().email('Adresse email invalide.').optional(),
  password: z.string().min(5, 'Le mot de passe doit comporter au moins 5 caractères.').optional(),
  subscriberId: z.string().min(1, 'L\'identifiant d\'abonné est requis.').optional(),
  phone: z.string().min(1, 'Le numéro de téléphone est requis.').optional(),
  otp: z.string().optional(),
  subscribers: z.array(z.any()).optional() // compatible with local state during transition
});

export type LoginInput = z.infer<typeof loginSchema>;
