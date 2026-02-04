import { useState, useRef, useEffect } from 'react'
import {
  Outlet,
  NavLink,
  Link,
  useLocation,
  useNavigate,
  Navigate,
} from 'react-router-dom'
import {
  Code2,
  LayoutDashboard,
  FileCode2,
  Trophy,
  Users,
  User,
  Settings,
  LogOut,
  Bell,
  Search,
  Menu,
  X,
  Sun,
  Moon,
  ChevronLeft,
  ChevronRight,
  Flame,
  Map,
} from 'lucide-react'
import { cn } from '../../lib/utils'
import { useTheme } from '../../context/ThemeContext'
import { useAuth } from '../../context/AuthContext'

interface NavItem {
  to: string
  label: string
  icon: React.ElementType
  badge?: number
}

const mainNavItems: NavItem[] = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/problems', label: 'Practice', icon: FileCode2 },
  { to: '/roadmaps', label: 'Roadmaps', icon: Map },
  { to: '/mentors', label: 'Mentorship', icon: Users },
  { to: '/contests', label: 'Contests', icon: Trophy, badge: 2 },
  { to: '/leaderboard', label: 'Leaderboard', icon: Users },
]

const bottomNavItems: NavItem[] = [
  { to: '/profile', label: 'Profile', icon: User },
  { to: '/settings', label: 'Settings', icon: Settings },
]

/**
 * Protected layout with sidebar navigation and top navbar
 * Used for authenticated app pages
 */
