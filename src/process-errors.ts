import {SfdxError} from './types';

function processError(inputError: any): SfdxError {
    let outputError: SfdxError = {
        message: '',
    };

    function hasOwnProperty(value: string): boolean {
        return (inputError || {}).hasOwnProperty && (inputError || {}).hasOwnProperty(value);
    }

    if (hasOwnProperty('error')) {
        return processError(inputError.error);
    }
    if (inputError instanceof Error) {
        outputError = getPlainObjectFromNativeError(inputError);
    } else if (hasOwnProperty('message')) {
        outputError = inputError;
    } else if (typeof inputError === 'string') {
        outputError.message = inputError;
    } else {
        const str = String(inputError);
        if (str !== '[object Object]') {
            outputError.message = str;
        } else {
            outputError.message = JSON.stringify(inputError);
        }
    }
    return outputError;
}

export function processAllErrors(sfdxErrors: any): SfdxError[] {
    let errors: SfdxError[] = [];
    if (Array.isArray(sfdxErrors)) {
        errors = sfdxErrors.map(processError);
    } else {
        errors.push(processError(sfdxErrors));
    }
    return errors;
}

const getPlainObjectFromNativeError = (err) => {
    const error = {
        message: ''
    };
    if (err instanceof Error) {
        const obj = err;
        const props = [];
        Object.getOwnPropertyNames(obj).forEach((key) => {
            if (!props.includes(key) && key !== '__proto__' && typeof obj[key] !== 'function') {
                error[key] = obj[key];
                props.push(key);
            }
        });
    }
    return error;
};
