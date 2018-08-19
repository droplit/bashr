const spawn = require('cross-spawn');
import * as path from 'path';
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
    it('Input "hello world foo" should match command "*"', function (done) {
        const defaultHandler: bashr.CommandHandler = (input, output) => {
            done();
        };
        const cli = new bashr.CLI('bashr');
        cli.command('*', defaultHandler);
        cli.run(['', '', 'hello', 'world', 'foo'])
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
    it('Input "myRoute hello world" should not match {route: "myRoute", command: "hello"}', function (done) {
        const handler: bashr.CommandHandler = (input, output) => {
            done('Command should not match command');
        };
        const defaultHandler: bashr.CommandHandler = (input, output) => {
            done();
        };
        const cli = new bashr.CLI('myCLI');
        const route = cli.route('myRoute');
        route.command('hello', handler);
        route.command('*', defaultHandler);
        cli.run(['', '', 'myRoute', 'hello', 'world'])
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
    it('Unused route', function (done) {
        const handler: bashr.CommandHandler = (input, output) => {
            done();
        };
        const cli = new bashr.CLI('myCLI');
        const unused = cli.route('otherRoute');
        const route = cli.route('myRoute');
        route.command('hello', handler);
        cli.run(['', '', 'myRoute', 'hello']);
    });
    it('Route name with *', function (done) {
        const handler: bashr.CommandHandler = (input, output) => {
            done();
        };
        const cli = new bashr.CLI('myCLI');
        const route = cli.route('myRoute *');
        route.command('hello', handler);
        cli.run(['', '', 'myRoute', 'anything', 'hello']);
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
    it('Single param (Extra space)', function (done) {
        const handler: bashr.CommandHandler = (input, output) => {
            expect(input.params['param']).to.equal('world');
            done();
        };
        const cli = new bashr.CLI('bashr');
        cli.command('hello    :param   ', handler);
        cli.run(['', '', 'hello', 'world'])
    });
    it('Single param in route', function (done) {
        const handler: bashr.CommandHandler = (input, output) => {
            expect(input.params['param']).to.equal('world');
            done();
        };
        const cli = new bashr.CLI('bashr');
        const route = cli.route('myRoute :param');
        route.command('hello', handler);
        cli.run(['', '', 'myRoute', 'world', 'hello'])
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
    it('Single param with validation', function (done) {
        const defaultHandler: bashr.CommandHandler = (input, output) => {
            done('"1234" should pass validation for regex /^[0-9]*$/');
        };
        const handler: bashr.CommandHandler = (input, output) => {
            expect(input.params['myParam']).to.equal('1234');
            done();
        };
        const cli = new bashr.CLI('bashr');
        cli.param('myParam', { validationRegex: /^[0-9]*$/ }); // Only numbers
        cli.command('hello :myParam', handler);
        cli.command('*', defaultHandler);
        cli.run(['', '', 'hello', '1234'])
    });
    it('Single param with validation (fail to pass)', function (done) {
        const defaultHandler: bashr.CommandHandler = (input, output) => {
            done();
        };
        const handler: bashr.CommandHandler = (input, output) => {
            done('"world" should not pass validation for regex /^[0-9]*$/');
        };
        const cli = new bashr.CLI('bashr');
        cli.param('myParam', { validationRegex: /^[0-9]*$/ }); // Only numbers
        cli.command('hello :myParam', handler);
        cli.command('*', defaultHandler);
        cli.run(['', '', 'hello', 'world'])
    });
    it('Single param with custom validator', function (done) {
        const defaultHandler: bashr.CommandHandler = (input, output) => {
            done('"world" should pass custom validator');
        };
        const handler: bashr.CommandHandler = (input, output) => {
            done();
        };
        const cli = new bashr.CLI('bashr');
        cli.param('myParam', { validator: (value) => value === 'world' }); // Only allow 'world'
        cli.command('hello :myParam', handler);
        cli.command('*', defaultHandler);
        cli.run(['', '', 'hello', 'world'])
    });
    it('Single param with custom validator (fail to pass)', function (done) {
        const defaultHandler: bashr.CommandHandler = (input, output) => {
            done();
        };
        const handler: bashr.CommandHandler = (input, output) => {
            done('"foo" should not pass custom validator');
        };
        const cli = new bashr.CLI('bashr');
        cli.param('myParam', { validator: (value) => value === 'world' }); // Only allow 'world'
        cli.command('hello :myParam', handler);
        cli.command('*', defaultHandler);
        cli.run(['', '', 'hello', 'foo'])
    });
});


describe('Child process test', function () {
    this.slow(500);
    before(() => {
        const command = spawn.sync('npm', ['link'], { cwd: path.join(__dirname, './food') });
    });
    it('Run food cli "hello"', done => {
        const command = spawn.sync('food', ['hello']);
        const output = command.stdout.toString();
        expect(output).to.equal('world');
        done();
    });
    it('Run food cli "fruit banana peel"', done => {
        const command = spawn.sync('food', ['fruit', 'banana', 'peel']);
        const output = command.stdout.toString();
        expect(output).to.equal('peeled!');
        done();
    });
    it('Food cli default "fruit banana peel foo"', done => {
        const command = spawn.sync('food', ['fruit', 'banana', 'peel', 'foo']);
        const output = command.stdout.toString();
        expect(output).to.equal('default handler');
        done();
    });
    after(() => {
        spawn.sync('npm', ['unlink', 'food']);
    })
});
