import { ParameterOptions, OptionOptions, CommandHandler, CommandInput, CommandOutput } from './types';

const debug = require('debug')('bashr');

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
    route,
    param
}

export interface PathToken {
    name: string;
    type: PathTokenType;
}

export interface EvalResult {
    match: boolean;
    params?: {[name: string]: any};
}

interface LazyLoader { (): Route; }

export class Route<TContext = any> {

    private routes: RouteInfo[] = [];
    private commands: CommandInfo[] = [];
    private useHandlers: CommandHandler<TContext>[] = [];
    private params: {[name: string]: ParameterOptions} = {};
    private options: {[name: string]: OptionOptions} = {};

    constructor() {
    }

    public param(name: string, options: ParameterOptions) {
        this.params[name] = options;
    }

    public option(name: string, options: OptionOptions): Route {
        this.options[name] = options;
        return this;
    }

    public use(...handler: CommandHandler<TContext>[]): Route {
        debug(`adding use handler`);
        this.useHandlers.push(...handler);
        return this;
    }

    public command(path: string, ...handler: CommandHandler<TContext>[]): this {
        debug(`adding command: ${path}`);
        this.commands.push({path, commandHandlers: handler});
        return this;
    }

    public route(path: string, route?: Route): Route {
        debug(`adding route: ${path}`);
        route = route || new Route();
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
            if (typeof(loaderOrPath) === 'function') {
                loader = () => {
                    const route = loaderOrPath();
                    resolve(route);
                    return route;
                };
            } else if (typeof(loaderOrPath) === 'string') {
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
        const result: EvalResult = {match: false};
        const params: {[name: string]: string} = {};
        // extract options and option params
        for (const i in pathTokens) {
            const pathToken = pathTokens[i];
            if (pathToken.type === PathTokenType.param || inputArgs[i] === pathToken.name) {
                result.match = true;
                if (pathToken.type === PathTokenType.param) {
                    params[pathToken.name] = inputArgs[i];
                }
            } else {
                return result;
            }
        }
        result.params = params;
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
            this._asyncEach(items, 0, operation, done ? done : () => {});
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
        debug('running use handlers');
        this.asyncEach(this.useHandlers, (handler, callback) => {
            handler(input, output, callback);
        }, () => {
            debug('processing commands', this.commands);
            this.processCommands(pathAndParams, input, output, originalInputParams, () => {
                debug('processing routes');
                this.processRoutes(pathAndParams, input, output, originalInputParams, next);
            });
        });
    }

    protected processCommands(pathAndParams: string[], input: CommandInput, output: CommandOutput, originalInputParams: {[name: string]: any}, next: () => void) {
        // process commands
        debug('processing commands', this.commands);
        if (this.commands.length === 0) if (next) next();
        this.asyncEach(this.commands, (commandInfo, nextCommand) => {
            debug(`processing ${commandInfo.path} command`);
            const commandTokens = Route.tokenizePath(commandInfo.path);
            const evalResult = Route.evalPath(pathAndParams, commandTokens);
            if (evalResult.match && commandTokens.length === pathAndParams.length) {
                debug(`running ${commandInfo.path} command`);
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

    protected processRoutes(pathAndParams: string[], input: CommandInput, output: CommandOutput, originalInputParams: {[name: string]: any}, next: () => void) {
        // process routes
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