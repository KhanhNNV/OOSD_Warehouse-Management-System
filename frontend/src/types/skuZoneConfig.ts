export interface SkuZoneConfig {
  id: number;
  skuPrefix: string;
  primaryZone: string;
  backupZone: string | null;
}

export interface SkuZoneConfigRequest {
  skuPrefix: string;
  primaryZone: string;
  backupZone?: string | null;
}