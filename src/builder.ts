import fs from 'fs-extra';
import _ from 'lodash';
import * as path from 'path';
import {CreateCommandFunc, NsApi} from './types';

function processCommandsDir(commandsDir: string, namespace: string, parts: string[]): any[] {
    const cmdArray: any[] = [];
    const cmdsDir = path.join(commandsDir, ...parts);
    fs
        .readdirSync(cmdsDir)
        .sort((a: string, b: string) => {
            const statA = fs.statSync(path.join(cmdsDir, a));
            const statB = fs.statSync(path.join(cmdsDir, b));
            return statA.isFile() === statB.isFile() ? 0 :
                statA.isFile() <= statB.isFile() ? 1 : -1;
        })
        .forEach((fileOrDir) => {
            const cmdDefPath = path.join(cmdsDir, fileOrDir);
            const fileNameWithoutExt = fileOrDir.replace('.js', '');
            const newParts = [...parts, fileNameWithoutExt];
            const stat = fs.statSync(cmdDefPath);
            if (stat.isFile()) {
                if (newParts.length > 0 && path.extname(cmdDefPath) === '.js') {
                    const obj: any = {};
                    obj.commandFile = cmdDefPath;
                    obj.commandId = [namespace, ...newParts].join(':');
                    cmdArray.push(obj);
                }
            } else if (stat.isDirectory()) {
                cmdArray.push(...processCommandsDir(commandsDir, namespace, newParts));
            }
        });
    return cmdArray;
}

export function buildCommands(createCmd: CreateCommandFunc, commandsDir: string, namespace: string): NsApi {
    const nsApi: NsApi = {};
    const cmdArray = processCommandsDir(path.join(commandsDir, namespace), namespace, []);
    cmdArray.forEach((cmdObj) => {
        const {commandId, commandFile}: any = cmdObj;
        const cmdKeyParts = commandId.split(':').slice(1);
        cmdKeyParts.reduce((api: any, part: string) => {
            if (!api.hasOwnProperty(part)) {
                if (cmdKeyParts[cmdKeyParts.length - 1] === part) {
                    const commandExportedName = _.upperFirst(_.camelCase([...cmdKeyParts, 'command'].join('-')));
                    api[part] = createCmd(commandId, commandExportedName, commandFile);
                } else {
                    api[part] = {};
                }
            }
            return api[part];
        }, nsApi);
    });
    return nsApi;
}
