# Bashr
Create stellar CLI applications

 [![NPM](https://nodei.co/npm/bashr.png)](https://www.npmjs.com/package/bashr)

## About

Bashr is a library for building NodeJS based command line interfaces. 

* Route based design
* Command parameters and options/flags
* Middleware architecture
* Lazy-load route modules for fast response time

## Example

```typescript
import * as bashr from 'bashr';

const food = new bashr.CLI('food');

food.command('hello', () => {
    console.log('world');
});

food.run(process.argv);
```

```console
$ food hello
world
```

# Overview
## Commands

```typescript
import * as bashr from 'bashr';

const food = new bashr.CLI('food');

food.command('hello', () => {
    console.log('world');
});

food.run(process.argv);
```

```console
$ food hello
world
```

### Multiple handlers

```typescript
import * as bashr from 'bashr';

const cli = new bashr.CLI('cli');

let count = 0;

const handler = () => {
    console.log(count);
    count++;
};

cli.command('hello', handler, handler, handler);

cli.run(process.argv);
```

```console
$ cli hello
0
1
2
```

### Parameters 

Parameters are described with a `:` prefix. You can extract input parameters in command handlers.

Example:

```typescript
import * as bashr from 'bashr';

const cli = new bashr.CLI('cli');

const handler = (input, output) => {
    console.log(input.params['param']);
};

cli.command('hello :param', handler);

cli.run(process.argv);
```

```console
$ cli hello world
world
```

### Optional Parameters

```typescript
import * as bashr from 'bashr';

const cli = new bashr.CLI('cli');

const handler = (input, output) => {
    console.log(input.params['param']);
};

cli.command('hello :[param]', handler);

cli.run(process.argv);
```

```console
$ cli hello world
world
```

### Options/Flags

Options and Flags are parsed and configured with [yargs-parser](https://www.npmjs.com/package/yargs-parser]).

```typescript
import * as bashr from 'bashr';

const cli = new bashr.CLI('cli');

const command = cli.command('hello', ()=> {
    console.log(input.options['world']);
});

command.option('world', { alias: ['w'] });

cli.run(process.argv);
```

```console
$ cli hello --world
true
```
or
```console
$ cli hello -w earth
earth
```

## Routes

```typescript
import * as bashr from 'bashr';

const food = new bashr.CLI('food');

const fruit = food.route('fruit');

fruit.command('banana', () => {
    console.log("I'm a banana!");
});

food.run(process.argv);
```

```console
$ food fruit banana
I'm a banana!
```

