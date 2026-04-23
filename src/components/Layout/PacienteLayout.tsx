import { useState, useEffect, useCallback } from "react";
import type { ReactNode } from "react";
import { useLocation } from "react-router-dom";
import PacienteSidebar from "./PacienteSidebar";
import PacienteHeader from "./PacienteHeader";
import PacienteFooter from "./PacienteFooter";
import "./PacienteLayout.css";

interface PacienteLayoutProps {
  children: ReactNode;
}

/** Breakpoint: below this width the sidebar is a mobile drawer */
const MOBILE_BREAKPOINT = 768;
/** Breakpoint: between MOBILE and this width the sidebar is collapsed (icons only) */
const TABLET_BREAKPOINT = 1024;

const PacienteLayout = ({ children }: PacienteLayoutProps) => {
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  /** Determine collapsed state from viewport width */
  const syncCollapsed = useCallback(() => {
    const w = window.innerWidth;
    setSidebarCollapsed(w >= MOBILE_BREAKPOINT && w <= TABLET_BREAKPOINT);
  }, []);

  // Set initial collapsed state + listen for resize
  useEffect(() => {
    syncCollapsed();
    window.addEventListener("resize", syncCollapsed);
    return () => window.removeEventListener("resize", syncCollapsed);
  }, [syncCollapsed]);

  // Close mobile sidebar on route change
  useEffect(() => {
    setSidebarOpen(false);
  }, [location.pathname]);

  const handleToggleSidebar = () => {
    setSidebarOpen((prev) => !prev);
  };

  const handleCloseSidebar = () => {
    setSidebarOpen(false);
  };

  return (
    <div className="paciente-layout">
      <PacienteSidebar
        isOpen={sidebarOpen}
        isCollapsed={sidebarCollapsed}
        onClose={handleCloseSidebar}
      />
      <div className="paciente-main">
        <PacienteHeader onToggleSidebar={handleToggleSidebar} />
        <main className="paciente-content">
          {children}
        </main>
        <PacienteFooter />
      </div>
    </div>
  );
};

export default PacienteLayout;
