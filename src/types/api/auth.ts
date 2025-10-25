// Authentication API types and DTOs
import { z } from 'zod';

// Request schemas
export const SignInRequestSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

export const SignUpRequestSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  name: z.string().min(1),
});

export const RefreshTokenRequestSchema = z.object({
  refreshToken: z.string(),
});

// Response schemas
export const AuthTokensSchema = z.object({
  accessToken: z.string(),
  refreshToken: z.string(),
  expiresIn: z.number(),
});

export const UserSchema = z.object({
  id: z.string(),
  email: z.string().email(),
  name: z.string(),
  avatar: z.string().optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const AuthResponseSchema = z.object({
  user: UserSchema,
  tokens: AuthTokensSchema,
});

export const SessionSchema = z.object({
  user: UserSchema,
  accessToken: z.string(),
  refreshToken: z.string(),
  expiresAt: z.string(),
  isAuthenticated: z.boolean(),
});

// Type exports
export type SignInRequest = z.infer<typeof SignInRequestSchema>;
export type SignUpRequest = z.infer<typeof SignUpRequestSchema>;
export type RefreshTokenRequest = z.infer<typeof RefreshTokenRequestSchema>;
export type AuthTokens = z.infer<typeof AuthTokensSchema>;
export type User = z.infer<typeof UserSchema>;
export type AuthResponse = z.infer<typeof AuthResponseSchema>;
export type Session = z.infer<typeof SessionSchema>;

// Social auth types
export interface SocialAuthRequest {
  provider: 'google' | 'apple';
  token: string;
  idToken?: string;
}

export interface SocialAuthResponse extends AuthResponse {
  isNewUser: boolean;
}
