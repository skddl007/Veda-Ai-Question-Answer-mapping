import {
  ArrowLeft,
  Bell,
  ChevronDown,
  ChevronsRight,
  ClipboardList,
  FileText,
  HelpCircle,
  LayoutGrid,
  Menu,
  MonitorPlay,
  PieChart,
  PanelLeft,
  Settings,
  Sparkles,
} from "lucide-react";
import { useEffect, useState } from "react";
import schoolLogo from "../assets/school-logo.png";

const navItems = [
  { label: "Home", icon: LayoutGrid },
  { label: "My Classroom", icon: MonitorPlay },
  { label: "Assignments", icon: FileText },
  { label: "Exams", icon: ClipboardList, active: true },
  { label: "My Library", icon: PieChart },
];

import vedaLogo from "../assets/veda-logo.png";

function LogoMark({ size = "h-11 w-11" }) {
  return (
    <div className={`grid ${size} shrink-0 place-items-center`}>
      <img src={vedaLogo} alt="VedaAI Logo" className="h-full w-full object-contain" />
    </div>
  );
}

function SidebarExpanded({ onCollapse }) {
  return (
    <aside className="hidden h-full w-[300px] shrink-0 flex-col overflow-hidden rounded-3xl bg-sidebar p-5 shadow-sm lg:flex">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <LogoMark />
          <span className="text-[26px] font-extrabold tracking-tight">VedaAI</span>
        </div>
        <button
          onClick={onCollapse}
          aria-label="Collapse sidebar"
          className="grid h-9 w-9 shrink-0 place-items-center rounded-lg text-muted-foreground hover:bg-secondary"
        >
          <PanelLeft className="h-5 w-5" />
        </button>
      </div>

      <button className="mt-7 flex w-full items-center justify-center gap-2 rounded-full bg-ink px-4 py-4 text-[17px] font-bold text-ink-foreground ring-2 ring-brand transition-transform hover:scale-[1.01]">
        <Sparkles className="h-5 w-5 text-brand" />
        AI Teacher&apos;s Toolkit
      </button>

      <nav className="mt-8 flex flex-col gap-1">
        {navItems.map((item) => (
          <button
            key={item.label}
            className={`flex items-center gap-3 rounded-2xl px-4 py-3.5 text-[17px] transition-colors ${
              item.active
                ? "bg-secondary font-semibold text-foreground"
                : "text-muted-foreground hover:bg-secondary/60"
            }`}
          >
            <item.icon className="h-5 w-5 shrink-0" />
            <span className="truncate">{item.label}</span>
          </button>
        ))}
      </nav>

      <div className="mt-auto flex flex-col gap-3">
        <button className="flex items-center gap-3 rounded-2xl px-4 py-3.5 text-[17px] text-muted-foreground hover:bg-secondary/60">
          <Settings className="h-5 w-5" />
          Settings
        </button>
        <div className="flex items-center gap-3 rounded-2xl bg-secondary p-3">
          <img
            src={schoolLogo}
            alt="Delhi Public School crest"
            loading="lazy"
            className="h-12 w-12 shrink-0 rounded-full bg-card object-contain p-1"
          />
          <div className="min-w-0">
            <p className="truncate text-[17px] font-bold">Delhi Public School</p>
            <p className="truncate text-sm text-muted-foreground">Bokaro Steel City</p>
          </div>
        </div>
      </div>
    </aside>
  );
}

