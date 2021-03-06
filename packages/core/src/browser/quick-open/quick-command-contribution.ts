/*
 * Copyright (C) 2017 TypeFox and others.
 *
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0
 */

import { injectable, inject } from 'inversify';
import { QuickCommandService } from './quick-command-service';
import { Command, CommandRegistry, CommandContribution, Key, Modifier, KeyCode, KeybindingRegistry, KeybindingContribution } from '../../common';

export const quickCommand: Command = {
    id: 'quickCommand',
    label: 'Quick Command'
};

@injectable()
export class QuickCommandFrontendContribution implements CommandContribution, KeybindingContribution {

    @inject(QuickCommandService)
    protected readonly quickCommandService: QuickCommandService;

    registerCommands(commands: CommandRegistry): void {
        commands.registerCommand(quickCommand, {
            execute: () => this.quickCommandService.open()
        });
    }

    registerKeyBindings(keybindings: KeybindingRegistry): void {
        keybindings.registerKeyBinding({
            commandId: quickCommand.id,
            keyCode: KeyCode.createKeyCode({ first: Key.F1 })
        });
        keybindings.registerKeyBinding({
            commandId: quickCommand.id,
            keyCode: KeyCode.createKeyCode({ first: Key.KEY_P, modifiers: [Modifier.M1, Modifier.M2] })
        });
    }

}
