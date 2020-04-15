import {fork} from 'child_process';
import * as path from 'path';
import {buildCommands} from './builder';
import {CreateCommandFunc, Flags, Opts, SfdxApi, SfdxNamespace, SfdxNodeMessage} from './types';

const createParallelCommand: CreateCommandFunc = (commandId: string, commandName: string, commandFile: string) =>
    (flags: Flags, opts: Opts) => new Promise((resolve, reject) => {
        const child = fork(path.join(__dirname, './child.js'), ['--colors']);
        child.on('message', (message) => {
            if (message.type === 'resolved') {
                resolve(message.value);
            } else if (message.type === 'rejected') {
                reject(message.value);
            }
        });
        const childMsg: SfdxNodeMessage = {
            commandId,
            commandName,
            commandFile,
            flags,
            opts
        };
        child.send(childMsg);
    });

export const sfdx: SfdxApi = new SfdxApi();

const commandsBuildsRequests: { [ns: string]: SfdxNamespace } = {};

export function registerNamespace(sfdxNamespace: SfdxNamespace, force?: boolean): void {
    const {commandsDir, namespace}: SfdxNamespace = sfdxNamespace;
    if (sfdx.hasOwnProperty(namespace) && force !== true) {
        return;
    }
    sfdx[namespace] = buildCommands(createParallelCommand, commandsDir, namespace);
    commandsBuildsRequests[namespace] = sfdxNamespace;
}
