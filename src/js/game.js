var ws;
var state_id;
var state = {};
var chunks = {};
var player = undefined;

let movedata = {x: 0, y: 0}
let is_moving = false;

const tileSize = window.innerWidth / 16

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
landscaft_layer.width = tileSize * 16 
landscaft_layer.height = tileSize * 16 

var globalVirtual = document.createElement('canvas');
globalVirtual.width = tileSize * 16 
globalVirtual.height = tileSize * 16    

var ticks = 0

let canvas, ctx;

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
            renderLandscaft();
        }
    }
    document.getElementById("auth").hidden = true;
    document.getElementById("editor").hidden = true;
    document.getElementById("game").hidden = false;

    function commonTouches(e) {
        for (var i = 0; i < e.touches.length; i++) {
            var radiusX = e.touches[i].clientX - (canvas.width - (canvas.height * 0.15))
            var radiusY = e.touches[i].clientY - (canvas.height * 0.85)
            var radius = Math.sqrt((radiusX * radiusX) + (radiusY * radiusY))
            console.log(e.touches[i].clientX, (canvas.width - (canvas.height * 0.15)))
            if (radius <= canvas.height * 0.15) {
                move_data = [radiusX / canvas.height * 0.15, radiusY / canvas.height * 0.15]
            }
        }
    }

    document.getElementById("canvas").addEventListener("touchstart", commonTouches)
    document.getElementById("canvas").addEventListener("touchmove", commonTouches)
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

var renderedChunks = {}
var cns = document.createElement('canvas');
cns.width = 16 * tileSize
cns.height = 16 * tileSize
var zctx = cns.getContext('2d');

function renderChunk(x, y) { 
    var chunk = chunks[[x, y]]
    if ([x, y] in renderedChunks) {
        return renderedChunks[[x, y]]
    }
    if (chunk != undefined) {
        zctx.clearRect(0, 0, cns.width, cns.height)
        for (var x = 0; x < 16; x++) {
            for (var y = 0; y < 16; y++) {
                zctx.fillStyle =`rgb(${colors[chunk[y][x]]})`
                zctx.fillRect(x * tileSize, y * tileSize, tileSize, tileSize)
            }
        }
        renderedChunks[[x, y]] = cns;
    }
    return cns
}

var ll = document.createElement('canvas');
var lctx = ll.getContext("2d")
ll.width = tileSize * 16 * 3;
ll.height = tileSize * 16 * 3;

function renderLandscaft() {
    var cx = Math.floor(player.state.position[0] / 16)
    var cy = Math.floor(player.state.position[1] / 16)
    for (var i = 0; i < 9; i++) {
        var cur_x = cx + directions[i][0]
        var cur_y = cy + directions[i][1]

        //var chunk = chunks[[]]

        var chunk_rel_x = (directions[i][0] + 1) * tileSize * 16
        var chunk_rel_y = (directions[i][1] + 1) * tileSize * 16

        lctx.drawImage(renderChunk(cur_x, cur_y), chunk_rel_x, chunk_rel_y)

        /*if (chunk != undefined) {
            for (var x = 0; x < 16; x++) {
                for (var y = 0; y < 16; y++) {0
                    lctx.fillStyle =`rgb(${colors[chunk[y][x]]})`
                    lctx.fillRect(chunk_rel_x + (x * tileSize), chunk_rel_y + (y * tileSize), tileSize, tileSize)
                }
            }
        }*/
        //console.log(renderChunk)
    }
    return ll
    /*for (const [key, value] of Object.entries(chunks)) {
        for (var y = 0; y < value.length; y++) {
            for (var x = 0; x < value[0].length; x++) {
                var chunk_pos = key.split(',')
                chunk_pos = [Number(chunk_pos[0]), Number(chunk_pos[1])]
                //console.log((chunk_pos[0] * 16 + x), (chunk_pos[1] * 16 + y), value[y][x])
                lctx.fillStyle =`rgb(${colors[value[y][x]]})`
                lctx.fillRect((chunk_pos[0] * 16 + x) * tileSize, (chunk_pos[1] * 16 + y) * tileSize, tileSize, tileSize)
            }
        }
    }*/
}

function inChunkDistance(x, y) {
    var m_chunk_x = Math.floor(player.state.position[0] / 16)
    var m_chunk_y = Math.floor(player.state.position[1] / 16)
    var h_chunk_x = Math.floor(x / 16)
    var h_chunk_y = Math.floor(y / 16)
    return Math.max(Math.abs(h_chunk_x - m_chunk_x), Math.abs(h_chunk_y - m_chunk_y)) <= 1
}

var three_chunks_canva = document.createElement("canvas")
three_chunks_canva.width = tileSize * 16 * 3;
three_chunks_canva.height = tileSize * 16 * 3; 
var tctx = three_chunks_canva.getContext("2d")

function renderGame() {
    tctx.clearRect(0, 0, tileSize * 16 * 3, tileSize * 16 * 3)

    if (player != undefined) {
        tctx.drawImage(renderLandscaft(), 0, 0)

        tctx.fillStyle = "rgba(255,255,255,0.5)"
        /*for (const [key, value] of Object.entries(state)) {
            if (key != state_id && inChunkDistance(value.state.position[0], value.state.position[1])) {
                tctx.fillRect(((value.state.position[0] - ((chunk_x - 1) * 16)) * tileSize) + tileSize * 0.125,
                            ((value.state.position[1] - ((chunk_y - 1) * 16)) * tileSize) + tileSize * 0.125,
                            tileSize*0.75, tileSize*0.75)
            }
        }*/
        tctx.fillRect((((player.state.position[0] % 16) + 16) * tileSize) + tileSize * 0.125, 
                      (((player.state.position[1] % 16) + 16) * tileSize) + tileSize * 0.125, 
                      tileSize*0.75, tileSize*0.75)

        var playercellx = (((player.state.position[0] % 16) + 16) * tileSize)
        var playercelly = (((player.state.position[1] % 16) + 16) * tileSize)

        var centerx = (canvas.width - tileSize) / 2
        var centery = (canvas.height - tileSize) / 2

        ctx.drawImage(three_chunks_canva, centerx - playercellx, centery - playercelly)
    }
    
    /*
    //ctx.fillRect(canvas.width - (canvas.height * 0.3), canvas.height * 0.7, canvas.height * 0.3, canvas.height * 0.3)
    ctx.beginPath()

    ctx.arc(canvas.width - (canvas.height * 0.15), canvas.height * 0.85, canvas.height * 0.15, 0, Math.PI * 2)
    ctx.fillStyle = "rgba(0, 0, 0, 0.5)"
    ctx.fill()

    ctx.closePath()
    ctx.beginPath()

    ctx.arc(canvas.width - (canvas.height * 0.15) + (canvas.height * 0.15 * move_data[0]), canvas.height * 0.85 + (canvas.height * 0.15 * move_data[1]), canvas.height * 0.03, 0, Math.PI * 2)
    ctx.fillStyle = "rgb(255, 255, 255)"
    ctx.fill()

    ctx.closePath()*/
    
    setTimeout(renderGame, 1000/60)//requestAnimationFrame(renderGame);
}