const Debugger = (function(){

const q = document.querySelector.bind(document);

function add(id, name) {
    q("#debugger").insertAdjacentHTML('beforeend', `<tr id="debug_row_${id}"><td>${name}</td><td id="debug_${id}"></td></tr>`);
}

function set(id, value) {
    q(`#debug_${id}`).innerText = value;
}

function remove(id) {
    q(`#debug_row_${id}`).remove();
}

return {
    add,
    set,
    remove,
}

}());
