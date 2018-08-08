process.env['DEBUG'] = 'bashr*';
import 'mocha';
import { expect } from 'chai';
import * as bashr from '../';

console.log(process.argv);

describe('CLI programmatically', function () {
    it('Create CLI', done => {
        const cli = new bashr.CLI('bashr');
        expect(cli).to.exist;
        done();
    });
    it('Run CLI', done => {
        const cli = new bashr.CLI('bashr');
        cli.run(['', '']);
        done();
    });
    it('Run CLI command', function (done) {
        const handler: bashr.CommandHandler = (input, output) => {
            done();
        };
        const cli = new bashr.CLI('bashr');
        cli.command('test', handler)
        cli.run(['', '', 'test']);
    });
    it('Run CLI command with route', function (done) {
        const handler: bashr.CommandHandler = (input, output) => {
            done();
        };
        const cli = new bashr.CLI('bashr');
        const route = cli.route('myRoute');
        route.command('test', handler);
        cli.run(['', '', 'myRoute', 'test']);
    });
});