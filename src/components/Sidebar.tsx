import React, { useState } from 'react';
import {
  LayoutDashboard,
  BarChart3,
  TrendingUp,
  CalendarDays,
  Tag,
  AlertTriangle,
  Users,
  Table,
  ListFilter,
  Upload,
  Sliders,
  ChevronDown,
  ChevronRight,
  ChevronLeft,
  X,
  Search,
  Sparkles,
  Layers,
  Flame,
  FileSpreadsheet,
  CheckCircle2,
  PieChart,
} from 'lucide-react';

export interface SidebarProps {
  isOpen: boolean;
  onToggleOpen: () => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  activeSection: string;
  onSelectSection: (sectionId: string) => void;
  onOpenUpload: () => void;
  onOpenCustomizer: () => void;
  // Dynamic live metric counters
  completedCount: number;
  totalCherryChild: number;
  duplicateIlpnCount: number;
  wrongLabel2114Count: number;
  activeUsersCount: number;
}

interface MenuItem {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  iconColorClass: string;
  badge?: string | number;
  badgeColorClass?: string;
  children?: {
    id: string;
    label: string;
    badge?: string | number;
    badgeColorClass?: string;
  }[];
}

interface MenuCategory {
  title: string;
  items: MenuItem[];
}

export const Sidebar: React.FC<SidebarProps> = ({
  isOpen,
  onToggleOpen,
  isCollapsed,
  onToggleCollapse,
  activeSection,
  onSelectSection,
  onOpenUpload,
  onOpenCustomizer,
  completedCount,
  totalCherryChild,
  duplicateIlpnCount,
  wrongLabel2114Count,
  activeUsersCount,
}) => {
  // Track open state for expandable multi-level items
  const [expandedItems, setExpandedItems] = useState<Record<string, boolean>>({
    'menu-hourly-hub': true,
    'menu-period-trend': false,
    'menu-cherry-analytics': true,
    'menu-quality-audit': true,
    'menu-workforce': false,
  });

  const [menuSearch, setMenuSearch] = useState('');

  const toggleExpand = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setExpandedItems((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  // Multi-level Navigation Structure
  const menuCategories: MenuCategory[] = [
    {
      title: 'ภาพรวมและการผลิต',
      items: [
        {
          id: 'section-kpi',
          label: 'ภาพรวม KPI สรุปด่วน',
          icon: LayoutDashboard,
          iconColorClass: 'liquid-icon-emerald',
          badge: `${completedCount.toLocaleString()} งาน`,
          badgeColorClass: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30',
        },
        {
          id: 'menu-hourly-hub',
          label: 'ผลผลิตรายชั่วโมง (Hourly)',
          icon: BarChart3,
          iconColorClass: 'liquid-icon-cyan',
          children: [
            {
              id: 'section-hourly',
              label: 'ยอดเสร็จรายชั่วโมง (00-23 น.)',
            },
            {
              id: 'section-cumulative',
              label: 'ยอดสะสมต่อเนื่อง (Cumulative)',
            },
          ],
        },
        {
          id: 'menu-period-trend',
          label: 'แนวโน้มช่วงเวลา (Period)',
          icon: CalendarDays,
          iconColorClass: 'liquid-icon-blue',
          children: [
            {
              id: 'section-daily-monthly',
              label: 'สรุปรายวัน (Daily View)',
            },
            {
              id: 'section-daily-monthly',
              label: 'สรุปรายเดือน (Monthly View)',
            },
          ],
        },
      ],
    },
    {
      title: 'งานหยิบสินค้า & ควบคุมคุณภาพ',
      items: [
        {
          id: 'menu-cherry-analytics',
          label: 'Cherry Pick (Active)',
          icon: Tag,
          iconColorClass: 'liquid-icon-rose',
          badge: `${totalCherryChild.toLocaleString()} ลูก`,
          badgeColorClass: 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/30',
          children: [
            {
              id: 'section-cherry',
              label: 'Replenish Active Cherry Pick',
            },
            {
              id: 'section-cherry',
              label: 'เปรียบเทียบกะ (เช้า 05-17 | ดึก 18-04)',
            },
          ],
        },
        {
          id: 'menu-quality-audit',
          label: 'ตรวจสอบความถูกต้อง iLPN',
          icon: AlertTriangle,
          iconColorClass: 'liquid-icon-amber',
          badge: duplicateIlpnCount > 0 ? `${duplicateIlpnCount} ซ้ำ` : 'ปกติ',
          badgeColorClass:
            duplicateIlpnCount > 0
              ? 'bg-amber-500/20 text-amber-600 dark:text-amber-400 border-amber-500/30 font-bold'
              : 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30',
          children: [
            {
              id: 'section-ilpn-audit',
              label: 'User ที่ใช้ iLPN ซ้ำ (>1 ครั้ง)',
              badge: duplicateIlpnCount,
              badgeColorClass: 'bg-amber-500/20 text-amber-600 dark:text-amber-400',
            },
            {
              id: 'section-ilpn-audit',
              label: 'ลาเบลผิดประเภท (2114*)',
              badge: wrongLabel2114Count,
              badgeColorClass: 'bg-rose-500/20 text-rose-600 dark:text-rose-400',
            },
          ],
        },
      ],
    },
    {
      title: 'พนักงาน & สถิติผลงาน',
      items: [
        {
          id: 'menu-workforce',
          label: 'ประสิทธิภาพพนักงาน (Users)',
          icon: Users,
          iconColorClass: 'liquid-icon-purple',
          badge: `${activeUsersCount} คน`,
          badgeColorClass: 'bg-purple-500/15 text-purple-600 dark:text-purple-400 border-purple-500/30',
          children: [
            {
              id: 'section-top-users',
              label: 'จัดอันดับพนักงาน (Leaderboard)',
            },
            {
              id: 'section-matrix',
              label: 'ตาราง Matrix (พนักงาน × ราย ชม.)',
            },
            {
              id: 'section-distribution',
              label: 'สัดส่วนประเภทงาน (Breakdown)',
            },
          ],
        },
        {
          id: 'section-raw-data',
          label: 'บันทึกงานรายแถว (Task Ledger)',
          icon: ListFilter,
          iconColorClass: 'liquid-icon-indigo',
        },
      ],
    },
  ];

  // Filter items by search query if any
  const filteredCategories = menuCategories.map((cat) => ({
    ...cat,
    items: cat.items.filter((item) => {
      if (!menuSearch) return true;
      const q = menuSearch.toLowerCase();
      const matchParent = item.label.toLowerCase().includes(q);
      const matchChildren = item.children?.some((c) => c.label.toLowerCase().includes(q));
      return matchParent || matchChildren;
    }),
  })).filter((cat) => cat.items.length > 0);

  const handleItemClick = (targetSectionId: string) => {
    onSelectSection(targetSectionId);
    // On mobile, close sidebar drawer
    if (window.innerWidth < 1024) {
      onToggleOpen();
    }
  };

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {isOpen && (
        <div
          onClick={onToggleOpen}
          className="fixed inset-0 z-40 bg-slate-950/60 backdrop-blur-sm lg:hidden transition-opacity"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 transition-all duration-300 ease-in-out flex flex-col ${
          isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        } ${
          isCollapsed ? 'lg:w-20' : 'w-72 sm:w-80'
        } bg-white/80 dark:bg-slate-950/85 backdrop-blur-2xl border-r border-white/20 dark:border-white/10 shadow-2xl shadow-black/20`}
      >
        {/* Specular Top Rim */}
        <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-cyan-400/40 to-transparent pointer-events-none" />

        {/* 1. Sidebar Header (Brand & Collapse Action) */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-white/10 dark:border-white/5 shrink-0">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="liquid-icon liquid-icon-cyan w-10 h-10 shrink-0 shadow-md shadow-cyan-500/20">
              <FileSpreadsheet className="w-5 h-5 text-cyan-600 dark:text-cyan-300" />
            </div>

            {!isCollapsed && (
              <div className="transition-opacity duration-200">
                <span className="font-bold text-sm tracking-tight text-slate-900 dark:text-white whitespace-nowrap block">
                  RP20 Analytics Hub
                </span>
                <span className="text-[10px] text-slate-500 dark:text-slate-400 font-mono flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Live Operational Portal
                </span>
              </div>
            )}
          </div>

          {/* Collapse/Expand Toggle on Desktop */}
          <button
            onClick={onToggleCollapse}
            className="hidden lg:flex p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            title={isCollapsed ? 'ขยายเมนู' : 'ย่อเมนู'}
          >
            {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>

          {/* Close Button on Mobile */}
          <button
            onClick={onToggleOpen}
            className="lg:hidden p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 2. Menu Quick Search (Visible when not collapsed) */}
        {!isCollapsed && (
          <div className="p-3 border-b border-white/10 dark:border-white/5 shrink-0">
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="ค้นหาเมนู & กราฟ..."
                value={menuSearch}
                onChange={(e) => setMenuSearch(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl bg-slate-100/80 dark:bg-slate-900/80 border border-slate-200/80 dark:border-white/10 text-slate-800 dark:text-slate-200 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-cyan-500/50"
              />
              {menuSearch && (
                <button
                  onClick={() => setMenuSearch('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] text-slate-400 hover:text-slate-600"
                >
                  ✕
                </button>
              )}
            </div>
          </div>
        )}

        {/* 3. Multi-level Navigation Items List */}
        <div className="flex-1 overflow-y-auto px-3 py-3 space-y-4">
          {filteredCategories.map((category, catIdx) => (
            <div key={catIdx} className="space-y-1">
              {/* Category Header Label */}
              {!isCollapsed ? (
                <div className="px-2.5 py-1 text-[10px] font-bold tracking-wider uppercase text-slate-400 dark:text-slate-500 font-mono">
                  {category.title}
                </div>
              ) : (
                <div className="h-px bg-slate-200 dark:bg-white/10 my-2 mx-1" />
              )}

              {/* Items under Category */}
              {category.items.map((item) => {
                const Icon = item.icon;
                const hasChildren = item.children && item.children.length > 0;
                const isExpanded = !!expandedItems[item.id];
                const isActive = activeSection === item.id;

                return (
                  <div key={item.id} className="space-y-0.5">
                    {/* Level 1 Parent Button */}
                    <div
                      onClick={() => {
                        if (hasChildren && !isCollapsed) {
                          setExpandedItems((prev) => ({ ...prev, [item.id]: !prev[item.id] }));
                        } else {
                          handleItemClick(item.id);
                        }
                      }}
                      title={isCollapsed ? item.label : undefined}
                      className={`group relative flex items-center justify-between w-full px-2.5 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer select-none ${
                        isActive
                          ? 'bg-gradient-to-r from-cyan-500/15 via-blue-500/10 to-transparent text-cyan-600 dark:text-cyan-400 border border-cyan-500/30 shadow-xs'
                          : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100/70 dark:hover:bg-slate-900/60 hover:text-slate-900 dark:hover:text-white border border-transparent hover:border-slate-200/60 dark:hover:border-white/5'
                      }`}
                    >
                      {/* Left: Liquid Icon & Label */}
                      <div className="flex items-center gap-2.5 truncate">
                        <div className={`liquid-icon ${item.iconColorClass} w-8 h-8 shrink-0`}>
                          <Icon className="w-4 h-4" />
                        </div>

                        {!isCollapsed && (
                          <span className="truncate text-xs font-medium">{item.label}</span>
                        )}
                      </div>

                      {/* Right: Badge / Expand Chevron */}
                      {!isCollapsed && (
                        <div className="flex items-center gap-1.5 shrink-0 ml-1">
                          {item.badge && !hasChildren && (
                            <span
                              className={`text-[10px] font-mono px-1.5 py-0.2 rounded-md border tabular-nums ${item.badgeColorClass}`}
                            >
                              {item.badge}
                            </span>
                          )}

                          {hasChildren && (
                            <button
                              onClick={(e) => toggleExpand(item.id, e)}
                              className="p-1 rounded-md text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-transform"
                            >
                              {isExpanded ? (
                                <ChevronDown className="w-3.5 h-3.5 text-cyan-500" />
                              ) : (
                                <ChevronRight className="w-3.5 h-3.5" />
                              )}
                            </button>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Level 2 Sub-items (Nested Children with connector line) */}
                    {hasChildren && isExpanded && !isCollapsed && (
                      <div className="ml-5 pl-3 border-l-2 border-slate-200/80 dark:border-white/10 space-y-0.5 mt-1 mb-1.5 animate-in slide-in-from-top-1 duration-150">
                        {item.children!.map((child, childIdx) => {
                          const isChildActive = activeSection === child.id;

                          return (
                            <button
                              key={childIdx}
                              onClick={() => handleItemClick(child.id)}
                              className={`w-full flex items-center justify-between text-left px-2.5 py-1.5 rounded-lg text-[11px] font-medium transition-all cursor-pointer ${
                                isChildActive
                                  ? 'text-cyan-600 dark:text-cyan-300 font-bold bg-cyan-500/10'
                                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100/50 dark:hover:bg-slate-900/40'
                              }`}
                            >
                              <div className="flex items-center gap-2 truncate">
                                <span
                                  className={`w-1.5 h-1.5 rounded-full ${
                                    isChildActive ? 'bg-cyan-500' : 'bg-slate-300 dark:bg-slate-600'
                                  }`}
                                />
                                <span className="truncate">{child.label}</span>
                              </div>

                              {child.badge !== undefined && (
                                <span
                                  className={`text-[9px] font-mono px-1.5 py-0.2 rounded font-bold tabular-nums ${
                                    child.badgeColorClass || 'bg-slate-200/70 dark:bg-slate-800 text-slate-500'
                                  }`}
                                >
                                  {child.badge}
                                </span>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ))}
        </div>

        {/* 4. Sidebar Bottom Actions (Upload & Customize Widgets) */}
        <div className="p-3 border-t border-white/10 dark:border-white/5 space-y-2 shrink-0 bg-slate-50/50 dark:bg-slate-900/30">
          {/* Quick Action: Upload */}
          <button
            onClick={() => {
              onOpenUpload();
              if (window.innerWidth < 1024) onToggleOpen();
            }}
            title={isCollapsed ? 'อัปโหลด Excel (RP20)' : undefined}
            className={`w-full flex items-center ${
              isCollapsed ? 'justify-center p-2' : 'gap-2 px-3 py-2'
            } rounded-xl text-xs font-semibold text-white bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 shadow-md shadow-cyan-500/20 transition-all cursor-pointer active:scale-95`}
          >
            <Upload className="w-4 h-4 shrink-0" />
            {!isCollapsed && <span>อัปโหลด Excel (RP20)</span>}
          </button>

          {/* Quick Action: Customize */}
          <button
            onClick={() => {
              onOpenCustomizer();
              if (window.innerWidth < 1024) onToggleOpen();
            }}
            title={isCollapsed ? 'ปรับแต่ง Widget' : undefined}
            className={`w-full flex items-center ${
              isCollapsed ? 'justify-center p-2' : 'gap-2 px-3 py-1.5'
            } rounded-xl text-xs font-medium text-slate-700 dark:text-slate-200 bg-white/60 dark:bg-slate-800/60 hover:bg-white dark:hover:bg-slate-800 border border-slate-200/80 dark:border-white/10 transition-all cursor-pointer`}
          >
            <Sliders className="w-4 h-4 text-indigo-500 shrink-0" />
            {!isCollapsed && <span>ปรับแต่ง Widget</span>}
          </button>
        </div>
      </aside>
    </>
  );
};
