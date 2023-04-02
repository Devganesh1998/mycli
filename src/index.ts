#!/usr/bin/env node
import { Command } from 'commander';
import { version } from '../package.json';
import registerTNodeServiceCommand from './commands/tNodeService';

const program = new Command();

program.name('mycli').description('Customizable CLI using plugins').version(version);

registerTNodeServiceCommand(program);

program.parse();
