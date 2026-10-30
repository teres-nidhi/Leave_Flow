import { useEffect, useState, type FormEvent, type ReactNode } from 'react'
import { BrowserRouter, Navigate, NavLink, Route, Routes, useNavigate } from 'react-router-dom'
import {
  Bell, CalendarDays, ChartNoAxesCombined, Check, ChevronDown, Clock3, Download,
  FileText, Home, Menu, Palmtree, Plus, Search, Settings, ShieldCheck,
  Users, X, LogOut, CircleCheck, WalletCards
} from 'lucide-react'
import { createClient } from '@supabase/supabase-js'
import {
  Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Pie, PieChart,
  ResponsiveContainer, Tooltip, XAxis, YAxis
} from 'recharts'
import { Toaster, toast } from 'sonner'

type Role = 'employee' | 'manager' | 'admin'
type LeaveStatus = 'Pending' | 'Approved' | 'Rejected' | 'Cancelled'
type User = { id: string; name: string; email: string; role: Role; employeeId: string; department: string; designation: string; manager: string; status: 'Active' | 'Inactive' }
type Leave = { id: string; employeeId: string; employee: string; type: string; start: string; end: string; days: number; status: LeaveStatus; reason: string; submitted: string; department: string }

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY
export const supabase = supabaseUrl && supabaseAnonKey ? createClient(supabaseUrl, supabaseAnonKey) : null

const seedUsers: User[] = [
  { id: 'u1', name: 'Sarah Johnson', email: 'sarah@leaveflow.com', role: 'employee', employeeId: 'LF-2024-001', department: 'Product', designation: 'Senior Product Designer', manager: 'Michael Chen', status: 'Active' },
  { id: 'u2', name: 'Michael Chen', email: 'manager@leaveflow.com', role: 'manager', employeeId: 'LF-2024-010', department: 'Product', designation: 'Head of Product', manager: 'Priya Kapoor', status: 'Active' },
  { id: 'u3', name: 'Priya Kapoor', email: 'admin@leaveflow.com', role: 'admin', employeeId: 'LF-2024-100', department: 'Human Resources', designation: 'HR Director', manager: '—', status: 'Active' },
]

const seedLeaves: Leave[] = [
  { id: 'LV-1001', employeeId: 'LF-2024-001', employee: 'Sarah Johnson', type: 'Casual Leave', start: '2026-11-03', end: '2026-11-04', days: 2, status: 'Approved', reason: 'Family function', submitted: '2026-10-24', department: 'Product' },
  { id: 'LV-1002', employeeId: 'LF-2024-018', employee: 'James Wilson', type: 'Sick Leave', start: '2026-11-06', end: '2026-11-06', days: 1, status: 'Pending', reason: 'Medical appointment', submitted: '2026-10-29', department: 'Engineering' },
  { id: 'LV-1003', employeeId: 'LF-2024-024', employee: 'Emma Davis', type: 'Earned Leave', start: '2026-11-12', end: '2026-11-14', days: 3, status: 'Pending', reason: 'Personal travel', submitted: '2026-10-28', department: 'Marketing' },
  { id: 'LV-1004', employeeId: 'LF-2024-031', employee: 'Daniel Kim', type: 'Sick Leave', start: '2026-10-20', end: '2026-10-20', days: 1, status: 'Rejected', reason: 'Fever', submitted: '2026-10-20', department: 'Engineering' },
]

function readStore<T>(key: string, fallback: T): T {
  try { const value = localStorage.getItem(key); return value ? JSON.parse(value) as T : fallback } catch { return fallback }
}
function useStore<T>(key: string, fallback: T) {
  const [value, setValue] = useState<T>(() => readStore(key, fallback))
  useEffect(() => localStorage.setItem(key, JSON.stringify(value)), [key, value])
  return [value, setValue] as const
}

