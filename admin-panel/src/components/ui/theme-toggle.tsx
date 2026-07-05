import { Moon, Sun } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useThemeStore } from '@/stores/themeStore';

export function ThemeToggle() {
    const { theme, toggleTheme } = useThemeStore();

    return (
        <Button variant="ghost" size="icon" onClick={toggleTheme} title="Cambiar tema">
            {theme === 'dark' ? (
                <Sun className="h-5 w-5" />
            ) : (
                <Moon className="h-5 w-5" />
            )}
        </Button>
    );
}