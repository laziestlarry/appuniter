export interface Organization {
  id: string;
  name: string;
  description?: string;
  units: Unit[];
  partners: PartnerRepo[];
}

export interface Unit {
  id: string;
  name: string;
  branches?: Branch[];
  connectors?: string[]; // marketplace connector IDs
}

export interface Branch {
  id: string;
  name: string;
  region?: string;
}

export interface PartnerRepo {
  id: string;
  name: string;
  url: string; // GitHub or similar
  type?: 'solution-partner' | 'delegate' | 'internal';
  tags?: string[];
}

export class OrgRegistry {
  private static orgs: Map<string, Organization> = new Map();

  static create(org: Organization) {
    this.orgs.set(org.id, org);
  }

  static get(id: string): Organization | undefined {
    return this.orgs.get(id);
  }

  static list(): Organization[] {
    return Array.from(this.orgs.values());
  }

  static upsertUnit(orgId: string, unit: Unit) {
    const org = this.get(orgId);
    if (!org) throw new Error(`Organization not found: ${orgId}`);
    const idx = org.units.findIndex(u => u.id === unit.id);
    if (idx >= 0) org.units[idx] = unit; else org.units.push(unit);
  }

  static addPartner(orgId: string, partner: PartnerRepo) {
    const org = this.get(orgId);
    if (!org) throw new Error(`Organization not found: ${orgId}`);
    org.partners.push(partner);
  }
}