function AppShell() {
  const [sessionUser, setSessionUser] = useStore<User | null>('lf-session', seedUsers[0])
  const [mobileOpen, setMobileOpen] = useState(false)
  const [notificationsOpen, setNotificationsOpen] = useState(false)
  const navigate = useNavigate()

  if (!sessionUser) return <Login onLogin={setSessionUser} />

  const logout = () => { setSessionUser(null); navigate('/login') }
  const nav = [
    { to: '/', label: 'Dashboard', icon: Home, roles: ['employee','manager','admin'] },
    { to: '/apply', label: 'Apply for Leave', icon: Plus, roles: ['employee','manager','admin'] },
    { to: '/balance', label: 'My Leave Balance', icon: WalletCards, roles: ['employee','manager','admin'] },
    { to: '/history', label: 'Leave History', icon: FileText, roles: ['employee','manager','admin'] },
    { to: '/calendar', label: 'Calendar', icon: CalendarDays, roles: ['employee','manager','admin'] },
    { to: '/notifications', label: 'Notifications', icon: Bell, roles: ['employee','manager','admin'] },
    { to: '/approvals', label: 'Approvals', icon: ShieldCheck, roles: ['manager','admin'] },
    { to: '/employees', label: 'Employee Management', icon: Users, roles: ['admin'] },
    { to: '/policies', label: 'Leave Policies', icon: Palmtree, roles: ['admin'] },
    { to: '/holidays', label: 'Holiday Management', icon: CalendarDays, roles: ['admin'] },
    { to: '/reports', label: 'Reports & Analytics', icon: ChartNoAxesCombined, roles: ['admin','manager'] },
    { to: '/settings', label: 'Settings', icon: Settings, roles: ['employee','manager','admin'] },
  ].filter(item => item.roles.includes(sessionUser.role))

  return (
    <div className="app-shell">
      {mobileOpen && <button className="sidebar-backdrop" aria-label="Close menu" onClick={() => setMobileOpen(false)} />}
      <aside className={`sidebar ${mobileOpen ? 'open' : ''}`}>
        <button className="brand" onClick={() => navigate('/')}>
          <span className="brand-mark"><Palmtree size={20} /></span>
          <span>LeaveFlow</span>
        </button>
        <nav className="nav-list">
          {nav.map(item => (
            <NavLink key={item.to} to={item.to} onClick={() => setMobileOpen(false)} className={({isActive}) => `nav-item ${isActive ? 'active' : ''}`}>
              <item.icon size={18} /><span>{item.label}</span>
            </NavLink>
          ))}
        </nav>
        <div className="sidebar-profile">
          <div className="avatar">{sessionUser.name.split(' ').map(n => n[0]).join('')}</div>
          <div><strong>{sessionUser.name}</strong><small>{sessionUser.role[0].toUpperCase() + sessionUser.role.slice(1)}</small></div>
          <button aria-label="Log out" onClick={logout}><LogOut size={17}/></button>
        </div>
      </aside>
      <main className="main-area">
        <header className="topbar">
          <button className="icon-btn menu-btn" onClick={() => setMobileOpen(true)}><Menu size={20}/></button>
          <div className="global-search"><Search size={17}/><input placeholder="Search employees, leave requests..." onKeyDown={(event)=>{if(event.key==='Enter'){navigate('/history');toast.success('Opening leave search results')}}} /><kbd>⌘ K</kbd></div>
          <div className="top-actions">
            <div className="notification-wrap">
              <button className="icon-btn" onClick={() => setNotificationsOpen(!notificationsOpen)}><Bell size={19}/><span className="unread-dot">3</span></button>
              {notificationsOpen && <NotificationMenu onClose={() => setNotificationsOpen(false)} />}
            </div>
            <div className="top-avatar">{sessionUser.name.split(' ').map(n => n[0]).join('')}</div>
            <button className="profile-menu" onClick={()=>navigate('/settings')}>{sessionUser.name}<ChevronDown size={15}/></button>
          </div>
        </header>
        <div className="content">
          <Routes>
            <Route path="/" element={<Dashboard user={sessionUser}/>} />
            <Route path="/apply" element={<ApplyLeave user={sessionUser}/>} />
            <Route path="/balance" element={<BalancePage/>} />
            <Route path="/history" element={<HistoryPage role={sessionUser.role}/>} />
            <Route path="/calendar" element={<CalendarPage/>} />
            <Route path="/notifications" element={<NotificationsPage/>} />
            <Route path="/approvals" element={sessionUser.role === 'employee' ? <Navigate to="/"/> : <ApprovalsPage/>} />
            <Route path="/employees" element={sessionUser.role === 'admin' ? <EmployeesPage/> : <Navigate to="/"/>} />
            <Route path="/policies" element={sessionUser.role === 'admin' ? <PoliciesPage/> : <Navigate to="/"/>} />
            <Route path="/holidays" element={sessionUser.role === 'admin' ? <HolidaysPage/> : <Navigate to="/"/>} />
            <Route path="/reports" element={sessionUser.role === 'employee' ? <Navigate to="/"/> : <ReportsPage/>} />
            <Route path="/settings" element={<SettingsPage user={sessionUser}/>} />
            <Route path="*" element={<Navigate to="/"/>} />
          </Routes>
        </div>
      </main>
    </div>
  )
}

