export class SfdxApi {
    [key: string]: any;
}

export class NsApi {
    [key: string]: any;
}

export interface SfdxNamespace {
    commandsDir: string;
    namespace: string;
}

export type Flags = { [key: string]: string | boolean | number | undefined | null };

export type Opts = string | string[];

export interface MessageArgs {
    commandId: string;
    flags: Flags;
    opts: Opts;
}

export interface SfdxMessage {
    cmd: string;
    args: MessageArgs;
    commandFile: string;
    commandName: string;
}

export interface SfdxError {
    message: string;
    stack?: string;
}

export type CreateCommandFunc = (cmdId: string, cmdName: string, cmdFile: string) =>
    (flags: Flags, opts: Opts) => Promise<any>;
