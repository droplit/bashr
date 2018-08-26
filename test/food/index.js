const bashr = require('../../dist/library');

const food = new bashr.CLI('food');

const fruit = food.route('fruit');

food.command('hello', (input, output) => {
    process.stdout.write('world');
});

const eatHandler = (input, output) => {
    process.stdout.write('eating', input);
};

const banana = fruit.route('banana');
banana.command('peel', (input, output) => {
    process.stdout.write('peeled!');
})
banana.command('eat', eatHandler).option('whole', {
    shorthand: 'w'
});

const other = food.route('other :item').command('eat', eatHandler);

const vegetables = food.route('vegetables :item2');

food.command('*', (input, output) => {
    process.stdout.write('default handler');
})

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