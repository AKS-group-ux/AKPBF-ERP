import crypto from 'crypto';

// Replicate decimal values for Prisma schemas
class MockDecimal {
  private val: number;
  constructor(v: any) {
    this.val = Number(v) || 0;
  }
  toNumber(): number {
    return this.val;
  }
  toString(): string {
    return this.val.toString();
  }
  toLocaleString(): string {
    return this.val.toLocaleString();
  }
}

export class InMemoryDb {
  private static instance: InMemoryDb | null = null;

  public static getInstance(): InMemoryDb {
    if (!InMemoryDb.instance) {
      InMemoryDb.instance = new InMemoryDb();
    }
    return InMemoryDb.instance;
  }

  private constructor() {
    this.seedInMemoryDefaults();
  }

  private seedInMemoryDefaults() {
    // 1. Seed Roles
    const rolesData = [
      { id: 'role-admin-id', name: 'ADMINISTRATEUR', description: 'Super-administrateur' },
      { id: 'role-comptable-id', name: 'COMPTABLE', description: 'Gestion financière' },
      { id: 'role-superviseur-id', name: 'SUPERVISEUR', description: 'Superviseur logistique' },
      { id: 'role-chauffeur-id', name: 'CHAUFFEUR', description: 'Chauffeur' },
      { id: 'role-agent-id', name: 'AGENT', description: 'Agent de terrain' },
      { id: 'role-recouvrement-id', name: 'AGENT_RECOUVREMENT', description: 'Agent de Recouvrement' },
      { id: 'role-client-id', name: 'CLIENT', description: 'Client / Citoyen' }
    ];
    this.collections.role = rolesData;

    // 2. Seed Users
    const usersData = [
      { id: 'usr-admin-1', email: 'groupaksservices@zohomail.com', name: 'Alkaïda Benjamin', phone: '+225 05 01 02 03 04', isActive: true, passwordHash: '', createdAt: new Date() },
      { id: 'usr-comptable-1', email: 'comptable@akpbf.com', name: 'Doumbia Sylvain (Fisc)', phone: '+225 05 02 03 04 05', isActive: true, passwordHash: '', createdAt: new Date() },
      { id: 'usr-superviseur-1', email: 'superviseur@akpbf.com', name: 'Gérard Gnakoury (Logistique)', phone: '+225 05 03 04 05 06', isActive: true, passwordHash: '', createdAt: new Date() },
      { id: 'usr-chauffeur-1', email: 'chauffeur@akpbf.com', name: 'Kaboré Moussa', phone: '+225 05 04 05 06 07', isActive: true, passwordHash: '', createdAt: new Date() },
      { id: 'usr-agent-1', email: 'agent@akpbf.com', name: 'Coulibaly Issa', phone: '+225 05 05 06 07 08', isActive: true, passwordHash: '', createdAt: new Date() },
      { id: 'usr-recouvrement-1', email: 'recouvrement@akpbf.com', name: 'Touré Moussa', phone: '+225 05 09 09 09 09', isActive: true, passwordHash: '', createdAt: new Date(), assignedZones: ['Cocody'] },
      { id: 'usr-dir-admin', email: 'groupaksservices@gmail.com', name: 'Direction AKP (Admin)', phone: '+225 05 00 00 00 01', isActive: true, passwordHash: '', createdAt: new Date() }
    ];
    this.collections.user = usersData;

    // 3. Seed UserRoles mapping
    this.collections.userRole = [
      { userId: 'usr-admin-1', roleId: 'role-admin-id' },
      { userId: 'usr-comptable-1', roleId: 'role-comptable-id' },
      { userId: 'usr-superviseur-1', roleId: 'role-superviseur-id' },
      { userId: 'usr-chauffeur-1', roleId: 'role-chauffeur-id' },
      { userId: 'usr-agent-1', roleId: 'role-agent-id' },
      { userId: 'usr-recouvrement-1', roleId: 'role-recouvrement-id' },
      { userId: 'usr-dir-admin', roleId: 'role-admin-id' }
    ];
  }