export default function ProtectedLayout() {
  const location = useLocation()
  const navigate = useNavigate()
  const { setTheme, resolvedTheme } = useTheme()
  const { user, logout, isLoading, isAuthenticated } = useAuth()

  const [isSidebarOpen, setIsSidebarOpen] = useState(true)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isProfileOpen, setIsProfileOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

  const profileRef = useRef<HTMLDivElement>(null)

  // Determine if current page needs full-width (like problem solver)
  const isFullWidthPage =
    /^\/problems\/[^/]+$/.test(location.pathname) || // category list
    /^\/problems\/[^/]+\/[^/]+$/.test(location.pathname) || // category detail
    /^\/problem\/[^/]+$/.test(location.pathname) // mongo-backed problem detail/solver

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        profileRef.current &&
        !profileRef.current.contains(event.target as Node)
      ) {
        setIsProfileOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Show loading state while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      navigate(`/problems?search=${encodeURIComponent(searchQuery)}`)
      setSearchQuery('')
    }
  }

  const handleLogout = async () => {
    await logout()
  }

  const toggleTheme = () => {
    setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')
  }

  // For full-width pages (problem solver), render minimal layout
  if (isFullWidthPage) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        {/* Minimal Header for Problem Solver */}
        <header className="h-12 bg-[#1a1f2e] text-white flex items-center px-4 shrink-0 border-b border-border">
          <Link to="/problems" className="flex items-center gap-2 group">
            <div className="bg-primary p-1 rounded group-hover:opacity-90 transition-opacity">
              <Code2 className="h-4 w-4 text-white" />
            </div>
            <span className="text-sm font-bold tracking-tight">Graphora</span>
          </Link>
        </header>
        <main className="flex-1 overflow-hidden flex flex-col">
          <Outlet />
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background flex">
      {/* Desktop Sidebar */}
      <aside
        className={cn(
          'hidden lg:flex flex-col bg-card border-r border-border transition-all duration-300 shrink-0',
          isSidebarOpen ? 'w-64' : 'w-[72px]',
        )}
      >
        {/* Sidebar Header */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-border">
          <Link to="/dashboard" className="flex items-center gap-2 group">
            <div className="bg-primary p-1.5 rounded-lg group-hover:opacity-90 transition-opacity">
              <Code2 className="h-5 w-5 text-white" />
            </div>
            {isSidebarOpen && (
              <span className="text-lg font-bold tracking-tight text-foreground">
                Graphora
              </span>
            )}
          </Link>
          {isSidebarOpen && (
            <button
              onClick={() => setIsSidebarOpen(false)}
              className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-4 px-3 space-y-1">
          {mainNavItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-primary/10 text-primary'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted',
                )
              }
            >
              <item.icon className="h-5 w-5 shrink-0" />
              {isSidebarOpen && (
                <>
                  <span className="flex-1">{item.label}</span>
                  {item.badge && (
                    <span className="px-2 py-0.5 text-xs bg-primary text-primary-foreground rounded-full">
                      {item.badge}
                    </span>
                  )}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        {/* Bottom Navigation */}
        <div className="border-t border-border py-4 px-3 space-y-1">
          {bottomNavItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-primary/10 text-primary'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted',
                )
              }
            >
              <item.icon className="h-5 w-5 shrink-0" />
              {isSidebarOpen && <span>{item.label}</span>}
            </NavLink>
          ))}

          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
          >
            <LogOut className="h-5 w-5 shrink-0" />
            {isSidebarOpen && <span>Logout</span>}
          </button>
        </div>

        {/* Collapse Toggle (when collapsed) */}
        {!isSidebarOpen && (
          <div className="p-3 border-t border-border">
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="w-full flex items-center justify-center p-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        )}
      </aside>

      {/* Mobile Sidebar Overlay */}
      {isMobileMenuOpen && (
        <div
          className="lg:hidden fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Mobile Sidebar */}
      <aside
        className={cn(
          'lg:hidden fixed inset-y-0 left-0 z-50 w-72 bg-card border-r border-border transform transition-transform duration-300',
          isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full',
        )}
      >
        <div className="h-16 flex items-center justify-between px-4 border-b border-border">
          <Link to="/dashboard" className="flex items-center gap-2">
            <div className="bg-primary p-1.5 rounded-lg">
              <Code2 className="h-5 w-5 text-white" />
            </div>
            <span className="text-lg font-bold">Graphora</span>
          </Link>
          <button
            onClick={() => setIsMobileMenuOpen(false)}
            className="p-2 rounded-md text-muted-foreground hover:text-foreground"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="flex-1 py-4 px-3 space-y-1">
          {mainNavItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={() => setIsMobileMenuOpen(false)}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-primary/10 text-primary'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted',
                )
              }
            >
              <item.icon className="h-5 w-5" />
              <span className="flex-1">{item.label}</span>
              {item.badge && (
                <span className="px-2 py-0.5 text-xs bg-primary text-primary-foreground rounded-full">
                  {item.badge}
                </span>
              )}
            </NavLink>
          ))}
        </nav>

        <div className="border-t border-border py-4 px-3 space-y-1">
          {bottomNavItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={() => setIsMobileMenuOpen(false)}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-primary/10 text-primary'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted',
                )
              }
            >
              <item.icon className="h-5 w-5" />
              <span>{item.label}</span>
            </NavLink>
          ))}
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Navbar */}
        <header className="h-16 bg-card border-b border-border flex items-center justify-between px-4 lg:px-6 shrink-0">
          {/* Left: Mobile menu + Search */}
          <div className="flex items-center gap-4">
            <button
              onClick={() => setIsMobileMenuOpen(true)}
              className="lg:hidden p-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted"
            >
              <Menu className="h-5 w-5" />
            </button>

            <form onSubmit={handleSearch} className="hidden sm:flex relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search problems..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-64 h-9 pl-10 pr-4 rounded-lg bg-muted border border-transparent text-sm placeholder-muted-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
              />
            </form>
          </div>

          {/* Right: Actions */}
          <div className="flex items-center gap-3">
            {/* Streak */}
            <div className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-orange-500/10 text-orange-500">
              <Flame className="h-4 w-4" />
              <span className="text-sm font-medium">
                {user?.streak || 0} day streak
              </span>
            </div>

            {/* Notifications */}
            <button className="relative p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
              <Bell className="h-5 w-5" />
              <span className="absolute top-1 right-1 h-2 w-2 bg-primary rounded-full" />
            </button>

            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              title={`Switch to ${resolvedTheme === 'dark' ? 'light' : 'dark'} mode`}
            >
              {resolvedTheme === 'dark' ? (
                <Sun className="h-5 w-5" />
              ) : (
                <Moon className="h-5 w-5" />
              )}
            </button>

            {/* Profile Dropdown */}
            <div className="relative" ref={profileRef}>
              <button
                onClick={() => setIsProfileOpen(!isProfileOpen)}
                className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-muted transition-colors"
              >
                <div className="h-8 w-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-bold">
                  {user?.name?.charAt(0).toUpperCase() || 'U'}
                </div>
              </button>

              {isProfileOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-card border border-border rounded-lg shadow-lg py-1 z-50 animate-in fade-in zoom-in-95 duration-200">
                  <div className="px-4 py-3 border-b border-border">
                    <p className="font-semibold text-foreground truncate">
                      {user?.name || 'User'}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">
                      {user?.email || 'user@example.com'}
                    </p>
                  </div>
                  <Link
                    to="/profile"
                    className="flex items-center gap-2 px-4 py-2 text-sm hover:bg-muted transition-colors"
                    onClick={() => setIsProfileOpen(false)}
                  >
                    <User className="h-4 w-4" />
                    Profile
                  </Link>
                  <Link
                    to="/settings"
                    className="flex items-center gap-2 px-4 py-2 text-sm hover:bg-muted transition-colors"
                    onClick={() => setIsProfileOpen(false)}
                  >
                    <Settings className="h-4 w-4" />
                    Settings
                  </Link>
                  <div className="h-px bg-border my-1" />
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-2 px-4 py-2 text-sm text-destructive hover:bg-destructive/10 transition-colors"
                  >
                    <LogOut className="h-4 w-4" />
                    Logout
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-auto p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
