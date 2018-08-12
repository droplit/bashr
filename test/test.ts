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
    it('Input "hello" should match command "*"', function (done) {
        const defaultHandler: bashr.CommandHandler = (input, output) => {
            done();
        };
        const cli = new bashr.CLI('myCLI');
        cli.command('*', defaultHandler);
        cli.run(['', '', 'hello'])
    });
    it('Input "hello world" should match command "*"', function (done) {
        const defaultHandler: bashr.CommandHandler = (input, output) => {
            done();
        };
        const cli = new bashr.CLI('bashr');
        cli.command('*', defaultHandler);
        cli.run(['', '', 'hello', 'world'])
    });
    it('Input "myRoute hello" should match {route: "myRoute", command: "*"}', function (done) {
        const defaultHandler: bashr.CommandHandler = (input, output) => {
            done();
        };
        const cli = new bashr.CLI('myCLI');
        const route = cli.route('myRoute');
        route.command('*', defaultHandler);
        cli.run(['', '', 'myRoute', 'hello'])
    });
    it('Input "myRoute" should match command "myRoute" before {route: "myRoute", command: "*"}', function (done) {
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
});

describe('Params', function () {
    it('Single param', function (done) {
        const handler: bashr.CommandHandler = (input, output) => {
            expect(input.params['param']).to.equal('world');
            done();
        };
        const cli = new bashr.CLI('bashr');
        cli.command('hello :param', handler);
        cli.run(['', '', 'hello', 'world'])
    });

    it('Two params', function (done) {
        const handler: bashr.CommandHandler = (input, output) => {
            expect(input.params['param1']).to.equal('foo');
            expect(input.params['param2']).to.equal('bar');
            done();
        };
        const cli = new bashr.CLI('bashr');
        cli.command('hello :param1 :param2', handler);
        cli.run(['', '', 'hello', 'foo', 'bar'])
    });
    it('Input "hello world" should match command "hello :myParam"', function (done) {
        const handler: bashr.CommandHandler = (input, output) => {
            expect(input.params['myParam']).to.equal('world');
            done();
        };
        const cli = new bashr.CLI('bashr');
        const route = cli.route('myRoute');
        route.command('hello :myParam', handler);
        cli.run(['', '', 'myRoute', 'hello', 'world'])
    });
    it('Input "hello world" will match "hello :myParam" and not {route:"hello", command: "world"}', function (done) {
        const handlerA: bashr.CommandHandler = (input, output) => {
            done();
        };
        const handlerB: bashr.CommandHandler = (input, output) => {
            done('Commands are matched before routes');
        };
        const cli = new bashr.CLI('bashr');
        cli.command('hello :myParam', handlerA);
        const route = cli.route('hello');
        route.command('world', handlerB);
        cli.run(['', '', 'hello', 'world'])
    });
    it('Input "hello myValue world" should match "hello :myParam world"', function (done) {
        const handlerA: bashr.CommandHandler = (input, output) => {
            expect(input.params['myParam']).to.equal('myValue');
            done();
        };
        const cli = new bashr.CLI('bashr');
        cli.command('hello :myParam world', handlerA);
        cli.run(['', '', 'hello', 'myValue', 'world'])
    });
    it('Input "hello myValue" should not match "hello :myParam world"', function (done) {
        const defaultHandler: bashr.CommandHandler = (input, output) => {
            done();
        };
        const cli = new bashr.CLI('bashr');
        cli.command('*', defaultHandler);
        cli.command('hello :myParam world', () => done('Should not match'));
        cli.run(['', '', 'hello', 'myValue'])
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
