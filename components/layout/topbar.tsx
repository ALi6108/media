'use client';

import { usePathname } from 'next/navigation';
import { Bell, Search } from 'lucide-react';
import { Input } from '../ui/input';
import { Button } from '../ui/button';

export function Topbar() {
  const pathname = usePathname();
  
  // Format pathname to display as title
  const getPageTitle = () => {
    if (pathname === '/') return 'Dashboard';
    const path = pathname.split('/')[1];
    if (!path) return 'Dashboard';
    
    // Convert from kebab-case to Title Case
    return path.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
  };

  return (
    <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-8 sticky top-0 z-10">
      <h1 className="text-xl font-semibold text-slate-800">{getPageTitle()}</h1>
      
      <div className="flex items-center space-x-4">
        <div className="relative hidden md:block">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
          <Input 
            type="search" 
            placeholder="Cari..." 
            className="w-64 pl-9 bg-slate-50 border-slate-200 focus-visible:ring-blue-500 rounded-full h-9"
          />
        </div>
        
        <Button variant="ghost" size="icon" className="text-slate-500 hover:text-slate-700 relative">
          <Bell className="h-5 w-5" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full"></span>
        </Button>
      </div>
    </header>
  );
}
