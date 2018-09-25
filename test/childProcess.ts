import * as path from 'path';
import 'mocha';
import { expect } from 'chai';
const spawn = require('cross-spawn');

describe('Child process test', function () {
    this.slow(500);
    before(() => {
        const command = spawn.sync('npm', ['link'], { cwd: path.join(__dirname, './food') });
    });
    it('Run food cli "hello"', (done) => {
        const command = spawn.sync('food', ['hello']);
        const output = command.stdout.toString();
        expect(output).to.equal('world');
        done();
    });
    it('Run food cli "fruit banana peel"', (done) => {
        const command = spawn.sync('food', ['fruit', 'banana', 'peel']);
        const output = command.stdout.toString();
        expect(output).to.equal('peeled!');
        done();
    });
    it('Food cli default "fruit banana peel foo"', (done) => {
        const command = spawn.sync('food', ['fruit', 'banana', 'peel', 'foo']);
        const output = command.stdout.toString();
        expect(output).to.equal('default handler');
        done();
    });
    after(() => {
        spawn.sync('npm', ['unlink', 'food']);
    });
});
