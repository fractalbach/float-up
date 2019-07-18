// __________________________________________________________________
//      Game Object Manager
// ==================================================================
// The game object manager abstracts away the data structures used
// to hold and compare game objects.  One of it's main goals is to
// support collision detection, which often relies upon special
// structures that are un-natural to work with at a higher level.

// Currently:
// is NOT implemented efficiently because there aren't that many
// objects that need collision detection.  When needed, swap out
// the underlying structures here.

// For better efficiency (once it's needed):
// TODO: use a self-balancing binary search tree instead of sorted list.
// TODO: make sure that tree is able to re-sort itself once objects move.

const GameObjectManager = (function(){

    let nextid = 333;
    let objects = new Map();

    function size() {
        return objects.size;
    }

    function _makeUID() {
        nextid++;
        return nextid;
    }

    function compareX (object1, object2) {
        return (object1.lowX() - object2.lowX())
    }

    function compareY (object1, object2) {
        return (object1.lowY() - object2.lowY())
    }

    function hasCollision(A, B) {
        if (!A || !B) {
            return false;
        }
        if (
            A.lowX() < B.highX() &&
            B.lowX() < A.highX() &&
            A.lowY() < B.highY() &&
            B.lowY() < A.highY()
        ){
            return true;
        }
        return false;
    }

    function add(object) {
        let id = _makeUID();
        object.id = id;
        objects.set(id, object);
        return id;
    }

    function remove(id) {
        let result = objects.delete(id);
        return result;
    }

    // forEach has similar behavior to Array.forEach
    function forEach(fn) {
        for (let v of objects.values()) {
            fn(v);
        }
    }

    function stepAll() {
        for (let v of objects.values()) {
            v.step();
        }
    }

    // return all objects that are colliding with the given object.
    // A is a reference to an object.
    function findCollisionsWith(A) {
        let results = new Array();
        // TODO: use binary search instead.
        for (let B of objects.values()) {
            if (A == B) {
                continue;
            }
            if (hasCollision(A,B)) {
                results.push(B);
            }
        }
        return results;
    }

    // removes objects that are too far off the screen.
    function cleanOffscreenObjects() {
        for (let [k,v] of objects.entries()) {
            if ((v.y > GAME_HEIGHT) || (v.x < 0) || (v.x > GAME_WIDTH)) {
                objects.delete(k)
            }
        }
    }

    // GameObjectManager public interfaces.
    return {
        size,
        add,
        remove,
        forEach,
        stepAll,
        findCollisionsWith,
        hasCollision,
        compareX,
        compareY,
        cleanOffscreenObjects,
    }

}());
