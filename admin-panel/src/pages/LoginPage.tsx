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

// El teléfono son 9 dígitos (+56 lo agregamos nosotros al enviar)
const schema = z.object({
    telefono: z
        .string()
        .length(9, 'Deben ser 9 dígitos')
        .regex(/^\d{9}$/, 'Solo números'),
    pin: z
        .string()
        .length(4, 'El PIN debe tener 4 dígitos')
        .regex(/^\d{4}$/, 'Solo números'),
});

type FormData = z.infer<typeof schema>;

export function LoginPage() {
    const navigate = useNavigate();
    const login = useAuthStore((s) => s.login);
    const [loading, setLoading] = useState(false);

    const {
        register,
        handleSubmit,
        setValue,
        formState: { errors, isValid },
    } = useForm<FormData>({
        resolver: zodResolver(schema),
        mode: 'onChange',                              // ← valida en cada tecla
        defaultValues: { telefono: '', pin: '' },
    });

    // Helper: solo permite dígitos y limita longitud
    const soloNumeros = (
        field: 'telefono' | 'pin',
        maxLen: number,
    ) => (e: React.ChangeEvent<HTMLInputElement>) => {
        const clean = e.target.value.replace(/\D/g, '').slice(0, maxLen);
        setValue(field, clean, { shouldValidate: true, shouldDirty: true });
    };

    const onSubmit = async (data: FormData) => {
        setLoading(true);
        try {
            const telefonoCompleto = `+56${data.telefono}`;
            await login(telefonoCompleto, data.pin);
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
                        {/* TELÉFONO con prefijo +56 fijo */}
                        <div className="space-y-2">
                            <Label htmlFor="telefono">Teléfono</Label>
                            <div className="flex items-stretch rounded-md border border-input bg-transparent focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2">
                                <span className="flex items-center px-3 text-sm text-muted-foreground border-r border-input select-none">
                                    +56
                                </span>
                                <Input
                                    id="telefono"
                                    inputMode="numeric"
                                    maxLength={9}
                                    placeholder="912345678"
                                    autoComplete="tel"
                                    className="border-0 focus-visible:ring-0 focus-visible:ring-offset-0"
                                    {...register('telefono', {
                                        onChange: soloNumeros('telefono', 9),
                                    })}
                                />
                            </div>
                            {errors.telefono && (
                                <p className="text-xs text-destructive">{errors.telefono.message}</p>
                            )}
                        </div>

                        {/* PIN */}
                        <div className="space-y-2">
                            <Label htmlFor="pin">PIN</Label>
                            <Input
                                id="pin"
                                type="password"
                                inputMode="numeric"
                                maxLength={4}
                                placeholder="••••"
                                autoComplete="current-password"
                                {...register('pin', {
                                    onChange: soloNumeros('pin', 4),
                                })}
                            />
                            {errors.pin && (
                                <p className="text-xs text-destructive">{errors.pin.message}</p>
                            )}
                        </div>

                        {/* Botón habilitado solo cuando isValid = true */}
                        <Button
                            type="submit"
                            className="w-full"
                            disabled={!isValid || loading}
                        >
                            {loading && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                            Ingresar
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}