import util from 'util';
import { ParameterOptions, OptionOptions } from './types';

import debug from 'debug';
import { IDebugger } from 'debug';

const log = debug('bashr');

export function concatObject(A: any, B: any): Object {
    return { ...A, ...B };
}

export enum PathTokenType {
    route = 'route',
    param = 'param',
    optional = 'optional',
}

export interface PathToken {
    name: string;
    type: PathTokenType;
}

export interface EvalResult {
    match: boolean;
    params: { [name: string]: any };
    options: { [name: string]: any };
}

export class Path<TContext = any> {
    protected log: IDebugger;

    protected name: string;
    protected params: { [name: string]: ParameterOptions } = {};
    protected options: { [name: string]: OptionOptions } = {};

    constructor(name: string) {
        this.name = name;
        this.log = debug(`bashr:path-${name.replace(' ', '_').replace('*', '⋆')}`);
    }

    public param(name: string, options: ParameterOptions) {
        this.params[name] = options;
    }

    public option(name: string, options: OptionOptions) {
        this.options[name] = options;
    }

    protected tokenizePath(path: string): PathToken[] {
        path = path.trim().replace(/\s{2,}/g, ' '); // Remove duplicate spaces
        return path.split(' ').map((token) => {
            if (token.startsWith('-')) throw new Error('path token cannot start with dash(-)');
            const isParam = token.startsWith(':');
            const pathToken: PathToken = {
                name: isParam ? token.slice(1) : token,
                type: isParam ? PathTokenType.param : PathTokenType.route
            };
            return pathToken;
        });
    }

    protected evalPath(inputArgs: string[], pathTokens: PathToken[]): EvalResult {
        const result: EvalResult = { match: false, params: {}, options: {} };
        // extract options and option params
        this.log(inputArgs, pathTokens);
        // Only validate routes, params, and optional params
        for (let index = 0; index < inputArgs.length; index++) {
            const inputArg = inputArgs[index];
            if (this.evalPathToken(pathTokens[index], inputArg, result.params) === false)
                return result;
            if (pathTokens[index].name === '*')
                result.match = true;
        }
        if (inputArgs.length < pathTokens.length)
            return result; // Too few arguments passed (check after validating args incase of "*" parameter)

        result.match = true;
        return result;

    }

    private evalPathToken(pathToken: PathToken, inputArg: string, params: { [name: string]: any }): boolean {
        if (!pathToken)
            return false;
        if (pathToken.name === '*')
            return true;
        if (!inputArg && pathToken.type !== PathTokenType.optional)
            return false;

        switch (pathToken.type) {
            case PathTokenType.route:
                if (inputArg !== pathToken.name)
                    return false;
                break;
            case PathTokenType.optional:
            case PathTokenType.param:
                if (this.validateParam(pathToken.name, inputArg) === false)
                    return false;

                params[pathToken.name] = inputArg;
                break;
        }
        return true;
    }

    private validateParam(paramName: string, inputArg: string): boolean {
        const validation = this.params[paramName];
        if (validation) {
            if (validation.validationRegex) {
                if (!RegExp(validation.validationRegex).test(inputArg))
                    return false;
            }
            if (validation.validator) {
                if (validation.validator(inputArg) !== true)
                    return false;
            }
            return true;
        } return true;
    }

    protected asyncEach<T>(items: T[], operation: (item: T, callback: () => void) => void, done?: () => void) {
        if (items.length > 0) {
            this._asyncEach(items, 0, operation, done ? done : () => { });
        } else {
            if (done) done();
        }
    }

    protected _asyncEach<T>(items: T[], index: number, operation: (item: T, callback: () => void) => void, done: () => void) {
        operation(items[index], () => {
            if (index + 1 < items.length) {
                this._asyncEach(items, index + 1, operation, done);
            } else {
                done();
            }
        });
    }
}