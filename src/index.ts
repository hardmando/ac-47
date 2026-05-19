import { config } from './config.js';
import { promptLLM } from './llm.js';
import { 
  Intent, 
  MAIN_SYSTEM_PROMPT, 
  ADD_EVENT_SYSTEM_PROMPT, 
  QUERY_FREE_TIME_SYSTEM_PROMPT,
  AddEventIntent,
  QueryFreeTimeIntent
} from './intent.js';
import { now, formatEventTime } from './utils/datetime.js';
import { getBusySlots, findFreeSlots } from './calendar.js';
import { writeIcsFile } from './ics-writer.js';
import { runOpenClaw } from './openclaw.js';
import chalk from 'chalk';
import inquirer from 'inquirer';
import { DateTime } from 'luxon';

async function handleAddEvent(intent: AddEventIntent) {
  if (intent.ambiguous_fields.length > 0) {
    console.log(chalk.yellow(`? Need more info for: ${intent.ambiguous_fields.join(', ')}`));
    // Simple re-prompt logic could go here
    return;
  }

  let success = false;
  if (config.openclawEnabled) {
    success = await runOpenClaw(intent);
  }

  if (success) {
    console.log(chalk.green(`✓ Event "${intent.title}" scheduled via OpenClaw.`));
  } else {
    const filePath = writeIcsFile(intent);
    console.log(chalk.cyan(`~ OpenClaw unavailable or failed. ICS file generated: ${filePath}`));
  }
}

async function handleQueryFreeTime(intent: QueryFreeTimeIntent) {
  const start = DateTime.fromISO(intent.window_start).setZone(config.timezone).startOf('day');
  const end = DateTime.fromISO(intent.window_end).setZone(config.timezone).endOf('day');
  
  const busy = getBusySlots(config.icsInputPath, start, end);
  const free = findFreeSlots(busy, start, end, intent.duration_minutes);

  if (free.length === 0) {
    console.log(chalk.red('> No free slots found in that window.'));
    return;
  }

  console.log(chalk.blue(`> Found ${free.length} free slots:`));
  free.forEach((slot, i) => {
    console.log(`${i + 1}. ${formatEventTime(slot.start)} - ${formatEventTime(slot.end)}`);
  });

  const { selection } = await inquirer.prompt([
    {
      type: 'input',
      name: 'selection',
      message: "Would you like to schedule something in one of these slots? (enter slot number or 'no')",
      default: 'no'
    }
  ]);

  if (selection !== 'no' && !isNaN(parseInt(selection))) {
    const slot = free[parseInt(selection) - 1];
    if (slot) {
      const { title } = await inquirer.prompt([{ type: 'input', name: 'title', message: 'Event title?' }]);
      const newIntent: AddEventIntent = {
        intent: 'ADD_EVENT',
        title,
        date: slot.start.toISODate(),
        start_time: slot.start.toFormat('HH:mm'),
        end_time: slot.end.toFormat('HH:mm'),
        duration_minutes: null,
        description: null,
        location: null,
        ambiguous_fields: []
      };
      await handleAddEvent(newIntent);
    }
  }
}

async function main() {
  const args = process.argv.slice(2);
  const singleCommand = args.join(' ');

  if (singleCommand) {
    await processInput(singleCommand);
  } else {
    repl();
  }
}

async function processInput(input: string) {
  try {
    const systemPrompt = MAIN_SYSTEM_PROMPT.replace('{{now}}', now().toISO() || '');
    const initialIntent = await promptLLM(input, systemPrompt) as Intent;

    if (initialIntent.intent === 'ADD_EVENT') {
      const refined = await promptLLM(JSON.stringify(initialIntent), ADD_EVENT_SYSTEM_PROMPT);
      await handleAddEvent(refined);
    } else if (initialIntent.intent === 'QUERY_FREE_TIME') {
      const refined = await promptLLM(JSON.stringify(initialIntent), QUERY_FREE_TIME_SYSTEM_PROMPT);
      await handleQueryFreeTime(refined);
    }
  } catch (error: any) {
    console.log(chalk.red(`✗ Error: ${error.message}`));
  }
}

async function repl() {
  while (true) {
    const { input } = await inquirer.prompt([
      {
        type: 'input',
        name: 'input',
        message: chalk.green('ac-47 >'),
      }
    ]);

    if (input.toLowerCase() === 'exit' || input.toLowerCase() === 'quit') break;
    await processInput(input);
  }
}

main();
