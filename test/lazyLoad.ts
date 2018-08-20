import * as path from 'path';
import 'mocha';
import { expect } from 'chai';
import * as bashr from '../';
describe('Lazy Loading', function () {
    this.slow(2000);
    it('Route Module (lazy.ts)', function (done) {
        const defaultHandler: bashr.CommandHandler = (input, output) => {
            done('should have resolved lazy route');
        };
        const cli = new bashr.CLI('bashr');
        cli.lazyRoute('foo', path.join(__dirname, './lazyLoaded/lazy'));
        cli.command('*', defaultHandler);
        const output: string[] = [];
        cli.logger = {
            log: (message?, ...optionalParams) => {
                output.push(message);
            }
        };

        cli.run(['', '', 'foo', 'bar'], (error) => {
            if (error) done(error);
            const lazyRouteOutput = output[0];
            expect(lazyRouteOutput).to.equal('baz');
            done();
        });
    });

    it('Resolve after (lazy.ts)', function (done) {
        const defaultHandler: bashr.CommandHandler = (input, output) => {
            done();
        };
        const cli = new bashr.CLI('bashr');
        cli.lazyRoute('foo', path.join(__dirname, './lazyLoaded/lazy'));
        cli.command('*', defaultHandler);
        const output: string[] = [];
        cli.logger = {
            log: (message?, ...optionalParams) => {
                output.push(message);
            }
        };
        cli.run(['', '', 'foo', 'nobar'], (error) => {
            done('Should resolve before "done"');
        });
    });

    it('No exported "route" (lazy1.ts)', function (done) {
        const defaultHandler: bashr.CommandHandler = (input, output) => {
            done('should have resolved lazy route');
        };
        const cli = new bashr.CLI('bashr');
        cli.lazyRoute('foo', path.join(__dirname, './lazyLoaded/lazy1'));
        cli.command('*', defaultHandler);
        cli.run(['', '', 'foo', 'bar'], (error) => {
            expect(error).to.exist;
            done();
        });

    });
})