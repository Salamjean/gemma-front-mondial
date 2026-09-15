'use client';

import Link from 'next/link';
import { FaBars, FaTimes } from 'react-icons/fa';
import Image from 'next/image';
import { useState } from 'react';

export default function NavbarHome() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const navItems = [
    { name: 'Accueil', href: '/' },
    { name: 'À Propos', href: '/about' },
    { name: 'Contact', href: '/contact' }, 
  ];

  return (
    <header className="fixed top-0 left-0 w-full z-50 shadow-md bg-[#06b6d4]/95 backdrop-blur-md transition-all duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16 sm:h-20">
          
          {/* 1. Logo (Gauche) */}
          <Link href="/" className="flex items-center space-x-2 focus:outline-none">
            <Image 
              src="/gemma.png" 
              alt="Logo Espace Patient"
              width={110} 
              height={36}
              priority 
              className="h-8 sm:h-10 w-auto object-contain"
            />
          </Link>
          
          {/* 2. Navigation (Centre - Desktop) */}
          <nav className="hidden md:flex items-center space-x-8">
            {navItems.map((item) => (
              <Link 
                key={item.name} 
                href={item.href} 
                className="text-white hover:text-cyan-100 transition-colors duration-200 text-base font-medium 
                           relative py-1 after:content-[''] after:absolute after:bottom-0 after:left-0 after:w-0 after:h-0.5 
                           after:bg-white hover:after:w-full after:transition-all after:duration-300" 
              >
                {item.name}
              </Link>
            ))}
          </nav>
          
          {/* 3. Bouton d'Action (Droite - Desktop) */}
          <div className="hidden md:flex items-center space-x-4">
            <Link href="/login">
              <button 
                className="px-5 py-2.5 border-2 border-white 
                           text-white font-semibold text-sm
                           rounded-xl shadow-sm
                           hover:bg-white hover:text-[#06b6d4] active:scale-95 transition-all duration-200"
              >
                Se Connecter
              </button>
            </Link>
          </div>

          {/* 4. Menu Hamburger (Mobile) */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="md:hidden p-2.5 rounded-xl text-white hover:bg-white/10 active:bg-white/20 transition-all focus:outline-none"
            aria-label="Menu de navigation"
            aria-expanded={isMobileMenuOpen}
          >
            {isMobileMenuOpen ? <FaTimes size={22} /> : <FaBars size={22} />}
          </button>
        </div>

        {/* Menu Mobile déroulant */}
        {isMobileMenuOpen && (
          <div className="md:hidden py-4 border-t border-white/15 animate-in fade-in slide-in-from-top-2 duration-200">
            <nav className="flex flex-col space-y-2">
              {navItems.map((item) => (
                <Link 
                  key={item.name} 
                  href={item.href}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="text-white hover:text-cyan-100 transition-colors text-base font-medium py-3 px-4 rounded-xl hover:bg-white/10 active:bg-white/20 flex items-center justify-between"
                >
                  <span>{item.name}</span>
                </Link>
              ))}
              <div className="pt-2 px-2">
                <Link href="/login" className="block w-full">
                  <button 
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="w-full py-3 border-2 border-white 
                               text-white font-semibold text-base
                               rounded-xl bg-white/10 hover:bg-white hover:text-[#06b6d4] transition-all duration-200 shadow-md"
                  >
                    Se Connecter
                  </button>
                </Link>
              </div>
            </nav>
          </div>
        )}
      </div>
    </header>
  );
}