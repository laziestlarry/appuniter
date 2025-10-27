import { proxyActivities } from '@temporalio/workflow';
import { OrgRegistry, Organization, Unit, Branch, PartnerRepo } from '../integrations/org';
import * as knowledge from './knowledge';
import * as business from './business';

// Organizational scaffolding workflows (in-memory registry)

export async function createOrganization(id: string, name: string, description?: string): Promise<Organization> {
  const org: Organization = { id, name, description, units: [], partners: [] };
  OrgRegistry.create(org);
  return org;
}

export async function addUnit(orgId: string, unit: Unit): Promise<Organization> {
  OrgRegistry.upsertUnit(orgId, unit);
  const org = OrgRegistry.get(orgId);
  if (!org) throw new Error('Org not found after upsert');
  return org;
}

export async function addBranch(orgId: string, unitId: string, branch: Branch): Promise<Organization> {
  const org = OrgRegistry.get(orgId);
  if (!org) throw new Error('Org not found');
  const unit = org.units.find(u => u.id === unitId);
  if (!unit) throw new Error('Unit not found');
  unit.branches = unit.branches || [];
  const idx = unit.branches.findIndex(b => b.id === branch.id);
  if (idx >= 0) unit.branches[idx] = branch; else unit.branches.push(branch);
  return org;
}

export async function addPartnerRepo(orgId: string, partner: PartnerRepo): Promise<Organization> {
  OrgRegistry.addPartner(orgId, partner);
  const org = OrgRegistry.get(orgId);
  if (!org) throw new Error('Org not found');
  return org;
}

export interface PartnerIngestResult { ingested: number; index: string; }
export async function ingestPartnerRepositories(orgId: string, index: string): Promise<PartnerIngestResult> {
  const org = OrgRegistry.get(orgId);
  if (!org) throw new Error('Org not found');
  const paths = org.partners.map(p => p.url).filter(u => u.startsWith('/')); // local paths only for now
  if (paths.length === 0) return { ingested: 0, index };
  await knowledge.ingestLocalKnowledge(index, paths);
  return { ingested: paths.length, index };
}

export async function unifyAllInventory(orgId: string): Promise<any> {
  const org = OrgRegistry.get(orgId);
  if (!org) throw new Error('Org not found');
  const connectorIds = Array.from(new Set(org.units.flatMap(u => u.connectors || [])));
  return business.unifyInventory(connectorIds);
}

export interface LaunchPlan {
  orgId: string;
  knowledgeIndex: string;
  messagesIndex?: string;
  steps: string[];
  status: 'created';
}

export async function initialLaunch(orgId: string, knowledgeIndex: string, ingestBasePath: string = '.'): Promise<LaunchPlan> {
  // Ingest local knowledge as seed
  await knowledge.ingestLatestLocal(knowledgeIndex, ingestBasePath, 300);
  // Unify any configured connector inventories
  await unifyAllInventory(orgId).catch(() => ({} as any));
  return { orgId, knowledgeIndex, steps: ['ingest-knowledge', 'unify-inventory'], status: 'created' };
}