  // Real-time in-memory collections of entities
  public collections: Record<string, any[]> = {
    user: [],
    role: [],
    permission: [],
    userRole: [],
    rolePermission: [],
    customer: [
      {
        id: '40290000-0000-0000-0000-000000004029',
        name: 'Koffi Jean-Jacques',
        email: 'koffi.jj@email.com',
        phone: '+225 07 48 29 10 22',
        address: 'Rue des Jardins, Villa 14, Cocody',
        subscriberId: 'SUB-4029',
        latitude: 5.3524,
        longitude: -3.9875,
        status: 'ACTIVE',
        balance: new MockDecimal(0),
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: '19330000-0000-0000-0000-000000001933',
        name: 'Soro Aminata',
        email: 'aminata.soro@outlook.com',
        phone: '+225 01 02 83 94 00',
        address: 'Avenue de la République, Face BICICI, Plateau',
        subscriberId: 'SUB-1933',
        latitude: 5.3211,
        longitude: -4.0198,
        status: 'ACTIVE',
        balance: new MockDecimal(0),
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: '88420000-0000-0000-0000-000000008842',
        name: 'Mamadou Diallo',
        email: 'diallo.mamadou@gmail.com',
        phone: '+225 05 55 92 11 39',
        address: 'Cité des Arts, Bâtiment D2, Cocody',
        subscriberId: 'SUB-8842',
        latitude: 5.3489,
        longitude: -3.9995,
        status: 'SUSPENDED',
        balance: new MockDecimal(3500),
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ],
    subscriptionPlan: [
      {
        id: '1b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4bed',
        name: 'Standard Municipal',
        price: new MockDecimal(3500),
        frequency: 'Mensuel',
        description: '2 collectes par semaine, bac de 240L fourni, idéal pour les ménages standards de 2 à 4 personnes.',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: '2b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4bed',
        name: 'Famille Nombreuse',
        price: new MockDecimal(6000),
        frequency: 'Mensuel',
        description: '3 collectes par semaine, bac renforcé de 360L fourni, ramassage des encombrants légers inclus.',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: '3b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4bed',
        name: 'Professionnel & Commerce',
        price: new MockDecimal(15000),
        frequency: 'Mensuel',
        description: 'Collecte quotidienne du lundi au samedi, grand conteneur de 1100L fourni, service de désinfection trimestriel.',
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ],
    subscription: [
      {
        id: 'sub-active-1',
        customerId: '40290000-0000-0000-0000-000000004029',
        planId: '1b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4bed',
        startDate: new Date(),
        status: 'ACTIVE',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 'sub-active-2',
        customerId: '19330000-0000-0000-0000-000000001933',
        planId: '3b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4bed',
        startDate: new Date(),
        status: 'ACTIVE',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 'sub-active-3',
        customerId: '88420000-0000-0000-0000-000000008842',
        planId: '1b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4bed',
        startDate: new Date(),
        status: 'SUSPENDED',
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ],
    invoice: [
      {
        id: 'inv-1',
        customerId: '88420000-0000-0000-0000-000000008842',
        amount: new MockDecimal(3500),
        dueDate: new Date(Date.now() - 5 * 24 * 3600 * 1000),
        status: 'UNPAID',
        billingPeriodStart: new Date(Date.now() - 35 * 24 * 3600 * 1000),
        billingPeriodEnd: new Date(Date.now() - 5 * 24 * 3600 * 1000),
        createdAt: new Date(Date.now() - 35 * 24 * 3600 * 1000),
        updatedAt: new Date()
      }
    ],
    payment: [],
    transaction: [],
    collectionRoute: [],
    routeAssignment: [],
    vehicle: [],
    vehicleLocation: [],
    bin: [
      {
        id: 'bin-1',
        qrCode: 'RFID-SUB-4029',
        customerId: '40290000-0000-0000-0000-000000004029',
        capacity: 240.0,
        fillLevel: 75,
        status: 'OK',
        createdAt: new Date()
      },
      {
        id: 'bin-2',
        qrCode: 'RFID-SUB-1933',
        customerId: '19330000-0000-0000-0000-000000001933',
        capacity: 1100.0,
        fillLevel: 40,
        status: 'OK',
        createdAt: new Date()
      },
      {
        id: 'bin-3',
        qrCode: 'RFID-SUB-8842',
        customerId: '88420000-0000-0000-0000-000000008842',
        capacity: 240.0,
        fillLevel: 95,
        status: 'FULL',
        createdAt: new Date()
      }
    ],
    collection: [],
    complaint: [],
    notification: [],
    document: [],
    auditLog: [],
    setting: []
  };

  /**
   * Translates models into in-memory collections names
   */
  private getCollectionName(model: string): string {
    const raw = model.toLowerCase();
    if (raw === 'subscriptionplan') return 'subscriptionPlan';
    if (raw === 'userrole') return 'userRole';
    if (raw === 'rolepermission') return 'rolePermission';
    if (raw === 'routeassignment') return 'routeAssignment';
    if (raw === 'vehiclelocation') return 'vehicleLocation';
    if (raw === 'collectionroute') return 'collectionRoute';
    if (raw === 'auditlog') return 'auditLog';
    return raw;
  }

  /**
   * Helper to check relationships and nested objects for findMany / findFirst / findUnique
   */
  private enrichRecord(model: string, record: any): any {
    if (!record) return null;
    const name = this.getCollectionName(model);

    if (name === 'customer') {
      return {
        ...record,
        subscriptions: this.collections.subscription.filter(s => s.customerId === record.id).map(s => this.enrichRecord('subscription', s)),
        invoices: this.collections.invoice.filter(i => i.customerId === record.id),
        bins: this.collections.bin.filter(b => b.customerId === record.id),
        documents: this.collections.document.filter(d => d.customerId === record.id)
      };
    }

    if (name === 'subscription') {
      return {
        ...record,
        customer: this.collections.customer.find(c => c.id === record.customerId),
        plan: this.collections.subscriptionPlan.find(p => p.id === record.planId)
      };
    }

    if (name === 'invoice') {
      return {
        ...record,
        customer: this.collections.customer.find(c => c.id === record.customerId),
        subscription: this.collections.subscription.find(s => s.id === record.subscriptionId),
        payments: (this.collections.payment || []).filter(p => p.invoiceId === record.id)
      };
    }

    if (name === 'bin') {
      return {
        ...record,
        customer: this.collections.customer.find(c => c.id === record.customerId),
        collections: (this.collections.collection || []).filter(co => co.binId === record.id)
      };
    }

    if (name === 'user') {
      const userRoles = (this.collections.userRole || [])
        .filter(ur => ur.userId === record.id)
        .map(ur => {
          const roleData = this.collections.role.find(r => r.id === ur.roleId);
          return {
            ...ur,
            role: roleData ? { ...roleData } : null
          };
        });
      return {
        ...record,
        userRoles
      };
    }

    return record;
  }

  public findMany(model: string, args?: any): any[] {
    const name = this.getCollectionName(model);
    let list = this.collections[name] || [];

    // Simple filtration simulation
    if (args?.where) {
      list = list.filter(item => {
        for (const [key, filter] of Object.entries(args.where)) {
          if (filter === undefined) continue;

          if (key === 'OR' && Array.isArray(filter)) {
            const orConditions = filter as any[];
            const matchesOr = orConditions.some(condition => {
              for (const [subCol, subVal] of Object.entries(condition)) {
                const actualVal = item[subCol];
                if (subVal && typeof subVal === 'object' && !(subVal instanceof Date) && !(subVal instanceof MockDecimal)) {
                  const sAny = subVal as any;
                  if ('equals' in sAny) {
                    if (String(actualVal).toLowerCase() === String(sAny.equals).toLowerCase()) return true;
                  }
                } else {
                  if (String(actualVal).toLowerCase() === String(subVal).toLowerCase()) return true;
                }
              }
              return false;
            });
            if (!matchesOr) return false;
            continue;
          }

          // Handle simple object (equals/in etc.) or direct value match
          if (filter && typeof filter === 'object' && !(filter instanceof Date) && !(filter instanceof MockDecimal)) {
            const fAny = filter as any;
            if ('equals' in fAny) {
              const val = String(item[key]).toLowerCase();
              const expected = String(fAny.equals).toLowerCase();
              if (val !== expected) return false;
            } else if ('contains' in fAny) {
              const val = String(item[key]).toLowerCase();
              const expected = String(fAny.contains).toLowerCase();
              if (!val.includes(expected)) return false;
            } else if ('in' in fAny && Array.isArray(fAny.in)) {
              if (!fAny.in.map((x: any) => String(x).toLowerCase()).includes(String(item[key]).toLowerCase())) {
                return false;
              }
            } else if ('not' in fAny) {
              if (item[key] === fAny.not) return false;
            }
          } else {
            // Direct attribute value match
            if (String(item[key]).toLowerCase() !== String(filter).toLowerCase()) {
              return false;
            }
          }
        }
        return true;
      });
    }

    // Enrich items
    return list.map(item => this.enrichRecord(model, item));
  }

  public findUnique(model: string, args: any): any {
    const list = this.findMany(model, args);
    return list[0] || null;
  }

  public findFirst(model: string, args?: any): any {
    const list = this.findMany(model, args);
    return list[0] || null;
  }

  public create(model: string, args: any): any {
    const name = this.getCollectionName(model);
    if (!this.collections[name]) {
      this.collections[name] = [];
    }

    const payload = args.data || {};
    const newRecord: any = {
      id: payload.id || crypto.randomUUID(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // Flatten data keys
    for (const [key, val] of Object.entries(payload)) {
      if (val !== undefined) {
        if (typeof val === 'number' && (key === 'balance' || key === 'amount' || key === 'price')) {
          newRecord[key] = new MockDecimal(val);
        } else {
          newRecord[key] = val;
        }
      }
    }

    this.collections[name].push(newRecord);
    return this.enrichRecord(model, newRecord);
  }

  public update(model: string, args: any): any {
    const target = this.findUnique(model, { where: args.where });
    if (!target) {
      throw new Error(`Enregistrement introuvable pour la mise à jour (Modèle: ${model})`);
    }

    const name = this.getCollectionName(model);
    const index = this.collections[name].findIndex(x => x.id === target.id);

    const payload = args.data || {};
    for (const [key, val] of Object.entries(payload)) {
      if (val !== undefined) {
        if (val && typeof val === 'object' && 'decrement' in val) {
          const current = Number(this.collections[name][index][key]?.toString() || 0);
          this.collections[name][index][key] = new MockDecimal(current - Number(val.decrement));
        } else if (val && typeof val === 'object' && 'increment' in val) {
          const current = Number(this.collections[name][index][key]?.toString() || 0);
          this.collections[name][index][key] = new MockDecimal(current + Number(val.increment));
        } else {
          this.collections[name][index][key] = val;
        }
      }
    }

    this.collections[name][index].updatedAt = new Date();
    return this.enrichRecord(model, this.collections[name][index]);
  }

  public updateMany(model: string, args: any): { count: number } {
    const list = this.findMany(model, { where: args.where });
    const name = this.getCollectionName(model);
    
    let count = 0;
    for (const item of list) {
      const idx = this.collections[name].findIndex(x => x.id === item.id);
      if (idx !== -1) {
        const payload = args.data || {};
        for (const [key, val] of Object.entries(payload)) {
          if (val !== undefined) {
            this.collections[name][idx][key] = val;
          }
        }
        count++;
      }
    }
    return { count };
  }

  public upsert(model: string, args: any): any {
    const name = this.getCollectionName(model);
    const target = this.collections[name]?.find(x => x.key === args.where.key || x.id === args.where.id);
    
    if (target) {
      return this.update(model, {
        where: args.where,
        data: args.update
      });
    } else {
      return this.create(model, {
        data: args.create
      });
    }
  }

  public delete(model: string, args: any): any {
    const target = this.findUnique(model, { where: args.where });
    if (!target) {
      throw new Error(`Enregistrement introuvable pour suppression (Modèle: ${model})`);
    }

    const name = this.getCollectionName(model);
    this.collections[name] = this.collections[name].filter(x => x.id !== target.id);
    return target;
  }

  public count(model: string, args?: any): number {
    return this.findMany(model, args).length;
  }
}
