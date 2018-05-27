# Bashr

## Theory of Operation

Create command line interface applications using an express-like router architecture to map commands.

* Plugin extensibility for help
* Plugin extensibility for param parsing
* framework for 
* Bashr itself does not have a CLI


example:

droplit device :id set :selector :value

droplit device partylight set BinarySwitch.switch on

droplit device set partylight BinarySwitch.switch on

// convention 1
#!/usr/bin/env node
let droplitCli = new bashr.CLI('droplit');
const ecosystemRoute = droplitCli.route('ecosystem');
const deviceRoute = droplitCli.route('device');
...
droplit.run(process.argv);

let router = bashr.Router();

// convention 2
let droplit = new bashr.CLI('droplit');
const ecosystem = droplit.route('ecosystem');
const device = droplit.route('device');
device.command(':deviceId set', (in, out) => {});
 - or -
const deviceId = device.route(':deviceId');
deviceId.command('set', (in, out) => { out.log(`deviceId: ${in.params.deviceId}`)});

// option 1
deviceRoute = cli.route('device')
deviceRoute.command('set :id :selector :value', (cmd, out) => {});
deviceRoute.command('get :id :selector :value')
deviceRoute.command('call :id :selector :value')


// option 2
route = cli.route('device :id')

route.command('set :selector :value', (cmd, out) => {});


// option 3
cli.route('device', () => require('./device'));

cli('device')('set')

`c:\> droplit device set :id :selector :value`
prompt invocation namespace command param param param

`droplit settings host list`
invocation namespace namespace command


(cmd, out) => {
    cmd.params : {
        "id": "",
        "selector": "",
        "value": ""
    }
    cmd.options

}

`droplit device :id set`

cli('device set :id :selector :value', (cmd, out, next) => {});

cli('device :id call :selector :[value]'); // call command with optional "value" field

cli('device :id call :selector [value...]'); // call command with optional any number of fields

`droplit device :deviceId get :selector --refresh=true`

droplit

menu:
ecosystem
environment
device
...

droplit> device

menu:
select
list
----
help
back


droplit device> select partylight

droplit device: partylight

menu:
set
get
call
----
help
back

droplit device: partylight> set BinarySwitch.switch on

setting partylight BinarySwitch.switch: on

droplit device: partylight>

### routing rules

* routes added first, are tested first
* routes can define required tokens and optional tokens
* all optional tokens must be after the last required token
* a route matches if all required tokens have been matched
* 

prompt

parameters/arguments

options

`> redirection operators`
`| pipeline`


Expressjs

let bookRoute = app.route('/book');

bookRoute.get('/topSellers', (req, res, next) => {});
bookRoute.get('/reserved', (req, res, next) => { if (!req.something) next(); });

app.get('/book/reserved', (req, res) => {});

GET http://somedomain.com/book/topSellers
GET http://somedomain.com/book/reserved

app
- /book
	- /topSellers
	- /reserved
- /book/reserved