function SidebarRail({ onExpand }) {
  return (
    <aside className="hidden h-full w-[76px] shrink-0 flex-col items-center overflow-hidden rounded-3xl bg-sidebar py-4 shadow-sm lg:flex">
      <LogoMark />

      <button
        aria-label="AI Teacher's Toolkit"
        className="mt-8 grid h-12 w-12 place-items-center rounded-full bg-ink text-ink-foreground ring-2 ring-brand"
      >
        <Sparkles className="h-5 w-5 text-brand" />
      </button>

      <nav className="mt-6 flex flex-col items-center gap-2">
        {navItems.map((item) => (
          <button
            key={item.label}
            aria-label={item.label}
            className={`grid h-11 w-11 place-items-center rounded-xl transition-colors ${
              item.active ? "text-foreground" : "text-muted-foreground hover:bg-secondary/60"
            }`}
          >
            <item.icon className="h-5 w-5" />
          </button>
        ))}
      </nav>

      <div className="mt-auto flex flex-col items-center gap-4">
        <img
          src={schoolLogo}
          alt="Delhi Public School crest"
          loading="lazy"
          className="h-11 w-11 rounded-full bg-secondary object-contain p-1"
        />
        <button
          onClick={onExpand}
          aria-label="Expand sidebar"
          className="grid h-9 w-9 place-items-center rounded-lg text-muted-foreground hover:bg-secondary"
        >
          <ChevronsRight className="h-5 w-5" />
        </button>
      </div>
    </aside>
  );
}

function TopBar({ onBack }) {
  return (
    <header className="flex items-center gap-3 rounded-3xl bg-card px-4 py-3 shadow-sm sm:px-5">
      <button
        onClick={onBack}
        aria-label="Go back"
        className="grid h-11 w-11 shrink-0 place-items-center rounded-full transition-colors hover:bg-secondary"
      >
        <ArrowLeft className="h-5 w-5" />
      </button>

      <div className="flex min-w-0 items-center gap-2 lg:hidden">
        <LogoMark size="h-9 w-9" />
        <span className="truncate text-xl font-extrabold tracking-tight">VedaAI</span>
      </div>
      <div className="hidden min-w-0 items-center gap-2 text-muted-foreground lg:flex">
        <ClipboardList className="h-5 w-5 shrink-0" />
        <span className="truncate text-[17px]">Exams</span>
      </div>

      <div className="ml-auto flex shrink-0 items-center gap-1 sm:gap-2">
        <button aria-label="Help" className="hidden h-11 w-11 place-items-center rounded-full hover:bg-secondary sm:grid">
          <HelpCircle className="h-6 w-6 text-muted-foreground" />
        </button>
        <button aria-label="Notifications" className="relative grid h-11 w-11 place-items-center rounded-full hover:bg-secondary">
          <Bell className="h-6 w-6 text-muted-foreground" />
          <span className="absolute right-2.5 top-2.5 h-2 w-2 rounded-full bg-brand" />
        </button>
        <button aria-label="AI" className="hidden h-11 w-11 place-items-center rounded-full bg-secondary sm:grid">
          <Sparkles className="h-5 w-5" />
        </button>
        <div className="flex items-center gap-2 pl-1">
          <div className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-ink text-xs font-bold text-ink-foreground">
            MR
          </div>
          <span className="hidden text-[17px] font-semibold lg:block">Madhur Rastogi</span>
          <ChevronDown className="hidden h-4 w-4 text-muted-foreground lg:block" />
        </div>
        <button aria-label="Menu" className="grid h-11 w-11 place-items-center rounded-full hover:bg-secondary lg:hidden">
          <Menu className="h-5 w-5" />
        </button>
      </div>
    </header>
  );
}

export function AppShell({ children, onBack, collapsed = false }) {
  const [isCollapsed, setIsCollapsed] = useState(collapsed);

  useEffect(() => {
    setIsCollapsed(collapsed);
  }, [collapsed]);

  return (
    <div className="flex h-dvh w-full gap-4 overflow-hidden bg-background p-3 sm:p-4">
      {isCollapsed ? (
        <SidebarRail onExpand={() => setIsCollapsed(false)} />
      ) : (
        <SidebarExpanded onCollapse={() => setIsCollapsed(true)} />
      )}
      <div className="flex min-w-0 flex-1 flex-col gap-4 overflow-y-auto pr-1">
        <TopBar onBack={onBack} />
        <main className="flex flex-1 flex-col">{children}</main>
      </div>
    </div>
  );
}
