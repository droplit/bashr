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
}

export interface PathToken {
    name: string;
    type: PathTokenType;
}

export interface EvalResult {
    match: boolean;
    params?: { [name: string]: any };
}

interface LazyLoader { (): Route; }

export class Route<TContext = any> {
    protected log: IDebugger;

    private name: string;
    private routes: RouteInfo[] = [];
    private commands: CommandInfo[] = [];
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
        this.commands.push({ path, commandHandlers: handler });
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
                // pathTokens: Route.tokenizeRoutePath(path),
                lazyLoader: loader
            });
        });
    }

    protected static tokenizePath(path: string): PathToken[] {
        const pathTokens: PathToken[] = [];
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

    protected static evalPath(inputArgs: string[], pathTokens: PathToken[]): EvalResult {
        const result: EvalResult = { match: true };
        // extract options and option params
        pathTokens.map((value, index, array) => {
            if (value.name === '*') {
                result.match = true;
                return result;
            }
            switch (value.type) {
                case PathTokenType.route:
                    if (inputArgs[index] !== value.name) {
                        result.match = false;
                        return result;
                    }
                    break;
                case PathTokenType.param:
                    result.params = result.params || {};
                    result.params[value.name] = inputArgs[index];
                    break;
                case PathTokenType.optional:
                    break;
            }
        });
        return result;
    }

    private static concatObject(A: any, B: any): Object {
        for (const key in B) {
            A[key] = B[key];
        }
        return A;
    }

    private invokeHandler(handler: CommandHandler, input: CommandInput, output: CommandOutput): Promise<boolean> {
        return new Promise<boolean>((resolve, reject) => {
            handler(input, output, () => {
                resolve(true);
            });
        });
    }

    private asyncEach<T>(items: T[], operation: (item: T, callback: () => void) => void, done?: () => void) {
        if (items.length > 0) {
            this._asyncEach(items, 0, operation, done ? done : () => { });
        } else {
            if (done) done();
        }
    }

    private _asyncEach<T>(items: T[], index: number, operation: (item: T, callback: () => void) => void, done: () => void) {
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
                this.processRoutes(pathAndParams, input, output, originalInputParams, next);
            });
        });
    }

    protected processCommands(pathAndParams: string[], input: CommandInput, output: CommandOutput, originalInputParams: { [name: string]: any }, next: () => void) {
        // process commands
        this.log('processing commands', util.inspect(this.commands, false, 1));
        if (this.commands.length === 0 && !!next) return next();
        this.asyncEach(this.commands, (commandInfo, nextCommand) => {
            this.log(`processing ${commandInfo.path} command`);
            const commandTokens = Route.tokenizePath(commandInfo.path);
            const evalResult = Route.evalPath(pathAndParams, commandTokens);
            this.log(pathAndParams, commandTokens, evalResult);
            if (evalResult.match) {
                this.log(`running ${commandInfo.path} command`);
                if (commandInfo.commandHandlers.length === 0) {
                    nextCommand();
                } else {
                    this.asyncEach(commandInfo.commandHandlers, (handler, callback) => {
                        input.params = Route.concatObject(originalInputParams, evalResult.params);
                        handler(input, output, callback);
                    }, nextCommand);
                }
            } else {
                nextCommand();
            }
        }, next);
    }

    protected processRoutes(pathAndParams: string[], input: CommandInput, output: CommandOutput, originalInputParams: { [name: string]: any }, next: () => void) {
        // process routes
        this.log('processing routes', util.inspect(this.routes, false, 1));
        this.asyncEach(this.routes, (routeInfo, callback) => {
            const routeTokens = Route.tokenizePath(routeInfo.path);
            const evalResult = Route.evalPath(pathAndParams, routeTokens);
            if (evalResult.match) {
                // path matches
                // trim route
                const remainingParams = pathAndParams.slice(routeTokens.length);
                if (routeInfo.route) {
                    routeInfo.route._run(remainingParams, input, output, callback);
                } else if (routeInfo.lazyLoader !== undefined) {
                    routeInfo.lazyLoader()._run(remainingParams, input, output, callback);
                }
            }
        }, next);
    }
}