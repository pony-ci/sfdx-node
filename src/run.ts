import {buildArgs} from '@pony-ci/cli-exec/lib';
import hookStd from 'hook-std';
import {processAllErrors} from './process-errors';
import {Flags, Opts} from './types';

const realStdoutWrite = process.stdout.write;
const realStderrWrite = process.stderr.write;
let sfdxErrors = [];

// @ts-ignore
process.on('cmdError', errObj => {
    sfdxErrors.push(errObj);
});

const unhookStd = () => {
    process.stdout.write = realStdoutWrite;
    process.stderr.write = realStderrWrite;
};

export const createCommand = (commandId: string, commandName: string, commandFile: string) =>
    (flags: Flags = {}, opts: Opts = []) => new Promise((resolve, reject) => {
        // tslint:disable-next-line:non-literal-require
        const required = require(commandFile);
        const cmd = required.default || required[commandName];
        cmd.id = commandId;
        const args: string[] = buildArgs(flags, opts);
        const quiet: boolean = Boolean(flags.quiet) || false;
        let currentHookFlag = false;
        if (quiet) {
            hookStd(() => undefined);
            currentHookFlag = true;
        }
        sfdxErrors = [];
        cmd.run(args)
            .then((sfdxResult) => {
                if (quiet && currentHookFlag) {
                    currentHookFlag = false;
                    unhookStd();
                }
                if (sfdxErrors.length) {
                    throw sfdxErrors;
                }
                if (process.exitCode) {
                    process.exitCode = 0;
                }
                resolve(sfdxResult);
            })
            .catch((sfdxErr) => {
                if (quiet && currentHookFlag) {
                    currentHookFlag = false;
                    unhookStd();
                }
                if (process.exitCode) {
                    process.exitCode = 0;
                }
                reject(processAllErrors(sfdxErr));
            });
    });
