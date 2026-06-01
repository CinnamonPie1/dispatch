import React, { useState, useEffect } from 'react';
import { 
  onAuthStateChanged, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  updateProfile,
  signOut,
  User 
} from 'firebase/auth';
import { auth } from './firebase';
import { LogIn, LogOut, Users, Calendar as CalendarIcon, History, Plus, Trash2, CheckCircle2, RotateCcw, AlertTriangle, Globe } from 'lucide-react';
import { Team, Person, Assignment } from './types';
import { getPeople, addPeopleBulk, deletePerson, saveAssignment, getAssignments, confirmCollaboration, checkIsAdmin, addAdmin, toggleEmergencyDept, updateCollabCount, deleteAssignment, toggleLimitOverride, getSystemSettings, updateSystemSettings } from './services/dbService';
import { getShiftForTeam, shuffle } from './utils/shiftLogic';
import { format, startOfToday } from 'date-fns';
import { translations, Language } from './translations';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<'dashboard' | 'people' | 'history' | 'admin'>('dashboard');
  const [people, setPeople] = useState<Person[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [maxCollaborationThreshold, setMaxCollaborationThreshold] = useState<number>(6);
  const [maxDailyCollaborators, setMaxDailyCollaborators] = useState<number>(7);

  // Language state, default to Spanish
  const [lang, setLang] = useState<Language>(() => {
    const saved = localStorage.getItem('dispatch_lang');
    return (saved as Language) || 'es';
  });

  // Centralized email/password auth state
  const [showLoginForm, setShowLoginForm] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [adminName, setAdminName] = useState('');
  const [authError, setAuthError] = useState<string | null>(null);
  const [isAuthenticating, setIsAuthenticating] = useState(false);

  const t = translations[lang];

  const toggleLanguage = () => {
    const nextLang = lang === 'en' ? 'es' : 'en';
    setLang(nextLang);
    localStorage.setItem('dispatch_lang', nextLang);
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (u) => {
      setUser(u);
      if (u) {
        const adminStatus = await checkIsAdmin(u.uid);
        setIsAdmin(adminStatus || u.email === 'davidcordero1012@gmail.com');
      } else {
        setIsAdmin(false);
      }
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  useEffect(() => {
    loadData();
  }, [user]);

  async function loadData() {
    try {
      const [peopleData, assignmentsData, settingsData] = await Promise.all([
        getPeople(),
        getAssignments(),
        getSystemSettings()
      ]);
      setPeople(peopleData);
      setAssignments(assignmentsData.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
      if (settingsData) {
        if (typeof settingsData.maxCollaborationThreshold === 'number') {
          setMaxCollaborationThreshold(settingsData.maxCollaborationThreshold);
        }
        if (typeof settingsData.maxDailyCollaborators === 'number') {
          setMaxDailyCollaborators(settingsData.maxDailyCollaborators);
        }
      }
    } catch (error) {
      console.error("Error loading data", error);
    }
  }

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) return;
    setIsAuthenticating(true);
    setAuthError(null);
    try {
      await signInWithEmailAndPassword(auth, email.trim(), password);
      setShowLoginForm(false);
      setEmail('');
      setPassword('');
      setAuthError(null);
    } catch (err: any) {
      console.error(err);
      if (err.code === 'auth/operation-not-allowed') {
        setAuthError(lang === 'es' 
          ? 'El inicio de sesión por correo/contraseña está desactivado en la consola de Firebase. Por favor, habilítelo.'
          : 'Email/Password sign-in provider is disabled in your Firebase console. Please enable it.'
        );
      } else if (err.code === 'auth/wrong-password' || err.code === 'auth/user-not-found' || err.code === 'auth/invalid-credential') {
        setAuthError(lang === 'es' ? 'Dirección de correo o contraseña incorrectas.' : 'Incorrect email or password credentials.');
      } else {
        setAuthError(err.message);
      }
    } finally {
      setIsAuthenticating(false);
    }
  };

  const handleSignUpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim() || !adminName.trim()) return;
    setIsAuthenticating(true);
    setAuthError(null);
    try {
      const cred = await createUserWithEmailAndPassword(auth, email.trim(), password);
      await updateProfile(cred.user, { displayName: adminName.trim() });
      
      // Auto-add to admins collection if matching primary email
      if (email.trim() === 'davidcordero1012@gmail.com') {
        await addAdmin(cred.user.uid, email.trim());
      }
      
      setShowLoginForm(false);
      setEmail('');
      setPassword('');
      setAdminName('');
      setAuthError(null);
    } catch (err: any) {
      console.error(err);
      if (err.code === 'auth/operation-not-allowed') {
        setAuthError(lang === 'es' 
          ? 'El registro con correo/contraseña está deshabilitado en Firebase.'
          : 'Email/Password registration is disabled in your Firebase console.'
        );
      } else {
        setAuthError(err.message);
      }
    } finally {
      setIsAuthenticating(false);
    }
  };

  const handleLogout = () => signOut(auth);

  if (loading) {
    return (
      <div className="min-h-screen grid place-items-center bg-[#0F1115]">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-blue-500"></div>
      </div>
    );
  }

  const publicDashboard = !user ? (
    <div className="min-h-screen bg-[#0F1115] flex flex-col font-sans text-[#E2E8F0]">
      <header className="bg-[#151921] border-b border-white/10 px-8 py-6 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center gap-4">
          <div className="bg-blue-600 p-2 rounded-lg">
            <Users className="text-white w-5 h-5" />
          </div>
          <h1 className="text-xl font-bold tracking-tight text-white">Daily <span className="text-blue-400">Dispatch</span></h1>
        </div>
        <div className="flex items-center gap-3">
          <button 
            type="button"
            onClick={toggleLanguage}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-[#1b212c] hover:bg-[#232a39] border border-white/5 rounded-lg text-xs text-slate-300 font-semibold transition-all cursor-pointer"
          >
            <Globe className="w-3.5 h-3.5 text-blue-400" />
            <span>{lang === 'es' ? 'EN' : 'ES'}</span>
          </button>
          <button 
            type="button"
            onClick={() => {
              setShowLoginForm(!showLoginForm);
              setAuthError(null);
            }} 
            className="flex items-center gap-2 px-5 py-2 bg-blue-600 hover:bg-blue-500 rounded-full text-xs font-bold text-white transition-all shadow-lg shadow-blue-900/20 cursor-pointer"
          >
            <LogIn className="w-3.5 h-3.5" />
            {showLoginForm ? (lang === 'es' ? 'Volver' : 'Back') : t.adminLoginTitle}
          </button>
        </div>
      </header>
      <main className="flex-1 p-6 md:p-12 overflow-auto flex flex-col justify-center items-center">
        {showLoginForm ? (
          <div className="w-full max-w-sm bg-[#151921] border border-white/10 rounded-2xl p-6 md:p-8 shadow-2xl relative">
            <div className="text-center mb-6">
              <h2 className="text-xl font-bold tracking-tight text-white">{isSignUp ? t.signUpBtn : t.adminLoginTitle}</h2>
              <p className="text-xs text-slate-400 mt-2">{t.adminLoginDesc}</p>
            </div>
            
            <form onSubmit={isSignUp ? handleSignUpSubmit : handleLoginSubmit} className="space-y-4">
              {isSignUp && (
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500">{lang === 'es' ? 'Nombre de Administrador' : 'Admin Name'}</label>
                  <input 
                    type="text" 
                    value={adminName}
                    onChange={e => setAdminName(e.target.value)}
                    required
                    className="w-full px-4 py-2 bg-[#0F1115] border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-blue-500 transition-colors"
                    placeholder="e.g. David Cordero"
                  />
                </div>
              )}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500">{t.emailLabel}</label>
                <input 
                  type="email" 
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                  className="w-full px-4 py-2 bg-[#0F1115] border border-white/10 rounded-xl text-white text-sm font-mono focus:outline-none focus:border-blue-500 transition-colors"
                  placeholder="admin@example.com"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500">{t.passwordLabel}</label>
                <input 
                  type="password" 
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  className="w-full px-4 py-2 bg-[#0F1115] border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-blue-500 transition-colors"
                  placeholder="••••••••"
                />
              </div>

              {authError && (
                <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl flex gap-1.5 items-start text-xs text-red-400">
                  <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{authError}</span>
                </div>
              )}

              <button 
                type="submit" 
                disabled={isAuthenticating}
                className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold text-xs uppercase tracking-widest mt-4 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {isAuthenticating ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-white"></div>
                ) : (
                  isSignUp ? t.signUpBtn : t.loginBtn
                )}
              </button>
            </form>

            <div className="text-center mt-6 pt-6 border-t border-white/5">
              <button 
                type="button"
                onClick={() => {
                  setIsSignUp(!isSignUp);
                  setAuthError(null);
                }}
                className="text-xs text-blue-400 hover:text-blue-300 font-semibold cursor-pointer transition-colors"
              >
                {isSignUp ? t.loginLink : t.signUpLink}
              </button>
            </div>
          </div>
        ) : (
          <div className="max-w-6xl w-full mx-auto space-y-8">
            <div className="bg-blue-600/5 border border-blue-500/10 rounded-2xl p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div className="flex gap-4 items-start">
                <div className="p-3 bg-blue-600/10 rounded-xl text-blue-400 shrink-0">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-white text-sm">{t.alertTitle}</h4>
                  <p className="text-xs text-slate-400 leading-relaxed mt-1">{t.alertDesc}</p>
                </div>
              </div>
            </div>
            <Dashboard people={people} assignments={assignments} onUpdate={loadData} isAdmin={false} lang={lang} t={t} maxCollaborationThreshold={maxCollaborationThreshold} maxDailyCollaborators={maxDailyCollaborators} />
          </div>
        )}
      </main>
    </div>
  ) : null;

  if (!user) {
    return publicDashboard;
  }

  return (
    <div className="min-h-screen bg-[#0F1115] flex flex-col md:flex-row font-sans text-[#E2E8F0]">
      {/* Sidebar */}
      <aside className="w-full md:w-72 bg-[#151921] border-b md:border-b-0 md:border-r border-white/10 p-8 flex flex-col">
        <div className="flex flex-col mb-10 px-2">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-semibold tracking-tight text-white">ShiftAssign <span className="text-blue-400">Pro</span></h1>
          </div>
          <p className="text-[10px] text-slate-500 uppercase font-bold tracking-widest mt-1">{lang === 'es' ? 'Despachador Determinista' : 'Deterministic Dispatcher'}</p>
        </div>
        
        <nav className="flex-1 space-y-2">
          <NavItem 
            icon={<CalendarIcon className="w-5 h-5" />} 
            label={t.dashboard} 
            active={view === 'dashboard'} 
            onClick={() => setView('dashboard')} 
          />
          <NavItem 
            icon={<Users className="w-5 h-5" />} 
            label={t.personnel} 
            active={view === 'people'} 
            onClick={() => setView('people')} 
          />
          <NavItem 
            icon={<History className="w-5 h-5" />} 
            label={lang === 'es' ? 'Registro Histórico' : t.dispatchHistory} 
            active={view === 'history'} 
            onClick={() => setView('history')} 
          />
          {isAdmin && (
            <NavItem 
              icon={<RotateCcw className="w-5 h-5" />} 
              label={t.adminSettings} 
              active={view === 'admin'} 
              onClick={() => setView('admin')} 
            />
          )}
        </nav>

        <div className="mt-auto pt-6 border-t border-white/5 space-y-4">
          <button 
            type="button"
            onClick={toggleLanguage}
            className="w-full flex items-center justify-between py-2.5 px-3 rounded-lg text-xs font-semibold text-slate-400 hover:text-white bg-[#0f1115]/40 hover:bg-[#0f1115]/80 transition-all border border-white/5 hover:border-white/10 cursor-pointer"
          >
            <span className="flex items-center gap-2">
              <Globe className="w-4 h-4 text-blue-400" />
              <span>{t.languageSelector}</span>
            </span>
            <span className="bg-blue-600/20 text-blue-400 px-1.5 py-0.5 rounded text-[10px] font-black uppercase tracking-wider">{lang.toUpperCase()}</span>
          </button>

          <div className="flex items-center gap-3.5 px-2">
            {user.photoURL ? (
              <img src={user.photoURL} alt="" className="w-9 h-9 rounded-full border border-white/10 ring-2 ring-white/5" />
            ) : (
              <div className="w-9 h-9 rounded-full bg-blue-600/30 text-blue-400 border border-blue-500/20 flex items-center justify-center font-bold text-sm shrink-0 leading-none">
                {(user.displayName || user.email || 'A').charAt(0).toUpperCase()}
              </div>
            )}
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <p className="text-sm font-bold truncate text-white">{user.displayName || (user.email ? user.email.split('@')[0] : 'Admin')}</p>
                {isAdmin && <span className="bg-blue-500/20 text-blue-400 text-[8px] px-1.5 py-0.5 rounded border border-blue-500/20 font-black uppercase tracking-wider">Admin</span>}
              </div>
              <p className="text-[10px] text-slate-500 truncate">{user.email}</p>
              <p className="text-[9px] font-mono text-slate-600 truncate mt-0.5 select-all" title="Click to select UID">UID: {user.uid}</p>
            </div>
          </div>
          <button onClick={handleLogout} className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-xs font-bold uppercase tracking-widest text-[#94A3B8] hover:text-red-400 hover:bg-red-500/5 border border-transparent hover:border-red-500/10 transition-all cursor-pointer">
            <LogOut className="w-4 h-4" />
            {t.signOut}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto p-6 md:p-10 bg-[#0F1115]">
        <div className="max-w-6xl mx-auto">
          {view === 'dashboard' && <Dashboard people={people} assignments={assignments} onUpdate={loadData} isAdmin={isAdmin} lang={lang} t={t} maxCollaborationThreshold={maxCollaborationThreshold} maxDailyCollaborators={maxDailyCollaborators} />}
          {view === 'people' && <PeopleManager people={people} onUpdate={loadData} isAdmin={isAdmin} lang={lang} t={t} maxCollaborationThreshold={maxCollaborationThreshold} />}
          {view === 'history' && <HistoryView assignments={assignments} people={people} onUpdate={loadData} isAdmin={isAdmin} lang={lang} t={t} />}
          {view === 'admin' && isAdmin && <AdminManager onUpdate={loadData} lang={lang} t={t} maxCollaborationThreshold={maxCollaborationThreshold} maxDailyCollaborators={maxDailyCollaborators} />}
        </div>
      </main>
    </div>
  );
}

function NavItem({ icon, label, active, onClick }: { icon: React.ReactNode, label: string, active: boolean, onClick: () => void }) {
  return (
    <button 
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-semibold transition-all group ${
        active 
          ? 'bg-blue-600/10 text-blue-400 border border-blue-500/20 shadow-[0_0_20px_rgba(59,130,246,0.05)]' 
          : 'text-slate-400 hover:bg-white/5 hover:text-white border border-transparent'
      }`}
    >
      <span className={`${active ? 'text-blue-400' : 'text-slate-500 group-hover:text-slate-300'}`}>{icon}</span>
      {label}
    </button>
  );
}

function Dashboard({ people, assignments, onUpdate, isAdmin, lang, t, maxCollaborationThreshold, maxDailyCollaborators }: { people: Person[], assignments: Assignment[], onUpdate: () => void, isAdmin: boolean, lang: Language, t: any, maxCollaborationThreshold: number, maxDailyCollaborators: number }) {
  const today = startOfToday();
  const [currentDate, setCurrentDate] = useState(today);
  const [isSaving, setIsSaving] = useState(false);
  const [raffleType, setRaffleType] = useState<'morning' | 'afternoon'>('morning');
  const [sortField, setSortField] = useState<'name' | 'team' | 'collabs' | 'status'>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  const existingAssignment = assignments.find(a => 
    new Date(a.date).toDateString() === currentDate.toDateString() && 
    (a.type === raffleType || (!a.type && raffleType === 'morning'))
  );

  const handleSort = (field: typeof sortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  const sortedPeople = [...people].sort((a, b) => {
    const shiftA = getShiftForTeam(currentDate, a.team);
    const shiftB = getShiftForTeam(currentDate, b.team);
    
    const isEligibleA = (raffleType === 'morning' ? shiftA === '8h' : shiftA === '24h') && (a.collaborationCount < maxCollaborationThreshold || a.limitOverride) && !a.isEmergencyDept;
    const isEligibleB = (raffleType === 'morning' ? shiftB === '8h' : shiftB === '24h') && (b.collaborationCount < maxCollaborationThreshold || b.limitOverride) && !b.isEmergencyDept;

    let compare = 0;
    if (sortField === 'name') compare = a.name.localeCompare(b.name);
    else if (sortField === 'team') compare = a.team.localeCompare(b.team);
    else if (sortField === 'collabs') compare = a.collaborationCount - b.collaborationCount;
    else if (sortField === 'status') {
      const getStatusRank = (p: Person, shift: string, eligible: boolean) => {
        if (p.collaborationCount >= maxCollaborationThreshold) return 3;
        if (eligible) return 0;
        if (shift === '24h') return 1;
        return 2;
      };
      compare = getStatusRank(a, shiftA, isEligibleA) - getStatusRank(b, shiftB, isEligibleB);
    }
    
    return sortOrder === 'asc' ? compare : -compare;
  });

  const shifts: Record<Team, string> = {
    '1': getShiftForTeam(currentDate, '1'),
    '2': getShiftForTeam(currentDate, '2'),
    '3': getShiftForTeam(currentDate, '3'),
    '4': getShiftForTeam(currentDate, '4'),
  };

  const availablePeople = people.filter(p => {
    const shift = getShiftForTeam(currentDate, p.team);
    const shiftCheck = raffleType === 'morning' ? shift === '8h' : shift === '24h';
    const countCheck = p.collaborationCount < maxCollaborationThreshold || p.limitOverride;
    return shiftCheck && countCheck && !p.isEmergencyDept;
  });

  const generateList = async () => {
    if (existingAssignment || availablePeople.length === 0) return;
    setIsSaving(true);
    try {
      const shuffled = shuffle(availablePeople);
      const selectedCollaborators = shuffled.slice(0, maxDailyCollaborators);
      
      await saveAssignment({
        date: currentDate.toISOString(),
        type: raffleType,
        assignedPeopleIds: selectedCollaborators.map(p => p.id),
        confirmedCollaborationIds: [],
        status: 'draft',
        createdAt: new Date().toISOString()
      });
      onUpdate();
    } catch (e) {
      console.error(e);
    } finally {
      setIsSaving(false);
    }
  };

  const displayedList = existingAssignment 
    ? (existingAssignment.assignedPeopleIds.map(id => people.find(p => p.id === id)).filter(Boolean) as Person[])
    : [];

  return (
    <div className="space-y-10">
      <header className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 border-b border-white/5 pb-8">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-white">{t.dailyDispatch}</h2>
          <p className="text-slate-400 font-medium mt-1">{t.assignmentsDesc}</p>
        </div>
        <div className="flex gap-4">
          <div className="flex bg-[#151921] p-1 rounded-xl border border-white/5">
            <button 
              type="button"
              onClick={() => setRaffleType('morning')}
              className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all cursor-pointer ${raffleType === 'morning' ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/20' : 'text-slate-500 hover:text-slate-300'}`}
            >
              {t.morning}
            </button>
            <button 
              type="button"
              onClick={() => setRaffleType('afternoon')}
              className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all cursor-pointer ${raffleType === 'afternoon' ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/20' : 'text-slate-500 hover:text-slate-300'}`}
            >
              {t.afternoon}
            </button>
          </div>
          <div className="flex flex-col gap-1.5 min-w-[200px]">
            <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500">{t.selectedDate}</label>
            <input 
              type="date" 
              className="input font-mono text-sm cursor-pointer"
              value={format(currentDate, 'yyyy-MM-dd')}
              onChange={(e) => setCurrentDate(new Date(e.target.value + 'T12:00:00'))}
            />
          </div>
        </div>
      </header>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {(['1', '2', '3', '4'] as Team[]).map(team => {
          const shift = shifts[team];
          return (
            <div key={team} className="card p-5 border border-white/5 relative overflow-hidden group">
              <div className={`absolute top-0 left-0 w-1 h-full ${shift === '24h' ? 'bg-orange-500' : shift === 'Free' ? 'bg-slate-700' : 'bg-emerald-500'}`}></div>
              <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">
                {t.guardiaGroup.replace('{team}', team)}
              </span>
              <p className={`text-sm font-mono font-bold mt-1.5 ${shift === '24h' ? 'text-orange-400' : shift === 'Free' ? 'text-slate-500' : 'text-emerald-400'}`}>
                {shift === '8h' ? t.shift8h : shift === '24h' ? t.shift24h : t.offDuty}
              </p>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
        {/* Available Pool */}
        <section className="xl:col-span-7 flex flex-col">
          <div className="flex items-center justify-between mb-4 px-2">
            <div>
              <h3 className="font-bold text-lg text-white">{t.personnelRegistry}</h3>
              <p className="text-xs text-slate-500">{t.availabilityFilter}</p>
            </div>
            <span className="bg-white/5 text-slate-400 border border-white/10 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest">
              {t.validCount.replace('{count}', String(availablePeople.length))}
            </span>
          </div>
          
          <div className="card flex-1 overflow-hidden">
            <div className="overflow-auto max-h-[500px]">
              <table className="w-full text-left">
                <thead className="bg-[#151921] sticky top-0 z-10 border-b border-white/5 text-[10px] uppercase text-slate-500 tracking-widest">
                  <tr>
                    <th className="px-6 py-4 cursor-pointer hover:text-white transition-colors" onClick={() => handleSort('name')}>
                      {t.name} {sortField === 'name' && (sortOrder === 'asc' ? '↑' : '↓')}
                    </th>
                    <th className="px-6 py-4 cursor-pointer hover:text-white transition-colors" onClick={() => handleSort('team')}>
                      {t.guardia} {sortField === 'team' && (sortOrder === 'asc' ? '↑' : '↓')}
                    </th>
                    <th className="px-6 py-4 text-center cursor-pointer hover:text-white transition-colors" onClick={() => handleSort('collabs')}>
                      {t.collabs} {sortField === 'collabs' && (sortOrder === 'asc' ? '↑' : '↓')}
                    </th>
                    <th className="px-6 py-4 text-right cursor-pointer hover:text-white transition-colors" onClick={() => handleSort('status')}>
                      {t.status} {sortField === 'status' && (sortOrder === 'asc' ? '↑' : '↓')}
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {sortedPeople.map(p => {
                    const shift = getShiftForTeam(currentDate, p.team);
                    const shiftCheck = raffleType === 'morning' ? shift === '8h' : shift === '24h';
                    const countCheck = p.collaborationCount < maxCollaborationThreshold || p.limitOverride;
                    const isEligible = shiftCheck && countCheck && !p.isEmergencyDept;
                    return (
                      <tr key={p.id} className={`hover:bg-white/[0.02] transition-colors ${isEligible ? 'bg-emerald-500/[0.03]' : ''}`}>
                        <td className="px-6 py-4 font-medium text-sm text-white">
                          <div className="flex items-center gap-2">
                            {p.name}
                            {p.isEmergencyDept && <span className="text-[8px] bg-red-500/20 text-red-500 px-1.5 py-0.5 rounded font-bold uppercase ring-1 ring-red-500/10">ED</span>}
                            {p.limitOverride && <span className="text-[8px] bg-purple-500/20 text-purple-400 px-1.5 py-0.5 rounded font-bold uppercase ring-1 ring-purple-500/10">Override</span>}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-slate-400 font-mono text-xs">G{p.team}</td>
                        <td className="px-6 py-4 text-center font-mono text-sm text-slate-300 font-medium">
                          <span className={p.collaborationCount >= maxCollaborationThreshold && !p.limitOverride ? 'text-red-400' : 'text-slate-300'}>
                            {p.collaborationCount}/{maxCollaborationThreshold}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          {isEligible ? (
                            <span className="badge-emerald">{raffleType === 'morning' ? t.eligible8h : t.eligibleShift}</span>
                          ) : p.isEmergencyDept ? (
                            <span className="badge-red">{t.edBlock}</span>
                          ) : p.collaborationCount >= maxCollaborationThreshold && !p.limitOverride ? (
                            <span className="badge-red">{t.maxCollab}</span>
                          ) : shift === '24h' && raffleType === 'morning' ? (
                            <span className="badge-orange">{t.conflict24h}</span>
                          ) : (
                            <span className="bg-slate-700/40 text-slate-500 px-2 py-0.5 rounded text-[10px] font-bold uppercase">{t.offDuty}</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                  {people.length === 0 && (
                    <tr>
                      <td colSpan={4} className="px-6 py-20 text-center text-slate-500 italic">{t.noPersonnel}</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* Priority List */}
        <section className="xl:col-span-5 flex flex-col">
          <div className="flex items-center justify-between mb-4 px-2">
            <div>
              <h2 className="text-sm font-bold uppercase tracking-wider text-blue-400">
                {t.selectionTitle.replace('{type}', raffleType === 'morning' ? t.morning : t.afternoon)}
              </h2>
              <p className="text-xs text-slate-500 mt-1">{t.selectionDesc}</p>
              {existingAssignment?.createdAt && (
                <p className="text-[9px] font-mono text-slate-600 mt-1 uppercase tracking-tighter">
                  {t.generatedText.replace('{time}', format(new Date(existingAssignment.createdAt), 'MMM dd, HH:mm:ss'))}
                </p>
              )}
            </div>
            {!existingAssignment && (
              <button 
                type="button"
                disabled={availablePeople.length === 0}
                onClick={generateList} 
                className="p-2 text-blue-400 hover:bg-blue-400/10 rounded-lg transition-all cursor-pointer"
              >
                <RotateCcw className="w-5 h-5" />
              </button>
            )}
          </div>

          <div className="card flex-1 flex flex-col bg-[#11141a] p-4 gap-3 min-h-[450px]">
            {displayedList.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center text-slate-600 bg-[#0A0C10] rounded-xl border border-dashed border-white/5 p-6">
                <RotateCcw className={`w-12 h-12 mb-4 transition-all ${isSaving ? 'animate-spin opacity-50' : 'opacity-10'}`} />
                <p className="text-sm font-medium tracking-wide text-center">
                  {isSaving ? t.generatingBtn : t.generateBtn}
                </p>
              </div>
            ) : (
              displayedList.map((p, i) => (
                <div key={p.id} className={`flex items-center gap-5 p-4 rounded-xl border transition-all ${i === 0 ? 'bg-blue-500/10 border-blue-500/30' : 'bg-white/[0.03] border-white/5'}`}>
                  <span className={`font-mono text-xl font-bold ${i === 0 ? 'text-blue-400' : 'text-slate-600'}`}>{String(i + 1).padStart(2, '0')}</span>
                  <div className="flex-1">
                    <p className="text-sm font-bold text-white">{p.name}</p>
                    <p className={`text-[10px] font-bold uppercase tracking-widest ${i === 0 ? 'text-blue-300/60' : 'text-slate-500'}`}>
                      {t.collabs}: {p.collaborationCount}/{maxCollaborationThreshold} • {t.guardia} {p.team}
                    </p>
                  </div>
                  {i === 0 && <div className="h-3 w-3 rounded-full bg-blue-400 shadow-[0_0_12px_rgba(96,165,250,0.8)]"></div>}
                </div>
              ))
            )}
            
            {existingAssignment && (
              <div className="mt-auto p-4 bg-blue-500/5 border border-blue-500/10 rounded-xl text-center">
                <p className="text-[10px] uppercase font-black tracking-widest text-blue-400/60">{t.dispatchCommitted}</p>
              </div>
            )}
          </div>
        </section>
      </div>

      <footer className="card bg-[#0A0C10] px-8 py-5 flex flex-wrap justify-between items-center gap-6">
        <div className="flex flex-wrap gap-8">
          <div className="flex items-center gap-3">
            <div className="w-3 h-3 rounded-sm bg-emerald-500"></div>
            <span className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">8H Eligible</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-3 h-3 rounded-sm bg-orange-500 text-orange-500 shadow-[0_0_8px_rgba(249,115,22,0.3)]"></div>
            <span className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">24H Conflict</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-3 h-3 rounded-sm bg-red-600"></div>
            <span className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">Limit/Emergency</span>
          </div>
        </div>
        <div className="flex flex-col items-end">
          <p className="text-[10px] font-mono text-slate-600 font-bold uppercase tracking-widest leading-none">System Status: CALIBRATED // DATABASE: ACTIVE</p>
          {isAdmin && <p className="text-[8px] font-black text-blue-500 uppercase tracking-[0.2em] mt-1">Admin Mode Enabled</p>}
        </div>
      </footer>
    </div>
  );
}

function PeopleManager({ people, onUpdate, isAdmin, lang, t, maxCollaborationThreshold }: { people: Person[], onUpdate: () => void, isAdmin: boolean, lang: Language, t: any, maxCollaborationThreshold: number }) {
  const [name, setName] = useState('');
  const [team, setTeam] = useState<Team>('1');
  const [isEmergencyDept, setIsEmergencyDept] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [teamFilter, setTeamFilter] = useState<'all' | Team>('all');
  const [sortField, setSortField] = useState<'name' | 'team' | 'collabs'>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  const handleSort = (field: typeof sortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setIsSubmitting(true);
    
    // Split names by commas or line breaks, trim, and filter empty strings
    const nameList = name
      .split(/[\n,]+/)
      .map(n => n.trim())
      .filter(n => n.length > 0);

    if (nameList.length === 0) {
      setIsSubmitting(false);
      return;
    }

    try {
      if (nameList.length === 1) {
        await addPeopleBulk([nameList[0]], team, isEmergencyDept);
      } else {
        await addPeopleBulk(nameList, team, isEmergencyDept);
      }
      setName('');
      setIsEmergencyDept(false);
      onUpdate();
    } catch (e) {
      console.error(e);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deletePerson(id);
      setDeletingId(null);
      onUpdate();
    } catch (e: any) {
      console.error("Delete failed:", e);
      alert("Delete failed. Check console.");
    }
  };

  const filteredPeople = teamFilter === 'all' 
    ? people 
    : people.filter(p => p.team === teamFilter);

  const getTeamColor = (t: Team) => {
    switch(t) {
      case '1': return 'bg-blue-500';
      case '2': return 'bg-purple-500';
      case '3': return 'bg-emerald-500';
      case '4': return 'bg-amber-500';
      default: return 'bg-slate-500';
    }
  };

  return (
    <div className="space-y-10">
      <header className="border-b border-white/5 pb-8 flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-white">{t.onboardTitle}</h2>
          <p className="text-slate-400 font-medium mt-1">{t.onboardDesc}</p>
        </div>
        <div className="flex bg-[#151921] p-1 rounded-xl border border-white/5">
          <button 
            type="button"
            onClick={() => setTeamFilter('all')}
            className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all cursor-pointer ${teamFilter === 'all' ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/20' : 'text-slate-500 hover:text-slate-300'}`}
          >
            {t.all}
          </button>
          {['1', '2', '3', '4'].map(t => (
            <button 
              key={t}
              type="button"
              onClick={() => setTeamFilter(t as Team)}
              className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all cursor-pointer ${teamFilter === t ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/20' : 'text-slate-500 hover:text-slate-300'}`}
            >
              G{t}
            </button>
          ))}
        </div>
      </header>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-10 items-start">
        {isAdmin && (
          <section className="xl:col-span-4 bg-[#151921] p-8 rounded-2xl border border-white/5 shadow-2xl h-fit sticky top-10">
            <h3 className="font-bold text-lg text-white mb-8 border-b border-white/5 pb-4">{t.onboardHeader}</h3>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <div className="flex justify-between items-end mb-1">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500">{t.personnelRoster}</label>
                  <span className="text-[8px] font-mono text-slate-600 uppercase">{t.commaSeparated}</span>
                </div>
                <textarea 
                  value={name}
                  onChange={e => setName(e.target.value)}
                  className="input w-full text-sm min-h-[120px] py-3 resize-none" 
                  placeholder="John Doe, Jane Smith..." 
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500">{t.groupLabel}</label>
                <div className="grid grid-cols-4 gap-3">
                  {(['1', '2', '3', '4'] as Team[]).map(t => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setTeam(t)}
                      className={`relative py-3 rounded-xl font-bold font-mono transition-all border cursor-pointer ${team === t ? 'bg-blue-600 text-white border-blue-500 shadow-lg shadow-blue-900/30' : 'bg-[#0F1115] text-slate-500 border-white/5 hover:border-white/10'}`}
                    >
                      {t}
                      <div className={`absolute bottom-0 left-1/2 -translate-x-1/2 w-4 h-0.5 rounded-full ${getTeamColor(t as Team)} opacity-50`}></div>
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex items-center justify-between p-4 bg-[#0F1115] rounded-xl border border-white/5">
                <div className="flex flex-col">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">{t.edLabel}</span>
                  <span className="text-xs text-slate-400">{t.edDesc}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setIsEmergencyDept(!isEmergencyDept)}
                  className="w-12 h-6 rounded-full transition-all relative cursor-pointer bg-slate-700"
                  style={{ backgroundColor: isEmergencyDept ? '#DC2626' : undefined }}
                >
                  <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${isEmergencyDept ? 'left-7' : 'left-1'}`} />
                </button>
              </div>
              <button disabled={isSubmitting} className="w-full btn-primary py-4 mt-4 flex items-center justify-center gap-3 uppercase tracking-widest text-xs font-black cursor-pointer">
                <Plus className="w-5 h-5" />
                {isSubmitting ? t.processingBtn : t.registerBtn}
              </button>
            </form>
          </section>
        )}

        <section className={`${isAdmin ? 'xl:col-span-8' : 'xl:col-span-12'} flex flex-col gap-4`}>
          <div className="flex items-center justify-between px-2 mb-2">
            <h3 className="font-bold text-lg text-white">{t.registryDatabase}</h3>
            <div className="flex gap-3">
              {['1', '2', '3', '4'].map(tNum => (
                <div key={tNum} className="flex flex-col items-end opacity-50">
                    <span className="text-[9px] font-bold text-slate-600 uppercase tracking-tighter">
                      {t.guardiaGroup.replace('{team}', tNum)}
                    </span>
                    <span className={`text-xs font-mono font-bold ${getTeamColor(tNum as Team).replace('bg-', 'text-')}`}>{people.filter(p => p.team === tNum).length}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="card overflow-hidden">
            <div className="max-h-[600px] overflow-auto">
              <table className="w-full text-left">
                <thead className="bg-[#151921] border-b border-white/5 text-[10px] uppercase text-slate-500 tracking-widest">
                  <tr>
                    <th className="px-6 py-4 cursor-pointer hover:text-white transition-colors" onClick={() => handleSort('name')}>
                      {t.name} {sortField === 'name' && (sortOrder === 'asc' ? '↑' : '↓')}
                    </th>
                    <th className="px-6 py-4 cursor-pointer hover:text-white transition-colors" onClick={() => handleSort('team')}>
                      {t.guardia} {sortField === 'team' && (sortOrder === 'asc' ? 'asc' === sortOrder ? '↑' : '↓' : '')}
                    </th>
                    <th className="px-6 py-4 text-center cursor-pointer hover:text-white transition-colors" onClick={() => handleSort('collabs')}>
                      {t.collabs} {sortField === 'collabs' && (sortOrder === 'asc' ? '↑' : '↓')}
                    </th>
                    <th className="px-6 py-4 text-right">{lang === 'es' ? 'Acciones' : 'Actions'}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {filteredPeople.sort((a, b) => {
                    let compare = 0;
                    if (sortField === 'name') compare = a.name.localeCompare(b.name);
                    else if (sortField === 'team') compare = a.team.localeCompare(b.team);
                    else if (sortField === 'collabs') compare = a.collaborationCount - b.collaborationCount;
                    return sortOrder === 'asc' ? compare : -compare;
                  }).map(p => (
                    <tr key={p.id} className="hover:bg-white/[0.02] group transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-4">
                          <div className={`w-9 h-9 rounded-full bg-[#0F1115] border border-white/10 flex items-center justify-center font-bold text-sm shadow-inner ${getTeamColor(p.team).replace('bg-', 'text-')}`}>
                            {p.name.charAt(0)}
                          </div>
                          <div>
                             <p className="font-bold text-sm text-white">{p.name}</p>
                             <div className="flex gap-1 mt-1">
                               {p.collaborationCount >= maxCollaborationThreshold && <span className="badge-red text-[8px] px-1.5 py-0.5 shadow-[0_0_8px_rgba(239,68,68,0.2)]">{t.maxThreshold}</span>}
                               {p.isEmergencyDept && <span className="bg-red-500/10 text-red-500 border border-red-500/20 text-[8px] font-bold px-1.5 py-0.5 rounded uppercase">{t.emergencyDept}</span>}
                             </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <div className={`w-1.5 h-1.5 rounded-full ${getTeamColor(p.team)} shadow-[0_0_8px] ${getTeamColor(p.team).replace('bg-', 'shadow-')}`}></div>
                          <span className="font-mono text-xs text-slate-400">G{p.team}</span>
                        </div>
                      </td>
                         <td className="px-6 py-4 text-center font-mono text-sm leading-none">
                           <div className="flex flex-col items-center gap-1">
                              <div className="flex items-center gap-2">
                                <span className={p.collaborationCount >= maxCollaborationThreshold && !p.limitOverride ? 'text-red-400' : 'text-slate-300'}>{p.collaborationCount}</span>
                                {isAdmin && (
                                  <div className="flex gap-1">
                                    <button 
                                     type="button"
                                     onClick={() => updateCollabCount(p.id, Math.max(0, p.collaborationCount - 1)).then(onUpdate)}
                                     className="p-1 hover:bg-white/10 rounded text-[10px] text-slate-500 cursor-pointer"
                                    >-</button>
                                    <button 
                                     type="button"
                                     onClick={() => updateCollabCount(p.id, p.collaborationCount + 1).then(onUpdate)}
                                     className="p-1 hover:bg-white/10 rounded text-[10px] text-slate-500 cursor-pointer"
                                    >+</button>
                                  </div>
                                )}
                              </div>
                              <span className="text-[8px] text-slate-600 uppercase font-black">{p.limitOverride ? t.overridden : t.limitMarker.replace('{limit}', String(maxCollaborationThreshold))}</span>
                           </div>
                         </td>
                         <td className="px-6 py-4 text-right">
                           <div className="flex items-center justify-end gap-3">
                             {isAdmin && (
                               <div className="flex flex-col gap-1 items-end">
                                 <button
                                   type="button"
                                   onClick={() => toggleEmergencyDept(p.id, p.isEmergencyDept).then(onUpdate)}
                                   className={`px-2 py-1 rounded text-[8px] font-black uppercase transition-all whitespace-nowrap cursor-pointer ${p.isEmergencyDept ? 'bg-red-500/20 text-red-400 border border-red-500/30' : 'bg-slate-800 text-slate-500 hover:text-slate-300 border border-transparent'}`}
                                 >
                                   {p.isEmergencyDept ? t.edActive : t.setEd}
                                 </button>
                                 <button
                                   type="button"
                                   onClick={() => toggleLimitOverride(p.id, !!p.limitOverride).then(onUpdate)}
                                   className={`px-2 py-1 rounded text-[8px] font-black uppercase transition-all whitespace-nowrap cursor-pointer ${p.limitOverride ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-slate-800 text-slate-500 hover:text-slate-300 border border-transparent'}`}
                                 >
                                   {p.limitOverride ? t.overrideOn : t.overrideLimit}
                                 </button>
                               </div>
                             )}
                             {isAdmin && (
                               <div className="flex items-center gap-1">
                                 {deletingId === p.id ? (
                                    <div className="flex gap-1 animate-in fade-in slide-in-from-right-2 duration-300">
                                      <button 
                                        type="button"
                                        onClick={() => handleDelete(p.id)}
                                        className="px-5 py-2.5 bg-red-600 text-white text-[10px] font-black uppercase rounded-lg shadow-xl shadow-red-900/40 hover:bg-red-500 transition-all active:scale-95 cursor-pointer"
                                      >{t.confirm}</button>
                                      <button 
                                        type="button"
                                        onClick={() => setDeletingId(null)}
                                        className="px-5 py-2.5 bg-slate-700 text-slate-300 text-[10px] font-black uppercase rounded-lg hover:bg-slate-600 transition-all active:scale-95 cursor-pointer"
                                      >{t.cancel}</button>
                                    </div>
                                 ) : (
                                   <button 
                                     type="button"
                                     onClick={(e) => {
                                       e.stopPropagation();
                                       setDeletingId(p.id);
                                     }}
                                     className="p-3 text-slate-600 hover:text-red-500 transition-all opacity-40 hover:opacity-100 bg-white/5 hover:bg-red-500/10 rounded-xl cursor-pointer flex-shrink-0"
                                     title={t.deletePersonnel}
                                   >
                                     <Trash2 className="w-5 h-5" />
                                   </button>
                                 )}
                               </div>
                             )}
                           </div>
                         </td>
                    </tr>
                  ))}
                  {people.length === 0 && (
                    <tr>
                      <td colSpan={4} className="px-6 py-20 text-center text-slate-500 italic">{t.databaseEmpty}</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

function AdminManager({ onUpdate, lang, t, maxCollaborationThreshold, maxDailyCollaborators }: { onUpdate: () => void, lang: Language, t: any, maxCollaborationThreshold: number, maxDailyCollaborators: number }) {
  const [newAdminUid, setNewAdminUid] = useState('');
  const [newAdminEmail, setNewAdminEmail] = useState('');
  const [isAdding, setIsAdding] = useState(false);

  const [tempLimit, setTempLimit] = useState(maxCollaborationThreshold);
  const [tempDailyLimit, setTempDailyLimit] = useState(maxDailyCollaborators);
  const [isSavingSettings, setIsSavingSettings] = useState(false);

  useEffect(() => {
    setTempLimit(maxCollaborationThreshold);
  }, [maxCollaborationThreshold]);

  useEffect(() => {
    setTempDailyLimit(maxDailyCollaborators);
  }, [maxDailyCollaborators]);

  const handleAddAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAdminUid.trim() || !newAdminEmail.trim()) return;
    setIsAdding(true);
    try {
      await addAdmin(newAdminUid, newAdminEmail);
      setNewAdminUid('');
      setNewAdminEmail('');
      alert(t.successAdminCreated);
      onUpdate();
    } catch (error: any) {
      console.error(error);
      alert(t.failedAdminCreated);
    } finally {
      setIsAdding(false);
    }
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingSettings(true);
    try {
      await updateSystemSettings(tempLimit, tempDailyLimit);
      alert(t.settingSaveSuccess);
      onUpdate();
    } catch (err: any) {
      console.error(err);
      alert(lang === 'es' ? 'Error al guardar los ajustes.' : 'Failed to save settings.');
    } finally {
      setIsSavingSettings(false);
    }
  };

  return (
    <div className="space-y-10">
      <header className="border-b border-white/5 pb-8">
        <h2 className="text-3xl font-bold tracking-tight text-white">{t.systemAdmin}</h2>
        <p className="text-slate-400 font-medium mt-1">{t.adminDesc}</p>
      </header>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-10 items-start">
        <div className="xl:col-span-5 space-y-6">
          <section className="bg-[#151921] p-8 rounded-2xl border border-white/5 shadow-2xl h-fit">
            <h3 className="font-bold text-lg text-white mb-8 border-b border-white/5 pb-4">{t.authorizeTitle}</h3>
            <form onSubmit={handleAddAdmin} className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-widest text-[#94A3B8]">{t.userUid}</label>
                <input 
                  value={newAdminUid}
                  onChange={e => setNewAdminUid(e.target.value)}
                  className="input w-full text-xs font-mono" 
                  placeholder="Paste UID here..." 
                />
                <p className="text-[9px] text-slate-600">{t.uidHint}</p>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-widest text-[#94A3B8]">{t.officialEmail}</label>
                <input 
                  type="email"
                  value={newAdminEmail}
                  onChange={e => setNewAdminEmail(e.target.value)}
                  className="input w-full text-xs" 
                  placeholder="email@example.com" 
                />
              </div>
              <button disabled={isAdding} className="w-full btn-primary py-4 mt-4 flex items-center justify-center gap-3 uppercase tracking-widest text-xs font-black cursor-pointer">
                <CheckCircle2 className="w-5 h-5" />
                {isAdding ? t.authorizingBtn : t.authorizeBtn}
              </button>
            </form>
          </section>

          <section className="bg-[#151921] p-8 rounded-2xl border border-white/5 shadow-2xl">
            <h3 className="font-bold text-lg text-white mb-8 border-b border-white/5 pb-4">
              {lang === 'es' ? 'Parámetros del Sistema' : 'System Parameters'}
            </h3>
            <form onSubmit={handleSaveSettings} className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-widest text-[#94A3B8]">{t.settingMaxcollabsLabel}</label>
                <input 
                  type="number"
                  min="1"
                  max="50"
                  value={tempLimit}
                  onChange={e => setTempLimit(parseInt(e.target.value) || 1)}
                  className="input w-full text-xs font-mono font-bold text-white bg-black/40 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-blue-500 transition-colors"
                />
                <p className="text-[9px] text-slate-500 leading-relaxed">{t.settingMaxcollabsDesc}</p>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-widest text-[#94A3B8]">{t.settingMaxDailyLabel}</label>
                <input 
                  type="number"
                  min="1"
                  max="100"
                  value={tempDailyLimit}
                  onChange={e => setTempDailyLimit(parseInt(e.target.value) || 1)}
                  className="input w-full text-xs font-mono font-bold text-white bg-black/40 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-blue-500 transition-colors"
                />
                <p className="text-[9px] text-slate-500 leading-relaxed">{t.settingMaxDailyDesc}</p>
              </div>
              <button disabled={isSavingSettings} className="w-full btn-primary py-4 mt-4 flex items-center justify-center gap-3 uppercase tracking-widest text-xs font-black cursor-pointer">
                <CheckCircle2 className="w-5 h-5" />
                {isSavingSettings ? t.settingSavingBtn : t.settingSaveBtn}
              </button>
            </form>
          </section>
        </div>

        <section className="xl:col-span-7 space-y-6">
          <div className="bg-blue-600/5 border border-blue-500/20 p-8 rounded-2xl flex items-start gap-5">
            <div className="p-3 bg-blue-600/10 rounded-xl text-blue-400">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div>
              <h4 className="font-bold text-white mb-2">{t.advisoryTitle}</h4>
              <p className="text-sm text-slate-400 leading-relaxed italic">
                {t.advisoryDesc}
              </p>
            </div>
          </div>
          
          <div className="p-8 bg-black/20 rounded-2xl border border-white/5">
            <h4 className="text-xs font-black uppercase tracking-[0.2em] text-slate-500 mb-4">{t.operationalStatus}</h4>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-[#151921] p-5 rounded-xl border border-white/5">
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-600">{t.dbEngine}</p>
                <p className="text-xl font-mono font-black text-emerald-500 mt-1">{t.secure}</p>
              </div>
              <div className="bg-[#151921] p-5 rounded-xl border border-white/5">
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-600">{t.encryption}</p>
                <p className="text-xl font-mono font-black text-emerald-500 mt-1">{t.aes256}</p>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

function HistoryView({ assignments, people, onUpdate, isAdmin, lang, t }: { assignments: Assignment[], people: Person[], onUpdate: () => void, isAdmin: boolean, lang: Language, t: any }) {
  const [selectedAssignment, setSelectedAssignment] = useState<Assignment | null>(null);
  const [confirmedIds, setConfirmedIds] = useState<string[]>([]);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);

  useEffect(() => {
    if (selectedAssignment) {
      setConfirmedIds(selectedAssignment.confirmedCollaborationIds);
      setIsConfirmingDelete(false);
    }
  }, [selectedAssignment]);

  const handleConfirm = async () => {
    if (!selectedAssignment) return;
    setIsUpdating(true);
    try {
      await confirmCollaboration(selectedAssignment.id, confirmedIds);
      setSelectedAssignment(null);
      onUpdate();
    } catch (e) {
      console.error(e);
    } finally {
      setIsUpdating(false);
    }
  };

  const executeDeleteLog = async () => {
    if (!selectedAssignment) return;
    try {
      const id = selectedAssignment.id;
      setSelectedAssignment(null);
      await deleteAssignment(id);
      setIsConfirmingDelete(false);
      onUpdate();
    } catch (error) {
      console.error(error);
      alert(t.deleteFailed || 'Delete failed');
    }
  };

  const handleDeleteLogDirect = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      if (selectedAssignment?.id === id) setSelectedAssignment(null);
      await deleteAssignment(id);
      onUpdate();
    } catch (error) {
      console.error(error);
      alert(t.deleteFailed || 'Delete failed');
    }
  };

  const toggleConfirmed = (id: string) => {
    setConfirmedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  return (
    <div className="space-y-10">
      <header className="border-b border-white/5 pb-8">
        <h2 className="text-3xl font-bold tracking-tight text-white">{t.dispatchHistory}</h2>
        <p className="text-slate-400 font-medium mt-1">{t.historyDesc}</p>
      </header>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-10 items-start">
        <section className="xl:col-span-4 space-y-4">
          <h3 className="font-bold text-lg text-white mb-2 ml-2 tracking-tight">{t.deploymentLogs}</h3>
          <div className="space-y-3 max-h-[700px] overflow-auto pr-2">
            {assignments.length === 0 ? (
              <p className="text-slate-600 italic p-10 text-center">{t.noLogsGenerated}</p>
            ) : (
              assignments.map(a => (
                <div key={a.id} className="relative group">
                  <button 
                    type="button"
                    onClick={() => setSelectedAssignment(a)}
                    className={`w-full card p-5 text-left flex items-center justify-between transition-all border-l-4 cursor-pointer ${selectedAssignment?.id === a.id ? 'border-l-blue-500 bg-[#1e242b]' : 'border-l-transparent hover:bg-white/[0.03]'}`}
                  >
                    <div className="flex flex-col gap-1">
                      <p className={`font-mono text-sm font-bold tracking-tight ${selectedAssignment?.id === a.id ? 'text-white' : 'text-slate-400'}`}>
                        {format(new Date(a.date), 'dd MMM yyyy')}
                      </p>
                      <p className="text-[10px] uppercase font-black tracking-widest text-slate-600">
                        {t.personnelCount.replace('{count}', String(a.assignedPeopleIds.length))}
                      </p>
                    </div>
                    <div>
                      {a.status === 'confirmed' ? (
                        <span className="badge-emerald flex items-center gap-1.5 ring-1 ring-emerald-500/20">
                          <CheckCircle2 className="w-3 h-3 text-emerald-400" /> {t.certified}
                        </span>
                      ) : (
                        <span className="badge-orange flex items-center gap-1.5 ring-1 ring-orange-500/20">
                          <AlertTriangle className="w-3 h-3 text-orange-400" /> {t.pending}
                        </span>
                      )}
                    </div>
                  </button>
                  {isAdmin && (
                    <button 
                      type="button"
                      onClick={(e) => handleDeleteLogDirect(a.id, e)}
                      className="absolute -top-1.5 -right-1.5 p-1.5 bg-red-600 text-white rounded-lg shadow-xl hover:bg-red-500 transition-all active:scale-95 z-20 cursor-pointer opacity-0 group-hover:opacity-100"
                      title={t.deleteLogBtn}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              ))
            )}
          </div>
        </section>

        <section className="xl:col-span-8 h-full">
          {selectedAssignment ? (
            <div className="card h-full p-8 bg-[#11141a] border-white/10 flex flex-col">
               <div className="flex justify-between items-start mb-10 border-b border-white/5 pb-6 gap-4 flex-wrap">
                 <div>
                    <div className="flex items-center gap-4 flex-wrap">
                      <h3 className="text-2xl font-bold text-white tracking-tight">{t.auditLog}</h3>
                      {isAdmin && (
                        <div className="flex items-center">
                          {isConfirmingDelete ? (
                            <div className="flex gap-2 items-center bg-red-500/5 px-3 py-1.5 rounded-xl border border-red-500/10 animate-in fade-in duration-200">
                              <span className="text-[9px] text-red-400 font-bold uppercase tracking-tight">{lang === 'es' ? '¿Confirmar?' : 'Confirm?'}</span>
                              <button 
                                type="button"
                                onClick={executeDeleteLog}
                                className="px-2 py-0.5 bg-red-600 text-white text-[9px] font-black uppercase rounded transition-all cursor-pointer hover:bg-red-500"
                              >
                                {t.confirm}
                              </button>
                              <button 
                                type="button"
                                onClick={() => setIsConfirmingDelete(false)}
                                className="px-2 py-0.5 bg-slate-700 text-slate-300 text-[9px] font-black uppercase rounded transition-all cursor-pointer hover:bg-slate-600"
                              >
                                {t.cancel}
                              </button>
                            </div>
                          ) : (
                            <button 
                              type="button"
                              onClick={() => setIsConfirmingDelete(true)}
                              className="flex items-center gap-1.5 px-2.5 py-1 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/10 hover:border-red-500/20 rounded-lg text-xs font-bold transition-all cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              <span>{t.deleteLogBtn}</span>
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                    <p className="text-xs font-mono text-slate-500 mt-1.5 uppercase tracking-widest">{format(new Date(selectedAssignment.date), 'eeee, MMMM do, yyyy')}</p>
                 </div>
                 <div className="text-right">
                    <p className="text-[10px] font-bold text-slate-600 uppercase tracking-widest">{t.statusCode}</p>
                    <p className={`text-sm font-black tracking-widest uppercase mt-1 ${selectedAssignment.status === 'confirmed' ? 'text-emerald-400' : 'text-orange-400'}`}>
                      {selectedAssignment.status === 'confirmed' ? t.certified : t.pending}
                    </p>
                 </div>
               </div>

               <p className="text-sm text-slate-400 mb-8 italic">{t.certifyInstruction}</p>
               
               <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-10">
                 {selectedAssignment.assignedPeopleIds.map((id, index) => {
                   const person = people.find(p => p.id === id);
                   const isConfirmed = confirmedIds.includes(id);
                   return (
                     <button
                       type="button"
                       key={id}
                       disabled={selectedAssignment.status === 'confirmed'}
                       onClick={() => toggleConfirmed(id)}
                       className={`group flex items-center justify-between p-4 rounded-xl border transition-all text-left ${selectedAssignment.status === 'confirmed' ? 'cursor-not-allowed opacity-80' : 'cursor-pointer'} ${isConfirmed ? 'bg-blue-600/10 border-blue-600/40 text-white' : 'bg-white/[0.03] border-white/5 text-slate-500 hover:border-white/10'}`}
                     >
                       <div className="flex items-center gap-4">
                         <span className={`font-mono text-xs ${isConfirmed ? 'text-blue-400' : 'text-slate-700 font-black'}`}>{String(index + 1).padStart(2, '0')}</span>
                         <span className="font-bold text-sm tracking-wide">{person?.name || t.unknownId}</span>
                       </div>
                       <div className={`w-5 h-5 rounded-md border flex items-center justify-center transition-all ${isConfirmed ? 'bg-blue-600 border-blue-600 text-white shadow-lg shadow-blue-900/40' : 'border-white/10 group-hover:border-white/20'}`}>
                         {isConfirmed && <CheckCircle2 className="w-3 h-3" />}
                       </div>
                     </button>
                   );
                 })}
               </div>

               <div className="mt-auto">
                 {selectedAssignment.status === 'draft' ? (
                   isAdmin ? (
                     <button 
                      type="button"
                      disabled={isUpdating}
                      onClick={handleConfirm}
                      className="w-full btn-primary py-5 flex items-center justify-center gap-3 tracking-[0.2em] font-black group cursor-pointer"
                     >
                       <CheckCircle2 className="w-5 h-5 group-hover:scale-110 transition-transform" />
                       {t.certifyBtn}
                     </button>
                   ) : (
                     <div className="p-10 bg-black/20 rounded-2xl text-center border border-white/5 flex flex-col items-center gap-3">
                       <AlertTriangle className="w-12 h-12 mb-2 text-orange-400 opacity-20" />
                       <p className="text-sm font-bold text-slate-500 tracking-widest uppercase">{t.adminAuthRequired}</p>
                       <p className="text-xs text-slate-600 mt-1">{t.contactAdminDesc}</p>
                     </div>
                   )
                 ) : (
                   <div className="p-10 bg-black/20 rounded-2xl text-center border border-white/5 flex flex-col items-center gap-3">
                     <div className="w-12 h-12 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-500 ring-2 ring-emerald-500/5">
                        <CheckCircle2 className="w-6 h-6" />
                     </div>
                     <div>
                        <p className="text-sm font-bold text-slate-300 tracking-widest uppercase">{t.logFinalized}</p>
                        <p className="text-xs text-slate-500 mt-1">{t.logFinalizedDesc}</p>
                     </div>
                   </div>
                 )}
               </div>
            </div>
          ) : (
            <div className="h-full min-h-[500px] bg-white/[0.01] border-2 border-dashed border-white/5 rounded-3xl flex flex-col items-center justify-center text-slate-600 p-12">
              <History className="w-16 h-16 mb-6 opacity-5" />
              <p className="text-center font-medium max-w-xs leading-relaxed italic opacity-40">{t.selectLogPrompt}</p>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
