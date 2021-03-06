import util from 'util';
import { CommandHandler, CommandInput, CommandOutput, ParameterOptions, OptionOptions } from './types';

import { Command } from './Command';
import { Path } from './Path';

import * as utils from './utils';

import debug from 'debug';

const log = debug('bashr');

interface RouteInfo {
    path: string;
    route?: Route;
    lazyLoader?: {
        loader: LazyLoader,
        path?: string
    };
}

interface RouteModule {
    route: Route;
}

export interface LazyLoader { (): Promise<RouteModule>; }

export class Route<TContext = any> extends Path {
    private _parent?: Route;
    private _routes: RouteInfo[] = [];
    private _commands: Command[] = [];
    public get parent() {
        return Object.freeze(this._parent);
    }
    public get commands() {
        return Object.freeze(this._commands.map((command) => {
            const info: {
                name: string,
                params: { [name: string]: ParameterOptions },
                options: { [name: string]: OptionOptions },
                info?: any
            } = {
                name: command.name,
                params: command.params,
                options: command.options,
            };
            if (command.info) info.info = command.info;
            return info;
        }));
    }

    public get routes() {
        const routeInfoPromises = this._routes.map((routeInfo) => {
            if (routeInfo.lazyLoader !== undefined) {
                return routeInfo.lazyLoader.loader().then((routeModule) => {
                    return Promise.resolve(routeModule.route);
                });
            } else {
                return Promise.resolve(routeInfo.route);
            }
        });

        return Promise.all(routeInfoPromises).then((routes) => {
            return Promise.resolve(Object.freeze(routes));
        });
    }

    private _default?: Command;
    private useHandlers: CommandHandler<TContext>[] = [];

    constructor(name: string) {
        super(name);
        this.log = debug(`bashr:route-${name.replace(' ', '_').replace('*', '⋆')}`);
    }

    public use(...handler: CommandHandler<TContext>[]): Route {
        this.log(`adding use handler`);
        this.useHandlers.push(...handler);
        return this;
    }

    public command(path: string, ...handler: CommandHandler<TContext>[]): Command {
        this.log(`adding command: ${path}`);
        if (path === '*') return this.default(...handler);
        const command = new Command(path, ...handler);
        this._commands.push(command);
        return command;
    }

    public default(...handler: CommandHandler<TContext>[]): Command {
        this.log(`adding default`);
        this._default = new Command('*', ...handler);
        return this._default;
    }

    public route(path: string, route?: Route): Route {
        route = route || new Route(path);
        this.log(`adding route: ${path}`);
        this._routes.push({
            path,
            route
        });
        return route;
    }

    public lazyRoute(path: string, loader: LazyLoader): void;
    public lazyRoute(path: string, requirePath: string): void;
    public lazyRoute(path: string, loaderOrPath: LazyLoader | string): void {
        this.log(`adding lazyRoute: ${path}`);
        if (loaderOrPath instanceof Function) {
            const loader = loaderOrPath;
            this._routes.push({
                path,
                lazyLoader: {
                    loader
                }
            });
        } else if (typeof (loaderOrPath) === 'string') {
            const loader = () => import(loaderOrPath);
            const loaderPath = loaderOrPath;
            this._routes.push({
                path,
                lazyLoader: {
                    loader,
                    path: loaderPath
                }
            });
        } else {
            throw new Error('Must specify a loader function or a path string');
        }
    }

    protected _run(parent: Route | undefined, pathAndParams: string[], input: CommandInput, output: CommandOutput, next: () => void) {
        this._parent = parent;
        const originalInputParams = input.params;
        // run use handlers
        this.log('running use handlers');
        utils.asyncEach(this.useHandlers, (handler, callback) => {
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
        if (this._commands.length === 0 && !!next) return next();
        utils.asyncEach(this._commands, (command, nextCommand) => {
            command.process(pathAndParams, input, output, originalInputParams, nextCommand);
        }, next);
    }

    protected processRoutes(pathAndParams: string[], input: CommandInput, output: CommandOutput, originalInputParams: { [name: string]: any }, next: () => void) {
        // process routes
        this.log('processing routes', util.inspect(this._routes, false, 1));
        utils.asyncEach(this._routes, (routeInfo, callback) => {
            try {
                const routeTokens = this.tokenizePath(routeInfo.path);
                const evalResult = this.evalPath(pathAndParams.slice(0, routeTokens.length), routeTokens);
                if (evalResult.match) {
                    // path matches
                    input.params = utils.concatObject(originalInputParams, evalResult.params); // Merge params
                    // trim route
                    const remainingParams = pathAndParams.slice(routeTokens.length);
                    if (routeInfo.route) {
                        routeInfo.route._run(this, remainingParams, input, output, callback);
                    } else if (routeInfo.lazyLoader !== undefined) {
                        const loaderPath = routeInfo.lazyLoader.path;
                        routeInfo.lazyLoader.loader().then((routeModule) => {
                            if (loaderPath && !routeModule.route) throw new Error(`Module "${loaderPath}" does not have exported property 'route'.`);
                            if (!routeModule.route) throw new Error(`Route Module does not have property 'route'.`);
                            routeModule.route._run(this, remainingParams, input, output, callback);
                        }).catch((error) => {
                            output.done(error);
                        });
                    } else {
                        callback();
                    }
                } else {
                    callback();
                }
            } catch (error) {
                output.done(error);
            }
        }, next);
    }

    protected processDefault(pathAndParams: string[], input: CommandInput, output: CommandOutput, originalInputParams: { [name: string]: any }, next: () => void) {
        this.log('processing default');
        if (!this._default) return next();
        this._default.process(pathAndParams, input, output, originalInputParams, next);
    }
}