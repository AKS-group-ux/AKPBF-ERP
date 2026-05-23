/**
 * @license
 * SPDX-License-Identifier: Apache-2.5
 */

import React, { useState, useMemo } from 'react';
import { 
  Users, 
  Plus, 
  TrendingUp, 
  Calendar, 
  Award, 
  FileSpreadsheet, 
  Briefcase, 
  CheckCircle2, 
  Clock, 
  ShieldCheck, 
  Search, 
  Calculator,
  UserCheck
} from 'lucide-react';

interface Employee {
  id: string;
  name: string;
  phone: string;
  role: 'Chauffeur' | 'Éboueur' | 'Comptable' | 'Superviseur' | 'Administrateur';
  contractType: 'CDI' | 'CDD' | 'Journalier';
  baseSalaryFcfa: number;
  bonusFcfa: number;
  hiredDate: string;
  status: 'active' | 'suspended' | 'on_leave';
  performanceRating: number; // 0 to 5 stars
}

interface LeaveRequest {
  id: string;
  employeeId: string;
  employeeName: string;
  leaveType: 'Congé annuel' | 'Maladie' | 'Maternité' | 'Exceptionnel';
  startDate: string;
  endDate: string;
  status: 'pending' | 'approved' | 'rejected';
}

const INITIAL_EMPLOYEES: Employee[] = [
  { id: 'EMP-001', name: 'Kouamé N\'Guessan', phone: '+225 07 45 42 10', role: 'Chauffeur', contractType: 'CDI', baseSalaryFcfa: 250000, bonusFcfa: 45000, hiredDate: '2023-01-15', status: 'active', performanceRating: 4.8 },
  { id: 'EMP-002', name: 'Coulibaly Moussa', phone: '+225 05 02 11 87', role: 'Chauffeur', contractType: 'CDI', baseSalaryFcfa: 250000, bonusFcfa: 30000, hiredDate: '2023-06-10', status: 'active', performanceRating: 4.5 },
  { id: 'EMP-003', name: 'Sidibé Oumar', phone: '+225 01 11 44 90', role: 'Éboueur', contractType: 'CDD', baseSalaryFcfa: 150000, bonusFcfa: 22000, hiredDate: '2024-02-01', status: 'active', performanceRating: 4.9 },
  { id: 'EMP-004', name: 'Koffi Blaise Christian', phone: '+225 07 88 12 00', role: 'Éboueur', contractType: 'Journalier', baseSalaryFcfa: 120000, bonusFcfa: 15000, hiredDate: '2025-05-01', status: 'active', performanceRating: 4.2 },
  { id: 'EMP-005', name: 'Sangaré Alassane', phone: '+225 27 21 00 11', role: 'Comptable', contractType: 'CDI', baseSalaryFcfa: 450000, bonusFcfa: 50000, hiredDate: '2022-09-01', status: 'active', performanceRating: 4.7 },
  { id: 'EMP-006', name: 'Bamba Sidiki', phone: '+225 05 92 84 91', role: 'Superviseur', contractType: 'CDI', baseSalaryFcfa: 350000, bonusFcfa: 38000, hiredDate: '2024-01-10', status: 'active', performanceRating: 4.6 }
];

const INITIAL_LEAVE_REQUESTS: LeaveRequest[] = [
  { id: 'CG-901', employeeId: 'EMP-004', employeeName: 'Koffi Blaise Christian', leaveType: 'Congé annuel', startDate: '2026-06-01', endDate: '2026-06-15', status: 'approved' },
  { id: 'CG-902', employeeId: 'EMP-002', employeeName: 'Coulibaly Moussa', leaveType: 'Maladie', startDate: '2026-05-24', endDate: '2026-05-28', status: 'pending' }
];

