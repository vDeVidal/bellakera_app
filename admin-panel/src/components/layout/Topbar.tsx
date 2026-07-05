import { LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { useAuthStore } from '@/stores/authStore';

export function Topbar() {
    const { user, logout } = useAuthStore();

    return (
        <header className="h-16 border-b bg-card flex items-center justify-between px-6">
            <div>
                <p className="text-xs text-muted-foreground">Bienvenido de vuelta 🔥</p>
                <p className="text-sm font-medium">
                    {user?.nombre} {user?.apellido}{' '}
                    <span className="text-xs text-muted-foreground">({user?.rol})</span>
                </p>
            </div>

            <div className="flex items-center gap-2">
                <ThemeToggle />
                <Button variant="ghost" size="icon" onClick={logout} title="Cerrar sesión">
                    <LogOut className="h-5 w-5" />
                </Button>
            </div>
        </header>
    );
}