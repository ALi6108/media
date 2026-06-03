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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
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
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 p-4 relative overflow-hidden">
      {/* Decorative background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-blue-600/5 rounded-full blur-3xl" />
      </div>

      <div className="w-full max-w-md relative z-10">
        {/* Logo & Title */}
        <div className="flex flex-col items-center mb-8">
          <div className="relative mb-4">
            <div className="absolute inset-0 bg-blue-500 rounded-2xl blur-lg opacity-50 animate-pulse" />
            <div className="relative bg-gradient-to-br from-blue-500 to-indigo-600 p-4 rounded-2xl shadow-xl">
              <Activity className="h-8 w-8 text-white" />
            </div>
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-white">HALO REKAN REKANITA !!</h1>
          <p className="text-blue-200/70 mt-2 text-sm">Web Report Kinerja Tim Media</p>
        </div>

        {/* Login Card */}
        <Card className="shadow-2xl border-0 bg-white/[0.03] backdrop-blur-xl ring-1 ring-white/10">
          <CardHeader className="pb-4">
            <CardTitle className="text-white text-xl">Masuk ke Akun</CardTitle>
            <CardDescription className="text-blue-200/50">
              Gunakan kredensial yang diberikan oleh administrator.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
              {/* Email Field */}
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium text-blue-100/80">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="masukan email anda"
                  className="bg-white/5 border-white/10 text-white placeholder:text-white/30 focus-visible:ring-blue-500/50 focus-visible:border-blue-500/50 h-11"
                  {...register('email')}
                />
                {errors.email && (
                  <p className="text-xs text-red-400">{errors.email.message}</p>
                )}
              </div>

              {/* Password Field */}
              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-medium text-blue-100/80">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="masukan password anda"
                    className="bg-white/5 border-white/10 text-white placeholder:text-white/30 focus-visible:ring-blue-500/50 focus-visible:border-blue-500/50 h-11 pr-10"
                    {...register('password')}
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/70 transition-colors"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {errors.password && (
                  <p className="text-xs text-red-400">{errors.password.message}</p>
                )}
              </div>

              {/* Error Message */}
              {errorMsg && (
                <div className="p-3 text-sm text-red-300 bg-red-500/10 rounded-lg ring-1 ring-red-500/20">
                  {errorMsg}
                </div>
              )}

              {/* Submit Button */}
              <Button
                type="submit"
                className="w-full h-11 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-medium shadow-lg shadow-blue-500/25 transition-all duration-200"
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
          </CardContent>
        </Card>

        <p className="text-center text-xs text-blue-200/30 mt-6">
          © 2026 Media PC IPNU IPPNU KABUPATEN MALANG
        </p>
      </div>
    </div>
  );
}
