import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  Menu, X, Home, Users, BookOpen, FileText, Shield, LogOut
} from "lucide-react";
import { useAuth } from "../contexts/AuthContext";

const IconMap = {
  "/": Home,
  "/stagiaires": Users,
  "/stages": BookOpen,
  "/rapports": FileText,
  "/encadrants": Shield,
};

function SidebarLink({ to, label }) {
  const location = useLocation();
  const isActive = location.pathname === to;
  const Icon = IconMap[to];

  return (
    <Link
      to={to}
      className={`flex items-center gap-3 p-3 rounded-lg transition-all duration-300 ease-in-out
        ${isActive
          ? "bg-white text-orange-600 shadow font-semibold"
          : "text-white hover:bg-orange-500 hover:translate-x-1"}
        justify-center group-hover:justify-start
      `}
    >
      <Icon size={20} className="transition-transform duration-300 group-hover:scale-110" />
      <span className="hidden group-hover:inline transition-opacity duration-300 opacity-0 group-hover:opacity-100">
        {label}
      </span>
    </Link>
  );
}

export default function Sidebar() {
  const { user, logout } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [animating, setAnimating] = useState(false);

  if (!user) return null;

  const toggleSidebar = () => {
    setAnimating(true);
    setIsOpen(!isOpen);
    setTimeout(() => setAnimating(false), 400); 
  };

  return (
    <>
      {/* Overlay mobile */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 animate-fade-in"
          onClick={toggleSidebar}
        />
      )}

     
      <button
        className="md:hidden p-3 fixed top-4 left-4 z-50 bg-orange-500 text-white rounded-lg shadow transition-transform duration-300 hover:scale-105"
        onClick={toggleSidebar}
      >
        {isOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      {/* Sidebar avec animation de glissement */}
      <div
        className={`
          fixed md:static top-0 left-0 h-screen bg-orange-400 text-white shadow-xl flex flex-col group overflow-hidden z-50
          transition-transform duration-500 ease-in-out
          ${isOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}
          md:w-16 md:hover:w-64 md:transition-[width] md:duration-500
        `}
      >
        
        <div className="p-4 border-b border-orange-300 h-16 flex items-center gap-3 justify-center group-hover:justify-start transition-all duration-300">
          <div >
           
          <img 
            src="/logo_ins.svg" 
            alt="Logo INS" 
            className="mx-auto h-10 w-auto "
          />
          </div>
          <span className="hidden group-hover:inline font-bold text-lg transition-opacity duration-300 opacity-0 group-hover:opacity-100">
            Admin Panel
          </span>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-2">
          <SidebarLink to="/" label="Tableau de bord" />
          <SidebarLink to="/stages" label="Stages" />
          <SidebarLink to="/stagiaires" label="Stagiaires" />
          <SidebarLink to="/rapports" label="Rapports" />
          {user?.permissions?.can_edit && (
            <SidebarLink to="/encadrants" label="Encadrants" />
          )}
        </nav>

        {/* Bas de sidebar */}
        <div className="p-4 border-t border-orange-300 space-y-3 transition-all duration-300">
          <div className="hidden group-hover:block transition-opacity duration-300 opacity-0 group-hover:opacity-100">
            <p className="text-sm font-semibold truncate">{user.username}</p>
            <p className="text-xs text-orange-100 capitalize">{user.role}</p>
          </div>

          <button
            onClick={logout}
            className="w-full flex items-center gap-3 p-3 rounded-lg bg-red-500 hover:bg-red-600 justify-center group-hover:justify-start transition-all duration-300 ease-in-out hover:translate-x-1"
          >
            <LogOut size={20} />
            <span className="hidden group-hover:inline transition-opacity duration-300 opacity-0 group-hover:opacity-100">
              Déconnexion
            </span>
          </button>
        </div>
      </div>
    </>
  );
}
