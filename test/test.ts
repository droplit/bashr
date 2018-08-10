import 'mocha';
import { expect } from 'chai';
import * as bashr from '../';

console.log(process.argv);

describe('CLI command and routes', function () {
    it('Create CLI', done => {
        const cli = new bashr.CLI('myCLI');
        expect(cli).to.exist;
        done();
    });
    it('Run CLI', done => {
        const cli = new bashr.CLI('myCLI');
        cli.run(['', '']);
        done();
    });
    it('Run CLI command', function (done) {
        const handler: bashr.CommandHandler = (input, output) => {
            done();
        };
        const cli = new bashr.CLI('myCLI');
        cli.command('test', handler)
        cli.run(['', '', 'test']);
    });
    it('Run CLI command with route', function (done) {
        const handler: bashr.CommandHandler = (input, output) => {
            done();
        };
        const cli = new bashr.CLI('myCLI');
        const route = cli.route('myRoute');
        route.command('test', handler);
        cli.run(['', '', 'myRoute', 'test']);
    });
    it('Run CLI command with nested route', function (done) {
        const handler: bashr.CommandHandler = (input, output) => {
            done();
        };
        const cli = new bashr.CLI('myCLI');
        const route1 = cli.route('myRoute');
        const route2 = route1.route('myRoute2')
        route2.command('test', handler);
        cli.run(['', '', 'myRoute', 'myRoute2', 'test']);
    });
    it('Wildcard command', function (done) {
        const defaultHandler: bashr.CommandHandler = (input, output) => {
            done();
        };
        const cli = new bashr.CLI('myCLI');
        cli.command('*', defaultHandler);
        cli.run(['', '', 'hello'])
    });
    it('Wildcard command on route', function (done) {
        const defaultHandler: bashr.CommandHandler = (input, output) => {
            done();
        };
        const cli = new bashr.CLI('myCLI');
        const route = cli.route('myRoute');
        route.command('*', defaultHandler);
        cli.run(['', '', 'myRoute', 'hello'])
    });
    it('Run CLI command with identical named route and command, and wildcard', function (done) {
        const handler: bashr.CommandHandler = (input, output) => {
            done();
        };
        const handler2: bashr.CommandHandler = (input, output) => {
            done('Command should resolve, not wildcard.');
        };
        const cli = new bashr.CLI('myCLI');
        cli.command('myRoute', handler);
        const route = cli.route('myRoute');
        route.command('*', handler2);
        cli.run(['', '', 'myRoute']);
    });

    it('Wildcard command with extra route', function (done) {
        // "hello world" should match "*"
        const defaultHandler: bashr.CommandHandler = (input, output) => {
            done();
        };
        const cli = new bashr.CLI('bashr');
        cli.command('*', defaultHandler);
        cli.run(['', '', 'hello', 'world'])
    });
});

// describe('CLI command with params', function () { 
//     it('Run CLI with params', done => {
//         const cli = new bashr.CLI('myCLI');
//         cli.command('hello :my-param', (input, output, callback) => {
//             console.log(input.params)
//             done();
//         });
//         cli.run(['', '', 'hello', '--myParamz', 'world'])        
//     });
// });
