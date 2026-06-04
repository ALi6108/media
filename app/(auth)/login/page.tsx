'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import api from '@/lib/axios';
import { USE_MOCK_LOGIN, MOCK_AUTH } from '@/lib/auth.config';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { GlassCard, GlassCardHeader, GlassCardTitle, GlassCardContent } from '@/components/ui/glass-card';
import { Activity, Eye, EyeOff, Loader2 } from 'lucide-react';

const loginSchema = z.object({
  email: z.string().email({ message: 'Email tidak valid.' }),
  password: z.string().min(8, { message: 'Password minimal 8 karakter.' }),
});

type LoginForm = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();
  const setTokens = useAuthStore((state) => state.setTokens);
  const setUser = useAuthStore((state) => state.setUser);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  async function onSubmit(values: LoginForm) {
    setIsLoading(true);
    setErrorMsg('');

    try {
      if (USE_MOCK_LOGIN) {
        // Mock login — langsung pakai token dari auth.config.ts
        setTokens(MOCK_AUTH.accessToken, MOCK_AUTH.refreshToken);
        setUser(MOCK_AUTH.user);
      } else {
        // Real API login
        const response = await api.post('/api/v1/auth/login', values);
        const resData = response.data?.data || response.data;
        const accessToken = resData.access_token || resData.accessToken;
        const refreshToken = resData.refresh_token || resData.refreshToken;
        const userData = resData.user || resData;

        setTokens(accessToken, refreshToken);
          setUser({
            id: userData.id || userData.sub,
            name: userData.full_name || userData.name || userData.email?.split('@')[0] || 'User',
            email: userData.email,
            role: (userData.role || 'viewer').toUpperCase(),
          });
      }
      router.replace('/');
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      setErrorMsg(err.response?.data?.message || 'Terjadi kesalahan saat login.');
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
      {/* Gradient Overlay for readability */}
      <div className="absolute inset-0 bg-gradient-to-br from-[var(--galactic-obsidian)]/50 via-[var(--galactic-deep)]/30 to-[var(--galactic-obsidian)]/50" />

      <div className="w-full max-w-md relative z-10">
        {/* Logo & Title */}
        <div className="flex flex-col items-center mb-10 animate-slide-up">
          <div className="relative mb-6 group">
            <div className="absolute inset-0 bg-[var(--galactic-aurora)] rounded-2xl blur-xl opacity-40 group-hover:opacity-60 transition-opacity duration-500" />
            <div className="relative bg-gradient-to-br from-[var(--galactic-aurora)] to-[var(--galactic-aurora)]/70 p-5 rounded-2xl shadow-[0_0_30px_var(--glass-shadow)] ring-1 ring-white/20 ring-offset-4 ring-offset-[var(--galactic-deep)] transition-all duration-500 group-hover:-translate-y-1">
              <Activity className="h-10 w-10 text-white" />
            </div>
          </div>
          <h1 className="text-3xl font-heading font-bold tracking-tight text-[var(--galactic-diamond)]">HALO REKAN REKANITA !!</h1>
          <p className="text-[var(--galactic-diamond)]/80 mt-3 text-sm font-medium tracking-wide uppercase">Web Report Kinerja Tim Media</p>
        </div>

        {/* Login Card */}
        <GlassCard className="shadow-[0_20px_50px_var(--glass-shadow)] border border-white/10 animate-fade-in transition-shadow duration-500">
          <GlassCardHeader className="pb-4 border-b border-white/5">
            <GlassCardTitle className="text-[var(--galactic-diamond)] text-xl font-heading">Masuk ke Akun</GlassCardTitle>
            <p className="text-[var(--galactic-diamond)]/70 text-sm mt-1">
              Gunakan kredensial yang diberikan oleh administrator.
            </p>
          </GlassCardHeader>
          <GlassCardContent className="pt-6">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
              {/* Email Field */}
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium text-[var(--galactic-diamond)]/80">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="masukan email anda"
                  className="glass-input h-12 w-full text-[var(--galactic-diamond)] placeholder:text-[var(--galactic-diamond)]/50 px-4"
                  {...register('email')}
                />
                {errors.email && (
                  <p className="text-xs text-[var(--galactic-rose)]">{errors.email.message}</p>
                )}
              </div>

              {/* Password Field */}
              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-medium text-[var(--galactic-diamond)]/80">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="masukan password anda"
                    className="glass-input h-12 w-full text-[var(--galactic-diamond)] placeholder:text-[var(--galactic-diamond)]/50 pl-4 pr-10"
                    {...register('password')}
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--galactic-diamond)]/60 hover:text-[var(--galactic-diamond)]/80 transition-colors p-2"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {errors.password && (
                  <p className="text-xs text-[var(--galactic-rose)]">{errors.password.message}</p>
                )}
              </div>

              {/* Error Message */}
              {errorMsg && (
                <div className="p-3 text-sm text-[var(--galactic-rose)] bg-[var(--galactic-rose)]/10 rounded-xl ring-1 ring-[var(--galactic-rose)]/20 backdrop-blur-md">
                  {errorMsg}
                </div>
              )}

              {/* Submit Button */}
              <Button
                type="submit"
                className="w-full h-12 rounded-xl bg-gradient-to-r from-[var(--galactic-aurora)] to-[var(--galactic-aurora)]/80 text-white font-medium shadow-[0_4px_15px_var(--glass-shadow)] transition-all duration-300 hover:brightness-110 border border-white/10"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Memproses...
                  </>
                ) : (
                  'Masuk'
                )}
              </Button>
            </form>
          </GlassCardContent>
        </GlassCard>

        <p className="text-center text-xs text-[var(--galactic-diamond)]/50 mt-8 tracking-wider">
          © 2026 Media PC IPNU IPPNU KABUPATEN MALANG
        </p>
      </div>
    </div>
  );
}
