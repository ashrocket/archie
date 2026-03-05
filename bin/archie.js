#!/usr/bin/env node
'use strict';

const { program } = require('commander');
const pkg = require('../package.json');

program
  .name('archie')
  .description('Archie — your architecture consultant')
  .version(pkg.version);

program
  .command('init')
  .description('Set up Archie (auto-runs on first use)')
  .action(() => console.log('TODO: init'));

program
  .command('chat [target]')
  .description('Start Archie — opens browser chat widget')
  .action((target) => console.log('TODO: chat', target));

program
  .command('stop')
  .description('Stop any running Archie bridge')
  .action(() => console.log('TODO: stop'));

program.parse();
