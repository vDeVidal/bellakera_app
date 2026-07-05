import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Flame, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuthStore } from '@/stores/authStore';

const schema = z.object({
    telefono: z.string().regex(/^\+56\d{9}$/, 'Formato: +56XXXXXXXXX'),
    pin: z.string().regex(/^\d{4}$/, 'PIN de 4 dígitos'),
});

type FormData = z.infer<typeof schema>;

export function LoginPage() {
    const navigate = useNavigate();
    const login = useAuthStore((s) => s.login);
    const [loading, setLoading] = useState(false);

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<FormData>({
        resolver: zodResolver(schema),
        defaultValues: { telefono: '+56900000001', pin: '1234' },
    });

    const onSubmit = async (data: FormData) => {
        setLoading(true);
        try {
            await login(data.telefono, data.pin);
            toast.success('¡Bienvenido!');
            navigate('/');
        } catch (e: any) {
            const msg = e?.response?.data?.message || e.message || 'Error al iniciar sesión';
            toast.error(msg);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-background p-4">
            <Card className="w-full max-w-md">
                <CardHeader className="text-center">
                    <div className="flex justify-center mb-2">
                        <div className="h-14 w-14 rounded-full bg-primary/10 flex items-center justify-center">
                            <Flame className="h-8 w-8 text-primary" />
                        </div>
                    </div>
                    <CardTitle className="text-2xl">Bellakera Admin</CardTitle>
                    <CardDescription>Ingresa tus credenciales de administrador</CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="telefono">Teléfono</Label>
                            <Input
                                id="telefono"
                                placeholder="+56900000001"
                                autoComplete="tel"
                                {...register('telefono')}
                            />
                            {errors.telefono && (
                                <p className="text-xs text-destructive">{errors.telefono.message}</p>
                            )}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="pin">PIN</Label>
                            <Input
                                id="pin"
                                type="password"
                                inputMode="numeric"
                                maxLength={4}
                                placeholder="••••"
                                autoComplete="current-password"
                                {...register('pin')}
                            />
                            {errors.pin && <p className="text-xs text-destructive">{errors.pin.message}</p>}
                        </div>

                        <Button type="submit" className="w-full" disabled={loading}>
                            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                            Ingresar
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}