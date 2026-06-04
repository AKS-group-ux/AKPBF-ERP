import { useState, useEffect, FormEvent } from 'react';
import { 
  UserPlus, 
  Search, 
  Filter, 
  Trash2, 
  Edit, 
  Check, 
  X, 
  Shield, 
  Mail, 
  Phone, 
  RefreshCw, 
  UserCheck, 
  UserX,
  Lock,
  Loader2,
  LockKeyhole
} from 'lucide-react';

interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: string;
  isActive: boolean;
  createdAt: string;
}

export default function UsersManagementView() {
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Search & Filter controls
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // Modal control states
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isResetOpen, setIsResetOpen] = useState(false);

  // Target User states for Edit/Reset
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  // Form input fields
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    role: 'AGENT',
    isActive: true
  });

  const [newPassword, setNewPassword] = useState('');

  // Pre-seed mock users in case server fails
  const mockUsers: User[] = [
    { id: '1', name: 'Alkaïda Benjamin', email: 'groupaksservices@zohomail.com', phone: '+225 05 01 02 03 04', role: 'ADMINISTRATEUR', isActive: true, createdAt: '2026-05-10T12:00:00Z' },
    { id: '2', name: 'Doumbia Sylvain (Fisc)', email: 'comptable@akpbf.com', phone: '+225 05 02 03 04 05', role: 'COMPTABLE', isActive: true, createdAt: '2026-05-11T09:30:00Z' },
    { id: '3', name: 'Gérard Gnakoury (Logistique)', email: 'superviseur@akpbf.com', phone: '+225 05 03 04 05 06', role: 'SUPERVISEUR', isActive: true, createdAt: '2026-05-12T15:20:00Z' },
    { id: '4', name: 'Kaboré Moussa', email: 'chauffeur@akpbf.com', phone: '+225 05 04 05 06 07', role: 'CHAUFFEUR', isActive: true, createdAt: '2026-05-13T10:15:00Z' },
    { id: '5', name: 'Coulibaly Issa', email: 'agent@akpbf.com', phone: '+225 05 05 06 07 08', role: 'AGENT', isActive: true, createdAt: '2026-05-14T08:00:00Z' },
    { id: '6', name: 'Direction AKP (Admin)', email: 'groupaksservices@gmail.com', phone: '+225 05 00 00 00 01', role: 'ADMINISTRATEUR', isActive: true, createdAt: '2026-05-15T10:00:00Z' }
  ];

  // Load token helper
  const getAuthHeaders = () => {
    const token = localStorage.getItem('akpbf_erp_token') || sessionStorage.getItem('akpbf_erp_token');
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    };
  };

  // Fetch users from core Postgres server
  const fetchUsers = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const query = new URLSearchParams({
        search: searchTerm,
        role: roleFilter,
        status: statusFilter,
        page: page.toString(),
        limit: '15'
      }).toString();

      const response = await fetch(`/api/users?${query}`, {
        headers: getAuthHeaders()
      });

      if (!response.ok) {
        throw new Error('Impossible de charger la liste des utilisateurs.');
      }

      const data = await response.json();
      if (data.success) {
        setUsers(data.users || []);
        setTotalCount(data.pagination?.total || data.users?.length || 0);
      } else {
        throw new Error(data.error || 'Erreur inconnue.');
      }
    } catch (err: any) {
      console.warn('Backend UserController failed or unreachable. Falling back to local offline list.', err);
      // Fallback
      let filtered = [...mockUsers];
      if (searchTerm) {
        filtered = filtered.filter(u => 
          u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
          u.phone.includes(searchTerm)
        );
      }
      if (roleFilter) {
        filtered = filtered.filter(u => u.role.toUpperCase() === roleFilter.toUpperCase());
      }
      if (statusFilter) {
        const activeReq = statusFilter === 'active';
        filtered = filtered.filter(u => u.isActive === activeReq);
      }
      setUsers(filtered);
      setTotalCount(filtered.length);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [searchTerm, roleFilter, statusFilter, page]);

  const handleCreateUser = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    if (!formData.name || !formData.email || !formData.password || !formData.role) {
      setError('Veuillez remplir tous les champs obligatoires.');
      return;
    }

    try {
      const response = await fetch('/api/users', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(formData)
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Erreur lors de la création de l\'utilisateur.');
      }

      setSuccessMsg(`L'utilisateur "${formData.name}" a été créé avec succès.`);
      setIsAddOpen(false);
      setFormData({
        name: '',
        email: '',
        phone: '',
        password: '',
        role: 'AGENT',
        isActive: true
      });
      fetchUsers();
    } catch (err: any) {
      setError(err.message || 'Erreur interne de communication.');
    }
  };

  const handleUpdateUser = async (e: FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;
    setError(null);
    setSuccessMsg(null);

    try {
      const response = await fetch(`/api/users/${selectedUser.id}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          role: formData.role,
          isActive: formData.isActive
        })
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Erreur lors de la modification.');
      }

      setSuccessMsg(`L'utilisateur "${formData.name}" a été modifié avec succès.`);
      setIsEditOpen(false);
      setSelectedUser(null);
      fetchUsers();
    } catch (err: any) {
      setError(err.message || 'Erreur lors de la modification de l\'utilisateur.');
    }
  };

  const handleResetPassword = async (e: FormEvent) => {
    e.preventDefault();
    if (!selectedUser || !newPassword) return;
    setError(null);
    setSuccessMsg(null);

    try {
      const response = await fetch(`/api/users/${selectedUser.id}/reset`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ newPassword })
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Erreur de réinitialisation.');
      }

      setSuccessMsg(`Le mot de passe de "${selectedUser.name}" a été mis à jour avec succès.`);
      setIsResetOpen(false);
      setNewPassword('');
      setSelectedUser(null);
    } catch (err: any) {
      setError(err.message || 'Erreur lors de la mise à jour du mot de passe.');
    }
  };

  const toggleUserStatus = async (user: User) => {
    setError(null);
    setSuccessMsg(null);
    const targetStatus = !user.isActive;

    try {
      const response = await fetch(`/api/users/${user.id}/status`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify({ isActive: targetStatus })
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Erreur changement statut.');
      }

      setSuccessMsg(`Le statut de ${user.name} a été basculé avec succès.`);
      fetchUsers();
    } catch (err: any) {
      setError(err.message || 'Impossible de changer le statut.');
    }
  };

  const handleDeleteUser = async (id: string, name: string) => {
    if (!confirm(`Voulez-vous vraiment supprimer définitivement l'utilisateur "${name}" du portail d'Abidjan ?`)) {
      return;
    }
    setError(null);
    setSuccessMsg(null);

    try {
      const response = await fetch(`/api/users/${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Erreur lors de la suppression.');
      }

      setSuccessMsg(`L'utilisateur "${name}" a été définitivement retiré.`);
      fetchUsers();
    } catch (err: any) {
      setError(err.message || 'Erreur interne de suppression.');
    }
  };

  const openAddModal = () => {
    setFormData({
      name: '',
      email: '',
      phone: '',
      password: '',
      role: 'AGENT',
      isActive: true
    });
    setError(null);
    setIsAddOpen(true);
  };

  const openEditModal = (user: User) => {
    setSelectedUser(user);
    setFormData({
      name: user.name,
      email: user.email,
      phone: user.phone,
      password: '', // unused in update
      role: user.role,
      isActive: user.isActive
    });
    setError(null);
    setIsEditOpen(true);
  };

  const openResetModal = (user: User) => {
    setSelectedUser(user);
    setNewPassword('');
    setError(null);
    setIsResetOpen(true);
  };

  const rolesList = [
    { code: 'ADMINISTRATEUR', label: 'Administrateur' },
    { code: 'COMPTABLE', label: 'Comptable' },
    { code: 'SUPERVISEUR', label: 'Superviseur Logistique' },
    { code: 'CHAUFFEUR', label: 'Chauffeur' },
    { code: 'AGENT', label: 'Agent Terrain' },
    { code: 'CLIENT', label: 'Client / Citoyen' }
  ];

  return (
    <div className="font-sans text-slate-800 p-6 space-y-6 max-w-7xl mx-auto">
      {/* Upper header section */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-100 pb-5">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-slate-900">
            Gestion des Utilisateurs & Opérateurs
          </h2>
          <p className="text-sm font-medium text-slate-500 mt-1">
            Création, habilitation, audits de rôles et sécurité d’accès de la plateforme AKPBF.
          </p>
        </div>
        <button
          onClick={openAddModal}
          className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-base py-3 px-6 rounded-xl shadow-lg shadow-emerald-600/10 transition duration-150 transform hover:-translate-y-0.5 cursor-pointer"
        >
          <UserPlus className="h-5 w-5" />
          Créer un Utilisateur
        </button>
      </div>

      {/* Notifications */}
      {successMsg && (
        <div className="bg-emerald-50 border-l-4 border-emerald-500 p-4 rounded-r-xl flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-3">
            <Check className="h-5 w-5 text-emerald-600 shrink-0" />
            <p className="text-emerald-800 font-medium text-sm">{successMsg}</p>
          </div>
          <button onClick={() => setSuccessMsg(null)} className="text-emerald-500 hover:text-emerald-700 cursor-pointer">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {error && (
        <div className="bg-rose-50 border-l-4 border-rose-500 p-4 rounded-r-xl flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-3">
            <X className="h-5 w-5 text-rose-600 shrink-0" />
            <p className="text-rose-800 font-medium text-sm">{error}</p>
          </div>
          <button onClick={() => setError(null)} className="text-rose-500 hover:text-rose-700 cursor-pointer">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Quick Search & Filters Bar */}
      <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex flex-col md:flex-row gap-4 items-center">
        <div className="relative w-full md:flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 h-5 w-5" />
          <input
            type="text"
            placeholder="Rechercher par nom, email, téléphone..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-11 pr-4 py-3 border border-slate-200 focus:border-emerald-500 rounded-xl text-base bg-slate-50/50 outline-none"
          />
        </div>
        
        <div className="flex flex-wrap gap-3 w-full md:w-auto">
          {/* Role Filter */}
          <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-xl text-slate-600 shrink-0 w-full sm:w-auto">
            <Filter className="h-4 w-4" />
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="bg-transparent font-medium py-1 text-base outline-none cursor-pointer text-slate-700"
            >
              <option value="">Tous les rôles</option>
              {rolesList.map(r => (
                <option key={r.code} value={r.code}>{r.label}</option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-xl text-slate-600 shrink-0 w-full sm:w-auto">
            <Shield className="h-4 w-4" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-transparent font-medium py-1 text-base outline-none cursor-pointer text-slate-700"
            >
              <option value="">Tous les statuts</option>
              <option value="active">Actifs uniquement</option>
              <option value="inactive">Désactivés uniquement</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Table view */}
      <div className="bg-white border border-slate-100 rounded-2xl shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="p-16 flex flex-col items-center justify-center gap-3">
            <Loader2 className="h-10 w-10 text-emerald-600 animate-spin" />
            <span className="text-slate-500 font-medium text-base">Chargement des comptes AKPBF...</span>
          </div>
        ) : users.length === 0 ? (
          <div className="p-16 text-center">
            <Lock className="h-12 w-12 text-slate-300 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-slate-700">Aucun utilisateur trouvé</h3>
            <p className="text-slate-400 text-sm mt-1">Créez des utilisateurs pour leur accorder des privilèges d'accès.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="bg-slate-50/70 border-b border-slate-100">
                  <th className="py-4 px-6 text-xs font-bold uppercase tracking-wider text-slate-500">Nom Complet</th>
                  <th className="py-4 px-6 text-xs font-bold uppercase tracking-wider text-slate-500">Contact / Email</th>
                  <th className="py-4 px-6 text-xs font-bold uppercase tracking-wider text-slate-500">Rôle</th>
                  <th className="py-4 px-6 text-xs font-bold uppercase tracking-wider text-slate-500">Statut</th>
                  <th className="py-4 px-5 text-xs font-bold uppercase tracking-wider text-slate-500 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {users.filter((item, idx, self) => self.findIndex(u => u.id === item.id) === idx).map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/50 transition duration-100">
                    <td className="py-5 px-6">
                      <div className="font-semibold text-slate-900 text-base">{item.name}</div>
                      <span className="text-xs text-slate-400 font-medium">Inscrit le {new Date(item.createdAt).toLocaleDateString('fr-FR')}</span>
                    </td>
                    <td className="py-5 px-6">
                      <div className="flex items-center gap-1.5 text-slate-600 text-base">
                        <Mail className="h-4 w-4 text-slate-400" />
                        {item.email}
                      </div>
                      {item.phone && (
                        <div className="flex items-center gap-1.5 text-slate-400 text-sm mt-1">
                          <Phone className="h-3.5 w-3.5" />
                          {item.phone}
                        </div>
                      )}
                    </td>
                    <td className="py-5 px-6">
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide ${
                        item.role === 'ADMINISTRATEUR' ? 'bg-purple-100 text-purple-700' :
                        item.role === 'COMPTABLE' ? 'bg-sky-100 text-sky-700' :
                        item.role === 'SUPERVISEUR' ? 'bg-orange-100 text-orange-700' :
                        item.role === 'CHAUFFEUR' ? 'bg-amber-100 text-amber-700' :
                        item.role === 'AGENT' ? 'bg-emerald-100 text-emerald-700' :
                        'bg-slate-100 text-slate-700'
                      }`}>
                        <Shield className="h-3.5 w-3.5" />
                        {item.role === 'ADMINISTRATEUR' ? 'Admin' : item.role}
                      </span>
                    </td>
                    <td className="py-5 px-6">
                      <button
                        onClick={() => toggleUserStatus(item)}
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-semibold cursor-pointer transition ${
                          item.isActive 
                            ? 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700' 
                            : 'bg-rose-50 hover:bg-rose-100 text-rose-600'
                        }`}
                        title={item.isActive ? "Désactiver ce compte" : "Activer ce compte"}
                      >
                        {item.isActive ? (
                          <>
                            <UserCheck className="h-4 w-4" />
                            Actif
                          </>
                        ) : (
                          <>
                            <UserX className="h-4 w-4" />
                            Désactivé
                          </>
                        )}
                      </button>
                    </td>
                    <td className="py-5 px-5 text-right">
                      <div className="inline-flex items-center gap-2">
                        {/* Reset Password Button */}
                        <button
                          onClick={() => openResetModal(item)}
                          className="p-2 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition duration-150 cursor-pointer"
                          title="Réinitialiser le mot de passe"
                        >
                          <LockKeyhole className="h-5 w-5" />
                        </button>

                        {/* Edit Button */}
                        <button
                          onClick={() => openEditModal(item)}
                          className="p-2 text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition duration-150 cursor-pointer"
                          title="Modifier les coordonnées"
                        >
                          <Edit className="h-5 w-5" />
                        </button>

                        {/* Delete Button */}
                        <button
                          onClick={() => handleDeleteUser(item.id, item.name)}
                          className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition duration-150 cursor-pointer"
                          title="Supprimer définitivement"
                        >
                          <Trash2 className="h-5 w-5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* MODAL : CREATE USER */}
      {isAddOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-white rounded-3xl w-full max-w-xl shadow-2xl overflow-hidden border border-slate-100 transform scale-100 transition-transform">
            <div className="bg-slate-900 p-6 text-white flex justify-between items-center">
              <div>
                <h3 className="text-xl font-bold">Nouveau Compte Système</h3>
                <p className="text-slate-400 text-xs mt-1">Créez un profil d'agent, comptable, chauffeur ou administrateur.</p>
              </div>
              <button onClick={() => setIsAddOpen(false)} className="text-slate-400 hover:text-white cursor-pointer">
                <X className="h-6 w-6" />
              </button>
            </div>
            
            <form onSubmit={handleCreateUser} className="p-6 space-y-5">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1.5">Nom complet *</label>
                <input
                  type="text"
                  required
                  placeholder="Koffi Armand"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-3 border border-slate-200 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 rounded-xl text-base bg-slate-50/50 outline-none"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1.5">Adresse email *</label>
                  <input
                    type="email"
                    required
                    placeholder="koffi.armand@akpbf.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-4 py-3 border border-slate-200 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 rounded-xl text-base bg-slate-50/50 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1.5">Téléphone mobile</label>
                  <input
                    type="text"
                    placeholder="+225 07 12 34 56 78"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-4 py-3 border border-slate-200 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 rounded-xl text-base bg-slate-50/50 outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1.5">Rôle Système *</label>
                  <select
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                    className="w-full px-4 py-3 border border-slate-200 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 rounded-xl text-base bg-slate-50/50 outline-none cursor-pointer"
                  >
                    {rolesList.map(r => (
                      <option key={r.code} value={r.code}>{r.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1.5">Mot de passe provisoire *</label>
                  <input
                    type="password"
                    required
                    minLength={6}
                    placeholder="••••••••"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="w-full px-4 py-3 border border-slate-200 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 rounded-xl text-base bg-slate-50/50 outline-none"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2.5 pt-2">
                <input
                  type="checkbox"
                  id="isActiveCheck"
                  checked={formData.isActive}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  className="h-5 w-5 text-emerald-600 border-slate-200 rounded cursor-pointer focus:ring-emerald-500"
                />
                <label htmlFor="isActiveCheck" className="text-base font-semibold text-slate-700 cursor-pointer">
                  Activer immédiatement le compte système
                </label>
              </div>

              <div className="flex gap-3 justify-end pt-5 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddOpen(false)}
                  className="px-5 py-3 text-slate-500 hover:bg-slate-50 rounded-xl font-semibold text-base transition cursor-pointer"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-semibold text-base shadow-lg shadow-emerald-600/10 transition cursor-pointer"
                >
                  Créer le Compte
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL : EDIT USER */}
      {isEditOpen && selectedUser && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-white rounded-3xl w-full max-w-xl shadow-2xl overflow-hidden border border-slate-100 transform scale-100 transition-transform">
            <div className="bg-slate-900 p-6 text-white flex justify-between items-center">
              <div>
                <h3 className="text-xl font-bold">Modifier l'Opérateur</h3>
                <p className="text-slate-400 text-xs mt-1">Ajustez le rôle, le statut, ou le téléphone de l'utilisateur.</p>
              </div>
              <button onClick={() => setIsEditOpen(false)} className="text-slate-400 hover:text-white cursor-pointer">
                <X className="h-6 w-6" />
              </button>
            </div>
            
            <form onSubmit={handleUpdateUser} className="p-6 space-y-5">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1.5">Nom complet *</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-3 border border-slate-200 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 rounded-xl text-base bg-slate-50/50 outline-none"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1.5">Adresse email *</label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-4 py-3 border border-slate-200 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 rounded-xl text-base bg-slate-50/50 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1.5">Téléphone mobile</label>
                  <input
                    type="text"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-4 py-3 border border-slate-200 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 rounded-xl text-base bg-slate-50/50 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1.5">Rôle Système *</label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  className="w-full px-4 py-3 border border-slate-200 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 rounded-xl text-base bg-slate-50/50 outline-none cursor-pointer"
                >
                  {rolesList.map(r => (
                    <option key={r.code} value={r.code}>{r.label}</option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-2.5 pt-2">
                <input
                  type="checkbox"
                  id="editIsActiveCheck"
                  checked={formData.isActive}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  className="h-5 w-5 text-emerald-600 border-slate-200 rounded cursor-pointer focus:ring-emerald-500"
                />
                <label htmlFor="editIsActiveCheck" className="text-base font-semibold text-slate-700 cursor-pointer">
                  Compte habilité à se connecter
                </label>
              </div>

              <div className="flex gap-3 justify-end pt-5 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsEditOpen(false)}
                  className="px-5 py-3 text-slate-500 hover:bg-slate-50 rounded-xl font-semibold text-base transition cursor-pointer"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-semibold text-base shadow-lg shadow-emerald-600/10 transition cursor-pointer"
                >
                  Valider Modifications
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL : RESET PASSWORD */}
      {isResetOpen && selectedUser && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden border border-slate-100 transform scale-100 transition-transform">
            <div className="bg-slate-900 p-5 text-white flex justify-between items-center">
              <div className="flex items-center gap-2">
                <LockKeyhole className="h-5 w-5 text-amber-400" />
                <h3 className="text-lg font-bold">Réinitialiser le Mot de passe</h3>
              </div>
              <button onClick={() => setIsResetOpen(false)} className="text-slate-400 hover:text-white cursor-pointer">
                <X className="h-6 w-6" />
              </button>
            </div>
            
            <form onSubmit={handleResetPassword} className="p-5 space-y-4">
              <p className="text-sm text-slate-500">
                Saisissez le nouveau mot de passe de connexion pour l'utilisateur <strong>{selectedUser.name}</strong> ({selectedUser.email}).
              </p>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1.5">Nouveau mot de passe *</label>
                <input
                  type="password"
                  required
                  minLength={6}
                  placeholder="Minimum 6 caractères"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-4 py-3 border border-slate-200 focus:border-indigo-500 rounded-xl text-base outline-none bg-slate-50"
                />
              </div>

              <div className="flex gap-2 justify-end pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsResetOpen(false)}
                  className="px-4 py-2.5 text-slate-500 hover:bg-slate-50 rounded-xl font-semibold transition cursor-pointer"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-semibold transition cursor-pointer"
                >
                  Réinitialiser
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
