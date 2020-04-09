import hookStd from 'hook-std';
import _ from 'lodash';
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

function getBooleanValue(inputValue: any): boolean {
    if (_.isBoolean(inputValue)) {
        return inputValue;
    }
    return typeof inputValue === 'string' && (inputValue || '').toLowerCase() === 'true';
}

function transformArgs(flags: Flags = {}, opts: Opts = {}): any {
    const argsObj = {
        argv: [],
        quiet: false
    };
    Object.keys(flags)
        .map(it => it.toLowerCase())
        .forEach((flagName) => {
            const flagValue = flags[flagName];
            if (flagName === '_quiet') {
                argsObj.quiet = getBooleanValue(flagValue);
            } else if (_.isBoolean(flagValue) && flagValue === true) {
                argsObj.argv.push(`--${flagName}`);
            } else if (!_.isBoolean(flagValue) && flagValue) {
                argsObj.argv.push(`--${flagName}`, `${flagValue}`);
            }
        });
    if (opts && Array.isArray(opts.args)) {
        argsObj.argv = [...argsObj.argv, ...opts.args];
    }
    return argsObj;
}

export const createCommand = (commandId: string, commandName: string, commandFile: string) =>
    (flags: Flags, opts: Opts) => new Promise((resolve, reject) => {
        // tslint:disable-next-line:non-literal-require
        const required = require(commandFile);
        const cmd = required.default || required[commandName];
        cmd.id = commandId;
        const cmdArgs = transformArgs(flags, opts);
        let currentHookFlag = false;
        if (cmdArgs.quiet) {
            hookStd(() => {
            });
            currentHookFlag = true;
        }
        sfdxErrors = [];
        cmd.run(cmdArgs.argv)
            .then((sfdxResult) => {
                if (cmdArgs.quiet && currentHookFlag) {
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
                if (cmdArgs.quiet && currentHookFlag) {
                    currentHookFlag = false;
                    unhookStd();
                }
                if (process.exitCode) {
                    process.exitCode = 0;
                }
                // { message: "some error", stack: "stack trace for the error" }
                reject(processAllErrors(sfdxErr));
            });
    });
