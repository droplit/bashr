import { CommandHandler, CommandInput, CommandOutput } from './types';

import { concatObject } from './Path';

import { Path } from './Path';

import debug from 'debug';

const log = debug('bashr');

export class Command<TContext = any> extends Path {
    private handlers: CommandHandler<TContext>[];
    constructor(name: string, ...handler: CommandHandler<TContext>[]) {
        super(name);
        this.handlers = handler;
        this.log = debug(`bashr:command-${name.replace(' ', '_').replace('*', '⋆')}`);
    }

    public process(pathAndParams: string[], input: CommandInput, output: CommandOutput, originalInputParams: { [name: string]: any }, next: () => void) {
        this.log(`processing ${this.name} command`);
        const commandTokens = this.tokenizePath(this.name);
        const evalResult = this.evalPath(pathAndParams, commandTokens);
        this.log(pathAndParams, commandTokens, evalResult);
        if (evalResult.match) {
            this.log(`running ${this.name} command`);
            if (this.handlers.length === 0) {
                next();
            } else {
                this.asyncEach(this.handlers, (handler, callback) => {
                    input.params = concatObject(originalInputParams, evalResult.params);
                    input.options = concatObject(originalInputParams, evalResult.options);
                    handler(input, output, callback);
                }, next);
            }
        } else {
            next();
        }
    }
}