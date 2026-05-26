import { z } from 'zod';

const emptyToUndefined = (val: unknown) => {
  if (typeof val === 'string') {
    const trimmed = val.trim();
    return trimmed === '' ? undefined : trimmed;
  }
  return val;
};

export const loginSchema = z.object({
  authMethod: z.enum(['email', 'id', 'phone']),
  email: z.preprocess(emptyToUndefined, z.string().email('Adresse email invalide.').optional()),
  password: z.preprocess(emptyToUndefined, z.string().min(5, 'Le mot de passe doit comporter au moins 5 caractères.').optional()),
  subscriberId: z.preprocess(emptyToUndefined, z.string().min(1, 'L\'identifiant d\'abonné est requis.').optional()),
  phone: z.preprocess(emptyToUndefined, z.string().min(1, 'Le numéro de téléphone est requis.').optional()),
  otp: z.string().optional(),
  subscribers: z.array(z.any()).optional() // compatible with local state during transition
});

export type LoginInput = z.infer<typeof loginSchema>;