function Login({ onLogin }: { onLogin: (user: User) => void }) {
  const [email, setEmail] = useState('sarah@leaveflow.com')
  const [password, setPassword] = useState('demo1234')
  const [mode,setMode] = useState<'login'|'register'>('login')
  const navigate = useNavigate()
  const submit = async (e: FormEvent) => {
    e.preventDefault()
    if (mode === 'register') {
      if (supabase) {
        const { error } = await supabase.auth.signUp({ email, password })
        if (error) return toast.error(error.message)
        toast.success('Account created. Check your email if confirmation is required.')
      }
      onLogin(seedUsers[0]); navigate('/'); return
    }
    if (supabase) {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) return toast.error(error.message)
      const role = email.includes('admin') ? 'admin' : email.includes('manager') ? 'manager' : 'employee'
      const user = seedUsers.find(u => u.role === role) || seedUsers[0]
      onLogin(user); navigate('/')
    } else {
      const role: Role = email.includes('admin') ? 'admin' : email.includes('manager') ? 'manager' : 'employee'
      const user = seedUsers.find(u => u.role === role) || seedUsers[0]
      onLogin(user); navigate('/')
      toast.success('Signed in to demo workspace')
    }
  }
  const reset = async () => {
    if (supabase) {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/login`,
      })
      if (error) return toast.error(error.message)
      toast.success('Password reset instructions sent')
    } else {
      toast.success('Password reset instructions would be sent by Supabase Auth')
    }
  }
  return (
    <div className="login-page">
      <div className="login-visual">
        <div className="brand login-brand"><span className="brand-mark"><Palmtree size={20}/></span><span>LeaveFlow</span></div>
        <div className="login-quote"><p>TIME / ACCESS / INTELLIGENCE</p><h1>Your time.<br/>Managed better.</h1></div>
      </div>
      <div className="login-form-wrap">
        <form className="login-card" onSubmit={submit}>
          <h2>{mode==='login'?'Welcome back':'Create your account'}</h2><p>{mode==='login'?'Sign in to your workspace':'Register as an employee'}</p>
          <label>Email address<input type="email" value={email} onChange={e => setEmail(e.target.value)} required/></label>
          <label>Password<input type="password" value={password} onChange={e => setPassword(e.target.value)} required/></label>
          <button className="link-btn" type="button" onClick={reset}>Forgot password?</button>
          <button className="primary-btn full" type="submit">{mode==='login'?'Sign in':'Create account'}</button>
          <button className="link-btn" type="button" onClick={()=>setMode(mode==='login'?'register':'login')}>{mode==='login'?'New employee? Create an account':'Already have an account? Sign in'}</button>
          <div className="demo-hints"><span>Demo accounts</span><button type="button" onClick={() => setEmail('sarah@leaveflow.com')}>Employee</button><button type="button" onClick={() => setEmail('manager@leaveflow.com')}>Manager</button><button type="button" onClick={() => setEmail('admin@leaveflow.com')}>Admin</button></div>
        </form>
      </div>
    </div>
  )
}

function PageHeader({ title, subtitle, action }: { title: string; subtitle?: string; action?: ReactNode }) {
  return <div className="page-header"><div><h1>{title}</h1>{subtitle && <p>{subtitle}</p>}</div>{action}</div>
}

function StatCard({ label, value, detail, icon, tone }: { label: string; value: string | number; detail: string; icon: ReactNode; tone: string }) {
  return <div className="stat-card"><div className={`stat-icon ${tone}`}>{icon}</div><div><span>{label}</span><strong>{value}</strong><small>{detail}</small></div></div>
}

function StatusBadge({ status }: { status: string }) {
  return <span className={`status-badge ${status.toLowerCase()}`}>{status}</span>
}

function Dashboard({ user }: { user: User }) {
  const navigate = useNavigate()
  const isAdmin = user.role === 'admin'
  const isManager = user.role === 'manager'
  const [leaves] = useStore<Leave[]>('lf-leaves', seedLeaves)
  const chartData = [
    { month: 'Jun', leaves: 42 }, { month: 'Jul', leaves: 55 }, { month: 'Aug', leaves: 48 },
    { month: 'Sep', leaves: 68 }, { month: 'Oct', leaves: 61 }, { month: 'Nov', leaves: 74 },
  ]
  const distribution = [
    { name: 'Casual', value: 38, color: '#c4c9ce' }, { name: 'Sick', value: 24, color: '#75aa8a' },
    { name: 'Earned', value: 21, color: '#7f8790' }, { name: 'Other', value: 17, color: '#9aa4b2' },
  ]
  if (isAdmin || isManager) {
    const exportReport = () => {
      const csv = 'Month,Leave days\nJun,42\nJul,55\nAug,48\nSep,68\nOct,61\nNov,74'
      const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }))
      const anchor = document.createElement('a')
      anchor.href = url; anchor.download = 'leaveflow-overview.csv'; anchor.click()
      URL.revokeObjectURL(url); toast.success('Overview report exported')
    }
    return <>
      <PageHeader title={isAdmin ? 'HR Overview' : 'Team Dashboard'} subtitle={`Welcome back, ${user.name.split(' ')[0]}`} action={<button className="primary-btn" onClick={exportReport}><Download size={16}/>Export report</button>} />
      <div className="stats-grid four">
        <StatCard label="Total Employees" value={isAdmin ? '248' : '32'} detail="+12 this quarter" icon={<Users size={20}/>} tone="blue"/>
        <StatCard label="Pending Requests" value="8" detail="3 need your review" icon={<Clock3 size={20}/>} tone="amber"/>
        <StatCard label="Currently on Leave" value="14" detail="5.6% of workforce" icon={<Palmtree size={20}/>} tone="green"/>
        <StatCard label="Leave Days Taken" value="486" detail="This year" icon={<CalendarDays size={20}/>} tone="purple"/>
      </div>
      <div className="dashboard-grid">
        <section className="panel wide"><div className="panel-head"><div><h3>Monthly Leave Trends</h3><p>Approved leave days</p></div><select><option>Last 6 months</option></select></div><div className="chart-box"><ResponsiveContainer width="100%" height="100%"><AreaChart data={chartData}><defs><linearGradient id="leaveFill" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#c4c9ce" stopOpacity={0.25}/><stop offset="95%" stopColor="#c4c9ce" stopOpacity={0}/></linearGradient></defs><CartesianGrid strokeDasharray="3 3" vertical={false}/><XAxis dataKey="month"/><YAxis/><Tooltip/><Area type="monotone" dataKey="leaves" stroke="#c4c9ce" fill="url(#leaveFill)" strokeWidth={2}/></AreaChart></ResponsiveContainer></div></section>
        <section className="panel"><div className="panel-head"><div><h3>Leave Distribution</h3><p>By category</p></div></div><div className="chart-box"><ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={distribution} dataKey="value" innerRadius={55} outerRadius={78} paddingAngle={3}>{distribution.map(d => <Cell key={d.name} fill={d.color}/>)}</Pie><Tooltip/></PieChart></ResponsiveContainer></div></section>
      </div>
      <section className="panel"><div className="panel-head"><div><h3>Recent Applications</h3><p>Latest submissions across the organization</p></div><button className="link-btn" onClick={()=>navigate('/history')}>View all</button></div><LeaveTable leaves={leaves} compact/></section>
    </>
  }
  return <>
    <PageHeader title={`Good morning, ${user.name.split(' ')[0]}`} subtitle={`${user.employeeId}  •  ${user.department}  •  ${user.designation}`} action={<button className="primary-btn" onClick={() => navigate('/apply')}><Plus size={16}/>Apply for leave</button>} />
    <div className="stats-grid four">
      <StatCard label="Available Balance" value="18.5" detail="days remaining" icon={<WalletCards size={20}/>} tone="blue"/>
      <StatCard label="Leaves Taken" value="7" detail="this year" icon={<Palmtree size={20}/>} tone="green"/>
      <StatCard label="Pending Applications" value="2" detail="awaiting approval" icon={<Clock3 size={20}/>} tone="amber"/>
      <StatCard label="Approved Upcoming" value="3" detail="next 30 days" icon={<CircleCheck size={20}/>} tone="purple"/>
    </div>
    <div className="dashboard-grid">
      <section className="panel wide"><div className="panel-head"><div><h3>My Leave Balance</h3><p>Annual allocation overview</p></div><button className="link-btn" onClick={()=>navigate('/balance')}>View details</button></div><div className="balance-list">
        {[
          ['Casual Leave','CL',12,7,5,'#c4c9ce'],['Sick Leave','SL',10,3,7,'#75aa8a'],['Earned Leave','EL',15,4,11,'#7f8790'],['Privilege Leave','PL',5,0,5,'#a2a8ae']
        ].map(([n,c,a,u,av,color]) => <div className="balance-row" key={String(c)}><div className="balance-type"><span style={{background:String(color)}}>{String(c)}</span><div><strong>{String(n)}</strong><small>{String(u)} used</small></div></div><div className="balance-bar"><div style={{width:`${Number(u)/Number(a)*100}%`, background:String(color)}}/></div><strong>{String(av)} days</strong></div>)}
      </div></section>
      <section className="panel"><div className="panel-head"><div><h3>Upcoming Holidays</h3><p>India · Maharashtra</p></div></div><div className="holiday-list"><div><span>08<br/><small>NOV</small></span><div><strong>Diwali</strong><small>Sunday</small></div></div><div><span>25<br/><small>DEC</small></span><div><strong>Christmas</strong><small>Friday</small></div></div><div><span>01<br/><small>JAN</small></span><div><strong>New Year</strong><small>Thursday</small></div></div></div></section>
    </div>
    <section className="panel"><div className="panel-head"><div><h3>Recent Applications</h3><p>Your latest leave requests</p></div><button className="link-btn" onClick={()=>navigate('/history')}>View history</button></div><LeaveTable leaves={seedLeaves.filter(l => l.employee === user.name)} compact/></section>
  </>
}

function LeaveTable({ leaves, compact=false }: { leaves: Leave[]; compact?: boolean }) {
  return <div className="table-wrap"><table><thead><tr><th>Employee</th><th>Leave type</th><th>Dates</th><th>Days</th><th>Status</th>{!compact && <th>Action</th>}</tr></thead><tbody>{leaves.map(l => <tr key={l.id}><td><div className="person-cell"><div className="mini-avatar">{l.employee.split(' ').map(n => n[0]).join('')}</div><div><strong>{l.employee}</strong><small>{l.department}</small></div></div></td><td>{l.type}</td><td>{formatDate(l.start)} – {formatDate(l.end)}</td><td>{l.days}</td><td><StatusBadge status={l.status}/></td>{!compact && <td><button className="row-action" onClick={()=>toast.success(`${l.id}: ${l.status} — ${l.reason}`)}>View</button></td>}</tr>)}</tbody></table></div>
}

function formatDate(value: string) { return new Date(value + 'T00:00:00').toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }) }

function calculateBusinessDays(start: string, end: string, half: boolean) {
  if (!start || !end || end < start) return 0
  let count = 0
  const cursor = new Date(start + 'T00:00:00')
  const finish = new Date(end + 'T00:00:00')
  while (cursor <= finish) { const day = cursor.getDay(); if (day !== 0 && day !== 6) count++; cursor.setDate(cursor.getDate()+1) }
  return half ? Math.max(0.5, count * 0.5) : count
}

function ApplyLeave({ user }: { user: User }) {
  const [leaves, setLeaves] = useStore<Leave[]>('lf-leaves', seedLeaves)
  const [type, setType] = useState('Casual Leave')
  const [start, setStart] = useState('')
  const [end, setEnd] = useState('')
  const [half, setHalf] = useState(false)
  const [reason, setReason] = useState('')
  const [contact, setContact] = useState('')
  const navigate = useNavigate()
  const days = calculateBusinessDays(start, end, half)
  const submit = (e: FormEvent) => {
    e.preventDefault()
    if (!start || !end || end < start) return toast.error('Please select a valid date range')
    if (!reason.trim()) return toast.error('Reason is required')
    const overlaps = leaves.some(l => l.employeeId === user.employeeId && l.status !== 'Rejected' && l.status !== 'Cancelled' && start <= l.end && end >= l.start)
    if (overlaps) return toast.error('This request overlaps an existing application')
    if (days > 18.5 && type !== 'Unpaid Leave') return toast.warning('Insufficient leave balance. This may be processed as unpaid leave.')
    const next: Leave = { id: `LV-${Date.now().toString().slice(-6)}`, employeeId: user.employeeId, employee: user.name, type, start, end, days, status: 'Pending', reason, submitted: new Date().toISOString().slice(0,10), department: user.department }
    setLeaves([next, ...leaves])
    toast.success('Leave application submitted successfully')
    navigate('/history')
  }
  return <>
    <PageHeader title="Apply for Leave" subtitle="Submit a new leave request"/>
    <form className="form-layout" onSubmit={submit}>
      <section className="panel form-panel">
        <h3>Leave Details</h3>
        <div className="form-grid">
          <label>Leave type<select value={type} onChange={e => setType(e.target.value)}><option>Casual Leave</option><option>Sick Leave</option><option>Earned Leave</option><option>Privilege Leave</option><option>Maternity Leave</option><option>Paternity Leave</option><option>Bereavement Leave</option><option>Compensatory Off</option><option>Unpaid Leave</option></select></label>
          <div/>
          <label>Start date<input type="date" value={start} min={new Date().toISOString().slice(0,10)} onChange={e => setStart(e.target.value)} required/></label>
          <label>End date<input type="date" value={end} min={start || new Date().toISOString().slice(0,10)} onChange={e => setEnd(e.target.value)} required/></label>
          <label className="check-label"><input type="checkbox" checked={half} onChange={e => setHalf(e.target.checked)}/> Half-day application</label>
          <label>Contact details during leave<input value={contact} onChange={e => setContact(e.target.value)} placeholder="Phone number or email"/></label>
          <label className="full-field">Reason for leave<textarea value={reason} onChange={e => setReason(e.target.value)} placeholder="Briefly describe the reason for your leave" required/></label>
          <label className="full-field">Supporting document <input type="file"/></label>
        </div>
      </section>
      <aside className="panel summary-panel"><h3>Request Summary</h3><div className="summary-days"><strong>{days || '—'}</strong><span>working days</span></div><dl><div><dt>Leave type</dt><dd>{type}</dd></div><div><dt>Available balance</dt><dd>18.5 days</dd></div><div><dt>Balance after request</dt><dd>{type === 'Unpaid Leave' ? 'No deduction' : `${Math.max(0, 18.5-days)} days`}</dd></div></dl>{days > 18.5 && type !== 'Unpaid Leave' && <p className="warning">Insufficient balance. Please choose Unpaid Leave or reduce the dates.</p>}<button className="primary-btn full" type="submit">Submit application</button><button className="secondary-btn full" type="button" onClick={() => toast.success('Draft saved')}>Save draft</button></aside>
    </form>
  </>
}

function BalancePage() {
  const balances = [
    ['Casual Leave','CL',12,7,5],['Sick Leave','SL',10,3,7],['Earned Leave','EL',15,4,11],
    ['Privilege Leave','PL',5,0,5],['Compensatory Off','CO',3,1,2],['Unpaid Leave','LWP',0,0,0]
  ] as const
  return <>
    <PageHeader title="My Leave Balance" subtitle="Leave allocation and usage for 2026"/>
    <div className="balance-cards">{balances.map(([name,code,allocated,used,available],i) => <section className="panel balance-card" key={name}><div className="balance-card-head"><span className={`code-chip c${i%4}`}>{code}</span><h3>{name}</h3></div><strong className="big-number">{available}<small> days available</small></strong><div className="balance-bar large"><div style={{width:`${allocated ? used/allocated*100 : 0}%`}}/></div><div className="balance-meta"><span>Allocated <strong>{allocated}</strong></span><span>Used <strong>{used}</strong></span><span>Pending <strong>{i===0?2:0}</strong></span></div></section>)}</div>
  </>
}

function HistoryPage({ role }: { role: Role }) {
  const [leaves] = useStore<Leave[]>('lf-leaves', seedLeaves)
  const [search,setSearch] = useState('')
  const [status,setStatus] = useState('All')
  const filtered = leaves.filter(l => (role !== 'employee' || l.employee === 'Sarah Johnson') && (status === 'All' || l.status === status) && `${l.employee} ${l.type} ${l.id}`.toLowerCase().includes(search.toLowerCase()))
  const exportHistory = () => {
    const csv = 'Application,Employee,Type,Start,End,Days,Status\n' + filtered.map(l => `${l.id},${l.employee},${l.type},${l.start},${l.end},${l.days},${l.status}`).join('\n')
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }))
    const anchor = document.createElement('a'); anchor.href=url; anchor.download='leave-history.csv'; anchor.click(); URL.revokeObjectURL(url)
    toast.success('Leave history exported')
  }
  return <>
    <PageHeader title="Leave History" subtitle={`${filtered.length} applications`} action={<button className="secondary-btn" onClick={exportHistory}><Download size={16}/>Export CSV</button>}/>
    <section className="panel"><div className="table-toolbar"><div className="global-search table-search"><Search size={16}/><input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search applications..."/></div><select value={status} onChange={e=>setStatus(e.target.value)}><option>All</option><option>Pending</option><option>Approved</option><option>Rejected</option><option>Cancelled</option></select><button className="filter-btn" onClick={()=>toast.success(`${filtered.length} applications match the current filters`)}><Settings size={16}/>Filters</button></div><LeaveTable leaves={filtered}/><div className="pagination"><span>Showing 1–{filtered.length} of {filtered.length}</span><div><button disabled>‹</button><button className="active-page">1</button><button disabled>›</button></div></div></section>
  </>
}

function CalendarPage() {
  const [leaves] = useStore<Leave[]>('lf-leaves', seedLeaves)
  const [view,setView] = useState('Month')
  const [cursor,setCursor] = useState(new Date(2026,10,1))
  const dateKey = (date: Date) => `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`
  const sameDate = (date: Date, value: string) => dateKey(date) === value
  const navigateCalendar = (direction: -1 | 1) => {
    const next = new Date(cursor)
    if (view === 'Month') next.setMonth(next.getMonth() + direction)
    else if (view === 'Week') next.setDate(next.getDate() + (direction * 7))
    else if (view === 'Day') next.setDate(next.getDate() + direction)
    setCursor(next)
  }
  const today = () => setCursor(new Date(2026,10,1))
  const monthTitle = cursor.toLocaleDateString('en-IN',{month:'long',year:'numeric'})
  const weekStart = new Date(cursor)
  weekStart.setDate(cursor.getDate() - cursor.getDay())
  const weekDays = Array.from({length:7},(_,i)=>{const date=new Date(weekStart);date.setDate(weekStart.getDate()+i);return date})
  const monthStart = new Date(cursor.getFullYear(),cursor.getMonth(),1)
  const leadingDays = monthStart.getDay()
  const daysInMonth = new Date(cursor.getFullYear(),cursor.getMonth()+1,0).getDate()
  const monthCells = [
    ...Array.from({length:leadingDays},()=>null),
    ...Array.from({length:daysInMonth},(_,i)=>new Date(cursor.getFullYear(),cursor.getMonth(),i+1))
  ]
  const renderEvents = (date: Date) => <>
    {dateKey(date)==='2026-11-03'&&<b className="event approved" onClick={()=>toast.success('Sarah Johnson · Approved leave')}>Sarah · Leave</b>}
    {dateKey(date)==='2026-11-06'&&<b className="event pending" onClick={()=>toast.success('James Wilson · Pending sick leave')}>James · Sick</b>}
    {dateKey(date)==='2026-11-08'&&<b className="event holiday" onClick={()=>toast.success('Diwali · Public holiday')}>Diwali Holiday</b>}
    {dateKey(date)==='2026-11-12'&&<b className="event pending blue-event" onClick={()=>toast.success('Emma Davis · Pending earned leave')}>Emma · Earned</b>}
    {leaves.filter(leave=>sameDate(date,leave.start)).map(leave=><b key={leave.id} className={`event ${leave.status==='Approved'?'approved':leave.status==='Rejected'?'rejected-event':'pending blue-event'}`} onClick={()=>toast.success(`${leave.employee}: ${leave.status}`)}>{leave.employee.split(' ')[0]} · {leave.type}</b>)}
  </>
  return <>
    <PageHeader title="Leave Calendar" subtitle="Team availability and approved absences" action={<div className="segmented">{['Month','Week','Day','List'].map(v=><button key={v} className={view===v?'active':''} onClick={()=>setView(v)}>{v}</button>)}</div>}/>
    {view === 'List' && <section className="panel"><LeaveTable leaves={leaves}/></section>}
    {view === 'Month' && <section className="panel calendar-panel"><div className="calendar-head"><button aria-label="Previous month" onClick={()=>navigateCalendar(-1)}>‹</button><h3>{monthTitle}</h3><button aria-label="Next month" onClick={()=>navigateCalendar(1)}>›</button><button className="today-btn" onClick={today}>Today</button></div><div className="calendar-grid weekdays">{['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map(d=><div key={d}>{d}</div>)}</div><div className="calendar-grid dates">{monthCells.map((date,i)=><div key={i} className={!date?'blank':''}>{date&&<><span>{date.getDate()}</span>{renderEvents(date)}</>}</div>)}</div></section>}
    {view === 'Week' && <section className="panel calendar-panel"><div className="calendar-head"><button aria-label="Previous week" onClick={()=>navigateCalendar(-1)}>‹</button><h3>{weekStart.toLocaleDateString('en-IN',{day:'2-digit',month:'short'})} – {weekDays[6].toLocaleDateString('en-IN',{day:'2-digit',month:'short',year:'numeric'})}</h3><button aria-label="Next week" onClick={()=>navigateCalendar(1)}>›</button><button className="today-btn" onClick={today}>Today</button></div><div className="calendar-grid weekdays">{weekDays.map(date=><div key={dateKey(date)}>{date.toLocaleDateString('en-IN',{weekday:'short'})} · {date.getDate()}</div>)}</div><div className="calendar-grid week-view">{weekDays.map(date=><div key={dateKey(date)}><span>{date.toLocaleDateString('en-IN',{weekday:'long'})}</span>{renderEvents(date)}</div>)}</div></section>}
    {view === 'Day' && <section className="panel calendar-panel"><div className="calendar-head"><button aria-label="Previous day" onClick={()=>navigateCalendar(-1)}>‹</button><h3>{cursor.toLocaleDateString('en-IN',{weekday:'long',day:'2-digit',month:'long',year:'numeric'})}</h3><button aria-label="Next day" onClick={()=>navigateCalendar(1)}>›</button><button className="today-btn" onClick={today}>Today</button></div><div className="day-view"><div className="day-timeline">{['09:00','12:00','15:00','18:00'].map(time=><div key={time}><span>{time}</span><i/></div>)}</div><div className="day-events">{renderEvents(cursor)}{leaves.filter(leave=>sameDate(cursor,leave.start)).length===0&&dateKey(cursor)!=='2026-11-03'&&dateKey(cursor)!=='2026-11-06'&&dateKey(cursor)!=='2026-11-08'&&dateKey(cursor)!=='2026-11-12'&&<p className="empty-calendar">No leave or holidays scheduled for this day.</p>}</div></div></section>}
  </>
}

function NotificationsPage() {
  const items = [
    ['New leave approved','Your Casual Leave request for 3–4 Nov was approved','2 hours ago'],
    ['Manager comment','Michael Chen added a comment to your leave request','Yesterday'],
    ['Holiday reminder','Diwali falls on 8 Nov. Plan your leave accordingly','2 days ago'],
    ['Balance updated','Your Earned Leave balance was updated to 11 days','4 days ago']
  ]
  return <><PageHeader title="Notifications" subtitle="Updates and activity" action={<button className="secondary-btn" onClick={()=>toast.success('All notifications marked as read')}><Check size={16}/>Mark all as read</button>}/><section className="panel notification-list">{items.map(([title,body,time],i)=><div className="notification-row" key={title}><div className={`notification-icon n${i}`}><Bell size={18}/></div><div><strong>{title}</strong><p>{body}</p><small>{time}</small></div>{i<2&&<span className="unread-dot static"/>}</div>)}</section></>
}

function NotificationMenu({ onClose }: { onClose: () => void }) {
  const navigate = useNavigate()
  return <div className="notification-menu"><div className="notification-menu-head"><strong>Notifications</strong><button onClick={onClose}><X size={16}/></button></div><button onClick={()=>navigate('/notifications')}><span><CircleCheck size={17}/></span><div><strong>Leave request approved</strong><small>2 hours ago</small></div></button><button onClick={()=>navigate('/notifications')}><span><Clock3 size={17}/></span><div><strong>New approval pending</strong><small>Yesterday</small></div></button><button className="menu-view-all" onClick={()=>{navigate('/notifications');onClose()}}>View all notifications</button></div>
}

function ApprovalsPage() {
  const [leaves,setLeaves] = useStore<Leave[]>('lf-leaves', seedLeaves)
  const pending = leaves.filter(l=>l.status==='Pending')
  const decide = (leave: Leave, status: 'Approved'|'Rejected') => {
    if (status === 'Rejected') {
      const reason = window.prompt('Enter a rejection reason:')
      if (!reason?.trim()) return toast.error('A rejection reason is required')
    }
    setLeaves(leaves.map(l=>l.id===leave.id?{...l,status}:l))
    toast.success(`Request ${status.toLowerCase()}`)
  }
  return <><PageHeader title="Leave Approvals" subtitle={`${pending.length} requests awaiting your decision`}/><div className="approval-list">{pending.map(leave=><section className="panel approval-card" key={leave.id}><div className="approval-person"><div className="avatar">{leave.employee.split(' ').map(n=>n[0]).join('')}</div><div><strong>{leave.employee}</strong><small>{leave.employeeId} · {leave.department}</small></div><StatusBadge status={leave.status}/></div><div className="approval-details"><div><small>Leave type</small><strong>{leave.type}</strong></div><div><small>Dates</small><strong>{formatDate(leave.start)} – {formatDate(leave.end)}</strong></div><div><small>Duration</small><strong>{leave.days} day(s)</strong></div><div><small>Reason</small><strong>{leave.reason}</strong></div></div><div className="approval-actions"><button className="danger-outline" onClick={()=>decide(leave,'Rejected')}><X size={16}/>Reject</button><button className="success-btn" onClick={()=>decide(leave,'Approved')}><Check size={16}/>Approve</button></div></section>)}</div></>
}

function EmployeesPage() {
  const [employees,setEmployees] = useStore<User[]>('lf-employees', seedUsers)
  const [search,setSearch] = useState('')
  const [showForm,setShowForm] = useState(false)
  const [draft,setDraft] = useState({name:'',email:'',department:'Engineering',designation:''})
  const filtered = employees.filter(e=>`${e.name} ${e.email} ${e.employeeId}`.toLowerCase().includes(search.toLowerCase()))
  const addEmployee = (e:FormEvent) => {
    e.preventDefault()
    setEmployees([...employees,{id:`u${Date.now()}`,name:draft.name,email:draft.email,role:'employee',employeeId:`LF-2026-${String(employees.length+1).padStart(3,'0')}`,department:draft.department,designation:draft.designation,manager:'Michael Chen',status:'Active'}])
    setDraft({name:'',email:'',department:'Engineering',designation:''}); setShowForm(false); toast.success('Employee added')
  }
  return <><PageHeader title="Employee Management" subtitle={`${employees.length} employees`} action={<button className="primary-btn" onClick={()=>setShowForm(true)}><Plus size={16}/>Add employee</button>}/><section className="panel"><div className="table-toolbar"><div className="global-search table-search"><Search size={16}/><input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search employees..."/></div><select><option>All departments</option><option>Engineering</option><option>Product</option><option>Marketing</option></select><select><option>All statuses</option><option>Active</option><option>Inactive</option></select></div><div className="table-wrap"><table><thead><tr><th>Employee</th><th>Employee ID</th><th>Department</th><th>Designation</th><th>Manager</th><th>Status</th><th>Action</th></tr></thead><tbody>{filtered.map(e=><tr key={e.id}><td><div className="person-cell"><div className="mini-avatar">{e.name.split(' ').map(n=>n[0]).join('')}</div><div><strong>{e.name}</strong><small>{e.email}</small></div></div></td><td>{e.employeeId}</td><td>{e.department}</td><td>{e.designation}</td><td>{e.manager}</td>  <td><span className={`status-badge ${e.status.toLowerCase()==='inactive'?'rejected':'approved'}`}>{e.status}</span></td><td><button className="row-action" onClick={()=>{setEmployees(employees.map(x=>x.id===e.id?{...x,status:x.status==='Active'?'Inactive':'Active'}:x));toast.success(`Employee ${e.status==='Active'?'deactivated':'reactivated'}`)}}>{e.status==='Active'?'Deactivate':'Reactivate'}</button></td></tr>)}</tbody></table></div></section>{showForm&&<div className="modal-backdrop"><form className="modal" onSubmit={addEmployee}><div className="modal-head"><h3>Add Employee</h3><button type="button" onClick={()=>setShowForm(false)}><X size={18}/></button></div><label>Full name<input required value={draft.name} onChange={e=>setDraft({...draft,name:e.target.value})}/></label><label>Email address<input type="email" required value={draft.email} onChange={e=>setDraft({...draft,email:e.target.value})}/></label><label>Department<select value={draft.department} onChange={e=>setDraft({...draft,department:e.target.value})}><option>Engineering</option><option>Product</option><option>Marketing</option><option>Human Resources</option></select></label><label>Designation<input required value={draft.designation} onChange={e=>setDraft({...draft,designation:e.target.value})}/></label><button className="primary-btn full" type="submit">Add employee</button></form></div>}</>
}

function PoliciesPage() {
  const [policies,setPolicies] = useStore('lf-policies', [
    {name:'Casual Leave',code:'CL',allocation:12,accrual:'Monthly',carry:0,negative:false,half:true},
    {name:'Sick Leave',code:'SL',allocation:10,accrual:'Annual',carry:0,negative:false,half:true},
    {name:'Earned Leave',code:'EL',allocation:15,accrual:'Monthly',carry:30,negative:false,half:false},
    {name:'Privilege Leave',code:'PL',allocation:5,accrual:'Annual',carry:0,negative:false,half:true},
  ])
  const addPolicy = () => {
    setPolicies([...policies, {name:'Custom Leave',code:`CP${policies.length+1}`,allocation:5,accrual:'Annual',carry:0,negative:false,half:true}])
    toast.success('Custom policy added')
  }
  return <><PageHeader title="Leave Policies" subtitle="Configure allocations, accruals and eligibility" action={<button className="primary-btn" onClick={addPolicy}><Plus size={16}/>Add policy</button>}/><section className="panel"><div className="policy-grid">{policies.map((p,i)=><div className="policy-card" key={p.code}><div className="policy-head"><span className={`code-chip c${i%4}`}>{p.code}</span><strong>{p.name}</strong><button className="row-action" onClick={()=>{setPolicies(policies.map(x=>x.code===p.code?{...x,allocation:x.allocation+1}:x));toast.success('Policy allocation updated')}}>Edit</button></div><dl><div><dt>Annual allocation</dt><dd>{p.allocation} days</dd></div><div><dt>Accrual</dt><dd>{p.accrual}</dd></div><div><dt>Carry forward</dt><dd>{p.carry}%</dd></div><div><dt>Half-day</dt><dd>{p.half?'Allowed':'Not allowed'}</dd></div></dl></div>)}</div></section></>
}

function HolidaysPage() {
  const [holidays,setHolidays] = useStore('lf-holidays', [
    {id:'h1',name:'Diwali',date:'2026-11-08',type:'National',recurring:true},
    {id:'h2',name:'Christmas',date:'2026-12-25',type:'National',recurring:true},
    {id:'h3',name:'New Year',date:'2027-01-01',type:'Organization',recurring:true},
  ])
  const add = () => {
    setHolidays([...holidays,{id:`h${Date.now()}`,name:'Company Foundation Day',date:'2026-12-15',type:'Organization',recurring:false}])
    toast.success('Holiday added')
  }
  return <><PageHeader title="Holiday Management" subtitle={`${holidays.length} organization holidays`} action={<button className="primary-btn" onClick={add}><Plus size={16}/>Add holiday</button>}/><section className="panel"><div className="table-wrap"><table><thead><tr><th>Holiday name</th><th>Date</th><th>Type</th><th>Recurring</th><th>Action</th></tr></thead><tbody>{holidays.map(h=><tr key={h.id}><td><strong>{h.name}</strong></td><td>{formatDate(h.date)}</td><td>{h.type}</td><td>{h.recurring?'Yes':'No'}</td><td><button className="row-action" onClick={()=>{setHolidays(holidays.filter(x=>x.id!==h.id));toast.success('Holiday deleted')}}>Delete</button></td></tr>)}</tbody></table></div></section></>
}

function ReportsPage() {
  const chartData = [
    {month:'Jun',approved:45,rejected:8},{month:'Jul',approved:52,rejected:6},{month:'Aug',approved:48,rejected:11},
    {month:'Sep',approved:63,rejected:7},{month:'Oct',approved:58,rejected:9},{month:'Nov',approved:71,rejected:5}
  ]
  const exportCSV = () => {
    const csv='Month,Approved,Rejected\n'+chartData.map(r=>`${r.month},${r.approved},${r.rejected}`).join('\n')
    const url=URL.createObjectURL(new Blob([csv],{type:'text/csv'})); const a=document.createElement('a'); a.href=url;a.download='leave-report.csv';a.click();URL.revokeObjectURL(url)
    toast.success('Report exported as CSV')
  }
  return <><PageHeader title="Reports & Analytics" subtitle="Organization-wide leave insights" action={<button className="primary-btn" onClick={exportCSV}><Download size={16}/>Export CSV</button>}/><section className="report-filters"><label>From<input type="date" defaultValue="2026-06-01"/></label><label>To<input type="date" defaultValue="2026-11-30"/></label><button className="secondary-btn" onClick={()=>toast.success('Report filters applied')}>Apply filters</button></section><div className="dashboard-grid"><section className="panel wide"><div className="panel-head"><div><h3>Approval versus rejection</h3><p>Monthly application outcomes</p></div></div><div className="chart-box"><ResponsiveContainer width="100%" height="100%"><BarChart data={chartData}><CartesianGrid strokeDasharray="3 3" vertical={false}/><XAxis dataKey="month"/><YAxis/><Tooltip/><Bar dataKey="approved" fill="#75aa8a" radius={[4,4,0,0]}/><Bar dataKey="rejected" fill="#7f8790" radius={[4,4,0,0]}/></BarChart></ResponsiveContainer></div></section><section className="panel"><div className="panel-head"><div><h3>Department utilization</h3></div></div><div className="department-list">{[['Engineering','82%'],['Product','68%'],['Marketing','54%'],['Sales','46%']].map(([n,v])=> <div key={n}><span>{n}</span><div><i style={{width:v}}/></div><strong>{v}</strong></div>)}</div></section></div></>
}

function SettingsPage({ user }: { user: User }) {
  const [name,setName] = useState(user.name)
  const [phone,setPhone] = useState('')
  return <><PageHeader title="Settings" subtitle="Manage your profile and preferences"/><div className="settings-grid"><section className="panel settings-panel"><h3>Profile Information</h3><div className="settings-avatar"><div className="avatar large-avatar">{name.split(' ').map(n=>n[0]).join('')}</div><button className="secondary-btn" onClick={()=>toast.success('Profile photo picker opened')}>Change photo</button></div><label>Full name<input value={name} onChange={e=>setName(e.target.value)}/></label><label>Email address<input value={user.email} disabled/></label><label>Phone number<input value={phone} onChange={e=>setPhone(e.target.value)} placeholder="+91 98765 43210"/></label><button className="primary-btn" onClick={()=>toast.success('Profile updated')}>Save changes</button></section><section className="panel settings-panel"><h3>Preferences</h3><label className="toggle-row"><div><strong>Email notifications</strong><small>Receive application updates by email</small></div><input type="checkbox" defaultChecked/></label><label className="toggle-row"><div><strong>In-app notifications</strong><small>Show notifications in the notification center</small></div><input type="checkbox" defaultChecked/></label><label className="toggle-row"><div><strong>Weekly summary</strong><small>Get a team leave summary every Monday</small></div><input type="checkbox"/></label></section></div></>
}

export default function App() {
  return <BrowserRouter><Toaster position="top-right"/><Routes><Route path="/login" element={<LoginRoute/>}/><Route path="/*" element={<AppShell/>}/></Routes></BrowserRouter>
}

function LoginRoute() {
  const [sessionUser,setSessionUser] = useStore<User|null>('lf-session', seedUsers[0])
  return sessionUser ? <Navigate to="/"/> : <Login onLogin={(user)=>{setSessionUser(user)}}/>
}
