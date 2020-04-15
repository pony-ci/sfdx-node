import {SfdxNodeError} from './types';

export const parseErrors = (sfdxErrors: any) =>
    Array.isArray(sfdxErrors) ? sfdxErrors.map(parseError) : [parseError(sfdxErrors)];

function parseError(error: any): SfdxNodeError {
    let result: SfdxNodeError = {
        message: '',
    };

    function hasOwnProperty(value: string): boolean {
        return (error || {}).hasOwnProperty && (error || {}).hasOwnProperty(value);
    }

    if (hasOwnProperty('error')) {
        return parseError(error.error);
    }
    if (error instanceof Error) {
        result = parseNativeError(error);
    } else if (hasOwnProperty('message')) {
        result = error;
    } else if (typeof error === 'string') {
        result.message = error;
    } else {
        const str = String(error);
        result.message = str !== '[object Object]' ? str : JSON.stringify(error);
    }
    return result;
}

const parseNativeError = (error: any): SfdxNodeError => {
    return Object
        .getOwnPropertyNames(error)
        .reduce((result: SfdxNodeError, key: string) => {
            if (key !== '__proto__' && typeof error[key] !== 'function') {
                result[key] = error[key];
            }
            return result;
        }, {
            message: ''
        });
};