export default function HrView() {
  const [employees, setEmployees] = useState<Employee[]>(INITIAL_EMPLOYEES);
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>(INITIAL_LEAVE_REQUESTS);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeSubTab, setActiveSubTab] = useState<'employees' | 'payroll' | 'leaves'>('employees');

  // Employee creation form state
  const [isAddEmployeeOpen, setIsAddEmployeeOpen] = useState(false);
  const [empName, setEmpName] = useState('');
  const [empPhone, setEmpPhone] = useState('');
  const [empRole, setEmpRole] = useState<'Chauffeur' | 'Éboueur' | 'Comptable' | 'Superviseur'>('Éboueur');
  const [empContract, setEmpContract] = useState<'CDI' | 'CDD' | 'Journalier'>('CDD');
  const [empSalary, setEmpSalary] = useState('');

  // Leaves request form state
  const [isAddLeaveOpen, setIsAddLeaveOpen] = useState(false);
  const [leaveEmpId, setLeaveEmpId] = useState('');
  const [leaveType, setLeaveType] = useState<'Congé annuel' | 'Maladie' | 'Maternité' | 'Exceptionnel'>('Congé annuel');
  const [leaveStart, setLeaveStart] = useState('');
  const [leaveEnd, setLeaveEnd] = useState('');

  // Active Payslip modal state
  const [selectedPayslipEmployee, setSelectedPayslipEmployee] = useState<Employee | null>(null);

  // Stats
  const hrStats = useMemo(() => {
    const totalStaffCount = employees.length;
    const totalSalaryMass = employees.reduce((sum, e) => sum + e.baseSalaryFcfa + e.bonusFcfa, 0);
    const averagePerfRating = employees.reduce((sum, e) => sum + e.performanceRating, 0) / totalStaffCount;
    const pendingLeavesCount = leaveRequests.filter(l => l.status === 'pending').length;

    return { totalStaffCount, totalSalaryMass, averagePerfRating, pendingLeavesCount };
  }, [employees, leaveRequests]);

  const filteredEmployees = useMemo(() => {
    return employees.filter(e => 
      e.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
      e.role.toLowerCase().includes(searchTerm.toLowerCase()) ||
      e.id.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [employees, searchTerm]);

  // Create Employee
  const handleCreateEmployee = (e: React.FormEvent) => {
    e.preventDefault();
    if (!empName) return;

    const newEmp: Employee = {
      id: `EMP-00${employees.length + 1}`,
      name: empName,
      phone: empPhone || '+225 27 00 11 22',
      role: empRole as any,
      contractType: empContract,
      baseSalaryFcfa: parseFloat(empSalary) || 150000,
      bonusFcfa: 15000,
      hiredDate: '2026-05-22',
      status: 'active',
      performanceRating: 4.5
    };

    setEmployees([...employees, newEmp]);
    setEmpName('');
    setEmpPhone('');
    setEmpSalary('');
    setIsAddEmployeeOpen(false);
  };

  // Create Leave Request
  const handleCreateLeaveRequest = (e: React.FormEvent) => {
    e.preventDefault();
    if (!leaveEmpId || !leaveStart || !leaveEnd) return;

    const matchedEmp = employees.find(e => e.id === leaveEmpId);
    if (!matchedEmp) return;

    const newLeave: LeaveRequest = {
      id: `CG-${900 + leaveRequests.length + 1}`,
      employeeId: leaveEmpId,
      employeeName: matchedEmp.name,
      leaveType,
      startDate: leaveStart,
      endDate: leaveEnd,
      status: 'pending'
    };

    setLeaveRequests([newLeave, ...leaveRequests]);
    setLeaveEmpId('');
    setLeaveStart('');
    setLeaveEnd('');
    setIsAddLeaveOpen(false);
  };

  // Accept Leave Request
  const handleApproveLeave = (leaveId: string) => {
    setLeaveRequests(prev => prev.map(l => {
      if (l.id === leaveId) {
        // Find employee and toggle status to on_leave
        setEmployees(emps => emps.map(e => e.id === l.employeeId ? { ...e, status: 'on_leave' as const } : e));
        return { ...l, status: 'approved' as const };
      }
      return l;
    }));
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      
      {/* TITLE HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-950 tracking-tight">ERP Ressources Humaines & Paie</h2>
          <p className="text-slate-500 text-sm mt-0.5">Fiches de paie SYSCOHADA révisé, affectations de contrats et demandes d'absences du personnel</p>
        </div>

        <div className="flex gap-2">
          {activeSubTab === 'leaves' ? (
            <button
              onClick={() => setIsAddLeaveOpen(true)}
              className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-2 rounded-xl text-xs font-bold transition active:scale-95 cursor-pointer"
            >
              <Plus className="h-4 w-4" />
              <span>Demander des Congés</span>
            </button>
          ) : (
            <button
              onClick={() => setIsAddEmployeeOpen(true)}
              className="flex items-center gap-1.5 bg-slate-900 hover:bg-slate-800 text-white px-4 py-2 rounded-xl text-xs font-bold transition active:scale-95 cursor-pointer"
            >
              <Plus className="h-4 w-4" />
              <span>Enrôler un Équipier</span>
            </button>
          )}
        </div>
      </div>

      {/* METRICS ROW */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-5 text-left">
        <div className="bg-white rounded-2xl p-5 border border-slate-205/80 shadow-xs flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Effectif Global</span>
            <h3 className="text-xl font-black text-slate-850">{hrStats.totalStaffCount} collaborateurs</h3>
            <p className="text-slate-400 text-xs">{employees.filter(e=>e.status==='active').length} actifs ce jour</p>
          </div>
          <div className="p-2.5 bg-sky-50 text-sky-700 rounded-xl">
            <Users className="h-5.5 w-5.5" />
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-205/85 shadow-xs flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Masse Salariale Brut</span>
            <h3 className="text-xl font-black text-emerald-800">{hrStats.totalSalaryMass.toLocaleString()} <span className="text-xs font-bold text-slate-400">FCFA</span></h3>
            <p className="text-slate-400 text-xs">Salaires d'exploitation + primes incluses</p>
          </div>
          <div className="p-2.5 bg-emerald-50 text-emerald-700 rounded-xl">
            <FileSpreadsheet className="h-5.5 w-5.5" />
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-205/85 shadow-xs flex items-center justify-between">
          <div className="space-y-1 font-sans">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Performance Équipe</span>
            <h3 className="text-xl font-black text-slate-800">{(hrStats.averagePerfRating).toFixed(2)} / 5 ★</h3>
            <p className="text-slate-400 text-xs">Note d'achèvement des tournées</p>
          </div>
          <div className="p-2.5 bg-amber-50 text-amber-600 rounded-xl">
            <Award className="h-5.5 w-5.5" />
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-205/85 shadow-xs flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Congés En Attente</span>
            <h3 className="text-xl font-black text-rose-700">{hrStats.pendingLeavesCount} demandes</h3>
            <p className="text-slate-400 text-xs">Absences à arbitrer</p>
          </div>
          <div className="p-2.5 bg-rose-50 text-rose-600 rounded-xl">
            <Clock className="h-5.5 w-5.5" />
          </div>
        </div>
      </div>

      {/* COMPONENT NAVIGATION BAR */}
      <div className="flex border-b border-slate-100 pb-3 gap-1">
        {[
          { id: 'employees', label: 'Surveillance des Employés', icon: Briefcase },
          { id: 'payroll', label: 'Générateur de Fiches de Paie', icon: Calculator },
          { id: 'leaves', label: 'Arbitrage des Absences', icon: Calendar }
        ].map(tb => {
          const TabIcon = tb.icon;
          return (
            <button
              key={tb.id}
              onClick={() => setActiveSubTab(tb.id as any)}
              className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-lg cursor-pointer transition ${
                activeSubTab === tb.id ? 'bg-emerald-600 text-white shadow-sm' : 'text-slate-500 hover:bg-slate-100 hover:text-slate-850 bg-transparent'
              }`}
            >
              <TabIcon className="h-4 w-4" />
              <span>{tb.label}</span>
            </button>
          );
        })}
      </div>

      {/* RENDER TAB: EMPLOYEES */}
      {activeSubTab === 'employees' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 space-y-4 text-left">
          <div className="pb-3 border-b border-slate-100 flex items-center bg-slate-50/50">
            <div className="relative w-full">
              <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input 
                type="text" 
                placeholder="Rechercher par équipier ou tâche..." 
                value={searchTerm}
                onChange={e=>setSearchTerm(e.target.value)}
                className="w-full bg-white border border-slate-200 pl-9 pr-4 py-2 rounded-lg text-xs font-semibold focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredEmployees.map(emp => (
              <div key={emp.id} className="p-4 rounded-xl border border-slate-200 hover:border-slate-350 transition flex flex-col justify-between gap-4">
                <div className="space-y-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-extrabold text-slate-850 text-sm">{emp.name}</h4>
                      <span className="text-[10px] bg-slate-100 text-slate-500 font-bold px-1.5 py-0.5 rounded-md mt-1 inline-block font-mono">{emp.id} • {emp.contractType}</span>
                    </div>
                    <span className={`text-[10.5px] font-black uppercase px-2 py-0.5 rounded border ${
                      emp.status === 'active' ? 'bg-emerald-50 text-emerald-800 border-emerald-100' :
                      emp.status === 'on_leave' ? 'bg-amber-50 text-amber-800 border-amber-100' :
                      'bg-rose-50 text-rose-800 border-rose-100'
                    }`}>
                      {emp.status === 'active' ? 'En Poste' : emp.status === 'on_leave' ? 'En Congé' : 'Suspendu'}
                    </span>
                  </div>

                  <div className="text-xs space-y-1 text-slate-500">
                    <div>Poste affecté : <strong className="text-slate-700">{emp.role}</strong></div>
                    <div>Contact d'urgence : <strong>{emp.phone}</strong></div>
                    <div>Embauché le : <strong>{emp.hiredDate}</strong></div>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-105 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1">
                    <span className="text-amber-500 font-bold">★</span>
                    <span className="font-sans font-bold text-slate-700">{emp.performanceRating} Performance</span>
                  </div>
                  <button
                    onClick={() => setSelectedPayslipEmployee(emp)}
                    className="text-xs font-bold text-emerald-700 hover:text-emerald-900 border border-emerald-250 bg-emerald-50 hover:bg-emerald-100 px-3 py-1 rounded-md transition"
                  >
                    Filtre Paie
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* RENDER TAB: PAYROLL */}
      {activeSubTab === 'payroll' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 space-y-4 text-left">
          <h3 className="text-xs font-black text-slate-850 uppercase tracking-widest">Grille d'Émission des Bulletins Mensuels</h3>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-slate-50 text-[9px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100">
                <tr>
                  <th className="p-3">Ref ID</th>
                  <th className="p-3">Collaborateur</th>
                  <th className="p-3">Rôle</th>
                  <th className="p-3 text-right">Salaire Base</th>
                  <th className="p-3 text-right">Primes & Bonus</th>
                  <th className="p-3 text-right">Preb CNPS (-4.7%)</th>
                  <th className="p-3 text-right">Net à payer</th>
                  <th className="p-3 text-center">Impression</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 font-mono text-[11px] text-slate-650">
                {employees.map(emp => {
                  const cnpsCutOff = emp.baseSalaryFcfa * 0.047;
                  const netToReceive = (emp.baseSalaryFcfa + emp.bonusFcfa) - cnpsCutOff;
                  return (
                    <tr key={emp.id} className="hover:bg-slate-50/45 transition">
                      <td className="p-3 font-semibold text-slate-800">{emp.id}</td>
                      <td className="p-3 font-sans font-bold text-slate-900">{emp.name}</td>
                      <td className="p-3 font-sans text-slate-500 font-medium">{emp.role}</td>
                      <td className="p-3 text-right font-bold text-slate-800">{emp.baseSalaryFcfa.toLocaleString()}</td>
                      <td className="p-3 text-right font-bold text-emerald-700">+{emp.bonusFcfa.toLocaleString()}</td>
                      <td className="p-3 text-right font-bold text-rose-700">-{cnpsCutOff.toLocaleString()}</td>
                      <td className="p-3 text-right font-black text-indigo-900">{netToReceive.toLocaleString()} FCFA</td>
                      <td className="p-3 text-center">
                        <button
                          onClick={() => setSelectedPayslipEmployee(emp)}
                          className="px-2.5 py-1 bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-[10px] rounded cursor-pointer"
                        >
                          Bulletin
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* RENDER TAB: LEAVES */}
      {activeSubTab === 'leaves' && (
        <div className="bg-white rounded-2xl border border-slate-205 shadow-xs p-5 space-y-4 text-left">
          <h3 className="text-xs font-black text-zinc-850 uppercase tracking-widest">Registre des Absences d’Équipes</h3>

          <div className="space-y-3">
            {leaveRequests.map(req => (
              <div key={req.id} className={`p-4 border rounded-xl flex items-center justify-between gap-4 transition ${
                req.status === 'approved' ? 'bg-emerald-50/50 border-emerald-250' : 'bg-white border-slate-200'
              }`}>
                <div className="space-y-1 font-sans text-xs">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[10px] text-indigo-750 font-bold">{req.id}</span>
                    <strong className="text-slate-850">{req.employeeName}</strong>
                  </div>
                  <div className="text-slate-550">
                    Genre d'absence : <strong className="text-slate-700">{req.leaveType}</strong> • Période : <span>{req.startDate} au {req.endDate}</span>
                  </div>
                  {req.status === 'approved' && (
                    <span className="text-[9.5px] bg-emerald-100 text-emerald-800 border border-emerald-200 px-2 py-0.5 rounded-full font-black">✓ Accordé par la Direction</span>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  {req.status === 'pending' ? (
                    <>
                      <button
                        onClick={() => handleApproveLeave(req.id)}
                        className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-black rounded cursor-pointer"
                      >
                        Valider
                      </button>
                      <button
                        onClick={() => setLeaveRequests(prev => prev.map(l => l.id === req.id ? { ...l, status: 'rejected' as const } : l))}
                        className="px-3 py-1 bg-amber-100 hover:bg-amber-200 text-amber-800 text-[10px] font-black rounded cursor-pointer"
                      >
                        Refuser
                      </button>
                    </>
                  ) : (
                    <div className="p-1 px-2.5 bg-emerald-105 text-emerald-750 text-[10px] font-extrabold rounded-md flex items-center gap-1">
                      <UserCheck className="h-3.5 w-3.5" />
                      <span>Remplacé</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* POPUP MODAL: ADD COLLABORATOR */}
      {isAddEmployeeOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <form onSubmit={handleCreateEmployee} className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-2xl border border-slate-100 animate-in fade-in-50 zoom-in-95 text-left">
            <div className="bg-slate-905 p-4 text-white bg-slate-900 font-extrabold text-xs uppercase tracking-widest">
              Immatriculer un Équipier
            </div>
            <div className="p-5 space-y-4 text-xs font-sans">
              <div className="space-y-1">
                <label className="font-bold text-slate-600">Civilité de l'agent :</label>
                <input required type="text" value={empName} onChange={e=>setEmpName(e.target.value)} className="w-full bg-slate-50 border border-slate-200 p-2.5 rounded-lg text-xs" placeholder="Prénom Noms" />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-slate-600">Mobile d'Alerte :</label>
                  <input type="text" value={empPhone} onChange={e=>setEmpPhone(e.target.value)} className="w-full bg-slate-50 border border-slate-200 p-2.5 rounded-lg text-xs" placeholder="+225..." />
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-slate-600">Contrat SYSCOHADA :</label>
                  <select value={empContract} onChange={e=>setEmpContract(e.target.value as any)} className="w-full bg-slate-50 border border-slate-200 p-2.5 rounded-lg text-xs">
                    <option value="CDI">CDI</option>
                    <option value="CDD">CDD</option>
                    <option value="Journalier">Journalier</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-slate-600">Poste d'affectation :</label>
                  <select value={empRole} onChange={e=>setEmpRole(e.target.value as any)} className="w-full bg-slate-50 border border-slate-200 p-2.5 rounded-lg text-xs">
                    <option value="Chauffeur">Chauffeur Compacteur</option>
                    <option value="Éboueur">Éboueur Chargeur</option>
                    <option value="Comptable">Comptable</option>
                    <option value="Superviseur">Superviseur Zone</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-slate-600">Salaire mensuel de Base :</label>
                  <input required type="number" value={empSalary} onChange={e=>setEmpSalary(e.target.value)} className="w-full bg-slate-50 border border-slate-200 p-2.5 rounded-lg text-xs" placeholder="FCFA" />
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <button type="submit" className="flex-1 bg-slate-900 text-white py-2.5 rounded-xl font-bold transition hover:bg-slate-800 cursor-pointer">Inscrire Dossier</button>
                <button type="button" onClick={()=>setIsAddEmployeeOpen(false)} className="flex-1 bg-slate-100 text-slate-650 py-2.5 rounded-xl font-bold transition hover:bg-slate-200 cursor-pointer">Fermer</button>
              </div>
            </div>
          </form>
        </div>
      )}

      {/* POPUP MODAL: LEAVE REQUEST */}
      {isAddLeaveOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <form onSubmit={handleCreateLeaveRequest} className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-2xl border border-slate-100 animate-in fade-in-50 zoom-in-95 text-left">
            <div className="bg-emerald-600 p-4 text-white font-extrabold text-xs uppercase tracking-widest">
              Déposer une Demande de Congés
            </div>
            <div className="p-5 space-y-4 text-xs font-sans">
              <div className="space-y-1">
                <label className="font-bold text-slate-600">Sélectionner Employé :</label>
                <select required value={leaveEmpId} onChange={e=>setLeaveEmpId(e.target.value)} className="w-full bg-slate-50 border border-slate-200 p-2.5 rounded-lg text-xs">
                  <option value="">-- Choisir Collaborateur --</option>
                  {employees.map(emp => <option key={emp.id} value={emp.id}>{emp.name} ({emp.role})</option>)}
                </select>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-600">Motif de Congés :</label>
                <select value={leaveType} onChange={e=>setLeaveType(e.target.value as any)} className="w-full bg-slate-50 border border-slate-200 p-2.5 rounded-lg text-xs">
                  <option value="Congé annuel">Congé annuel statutaire (30 jours)</option>
                  <option value="Maladie">Certificat Médical / Maladie</option>
                  <option value="Exceptionnel">Événement familial Exceptionnel</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-slate-600">Date de départ :</label>
                  <input required type="date" value={leaveStart} onChange={e=>setLeaveStart(e.target.value)} className="w-full bg-slate-50 border border-slate-200 p-2.5 rounded-lg text-xs" />
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-slate-600">Date de retour :</label>
                  <input required type="date" value={leaveEnd} onChange={e=>setLeaveEnd(e.target.value)} className="w-full bg-slate-50 border border-slate-200 p-2.5 rounded-lg text-xs" />
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <button type="submit" className="flex-1 bg-emerald-600 text-white py-2.5 rounded-xl font-bold transition hover:bg-emerald-700 cursor-pointer">Déposer Dossier</button>
                <button type="button" onClick={()=>setIsAddLeaveOpen(false)} className="flex-1 bg-slate-100 text-slate-650 py-2.5 rounded-xl font-bold transition hover:bg-slate-200 cursor-pointer">Fermer</button>
              </div>
            </div>
          </form>
        </div>
      )}

      {/* POPUP MODAL: BULLETINS PREVIEWER */}
      {selectedPayslipEmployee && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4" onClick={() => setSelectedPayslipEmployee(null)}>
          <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-2xl border border-slate-100 animate-in zoom-in-95 duration-150" onClick={e=>e.stopPropagation()}>
            <div className="bg-slate-900 text-white p-4.5 font-bold text-xs uppercase flex justify-between tracking-wide items-center">
              <span>Bulletin individuel de paie (SYSCOHADA)</span>
              <button onClick={() => setSelectedPayslipEmployee(null)}>✕</button>
            </div>
            
            <div className="p-6 space-y-4 text-xs font-mono text-left">
              <div className="text-center font-sans space-y-1 pb-4 border-b border-dashed border-slate-200">
                <h3 className="font-black text-slate-805 text-md">AKPBF WASTE SERVICE LTD.</h3>
                <span className="text-[10px] text-slate-400 block font-semibold">Abidjan - Côte d'Ivoire</span>
                <span className="text-[11px] bg-slate-100 px-2 py-0.5 rounded font-black mt-2 inline-block">Mois : Mai 2026</span>
              </div>

              <div className="space-y-1.5 text-xs">
                <div>Matricule : <strong>{selectedPayslipEmployee.id}</strong></div>
                <div>Embauché le : <strong>{selectedPayslipEmployee.hiredDate}</strong></div>
                <div>Équipier : <strong>{selectedPayslipEmployee.name}</strong></div>
                <div>Poste d'immatriculation : <strong>{selectedPayslipEmployee.role}</strong></div>
                <div>Type de contrat : <strong>{selectedPayslipEmployee.contractType}</strong></div>
              </div>

              <div className="border-y border-dashed border-slate-200 py-3 space-y-2">
                <div className="flex justify-between">
                  <span>Salaire Mensuel Brut :</span>
                  <strong>{selectedPayslipEmployee.baseSalaryFcfa.toLocaleString()} FCFA</strong>
                </div>
                <div className="flex justify-between text-emerald-700">
                  <span>Primes & Indemnités d'éco-voirie :</span>
                  <strong>+{selectedPayslipEmployee.bonusFcfa.toLocaleString()} FCFA</strong>
                </div>
                <div className="flex justify-between text-rose-700">
                  <span>Cotisation Retraite CNPS (4.7%) :</span>
                  <strong>-{(selectedPayslipEmployee.baseSalaryFcfa * 0.047).toLocaleString()} FCFA</strong>
                </div>
              </div>

              <div className="flex justify-between font-sans text-sm font-black text-indigo-900 bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                <span>NET REÇU EN BANQUE (CFA) :</span>
                <span>{((selectedPayslipEmployee.baseSalaryFcfa + selectedPayslipEmployee.bonusFcfa) - (selectedPayslipEmployee.baseSalaryFcfa * 0.047)).toLocaleString()} FCFA</span>
              </div>

              <div className="pt-2 text-center font-sans text-slate-400 text-[10px] leading-normal">
                Les cotisations sociales ont été télé-transmises aux caisses d'épargne Ivoirienne.
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
