import React, { useState, useEffect } from 'react';
import { 
  onAuthStateChanged, 
  signInWithPopup, 
  GoogleAuthProvider, 
  signOut,
  User 
} from 'firebase/auth';
import { auth } from './firebase';
import { LogIn, LogOut, Users, Calendar as CalendarIcon, History, Plus, Trash2, CheckCircle2, RotateCcw, AlertTriangle } from 'lucide-react';
import { Team, Person, Assignment } from './types';
import { getPeople, addPerson, deletePerson, saveAssignment, getAssignments, confirmCollaboration, checkIsAdmin } from './services/dbService';
import { getShiftForTeam, shuffle } from './utils/shiftLogic';
import { format, startOfToday } from 'date-fns';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<'dashboard' | 'people' | 'history'>('dashboard');
  const [people, setPeople] = useState<Person[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (u) => {
      setUser(u);
      if (u) {
        const adminStatus = await checkIsAdmin(u.uid);
        setIsAdmin(adminStatus);
      } else {
        setIsAdmin(false);
      }
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user]);

  async function loadData() {
    try {
      const [peopleData, assignmentsData] = await Promise.all([
        getPeople(),
        getAssignments()
      ]);
      setPeople(peopleData);
      setAssignments(assignmentsData.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
    } catch (error) {
      console.error("Error loading data", error);
    }
  }

  const handleLogin = () => signInWithPopup(auth, new GoogleAuthProvider());
  const handleLogout = () => signOut(auth);

  if (loading) return <div className="min-h-screen grid place-items-center"><div className="animate-spin rounded-full h-8 w-8 border-t-2 border-black"></div></div>;

  if (!user) {
    return (
      <div className="min-h-screen bg-[#0F1115] grid place-items-center p-4 font-sans">
        <div className="max-w-md w-full bg-[#151921] p-10 rounded-2xl border border-white/5 text-center shadow-2xl">
          <div className="w-20 h-20 bg-blue-600 rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-lg shadow-blue-900/40">
            <Users className="text-white w-10 h-10" />
          </div>
          <h1 className="text-4xl font-bold tracking-tight mb-3 text-white">ShiftAssign <span className="text-blue-400">Pro</span></h1>
          <p className="text-slate-400 mb-10 font-medium uppercase text-xs tracking-widest">Automated Collaboration Dispatcher</p>
          <button onClick={handleLogin} className="w-full btn-primary flex items-center justify-center gap-3 py-4 text-base">
            <LogIn className="w-5 h-5" />
            Sign in with Google
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0F1115] flex flex-col md:flex-row font-sans text-[#E2E8F0]">
      {/* Sidebar */}
      <aside className="w-full md:w-72 bg-[#151921] border-b md:border-b-0 md:border-r border-white/10 p-8 flex flex-col">
        <div className="flex flex-col mb-12 px-2">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-semibold tracking-tight text-white">ShiftAssign <span className="text-blue-400">Pro</span></h1>
          </div>
          <p className="text-[10px] text-slate-500 uppercase font-bold tracking-widest mt-1">Collaboration Dispatcher</p>
        </div>
        
        <nav className="flex-1 space-y-3">
          <NavItem 
            icon={<CalendarIcon className="w-5 h-5" />} 
            label="Dashboard" 
            active={view === 'dashboard'} 
            onClick={() => setView('dashboard')} 
          />
          <NavItem 
            icon={<Users className="w-5 h-5" />} 
            label="Personnel Registry" 
            active={view === 'people'} 
            onClick={() => setView('people')} 
          />
          <NavItem 
            icon={<History className="w-5 h-5" />} 
            label="History Logs" 
            active={view === 'history'} 
            onClick={() => setView('history')} 
          />
        </nav>

        <div className="mt-auto pt-8 border-t border-white/5">
          <div className="flex items-center gap-4 px-2 mb-6">
            <img src={user.photoURL || ''} alt="" className="w-10 h-10 rounded-full border border-white/10 ring-2 ring-white/5" />
            <div className="min-w-0">
              <p className="text-sm font-bold truncate text-white">{user.displayName}</p>
              <p className="text-[10px] text-slate-500 truncate">{user.email}</p>
              <p className="text-[9px] font-mono text-slate-600 truncate mt-0.5 select-all" title="Click to select UID">UID: {user.uid}</p>
            </div>
          </div>
          <button onClick={handleLogout} className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-xs font-bold uppercase tracking-widest text-slate-500 hover:text-red-400 hover:bg-red-500/5 border border-transparent hover:border-red-500/10 transition-all">
            <LogOut className="w-4 h-4" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto p-6 md:p-10 bg-[#0F1115]">
        <div className="max-w-6xl mx-auto">
          {view === 'dashboard' && <Dashboard people={people} onUpdate={loadData} isAdmin={isAdmin} />}
          {view === 'people' && <PeopleManager people={people} onUpdate={loadData} isAdmin={isAdmin} />}
          {view === 'history' && <HistoryView assignments={assignments} people={people} onUpdate={loadData} isAdmin={isAdmin} />}
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

function Dashboard({ people, onUpdate, isAdmin }: { people: Person[], onUpdate: () => void, isAdmin: boolean }) {
  const today = startOfToday();
  const [currentDate, setCurrentDate] = useState(today);
  const [generatedList, setGeneratedList] = useState<Person[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  const shifts: Record<Team, string> = {
    '1': getShiftForTeam(currentDate, '1'),
    '2': getShiftForTeam(currentDate, '2'),
    '3': getShiftForTeam(currentDate, '3'),
    '4': getShiftForTeam(currentDate, '4'),
  };

  const availablePeople = people.filter(p => {
    const shift = getShiftForTeam(currentDate, p.team);
    return shift === '8h' && p.collaborationCount < 6 && !p.isEmergencyDept;
  });

  const generateList = () => {
    const shuffled = shuffle(availablePeople);
    setGeneratedList(shuffled.slice(0, 7));
  };

  const handleSave = async () => {
    if (generatedList.length === 0) return;
    setIsSaving(true);
    try {
      await saveAssignment({
        date: currentDate.toISOString(),
        assignedPeopleIds: generatedList.map(p => p.id),
        confirmedCollaborationIds: [],
        status: 'draft'
      });
      setGeneratedList([]);
      onUpdate();
    } catch (e) {
      console.error(e);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-10">
      <header className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 border-b border-white/5 pb-8">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-white">Daily Dispatch</h2>
          <p className="text-slate-400 font-medium mt-1">Generate ranked priority assignments based on active shifts.</p>
        </div>
        <div className="flex gap-6">
          <div className="flex flex-col gap-1.5 min-w-[200px]">
            <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Selected Date</label>
            <input 
              type="date" 
              className="input font-mono text-sm"
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
              <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Guardia {team}</span>
              <p className={`text-xl font-mono font-bold mt-1 ${shift === '24h' ? 'text-orange-400' : shift === 'Free' ? 'text-slate-500' : 'text-emerald-400'}`}>
                {shift === '8h' ? '8H SHIFT' : shift === '24h' ? '24H ACTIVE' : 'OFF-DUTY'}
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
              <h3 className="font-bold text-lg text-white">Personnel Registry</h3>
              <p className="text-xs text-slate-500">Availability filtered by 8h shift & collab thresholds</p>
            </div>
            <span className="bg-white/5 text-slate-400 border border-white/10 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest">
              {availablePeople.length} Valid
            </span>
          </div>
          
          <div className="card flex-1 overflow-hidden">
            <div className="overflow-auto max-h-[500px]">
              <table className="w-full text-left">
                <thead className="bg-[#151921] sticky top-0 z-10 border-b border-white/5 text-[10px] uppercase text-slate-500 tracking-widest">
                  <tr>
                    <th className="px-6 py-4">Name</th>
                    <th className="px-6 py-4">Guardia</th>
                    <th className="px-6 py-4 text-center">Collabs</th>
                    <th className="px-6 py-4 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {people.sort((a,b) => {
                    const shiftA = getShiftForTeam(currentDate, a.team);
                    const shiftB = getShiftForTeam(currentDate, b.team);
                    if (shiftA === '8h' && shiftB !== '8h') return -1;
                    if (shiftA !== '8h' && shiftB === '8h') return 1;
                    return a.name.localeCompare(b.name);
                  }).map(p => {
                    const shift = getShiftForTeam(currentDate, p.team);
                    const isEligible = shift === '8h' && p.collaborationCount < 6 && !p.isEmergencyDept;
                    return (
                      <tr key={p.id} className={`hover:bg-white/[0.02] transition-colors ${isEligible ? 'bg-emerald-500/[0.03]' : ''}`}>
                        <td className="px-6 py-4 font-medium text-sm text-white">
                          <div className="flex items-center gap-2">
                            {p.name}
                            {p.isEmergencyDept && <span className="text-[8px] bg-red-500/20 text-red-500 px-1 rounded font-bold uppercase ring-1 ring-red-500/10">ED</span>}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-slate-400 font-mono text-xs">G{p.team}</td>
                        <td className="px-6 py-4 text-center font-mono text-sm text-slate-300">{p.collaborationCount}/6</td>
                        <td className="px-6 py-4 text-right">
                          {p.collaborationCount >= 6 ? (
                            <span className="badge-red">Max Collab</span>
                          ) : shift === '8h' ? (
                            <span className="badge-emerald">8H Eligible</span>
                          ) : shift === '24h' ? (
                            <span className="badge-orange">24H Conflict</span>
                          ) : (
                            <span className="bg-slate-700/40 text-slate-500 px-2 py-0.5 rounded text-[10px] font-bold uppercase">Off-Duty</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                  {people.length === 0 && (
                    <tr>
                      <td colSpan={4} className="px-6 py-20 text-center text-slate-500 italic">No personnel found.</td>
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
              <h2 className="text-sm font-bold uppercase tracking-wider text-blue-400">The Daily Seven</h2>
              <p className="text-xs text-slate-500 mt-1">Ranked priority for collaboration assignments</p>
            </div>
            <button 
              disabled={availablePeople.length === 0}
              onClick={generateList} 
              className="p-2 text-blue-400 hover:bg-blue-400/10 rounded-lg transition-all"
            >
              <RotateCcw className="w-5 h-5" />
            </button>
          </div>

          <div className="card flex-1 flex flex-col bg-[#11141a] p-4 gap-3 min-h-[450px]">
            {generatedList.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center text-slate-600 bg-[#0A0C10] rounded-xl border border-dashed border-white/5">
                <RotateCcw className="w-12 h-12 mb-4 opacity-10" />
                <p className="text-sm font-medium tracking-wide">Generate selection queue</p>
              </div>
            ) : (
              generatedList.map((p, i) => (
                <div key={p.id} className={`flex items-center gap-5 p-4 rounded-xl border transition-all ${i === 0 ? 'bg-blue-500/10 border-blue-500/30' : 'bg-white/[0.03] border-white/5'}`}>
                  <span className={`font-mono text-xl font-bold ${i === 0 ? 'text-blue-400' : 'text-slate-600'}`}>{String(i + 1).padStart(2, '0')}</span>
                  <div className="flex-1">
                    <p className="text-sm font-bold text-white">{p.name}</p>
                    <p className={`text-[10px] font-bold uppercase tracking-widest ${i === 0 ? 'text-blue-300/60' : 'text-slate-500'}`}>
                      Collabs: {p.collaborationCount}/6 • Guardia {p.team}
                    </p>
                  </div>
                  {i === 0 && <div className="h-3 w-3 rounded-full bg-blue-400 shadow-[0_0_12px_rgba(96,165,250,0.8)]"></div>}
                </div>
              ))
            )}

            {generatedList.length > 0 && (
              <button 
                disabled={isSaving}
                onClick={handleSave}
                className="w-full btn-primary py-4 mt-2 flex items-center justify-center gap-3 text-sm tracking-widest uppercase font-black"
              >
                <CheckCircle2 className="w-5 h-5" />
                Commit Dispatch
              </button>
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
        <p className="text-[10px] font-mono text-slate-600 font-bold uppercase tracking-widest">System Status: CALIBRATED // DATABASE: ACTIVE</p>
      </footer>
    </div>
  );
}

function PeopleManager({ people, onUpdate, isAdmin }: { people: Person[], onUpdate: () => void, isAdmin: boolean }) {
  const [name, setName] = useState('');
  const [team, setTeam] = useState<Team>('1');
  const [isEmergencyDept, setIsEmergencyDept] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setIsSubmitting(true);
    try {
      await addPerson(name, team, isEmergencyDept);
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
    if (!confirm("Confirm removal of personnel from registry?")) return;
    await deletePerson(id);
    onUpdate();
  };

  return (
    <div className="space-y-10">
      <header className="border-b border-white/5 pb-8">
        <h2 className="text-3xl font-bold tracking-tight text-white">Personnel Registry</h2>
        <p className="text-slate-400 font-medium mt-1">Onboard and manage personnel and their rotation groups.</p>
      </header>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-10 items-start">
        {isAdmin && (
          <section className="xl:col-span-4 bg-[#151921] p-8 rounded-2xl border border-white/5 shadow-2xl h-fit">
            <h3 className="font-bold text-lg text-white mb-8 border-b border-white/5 pb-4">Onboard Personnel</h3>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Legal Full Name</label>
                <input 
                  value={name}
                  onChange={e => setName(e.target.value)}
                  className="input w-full text-sm" 
                  placeholder="Enter name..." 
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Assigned Guardia Group</label>
                <div className="grid grid-cols-4 gap-3">
                  {(['1', '2', '3', '4'] as Team[]).map(t => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setTeam(t)}
                      className={`py-3 rounded-xl font-bold font-mono transition-all border ${team === t ? 'bg-blue-600 text-white border-blue-500 shadow-lg shadow-blue-900/30' : 'bg-[#0F1115] text-slate-500 border-white/5 hover:border-white/10'}`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex items-center justify-between p-4 bg-[#0F1115] rounded-xl border border-white/5">
                <div className="flex flex-col">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Emergency Dept</span>
                  <span className="text-xs text-slate-400">Always ineligible for selection</span>
                </div>
                <button
                  type="button"
                  onClick={() => setIsEmergencyDept(!isEmergencyDept)}
                  className={`w-12 h-6 rounded-full transition-all relative ${isEmergencyDept ? 'bg-red-600' : 'bg-slate-700'}`}
                >
                  <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${isEmergencyDept ? 'left-7' : 'left-1'}`} />
                </button>
              </div>
              <button disabled={isSubmitting} className="w-full btn-primary py-4 mt-4 flex items-center justify-center gap-3 uppercase tracking-widest text-xs font-black">
                <Plus className="w-5 h-5" />
                Register Person
              </button>
            </form>
          </section>
        )}

        <section className={`${isAdmin ? 'xl:col-span-8' : 'xl:col-span-12'} flex flex-col gap-4`}>
          <div className="flex items-center justify-between px-2 mb-2">
            <h3 className="font-bold text-lg text-white">Registry Database</h3>
            <div className="flex gap-3">
              {['1', '2', '3', '4'].map(t => (
                <div key={t} className="flex flex-col items-end">
                   <span className="text-[9px] font-bold text-slate-600 uppercase tracking-tighter">Guardia {t}</span>
                   <span className="text-xs font-mono font-bold text-blue-400">{people.filter(p => p.team === t).length}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="card overflow-hidden">
            <div className="max-h-[600px] overflow-auto">
              <table className="w-full text-left">
                <thead className="bg-[#151921] border-b border-white/5 text-[10px] uppercase text-slate-500 tracking-widest">
                  <tr>
                    <th className="px-6 py-4">Name</th>
                    <th className="px-6 py-4">Guardia</th>
                    <th className="px-6 py-4 text-center">Collabs</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {people.sort((a,b) => a.name.localeCompare(b.name)).map(p => (
                   <tr key={p.id} className="hover:bg-white/[0.02] group transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-4">
                          <div className="w-9 h-9 rounded-full bg-[#0F1115] border border-white/5 flex items-center justify-center font-bold text-slate-400 text-sm">
                            {p.name.charAt(0)}
                          </div>
                          <div>
                             <p className="font-bold text-sm text-white">{p.name}</p>
                             <div className="flex gap-1">
                               {p.collaborationCount >= 6 && <span className="badge-red text-[8px] px-1 py-0 shadow-[0_0_8px_rgba(239,68,68,0.2)]">Max Threshold</span>}
                               {p.isEmergencyDept && <span className="bg-red-500/10 text-red-500 border border-red-500/20 text-[8px] font-bold px-1 rounded uppercase">Emergency Dept</span>}
                             </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 font-mono text-xs text-slate-400">G{p.team}</td>
                      <td className="px-6 py-4 text-center font-mono text-sm">
                         <span className={p.collaborationCount >= 6 ? 'text-red-400' : 'text-slate-300'}>{p.collaborationCount}</span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        {isAdmin && (
                          <button 
                            onClick={() => handleDelete(p.id)}
                            className="p-2 text-slate-600 hover:text-red-500 transition-all opacity-0 group-hover:opacity-100 bg-white/5 hover:bg-red-500/10 rounded-lg"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </td>
                   </tr>
                  ))}
                  {people.length === 0 && (
                    <tr>
                      <td colSpan={4} className="px-6 py-20 text-center text-slate-500 italic">Database is empty. Personnel required.</td>
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

function HistoryView({ assignments, people, onUpdate, isAdmin }: { assignments: Assignment[], people: Person[], onUpdate: () => void, isAdmin: boolean }) {
  const [selectedAssignment, setSelectedAssignment] = useState<Assignment | null>(null);
  const [confirmedIds, setConfirmedIds] = useState<string[]>([]);
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    if (selectedAssignment) {
      setConfirmedIds(selectedAssignment.confirmedCollaborationIds);
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

  const toggleConfirmed = (id: string) => {
    setConfirmedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  return (
    <div className="space-y-10">
      <header className="border-b border-white/5 pb-8">
        <h2 className="text-3xl font-bold tracking-tight text-white">Dispatch History</h2>
        <p className="text-slate-400 font-medium mt-1">Review operational logs and certify actual collaborations for record tracking.</p>
      </header>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-10 items-start">
        <section className="xl:col-span-4 space-y-4">
          <h3 className="font-bold text-lg text-white mb-2 ml-2 tracking-tight">Deployment Logs</h3>
          <div className="space-y-3 max-h-[700px] overflow-auto pr-2">
            {assignments.length === 0 ? (
              <p className="text-slate-600 italic p-10 text-center">No logs generated.</p>
            ) : (
              assignments.map(a => (
                <button 
                  key={a.id} 
                  onClick={() => setSelectedAssignment(a)}
                  className={`w-full group card p-5 text-left flex items-center justify-between transition-all border-l-4 ${selectedAssignment?.id === a.id ? 'border-l-blue-500 bg-[#1e242b]' : 'border-l-transparent hover:bg-white/[0.03]'}`}
                >
                  <div className="flex flex-col gap-1">
                    <p className={`font-mono text-sm font-bold tracking-tight ${selectedAssignment?.id === a.id ? 'text-white' : 'text-slate-400'}`}>
                      {format(new Date(a.date), 'dd MMM yyyy')}
                    </p>
                    <p className="text-[10px] uppercase font-black tracking-widest text-slate-600">Personnel count: {a.assignedPeopleIds.length}</p>
                  </div>
                  <div>
                    {a.status === 'confirmed' ? (
                      <span className="badge-emerald flex items-center gap-1.5 ring-1 ring-emerald-500/20">
                        <CheckCircle2 className="w-3 h-3 text-emerald-400" /> Certfied
                      </span>
                    ) : (
                      <span className="badge-orange flex items-center gap-1.5 ring-1 ring-orange-500/20">
                        <AlertTriangle className="w-3 h-3 text-orange-400" /> Pending
                      </span>
                    )}
                  </div>
                </button>
              ))
            )}
          </div>
        </section>

        <section className="xl:col-span-8 h-full">
          {selectedAssignment ? (
            <div className="card h-full p-8 bg-[#11141a] border-white/10 flex flex-col">
               <div className="flex justify-between items-start mb-10 border-b border-white/5 pb-6">
                 <div>
                    <h3 className="text-2xl font-bold text-white tracking-tight">Audit Log</h3>
                    <p className="text-xs font-mono text-slate-500 mt-1 uppercase tracking-widest">{format(new Date(selectedAssignment.date), 'eeee, MMMM do, yyyy')}</p>
                 </div>
                 <div className="text-right">
                    <p className="text-[10px] font-bold text-slate-600 uppercase tracking-widest">Status Code</p>
                    <p className={`text-sm font-black tracking-widest uppercase ${selectedAssignment.status === 'confirmed' ? 'text-emerald-400' : 'text-orange-400'}`}>
                      {selectedAssignment.status}
                    </p>
                 </div>
               </div>

               <p className="text-sm text-slate-400 mb-8 italic">Certify members who effectively engaged in collaboration for threshold accrual:</p>
               
               <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-10">
                 {selectedAssignment.assignedPeopleIds.map((id, index) => {
                   const person = people.find(p => p.id === id);
                   const isConfirmed = confirmedIds.includes(id);
                   return (
                     <button
                       key={id}
                       disabled={selectedAssignment.status === 'confirmed'}
                       onClick={() => toggleConfirmed(id)}
                       className={`group flex items-center justify-between p-4 rounded-xl border transition-all text-left ${isConfirmed ? 'bg-blue-600/10 border-blue-600/40 text-white' : 'bg-white/[0.03] border-white/5 text-slate-500 hover:border-white/10'}`}
                     >
                       <div className="flex items-center gap-4">
                         <span className={`font-mono text-xs ${isConfirmed ? 'text-blue-400' : 'text-slate-700 font-black'}`}>{String(index + 1).padStart(2, '0')}</span>
                         <span className="font-bold text-sm tracking-wide">{person?.name || 'Unknown Identification'}</span>
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
                      disabled={isUpdating}
                      onClick={handleConfirm}
                      className="w-full btn-primary py-5 flex items-center justify-center gap-3 tracking-[0.2em] font-black group"
                     >
                       <CheckCircle2 className="w-5 h-5 group-hover:scale-110 transition-transform" />
                       CERTIFY DEPLOYMENT
                     </button>
                   ) : (
                     <div className="p-10 bg-black/20 rounded-2xl text-center border border-white/5 flex flex-col items-center gap-3">
                       <AlertTriangle className="w-12 h-12 mb-2 text-orange-400 opacity-20" />
                       <p className="text-sm font-bold text-slate-500 tracking-widest uppercase">Admin Authorization Required</p>
                       <p className="text-xs text-slate-600 mt-1">Contact a system administrator to certify this operational log.</p>
                     </div>
                   )
                 ) : (
                   <div className="p-10 bg-black/20 rounded-2xl text-center border border-white/5 flex flex-col items-center gap-3">
                     <div className="w-12 h-12 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-500 ring-2 ring-emerald-500/5">
                        <CheckCircle2 className="w-6 h-6" />
                     </div>
                     <div>
                        <p className="text-sm font-bold text-slate-300 tracking-widest uppercase">Operational Log Finalized</p>
                        <p className="text-xs text-slate-500 mt-1">Activity metrics have been successfully pushed to personnel records.</p>
                     </div>
                   </div>
                 )}
               </div>
            </div>
          ) : (
            <div className="h-full min-h-[500px] bg-white/[0.01] border-2 border-dashed border-white/5 rounded-3xl flex flex-col items-center justify-center text-slate-600 p-12">
              <History className="w-16 h-16 mb-6 opacity-5" />
              <p className="text-center font-medium max-w-xs leading-relaxed italic opacity-40">Select a deployment vector from the log queue to review details and certify collaboration events.</p>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
