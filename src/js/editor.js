var class_id = 0;
var classes = {
    0: 'Лучник',
    1: 'Рыцарь',
    2: 'Маг',
    3: 'Мастер'
}

function startEditor() {
    document.getElementById("auth").hidden = true;
    document.getElementById("editor").hidden = false;
}

function plusClass() {
    if (class_id == 3) {
        class_id = 0;
    } else {
        class_id++;
    }
    document.getElementById("editor_class").innerText = classes[class_id];
}

function minusClass() {
    if (class_id == 0) {
        class_id = 3;
    } else {
        class_id--;
    }
    document.getElementById("editor_class").innerText = classes[class_id];
}

function sendEditorData() {
    var data = {
        nickname: document.getElementById("editor_name").value,
        appearance: {},
        skills: {
            class: class_id
        }
    }
    ws.send(JSON.stringify(data));
}