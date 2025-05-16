#!/usr/bin/env bun
import { Command } from 'commander';
import inquirer from 'inquirer';
import { KarabinerConfigManager } from './configManager';
import type { Rule, Manipulator, ToEvent, DevicePreset } from './types';
import fs from 'fs'; // For fs.watch in the 'watch' command

const program = new Command();
const configManager = new KarabinerConfigManager();

program
  .name('karabiner-tool')
  .description('CLI tool to manage Karabiner Elements complex modifications');

function formatToEvent(toEvent: ToEvent): string {
  let output = '';
  if (toEvent.key_code) {
    output += toEvent.key_code;
  }
  if (toEvent.modifiers && toEvent.modifiers.length > 0) {
    const mods = toEvent.modifiers.map(m => {
      if (m.startsWith('left_')) return m.replace('left_', 'L-');
      if (m.startsWith('right_')) return m.replace('right_', 'R-');
      return m;
    }).join('+');
    output = `${mods}+${output}`;
  }
  return output;
}

async function displayComplexModifications() {
  try {
    await configManager.loadConfig();
    const activeProfile = configManager.getActiveProfile();
    if (!activeProfile) {
      console.error('No active profile found.');
      return;
    }
    console.log(`\nComplex Modifications for profile: "${activeProfile.name}":`);
    const rules = configManager.getComplexModifications(activeProfile);
    if (rules.length === 0) {
      console.log('  No complex modifications found.');
      return;
    }
    rules.forEach((rule, index) => {
      console.log(`\n[${index + 1}] ${rule.description}`);
      rule.manipulators.forEach((manipulator: Manipulator) => {
        if (manipulator.conditions) {
          manipulator.conditions.forEach(condition => {
            if (condition.type === 'device_if' && condition.identifiers && condition.identifiers[0]) {
              const dev = condition.identifiers[0];
              console.log(`    Device: ${dev.description || 'N/A'} (VendorID: ${dev.vendor_id}, ProductID: ${dev.product_id})`);
            }
          });
        }
        let fromKey = manipulator.from.key_code || manipulator.from.consumer_key_code || manipulator.from.pointing_button || 'N/A';
        if (manipulator.from.modifiers && manipulator.from.modifiers.optional?.includes('any')) {
          fromKey = `Any+${fromKey}`;
        }
        // TODO: Handle mandatory modifiers for 'from' if necessary
        console.log(`    From: ${fromKey}`);
        if (manipulator.to && manipulator.to.length > 0) {
          console.log(`    To: ${manipulator.to.map(formatToEvent).join(', ')}`);
        }
      });
    });
  } catch (error) {
    if (error instanceof Error) {
      console.error('Error listing modifications:', error.message);
    } else {
      console.error('An unknown error occurred while listing modifications.');
    }
  }
}

program
  .command('list')
  .description('List all active complex modifications')
  .action(displayComplexModifications);

// Device presets as discussed
const devicePresets: DevicePreset[] = [
  { name: "Foot Pedal", description: "VoltPad", vendor_id: 65195, product_id: 6 },
  { name: "VoltPad", description: "VoltPad", vendor_id: 33025, product_id: 9217 },
  { name: "Keychron Q0 Max", description: "Keychron Q0 Max", vendor_id: 13364, product_id: 2048 },
  { name: "BN006 (Binepad)", description: "BN006 (Binepad)", vendor_id: 16969, product_id: 17006 },
  { name: "PIXIE", description: "PIXIE", vendor_id: 16969, product_id: 20600 },
];

