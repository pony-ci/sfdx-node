import {processAllErrors} from './process-errors';
import {createCommand} from './run';
import {MessageArgs, SfdxMessage} from './types';

const sendResolved = (value) => {
    process.send({
        type: 'resolved',
        value,
    });
};
const sendRejected = (value) => {
    process.send({
        type: 'rejected',
        value: processAllErrors(value),
    });
};

// tslint:disable-next-line:no-function-expression
process.on('message', function onMessage(message: SfdxMessage): Promise<void> {
    if (message.cmd !== 'SFDX_PARALLEL_init') {
        return;
    }
    // @ts-ignore
    if (onMessage.initialized) {
        return;
    }
    // @ts-ignore
    onMessage.initialized = true;
    process.removeListener('message', onMessage);
    const {commandId, flags, opts}: MessageArgs = message.args;
    try {
        const command = createCommand(commandId, message.commandName, message.commandFile);
        const value = command(flags, opts);
        if (value && typeof value.then === 'function') {
            value.then(sendResolved).catch(sendRejected);
        } else {
            sendResolved(value);
        }
    } catch (err) {
        sendRejected(err);
    }
});
