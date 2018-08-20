import { ParameterOptions, CommandHandler, CommandInput, CommandOutput } from './types';
import { Route } from './Route';

import debug from 'debug';
const log = debug('bashr:CLI');

export interface Logger {
    log: (message?: any, ...optionalParams: any[]) => void;
}

export interface CliOptions {
    caseSensitive?: boolean;
    enableRepl?: boolean;
}

export class CLI<TContext = any> extends Route {
    private _invocation: string;
    private _options: CliOptions = { // must define defaults for all options or validation will not work
        caseSensitive: false,
        enableRepl: true
    };
    public logger?: Logger;

    constructor(invocation: string, options?: CliOptions) {
        super(invocation);
        this._invocation = invocation;
        // read in options, use defaults where undefined
        if (options !== undefined) {
            for (const key in options) {
                if (this._options.hasOwnProperty(key)) { // validate option is supported
                    if ((<any>options)[key] !== undefined) {
                        (<any>this._options)[key] = (<any>options)[key];
                    }
                } else {
                    throw new Error(`Invalid options specified. "${key}" not supported.`);
                }
            }
        }
    }

    public run(argv = process.argv, done?: (error?: Error) => any) {
        done = done || ((error?: Error) => {
            console.log(error);
        });
        log('Running CLI...');
        // organize args
        const pathAndParams: string[] = argv.slice(2); // remove node/path and invocation
        const outputLog = this.logger ? this.logger.log : console.log;
        this._run(pathAndParams, { path: '', params: {} }, { log: outputLog, done }, () => { });
    }
}