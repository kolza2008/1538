var ws;
var state_id;
var state = {};
var chunks = {};
var player = undefined;

let movedata = {x: 0, y: 0}
let is_moving = false;

const tileSize = window.innerWidth / 16
const zone_seeing = Math.max(16, Math.ceil(window.innerHeight / tileSize)) + 2

const colors = {
    0: '33,150,255',
    1: '139,194,74',
    2: '240,236,84',
    3: '8,182, 253'
}
const directions = [[-1, -1], [-1, 0], [-1, 1], 
                    [0, -1],  [0, 0],  [0, 1], 
                    [1, -1],  [1, 0],  [1, 1]]


var landscaft_layer = document.createElement('canvas');
landscaft_layer.width = tileSize * 16 * 16
landscaft_layer.height = tileSize * 16  * 16

var globalVirtual = document.createElement('canvas');
globalVirtual.width = tileSize * 16 
globalVirtual.height = tileSize * 16    

var ticks = 0

let canInteract = false
let interacted = ''

let ininventory = false

let canvas, ctx;

let images = {
    "e_for_interact" : document.getElementById("img/e_interact.png"),
    "inventory" : document.getElementById("img/inventory.png"),
    "icon" : {
        "helmet" : document.getElementById("img/helmeticon.png"),
        "chestplate" : document.getElementById("img/chestplateicon.png"),
        "boots" : document.getElementById("img/bootsicon.png"),
        "sword" : document.getElementById("img/swordicon.png"),
        "shield" : document.getElementById("img/shieldicon.png"),
        "artifact" : document.getElementById("img/artifacticon.png"),
        "belt" : document.getElementById("img/belticon.png"),
        "ring" : document.getElementById("img/ringicon.png")
    }
}

class Slot {
    constructor (x, y, source, defaultIcon) {
        this.renderX = x, 
        this.renderY = y, 
        this.source = source
        this.defaultIcon = defaultIcon
    }
    render (x, y) {
        if (this.source == undefined) {
            ctx.drawImage(this.defaultIcon, x + this.renderX, y + this.renderY)
        } else {
            ctx.drawImage(this.source.icon, x + this.renderX, y + this.renderY)
        }
    }
}

let slots = {
    helmetSlot : new Slot(96, 83, undefined, images.icon.helmet),
    chestplateSlot : new Slot(96, 126, undefined, images.icon.chestplate),
    bootsSlot : new Slot(96, 173, undefined, images.icon.boots),
    swordSlot : new Slot(41, 110, undefined, images.icon.sword),
    shieldSlot : new Slot(151, 110, undefined, images.icon.shield),
    artifactSlot : new Slot(52, 226, undefined, images.icon.artifact),
    beltSlot : new Slot(96, 226, undefined, images.icon.belt),
    ringSlot : new Slot(140, 226, undefined, images.icon.ring) 
}

function onKeyDown(e) {
    if (e.keyCode == 87) {
        if (state[state_id].state.position[1] > 0) {
            movedata.y = -1;
        } 
        is_moving = true;
    } else if (e.keyCode == 83) {
        movedata.y = 1;
        is_moving = true;
    } else if (e.keyCode == 65) {
        if (state[state_id].state.position[0] > 0) {
            movedata.x = -1;
        }
        is_moving = true;
    } else if (e.keyCode == 68) {
        movedata.x = 1;
        is_moving = true;
    }
    console.log(movedata, is_moving, e.keyCode)
}
function onKeyUp(e) {
    if (e.keyCode == 87 || e.keyCode == 83) {
        movedata.y = 0;
        is_moving = false;
    } else if (e.keyCode == 65 || e.keyCode == 68) {
        movedata.x = 0;
        is_moving = false;
    } else if (e.keyCode == 69) {
        ininventory = !ininventory;     
    }
    console.log('down')
}

function uploadChunks(){
    if (player != undefined) {
        var startx = Math.floor(player.state.position[0] / 16)
        var starty = Math.floor(player.state.position[1] / 16)
        for (var i = 0; i < 9; i++) {
            var cur_x = startx + directions[i][0]
            var cur_y = starty + directions[i][1]
            if (!([cur_x, cur_y] in chunks) && cur_x >= 0 && cur_y >= 0) {
                console.log(cur_x, cur_y)
                ws.send(`?chunk.${cur_x}.${cur_y}`)
            }
        }
    }
}

function prepareGame() {
    ws = new WebSocket(`wss://${SERVER}/ws?token=${localStorage.getItem('API_TOKEN')}`);
    ws.onmessage = function(event) {
        let symbol = event.data.substr(0, 1);
        if (symbol == "|") {
            if (event.data.substr(1, 3) == "404") {
                console.log("editor")
                startEditor();
            }
        } else if (symbol == "#") {
            localStorage.setItem('id', event.data.substr(1, event.data.length - 1))
            state_id = event.data.substr(1, event.data.length - 1)
            startGame();
        }
    }
}

