export function concatObject(A: any, B: any): Object {
    return { ...A, ...B };
}

export function asyncEach<T>(items: T[], operation: (item: T, callback: () => void) => void, done?: () => void) {
    if (items.length > 0) {
        _asyncEach(items, 0, operation, done ? done : () => { });
    } else {
        if (done) done();
    }
}

function _asyncEach<T>(items: T[], index: number, operation: (item: T, callback: () => void) => void, done: () => void) {
    operation(items[index], () => {
        if (index + 1 < items.length) {
            _asyncEach(items, index + 1, operation, done);
        } else {
            done();
        }
    });
}