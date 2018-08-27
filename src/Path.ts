import { ParameterOptions, OptionOptions } from './types';
import * as utils from './utils';

import debug from 'debug';
import { IDebugger } from 'debug';

const yargsParser = require('yargs-parser');

const log = debug('bashr');

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

    protected _name: string;
    public get name() {
        return this._name;
    }
    protected _params: { [name: string]: ParameterOptions } = {};
    public get params() {
        return Object.freeze(this._params);
    }
    public get options() {
        return Object.freeze(this._options);
    }
    protected _options: { [name: string]: OptionOptions } = {};
    public info?: any;

    constructor(name: string) {
        this._name = name;
        this.log = debug(`bashr:path-${name.replace(' ', '_').replace('*', '⋆')}`);
    }

    public param(name: string, options?: ParameterOptions) {
        this._params[name] = options || {};
    }

    public option(name: string, options?: OptionOptions) {
        this._options[name] = options || {};
    }

    protected tokenizePath(path: string): PathToken[] {
        path = path.trim().replace(/\s{2,}/g, ' '); // Remove duplicate spaces
        return path.split(' ').map((token) => {
            if (token.startsWith('-')) throw new Error('path token cannot start with dash(-)');
            if (!token.startsWith(':'))
                return {
                    name: token,
                    type: PathTokenType.route
                };

            const param = token.slice(1);
            if (param.startsWith('[') && param.endsWith(']')) {
                return {
                    name: param.slice(1, param.length - 1),
                    type: PathTokenType.optional
                };
            } else {
                return {
                    name: param,
                    type: PathTokenType.param
                };
            }
            // throw new Error(`Cannot parse token "${token}" in "${path}"`);
        });
    }

    protected evalPath(inputArgs: string[], pathTokens: PathToken[]): EvalResult {
        const result: EvalResult = { match: true, params: {}, options: {} };
        this.log(inputArgs, pathTokens);
        // extract options and option params
        result.options = utils.concatObject(result.options, this.processOptions(inputArgs));
        // Only validate routes, params, and optional params
        const map = pathTokens.map((token) => {
            return {
                pathToken: token,
                matched: false
            };
        });
        this.log(map);
        for (let index = 0; index < map.length; index++) {
            if (map[index].pathToken.name === '*')
                return result;

            const inputArg = inputArgs[index];
            if (this.evalPathToken(pathTokens[index], inputArg, result.params) === true)
                map[index].matched = true;
        }
        // Check param inputs after checking for *
        if (inputArgs.length > pathTokens.length)
            result.match = false;

        map.forEach((match) => {
            if (match.matched === false)
                result.match = false;
        });
        this.log(map);

        return result;
    }

    private evalPathToken(pathToken: PathToken, inputArg: string, params: { [name: string]: any }): boolean {
        if (!pathToken)
            return false;
        if (pathToken.name === '*')
            return true;
        if (!inputArg && pathToken.type === PathTokenType.optional)
            return true;

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
        const validation = this._params[paramName];
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

    private processOptions(inputArgs: string[]): any {
        const aliasOpts: any = {};
        Object.keys(this._options).forEach((key) => {
            const alias = this._options[key].alias;
            if (alias && typeof alias === 'string') {
                aliasOpts[key] = [alias];
            } else {
                aliasOpts[key] = alias || [];
            }
        });
        const parserOpts = {
            alias: aliasOpts
        };
        const options = yargsParser(this.extractOptions(inputArgs).join(' '), parserOpts);
        delete options._;
        return options;
    }

    private extractOptions(inputArgs: string[]): string[] {
        for (let index = 0; index < inputArgs.length; index++) {
            const arg = inputArgs[index];
            if (arg.startsWith('-'))
                return inputArgs.splice(index);
        }
        return [];
    }

}