function startGame() {
    console.log("start game")
    ws.onmessage = function(event) {
        let symbol = event.data.substr(0, 1);
        let other = event.data.substr(1, event.data.length - 1);
        if (symbol == ".") {
            state = JSON.parse(other);
            player = state[state_id];
            uploadChunks()
            //console.log(state)
        } else if (symbol == "$") {
            var str_pos = other.split("|")[0].split('.')
            chunks[[Number(str_pos[0]), Number(str_pos[1])]] = JSON.parse(other.split("|")[1])
        }
    }
    document.getElementById("auth").hidden = true;
    document.getElementById("editor").hidden = true;
    document.getElementById("game").hidden = false;

    
    document.addEventListener("keydown", onKeyDown)
    document.addEventListener("keyup", onKeyUp)

    canvas = document.getElementById("canvas")
    canvas.width = window.innerWidth
    canvas.height = window.innerHeight
    ctx = canvas.getContext("2d")
    
    function sendMovement() {
        if (is_moving) {
            ws.send(`@${movedata.x}.${movedata.y}`)
            console.log('jija')
        }
    }
    setInterval(sendMovement, 50)

    renderGame();
}


function getTile(x, y) {
    if (x != 0) {var cx = Math.floor(x / 16)} else {var cx = 0}
    if (y != 0) {var cy = Math.floor(y / 16)} else {var cy = 0}
    var chunk = chunks[[cx, cy]]
    if (chunk != undefined) {
        return chunk[y % 16][x % 16]
    }
    return 0;
}

function inSeeingDistance(x, y) {
    var distancex = Math.abs(x - player.state.position[0])
    var distancey = Math.abs(y - player.state.position[1])
    var distance = Math.sqrt((distancex * distancex) + (distancey * distancey))
    return distance <= zone_seeing
}

function renderGame() {
    if (ws.state == ws.CLOSED || ws.state == ws.CLOSING) {
        alert("Disconnect")
        return
    }
    if (player != undefined) {
        ctx.clearRect(0,0,canvas.width,canvas.height);
        
        var playercellx = (canvas.width - tileSize) / 2
        var playercelly = (canvas.height - tileSize) / 2

        var startCol = player.state.position[0] - Math.ceil(playercellx / tileSize)
        var endCol = player.state.position[0] + Math.ceil(playercellx / tileSize)
        if (startCol < 0) {startCol = 0}

        var startRow = player.state.position[1] - Math.ceil(playercelly / tileSize)
        var endRow = player.state.position[1] + Math.ceil(playercelly / tileSize)
        if (startRow < 0) {startRow = 0}

        for (var y = startRow; y <= endRow; y++) {
            for (var x = startCol; x <= endCol; x++) {
                ctx.fillStyle =`rgb(${colors[getTile(x, y)]})`
                ctx.fillRect(playercellx - ((player.state.position[0] - x) * tileSize), playercelly - ((player.state.position[1] - y) * tileSize), tileSize, tileSize)
            }
        }

        canInteract = false
        for (var i of Object.keys(state)) {
            var sx = state[i].state.position[0], sy = state[i].state.position[1]
           
            if (inSeeingDistance(sx, sy)) {
                if (state[i].type == 'player') {
                    ctx.fillStyle = "rgba(0,0,0,1)"
                    ctx.fillRect((playercellx - ((player.state.position[0] - sx) * tileSize)) + tileSize * 0.125, 
                                 (playercelly - ((player.state.position[1] - sy) * tileSize)) + tileSize * 0.125, 
                                 tileSize * 0.75, tileSize * 0.75)
                } else if (state[i].type == 'chest') {
                    ctx.fillStyle = "rgba(255,170,0,1)"
                    ctx.fillRect((playercellx - ((player.state.position[0] - sx) * tileSize)) + tileSize * 0.125, 
                                 (playercelly - ((player.state.position[1] - sy) * tileSize)) + tileSize * 0.125, 
                                 tileSize * 0.75, tileSize * 0.75)
                    if (state[i].state.position[0] == player.state.position[0] && state[i].state.position[1] == player.state.position[1]) {
                        canInteract = true
                        interacted = i
                    }
                }
            }
        }
    }
    if (canInteract && !ininventory) {
        ctx.drawImage(images.e_for_interact, 
                      canvas.width - images.e_for_interact.width,
                      canvas.height - images.e_for_interact.height
        )
    } 
    if (ininventory) {
        ctx.fillStyle = "rgba(0,0,0,0.7)"
        ctx.fillRect(0,0,canvas.width,canvas.height)

        invX = (canvas.width - images.inventory.width) / 2
        invY = (canvas.height - images.inventory.height) / 2
        ctx.drawImage(images.inventory, invX, invY)

        slots.helmetSlot.render(invX, invY)
        slots.chestplateSlot.render(invX, invY)
        slots.bootsSlot.render(invX, invY)
        slots.swordSlot.render(invX, invY)
        slots.shieldSlot.render(invX, invY)
        slots.artifactSlot.render(invX, invY)
        slots.beltSlot.render(invX, invY)
        slots.ringSlot.render(invX, invY)
    }
    requestAnimationFrame(renderGame);
}