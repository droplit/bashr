import util from 'util';
import { ParameterOptions, OptionOptions, CommandHandler, CommandInput, CommandOutput } from './types';

import debug from 'debug';
import { IDebugger } from 'debug';

const log = debug('bashr');

interface RouteInfo {
    path: string;
    route?: Route;
    lazyLoader?: LazyLoader;
}

interface CommandInfo {
    path: string;
    commandHandlers: CommandHandler[];
}

export enum PathTokenType {
    route = 'route',
    param = 'param',
    optional = 'optional',
    multipleOptional = 'multipleOptional'
}

export interface PathToken {
    name: string;
    type: PathTokenType;
}

export interface EvalResult {
    match: boolean;
    params: { [name: string]: any };
}

interface LazyLoader { (): Route; }

export class Route<TContext = any> {
    protected log: IDebugger;

    private name: string;
    private routes: RouteInfo[] = [];
    private commands: CommandInfo[] = [];
    private _default?: CommandInfo;
    private useHandlers: CommandHandler<TContext>[] = [];
    private params: { [name: string]: ParameterOptions } = {};
    private options: { [name: string]: OptionOptions } = {};

    constructor(name: string) {
        this.name = name;
        this.log = debug(`bashr:route-${name}`);
    }

    public param(name: string, options: ParameterOptions) {
        this.params[name] = options;
    }

    public option(name: string, options: OptionOptions): Route {
        this.options[name] = options;
        return this;
    }

    public use(...handler: CommandHandler<TContext>[]): Route {
        this.log(`adding use handler`);
        this.useHandlers.push(...handler);
        return this;
    }

    public command(path: string, ...handler: CommandHandler<TContext>[]): this {
        this.log(`adding command: ${path}`);
        if (path === '*') return this.deafult(...handler);
        this.commands.push({ path, commandHandlers: handler });
        return this;
    }

    public deafult(...handler: CommandHandler<TContext>[]): this {
        this.log(`adding default`);
        this._default = { path: '*', commandHandlers: handler };
        return this;
    }

    public route(path: string, route?: Route): Route {
        route = route || new Route(path);
        this.log(`adding route: ${path}`);
        this.routes.push({
            path,
            route
        });
        return route;
    }

    public lazyRoute(path: string, loader: (() => Route)): Promise<Route>;
    public lazyRoute(path: string, requirePath: string): Promise<Route>;
    public lazyRoute(path: string, loaderOrPath: (() => Route) | string): any {
        return new Promise((resolve, reject) => {
            let loader: LazyLoader | undefined;
            if (typeof (loaderOrPath) === 'function') {
                loader = () => {
                    const route = loaderOrPath();
                    resolve(route);
                    return route;
                };
            } else if (typeof (loaderOrPath) === 'string') {
                loader = () => {
                    const route = require(loaderOrPath);
                    resolve(route);
                    return route;
                };
            } else {
                reject(new Error('Must specify a loader function or a path string'));
            }
            this.routes.push({
                path,
                lazyLoader: loader
            });
        });
    }

    private static tokenizePath(path: string): PathToken[] {
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

    private evalPath(inputArgs: string[], pathTokens: PathToken[]): EvalResult {
        const result: EvalResult = { match: false, params: {} };
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
        if (!inputArg && pathToken.type !== PathTokenType.multipleOptional)
            return false;

        switch (pathToken.type) {
            case PathTokenType.route:
                if (inputArg !== pathToken.name)
                    return false;
                break;
            case PathTokenType.optional:
            case PathTokenType.param:
                this.log(this.validateParam(pathToken.name, inputArg));
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

    protected static concatObject(A: any, B: any): Object {
        return { ...A, ...B };
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

    protected _run(pathAndParams: string[], input: CommandInput, output: CommandOutput, next: () => void) {
        const originalInputParams = input.params;
        // run use handlers
        this.log('running use handlers');
        this.asyncEach(this.useHandlers, (handler, callback) => {
            handler(input, output, callback);
        }, () => {
            log(pathAndParams, input);
            // Process commands before routes since routes may be lazy loaded.
            this.processCommands(pathAndParams, input, output, originalInputParams, () => {
                this.processRoutes(pathAndParams, input, output, originalInputParams, () => {
                    this.processDefault(pathAndParams, input, output, originalInputParams, next);
                });
            });
        });
    }

    protected processCommands(pathAndParams: string[], input: CommandInput, output: CommandOutput, originalInputParams: { [name: string]: any }, next: () => void) {
        // process commands
        this.log('processing commands', util.inspect(this.commands, false, 1));
        if (this.commands.length === 0 && !!next) return next();
        this.asyncEach(this.commands, (commandInfo, nextCommand) => {
            this.processCommand(pathAndParams, input, output, commandInfo, originalInputParams, nextCommand);
        }, next);
    }

    protected processRoutes(pathAndParams: string[], input: CommandInput, output: CommandOutput, originalInputParams: { [name: string]: any }, next: () => void) {
        // process routes
        this.log('processing routes', util.inspect(this.routes, false, 1));
        this.asyncEach(this.routes, (routeInfo, callback) => {
            const routeTokens = Route.tokenizePath(routeInfo.path);
            const evalResult = this.evalPath(pathAndParams.slice(0, routeTokens.length), routeTokens);
            if (evalResult.match) {
                // path matches
                input.params = Route.concatObject(originalInputParams, evalResult.params); // Merge params
                // trim route
                const remainingParams = pathAndParams.slice(routeTokens.length);
                if (routeInfo.route) {
                    routeInfo.route._run(remainingParams, input, output, callback);
                } else if (routeInfo.lazyLoader !== undefined) {
                    routeInfo.lazyLoader()._run(remainingParams, input, output, callback);
                } else {
                    callback();
                }
            } else {
                callback();
            }
        }, next);
    }

    protected processDefault(pathAndParams: string[], input: CommandInput, output: CommandOutput, originalInputParams: { [name: string]: any }, next: () => void) {
        this.log('processing default');
        if (!this._default) return next();
        this.processCommand(pathAndParams, input, output, this._default, originalInputParams, next);
    }

    protected processCommand(pathAndParams: string[], input: CommandInput, output: CommandOutput, commandInfo: CommandInfo, originalInputParams: { [name: string]: any }, next: () => void) {
        this.log(`processing ${commandInfo.path} command`);
        const commandTokens = Route.tokenizePath(commandInfo.path);
        const evalResult = this.evalPath(pathAndParams, commandTokens);
        this.log(pathAndParams, commandTokens, evalResult);
        if (evalResult.match) {
            this.log(`running ${commandInfo.path} command`);
            if (commandInfo.commandHandlers.length === 0) {
                next();
            } else {
                this.asyncEach(commandInfo.commandHandlers, (handler, callback) => {
                    input.params = Route.concatObject(originalInputParams, evalResult.params);
                    handler(input, output, callback);
                }, next);
            }
        } else {
            next();
        }
    }
}