// Placeholder for 'add' command
program
  .command('add')
  .description('Add a new complex modification interactively')
  .action(async () => {
    try {
      await configManager.loadConfig();
      const activeProfile = configManager.getActiveProfile();
      if (!activeProfile) {
        console.error('No active profile found. Cannot add modification.');
        return;
      }

      const currentRules = configManager.getComplexModifications(activeProfile);

      // 1. Select Device Preset
      const presetChoices = [
        ...devicePresets.map(p => ({ name: `${p.name} (Vendor: ${p.vendor_id}, Product: ${p.product_id})`, value: p })),
        new inquirer.Separator(),
        { name: "Custom Device", value: "custom" }
      ];

      const { selectedPresetChoice } = await inquirer.prompt([
        {
          type: 'list',
          name: 'selectedPresetChoice',
          message: 'Select a device preset:',
          choices: presetChoices,
        },
      ]);

      let targetDevice: DevicePreset;

      if (selectedPresetChoice === "custom") {
        const customDeviceAnswers = await inquirer.prompt([
          { type: 'input', name: 'description', message: 'Enter device description (e.g., My Keyboard):' },
          { type: 'number', name: 'vendor_id', message: 'Enter Vendor ID:' },
          { type: 'number', name: 'product_id', message: 'Enter Product ID:' },
        ]);
        targetDevice = { name: customDeviceAnswers.description, ...customDeviceAnswers };
      } else {
        targetDevice = selectedPresetChoice as DevicePreset;
      }

      // 2. Enter "From" Key
      const { fromKey } = await inquirer.prompt([
        { type: 'input', name: 'fromKey', message: 'Enter the "from" key_code (e.g., a, keypad_1, f1):' },
      ]);

      // 3. Auto-Suggest "To" Key + Modifiers
      const usedToCombinations = new Set<string>();
      currentRules.forEach(rule => {
        rule.manipulators.forEach(manipulator => {
          manipulator.to?.forEach(toEvent => {
            const key = toEvent.key_code || '';
            const mods = (toEvent.modifiers || []).sort().join(',');
            usedToCombinations.add(`${key}:${mods}`);
          });
        });
      });

      let suggestedToKey: string | null = null;
      let suggestedModifiers: string[] = [];
      const hyperModifiersLeft = ["left_command", "left_option", "left_control", "left_shift"].sort();
      const hyperModifiersRight = ["right_command", "right_option", "right_control", "right_shift"].sort();
      const suggestionKeyPool = "abcdefghijklmnopqrstuvwxyz0123456789".split('');

      for (const key of suggestionKeyPool) {
        const comboLeft = `${key}:${hyperModifiersLeft.join(',')}`;
        if (!usedToCombinations.has(comboLeft)) {
          suggestedToKey = key;
          suggestedModifiers = hyperModifiersLeft;
          break;
        }
        const comboRight = `${key}:${hyperModifiersRight.join(',')}`;
        if (!usedToCombinations.has(comboRight)) {
          suggestedToKey = key;
          suggestedModifiers = hyperModifiersRight;
          break;
        }
      }
      
      let finalToKey: string;
      let finalModifiers: string[];

      if (suggestedToKey) {
        const { useSuggestion } = await inquirer.prompt([
          {
            type: 'confirm',
            name: 'useSuggestion',
            message: `Suggested 'to' mapping: ${formatToEvent({ key_code: suggestedToKey, modifiers: suggestedModifiers })}. Use this?`,
            default: true,
          }
        ]);
        if (useSuggestion) {
          finalToKey = suggestedToKey;
          finalModifiers = suggestedModifiers;
        } else {
          // Manual input for 'to' key
          const manualTo = await inquirer.prompt([
            { type: 'input', name: 'toKey', message: 'Enter the "to" key_code:'},
            { 
              type: 'checkbox', 
              name: 'toModifiers', 
              message: 'Select "to" modifiers (optional):',
              choices: [
                "left_command", "left_option", "left_control", "left_shift",
                "right_command", "right_option", "right_control", "right_shift",
                "caps_lock", "fn"
              ]
            }
          ]);
          finalToKey = manualTo.toKey;
          finalModifiers = manualTo.toModifiers;
        }
      } else {
        console.log("Could not find an available Hyper key combination automatically.");
         const manualTo = await inquirer.prompt([
            { type: 'input', name: 'toKey', message: 'Enter the "to" key_code:'},
            { 
              type: 'checkbox', 
              name: 'toModifiers', 
              message: 'Select "to" modifiers (optional):',
              choices: [
                "left_command", "left_option", "left_control", "left_shift",
                "right_command", "right_option", "right_control", "right_shift",
                "caps_lock", "fn"
              ]
            }
          ]);
          finalToKey = manualTo.toKey;
          finalModifiers = manualTo.toModifiers;
      }
      
      // 4. Construct the new rule
      const autoDescription = `${fromKey} to ${formatToEvent({key_code: finalToKey, modifiers: finalModifiers})} for ${targetDevice.description || targetDevice.name}`;
      
      const { description } = await inquirer.prompt ([
        {
          type: 'input',
          name: 'description',
          message: 'Enter a description for this rule:',
          default: autoDescription
        }
      ]);

      const newRule: Rule = {
        description: description,
        manipulators: [
          {
            type: 'basic',
            from: {
              key_code: fromKey,
              modifiers: { optional: ['any'] },
            },
            to: [
              {
                key_code: finalToKey,
                modifiers: finalModifiers,
              },
            ],
            conditions: [
              {
                type: 'device_if',
                identifiers: [
                  {
                    vendor_id: targetDevice.vendor_id,
                    product_id: targetDevice.product_id,
                    description: targetDevice.description || targetDevice.name,
                  },
                ],
              },
            ],
          },
        ],
      };

      // 5. Add rule and save
      configManager.addComplexModificationRule(activeProfile, newRule);
      await configManager.saveConfig();
      console.log(`Successfully added new rule: "${description}"`);

    } catch (error) {
       if (error instanceof Error) {
        console.error('Error adding modification:', error.message);
      } else {
        console.error('An unknown error occurred while adding modification.');
      }
      if ((error as any).isTtyError) {
        console.error('Prompts could not be rendered in the current environment.');
      }
    }
  });

// Placeholder for 'watch' command
program
  .command('watch')
  .description('Monitor karabiner.json for changes and update list')
  .action(async () => {
    const karabinerConfigFilePath = '/Users/oliy/.config/karabiner/karabiner.json';
    console.log(`Watching ${karabinerConfigFilePath} for changes...`);

    const listModificationsOnWatch = async () => {
      console.clear(); // Clear console before re-listing
      console.log(`File changed at ${new Date().toLocaleTimeString()}. Reloading modifications...`);
      try {
        await displayComplexModifications();
      } catch (e) {
        console.error("Error reloading modifications on watch:", e);
      }
    };

    // Initial list
    await listModificationsOnWatch();

    fs.watch(karabinerConfigFilePath, async (eventType, filename) => {
      if (filename && eventType === 'change') {
        await listModificationsOnWatch();
      } else if (filename && eventType === 'rename') {
        console.log(`File ${filename} was renamed or deleted. Stopping watch.`);
        process.exit(0); // Or try to re-watch
      }
    });

    // Keep the process alive
    process.stdin.resume();
    process.on('SIGINT', () => {
      console.log('Stopping watch.');
      process.exit(0);
    });
  });


async function main() {
  await program.parseAsync(process.argv);
}

main().catch(err => {
  console.error("An unexpected error occurred:", err);
  process.exit(1);
});
