import fs from 'fs-extra';
import * as path from 'path';
import {CreateCommandFunc, NsApi, SfdxCommandDefinition} from './types';

const pascalCase = (it: string[]) => it.map(word => word[0].toUpperCase() + word.slice(1).toLowerCase()).join('');

function preprocessCommandsDir(commandsDir: string, namespace: string, parts: string[]): SfdxCommandDefinition[] {
    const cmdArray: SfdxCommandDefinition[] = [];
    const dir = path.join(commandsDir, ...parts);
    fs
        .readdirSync(dir)
        .sort((a: string, b: string) => {
            const statA = fs.statSync(path.join(dir, a));
            const statB = fs.statSync(path.join(dir, b));
            return statA.isFile() === statB.isFile() ? 0 : statA.isFile() <= statB.isFile() ? 1 : -1;
        })
        .forEach((fileOrDir) => {
            const commandFile = path.join(dir, fileOrDir);
            const fileNameWithoutExt = fileOrDir.replace('.js', '');
            const newParts = [...parts, fileNameWithoutExt];
            const stat = fs.statSync(commandFile);
            if (stat.isFile()) {
                if (newParts.length > 0 && path.extname(commandFile) === '.js') {
                    cmdArray.push({
                        commandId: [namespace, ...newParts].join(':'),
                        commandName: pascalCase([...newParts, 'command']),
                        commandFile
                    });
                }
            } else if (stat.isDirectory()) {
                cmdArray.push(...preprocessCommandsDir(commandsDir, namespace, newParts));
            }
        });
    return cmdArray;
}

export function buildCommands(createCommand: CreateCommandFunc, commandsDir: string, namespace: string): NsApi {
    const nsApi: NsApi = {};
    preprocessCommandsDir(path.join(commandsDir, namespace), namespace, [])
        .forEach(({commandId, commandName, commandFile}: SfdxCommandDefinition) => {
            const parts = commandId.split(':').slice(1);
            parts.reduce((api: any, part: string) => {
                if (!api.hasOwnProperty(part)) {
                    if (parts[parts.length - 1] === part) {
                        api[part] = createCommand(commandId, commandName, commandFile);
                    } else {
                        api[part] = {};
                    }
                }
                return api[part];
            }, nsApi);
        });
    return nsApi;
}
