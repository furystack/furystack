import type { Plugin } from '@yarnpkg/core';
import { ApplyCommand } from './commands/ApplyCommand';
import { CheckCommand } from './commands/CheckCommand';
import { CreateCommand } from './commands/CreateCommand';

const plugin: Plugin = {
  commands: [CreateCommand, CheckCommand, ApplyCommand],
};

export default plugin;
