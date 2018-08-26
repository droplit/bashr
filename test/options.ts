import 'mocha';
import { expect } from 'chai';
import * as bashr from '../';

describe('Options', function () {
    it('Option', function (done) {
        const handler: bashr.CommandHandler = (input, output) => {
            expect(input.options['test']).to.exist;
            done();
        };
        const cli = new bashr.CLI('myCLI');
        const command = cli.command('test', handler)
        command.option('test');
        cli.run(['', '', 'test', '--test']);
    });

    it('Shorthand', function (done) {
        const handler: bashr.CommandHandler = (input, output) => {
            expect(input.options['test']).to.exist;
            done();
        };
        const cli = new bashr.CLI('myCLI');
        const command = cli.command('test', handler)
        command.option('test', { alias: 't' });
        cli.run(['', '', 'test', '-t']);
    });

    it('Shorthand []', function (done) {
        const handler: bashr.CommandHandler = (input, output) => {
            expect(input.options['test']).to.exist;
            done();
        };
        const cli = new bashr.CLI('myCLI');
        const command = cli.command('test', handler)
        command.option('test', { alias: ['t'] });
        cli.run(['', '', 'test', '-t']);
    });

    it('Option with parameter', function (done) {
        const handler: bashr.CommandHandler = (input, output) => {
            expect(input.options['test']).to.equal('hello');
            done();
        };
        const cli = new bashr.CLI('myCLI');
        const command = cli.command('test', handler)
        command.option('test');
        cli.run(['', '', 'test', '--test', 'hello']);
    });
});