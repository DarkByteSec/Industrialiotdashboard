import React from 'react';
import { motion } from 'motion/react';
import { Moon, Sun, BellOff, BellRing } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { useNotifications } from '../context/NotificationContext';
import { NotificationDropdown } from './NotificationDropdown';
import { Button } from './ui/button';
import { Switch } from './ui/switch';
import { Separator } from './ui/separator';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from './ui/tooltip';

interface GlobalNavbarProps {
  title?: string;
  subtitle?: string;
}

export const GlobalNavbar: React.FC<GlobalNavbarProps> = ({ title, subtitle }) => {
  const { theme, toggleTheme } = useTheme();
  const { globalMute, toggleGlobalMute } = useNotifications();

  return (
    <header className="bg-white dark:bg-[#1E293B] border-b border-slate-200 dark:border-[#334155] transition-colors duration-300 shadow-sm dark:shadow-[0_4px_20px_rgba(0,0,0,0.3)]">
      <div className="container mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          {/* Left: Title */}
          <div>
            <motion.h1
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
              className="text-2xl font-bold text-slate-900 dark:text-[#F1F5F9]"
            >
              {title || 'EyeSafeU'}
            </motion.h1>
            {subtitle && (
              <p className="text-slate-600 dark:text-[#94A3B8] text-sm mt-1">{subtitle}</p>
            )}
          </div>

          {/* Right: Controls */}
          <div className="flex items-center gap-4">
            {/* Global Mute Toggle */}
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={toggleGlobalMute}
                    className={`transition-all duration-200 hover:bg-slate-100 dark:hover:bg-[#334155] ${
                      globalMute ? 'text-[#F59E0B]' : 'text-slate-600 dark:text-[#94A3B8]'
                    }`}
                  >
                    {globalMute ? (
                      <BellOff className="w-5 h-5" />
                    ) : (
                      <BellRing className="w-5 h-5" />
                    )}
                  </Button>
                </TooltipTrigger>
                <TooltipContent className="bg-[#1E293B] border-[#334155] text-[#F1F5F9]">
                  <p>{globalMute ? 'Unmute all alerts' : 'Mute all alerts'}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>

            <Separator orientation="vertical" className="h-6 bg-slate-300 dark:bg-[#334155]" />

            {/* Notifications */}
            <NotificationDropdown />

            <Separator orientation="vertical" className="h-6 bg-slate-300 dark:bg-[#334155]" />

            {/* Theme Toggle */}
            <div className="flex items-center gap-3 bg-slate-100 dark:bg-[#334155] px-3 py-2 rounded-lg transition-all duration-200 hover:bg-slate-200 dark:hover:bg-[#475569]">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="flex items-center gap-2">
                      <Sun className="w-4 h-4 text-slate-600 dark:text-[#94A3B8] transition-colors" />
                      <Switch
                        checked={theme === 'dark'}
                        onCheckedChange={toggleTheme}
                        className="data-[state=checked]:bg-[#3B82F6]"
                      />
                      <Moon className="w-4 h-4 text-slate-600 dark:text-[#94A3B8] transition-colors" />
                    </div>
                  </TooltipTrigger>
                  <TooltipContent className="bg-[#1E293B] border-[#334155] text-[#F1F5F9]">
                    <p>Toggle {theme === 'dark' ? 'light' : 'dark'} mode</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};