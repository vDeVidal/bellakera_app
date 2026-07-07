import { NavLink } from 'react-router-dom';
import {
    LayoutDashboard,
    CalendarDays,
    Beer,
    ShoppingCart,
    ClipboardList,
    Flame,
    Gamepad2,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const links = [
    { to: '/', label: 'Dashboard', icon: LayoutDashboard, end: true },
    { to: '/eventos', label: 'Eventos', icon: CalendarDays },
    { to: '/productos', label: 'Productos', icon: Beer },
    { to: '/cola', label: 'Cola de pedidos', icon: ClipboardList },
    { to: '/ventas', label: 'Ventas', icon: ShoppingCart },
    { to: '/minijuegos', label: 'Minijuegos', icon: Gamepad2 },
];

export function Sidebar() {
    return (
        <aside className="hidden md:flex flex-col w-64 border-r bg-card min-h-screen">
            <div className="h-16 flex items-center gap-2 px-6 border-b">
                <Flame className="h-6 w-6 text-bellakera" />
                <span className="font-bold text-lg tracking-tight">BELLAKERA</span>
            </div>

            <nav className="flex-1 p-3 space-y-1">
                {links.map(({ to, label, icon: Icon, end }) => (
                    <NavLink
                        key={to}
                        to={to}
                        end={end}
                        className={({ isActive }) =>
                            cn(
                                'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                                isActive
                                    ? 'bg-primary text-primary-foreground'
                                    : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground',
                            )
                        }
                    >
                        <Icon className="h-4 w-4" />
                        {label}
                    </NavLink>
                ))}
            </nav>

            <div className="p-4 border-t text-xs text-muted-foreground">
                Bellakera Admin · v0.1
            </div>
        </aside>
    );
}