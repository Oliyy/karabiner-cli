import fs from 'fs/promises';
import path from 'path';
import type { KarabinerConfig, Profile, Rule } from './types';

const KARABINER_CONFIG_PATH = '/Users/oliy/.config/karabiner/karabiner.json';

export class KarabinerConfigManager {
  private config: KarabinerConfig | null = null;
  private configPath: string;

  constructor(configPath: string = KARABINER_CONFIG_PATH) {
    this.configPath = configPath;
  }

  async loadConfig(): Promise<KarabinerConfig> {
    try {
      const fileContent = await fs.readFile(this.configPath, 'utf-8');
      this.config = JSON.parse(fileContent) as KarabinerConfig;
      if (!this.config.profiles || !Array.isArray(this.config.profiles)) {
        throw new Error('Invalid Karabiner configuration: "profiles" array is missing or not an array.');
      }
      return this.config;
    } catch (error) {
      console.error(`Error loading Karabiner config from ${this.configPath}:`, error);
      throw error;
    }
  }

  getActiveProfile(): Profile | null {
    if (!this.config) {
      throw new Error('Config not loaded. Call loadConfig() first.');
    }
    const activeProfile = this.config.profiles.find(p => p.selected);
    if (!activeProfile) {
      throw new Error('No active profile found in Karabiner configuration.');
    }
    return activeProfile;
  }

  getComplexModifications(profile: Profile): Rule[] {
    if (!profile.complex_modifications || !profile.complex_modifications.rules) {
      return [];
    }
    return profile.complex_modifications.rules;
  }

  addComplexModificationRule(profile: Profile, newRule: Rule): void {
    if (!profile.complex_modifications) {
      profile.complex_modifications = { rules: [] };
    }
    if (!profile.complex_modifications.rules) {
      profile.complex_modifications.rules = [];
    }
    profile.complex_modifications.rules.push(newRule);
  }

  async saveConfig(): Promise<void> {
    if (!this.config) {
      throw new Error('No configuration data to save. Load or modify config first.');
    }

    const backupPath = this.configPath + '.bak';

    try {
      await fs.copyFile(this.configPath, backupPath);
      console.log(`Backup created at ${backupPath}`);
    } catch (error) {
      console.warn(`Could not create backup for ${this.configPath}:`, error);
    }

    try {
      const newConfigContent = JSON.stringify(this.config, null, 4);
      await fs.writeFile(this.configPath, newConfigContent, 'utf-8');
      console.log(`Karabiner configuration saved to ${this.configPath}`);
    } catch (error) {
      console.error(`Error saving Karabiner config to ${this.configPath}:`, error);
      throw error;
    }
  }
}
