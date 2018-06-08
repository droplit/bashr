import * as bashr from '../library';

const food = new bashr.CLI('food');

const fruit = food.route('fruit');

const eatHandler: bashr.CommandHandler = (input, output) => { console.log('eating', input); };

fruit.route('banana')
.command('peel', (input, output) => { console.log('peeling', input); })
.command('eat', eatHandler).option('whole', {shorthand: 'w'});

const other = food.route('other :item').command('eat', eatHandler);

const vegetables = food.route('vegetables :item2');

food.command('poop', (input, output) => { output.log('herro'); });

food.run(process.argv);

/*
    food
        fruit
            banana
                #peel
                #eat
        other :item
            #eat
        vegetables :item2
*/