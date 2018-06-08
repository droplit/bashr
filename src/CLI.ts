import { ParameterOptions, CommandHandler, CommandInput, CommandOutput } from './types';
import { Route } from './Route';

const debug = require('debug')('bashr');

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

    constructor(invocation: string, options?: CliOptions) {
        super();
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

    public run(argv?: string[]) {
        argv = argv || process.argv;
        // organize args
        const pathAndParams: string[] = argv.slice(2); // remove node/path and invocation
        this._run(pathAndParams, {path: '', params: {}}, {log: console.log}, () => {});
    }

}