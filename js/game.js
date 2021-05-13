/* GameObject.js */
//Helpers
var Keys = {
  up: 38,
  down: 40,
  left: 37,
  right: 39,
  key_z: 90,
  key_x: 88,
  return: 13,
  escape: 27,
  space: 32,
  key_w: 87,
  key_a: 65,
  key_s: 83,
  key_d: 68,
  backspace: 8,
  tilde: 192,
  shift: 16,
  control: 17
};

function RectsColliding(r1, r2) {
    return !(r1.x > r2.x + r2.w || r1.x + r1.w < r2.x || r1.y > r2.y + r2.h || r1.y + r1.h < r2.y);
}

//Point Distance (x1,x2,y1,y2)
function distance(x1, x2, y1, y2) {
  var a = x1 - x2
  var b = y1 - y2
  return Math.sqrt( a*a + b*b );
}

//Get random
function getRandomInt(min, max) {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min)) + min;
}

//wrapText polyfill
CanvasRenderingContext2D.prototype.wrapText = function (text, x, y, maxWidth, lineHeight) {

    var lines = text.split("\n");

    for (var i = 0; i < lines.length; i++) {

        var words = lines[i].split(' ');
        var line = '';

        for (var n = 0; n < words.length; n++) {
            var testLine = line + words[n] + ' ';
            var metrics = this.measureText(testLine);
            var testWidth = metrics.width;
            if (testWidth > maxWidth && n > 0) {
                this.fillText(line, x, y);
                line = words[n] + ' ';
                y += lineHeight;
            }
            else {
                line = testLine;
            }
        }

        this.fillText(line, x, y);
        y += lineHeight;
    }
}



function Sprite(image,width,height) {
    this.image = new Image();
    this.image.ready = false;
    this.image.onload = function() {
        this.ready = true;
    }
    this.image.src = image;
    this.dirs = {
        up: 0,
        right: 96,
        down: 196,
        left: 288
    }
    this.frame = {
        width: width,
        height: height,
        x: 72,
        y: this.dirs.down
    }
    this.framecounter = 0;
    this.fps = 10;
    this.animating = false;

    this.animate = function() {
        if(this.framecounter >= this.fps) {
            this.frame.x += this.frame.width;
            if (this.frame.x >= this.image.width) {
                this.frame.x = 0;
            }
            this.framecounter = 0;
        }
        if(this.animating) {
            this.framecounter++;       
        }
    }

    this.setDir = function(dir,value) {
        this.dirs[dir] = value;
    }
}

function Rect(x,y,w,h) {
    this.x = x;
    this.y = y;
    this.w = w;
    this.h = h;

    this.setRect = function(rect) {
        this.x = rect.x;
        this.y = rect.y;
        this.w = rect.w;
        this.h = rect.h;
    }

    this.setXYWH = function(x,y,w,h) {
        this.x = x;
        this.y = y;
        this.w = w;
        this.h = h;
    }
}


function Vector(x,y) {
    this.x = x;
    this.y = y;
}

function Size(w,h) {
    this.w = w;
    this.h = h;
}

function GameObject(x,y,w,h) {
    this.x = x;
    this.y = y;
    this.w = w;
    this.h = h;
    this.speed = 1;
    this.xvel = 0;
    this.yvel = 0;
    this.canMove = true;
    this.colliding = false;
    this.oldColor = `red`;
    this.color = "red";
    this.nextMove = new Rect(x,y,w,h);
    this.collidesWith = [];
    this.overlaps = {};
    this.keysDown = [];
    this.collider = new Rect(x,y,w,h);
    this.debug = false;
    this.sprite = null;

    this.createSprite = function(image,frame_width,frame_height) {
        this.sprite = new Sprite(image,frame_width,frame_height);
    }



    this.draw = function() {
        if(this.sprite !== null && this.sprite.image.ready) {
            if(this.debug == true && this.collider) {  
                cx.strokeStyle = "#0F0";
                cx.strokeRect(this.collider.x, this.collider.y, this.collider.w, this.collider.h);
            }
            cx.drawImage(this.sprite.image,this.sprite.frame.x, this.sprite.frame.y,this.sprite.frame.width,this.sprite.frame.height,this.x,this.y,this.w,this.h);               
        }
        else {
            cx.fillStyle = this.color;
            cx.fillRect(this.x, this.y, this.w, this.h);
            cx.fillStyle = "red";
            cx.font = "14px Consolas";
            cx.fillText("Loading ",this.x, this.y + 20);
        }
    }

    this.update = function(deltaTime) {
        this.sprite.animate();
        this.move(deltaTime);
    }

    this.setDir = function(x,y) {
        this.xvel = x;
        this.yvel = y;

    }

    this.collides = function(items) {
        if(items instanceof Array) {
            for(var i=0;i < items.length;i++) {
                this.collidesWith.push(items[i]);
            }
        } 
        else {
            this.collidesWith.push(items);
        }
    }

    this.overlap = function(name,item,callback) {
        this.overlaps[name] = {
            collider: item,
            callback: callback
        };
    }

    this.move = function(dt) {

        //Calculate next Pos
        if(this.xvel !== 0 || this.yvel !== 0) {
            this.nextMove = {
                x: this.x + this.xvel * dt,
                y: this.y + this.yvel * dt,
                w: this.w,
                h: this.h
            };
            this.collider.setRect(this.nextMove);
            this.collider.w = 10;
            this.collider.h = 10; 
            this.collider.x += 10;
            this.collider.y += 30;
            this.canMove = true;
        }

        //Colliding with other GameObjects
        for(var i=0;i < this.collidesWith.length;i++) {
            if(RectsColliding(this.collider,this.collidesWith[i])) {
                this.canMove = false;
            }
        }

        //Overlaping with other GameObjects
        for(var n in this.overlaps) {
            var over = this.overlaps[n];
            var collider = over.collider;
            var func = over.callback;
            if(RectsColliding(this.collider, collider)) {
                func.call(this);
            }
        }

        if(this.canMove) {
            this.color = "green";
            this.x = this.nextMove.x;
            this.y = this.nextMove.y;

        } else {
            this.color = "white";
        }


    }

    this.keydown = function(e) {
        this.keysDown[e.keyCode] = true;
    }

    this.keyup = function(e) {
        this.keysDown[e.keyCode] = false;

    }

    this.input = function(e) {
        var xdir = 0;
        var ydir = 0;
        if(this.keysDown[Keys.left]) {
            xdir = -this.speed;
            this.sprite.frame.y = this.sprite.dirs.left;
            this.setDir(xdir,ydir);
        }
        else if(this.keysDown[Keys.right]) {
            xdir = this.speed;
            this.sprite.frame.y = this.sprite.dirs.right;
            this.setDir(xdir,ydir);
        }


        if(this.keysDown[Keys.up]) {
            ydir = -this.speed;
            this.sprite.frame.y = this.sprite.dirs.up;
            this.setDir(xdir,ydir);
        }
        else if(this.keysDown[Keys.down]) {
            ydir = this.speed;
            this.sprite.frame.y = this.sprite.dirs.down;
            this.setDir(xdir,ydir);
        }
    }

    this.stop = function() {
        this.setDir(0,0);
        if(this.sprite !== null) {
            this.sprite.animating = false;
            this.sprite.framecounter = 0;
            this.sprite.frame.x = 72;
        }
    }
}

/* game.js */
var canvas = document.getElementById("display");
var cx = canvas.getContext("2d");
var width = 800, height = 600;
var lastTime;

//Game Vars
var player,other;
var carpet;

function Tile(x,y,w,h,type) {
    this.x = x;
    this.y = y;
    this.w = w;
    this.h = h;
    this.type = type;

    this.draw = function() {
        cx.fillStyle = this.type;
        cx.fillRect(this.x,this.y,this.w, this.h);

    }
}

function TileMap(width,height,tile_width,tile_height) {
    this.width = width;
    this.height = height;
    this.tiles = {
        width: tile_width,
        height: tile_height,
        data: [],
        tileData: []
    };
    this.lookupTable = {
        0: "black",
        1: "red",
        2: "green"
    }

    this.build = function(map) {
        var m_x = map[0].length;
        var m_y = map.length;
        var i=0;
        for(var y=0;y < m_y;y++) {
            for(var x=0;x < m_x;x++) {
                var tile = map[y][x];
                var type = this.lookupTable[tile];
                this.tiles.tileData[i] = new Tile(x * this.tiles.width,y * this.tiles.height,this.tiles.width, this.tiles.height,type);
                i++;
            }
        }        
    }

    this.draw = function(x,y) {
        for(var i in this.tiles.tileData) {
            this.tiles.tileData[i].draw();
        }
    }
}

var tMap;
function setup() {

    //Create player sprite
    player = new GameObject(34,20,30,40);
    player.speed = 60;
    player.createSprite("https://github.com/mouseroot/PhaserGame/raw/master/girl.png",72,96);

    tMap = new TileMap(23,17,25,25);
    var map = [
        [2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2],
        [2,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,2],
        [2,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,2],
        [2,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,2],
        [2,2,2,2,0,0,2,2,2,2,2,2,2,2,2,2,2,0,0,0,0,0,2],
        [2,0,0,0,0,0,0,0,2,0,0,0,0,0,0,0,0,0,0,0,0,0,2],
        [2,0,0,0,0,0,0,0,2,0,0,0,0,0,0,0,0,0,0,0,0,0,2],
        [2,0,0,0,0,0,0,0,2,0,0,0,0,2,0,0,0,0,0,0,0,0,2],
        [2,2,2,2,2,2,2,2,2,2,0,0,2,2,2,2,2,2,2,2,2,2,2],
        [2,2,0,0,0,0,0,0,0,0,0,0,0,2,0,0,0,0,0,0,0,0,2],
        [2,2,0,2,2,0,0,0,0,0,0,0,0,2,0,0,0,0,0,0,0,0,2],
        [2,2,0,2,2,0,0,0,0,0,0,0,0,2,0,0,0,0,0,0,0,0,2],
        [2,2,2,0,0,0,0,0,0,0,0,2,2,2,0,0,0,0,0,0,0,0,2],
        [2,2,0,0,0,0,0,0,0,0,0,0,0,2,0,0,0,0,0,0,0,0,2],
        [2,2,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,2],
        [2,2,2,2,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,2],
        [2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,0,0,0,2,2],
    ];
    tMap.build(map);
    console.log(tMap.tiles.tileData);
    var collideTiles = [];
    for(var i in tMap.tiles.tileData) {
        if(tMap.tiles.tileData[i].type !== "black") {
            collideTiles.push(tMap.tiles.tileData[i]);
        }
    }
    player.collides(collideTiles);


    document.addEventListener("keydown",function(e){
        player.sprite.animating = true;
        player.keydown(e);
        player.input(e);
    },false);
    document.addEventListener("keyup", function(e){
        player.keyup(e);
        player.stop();
    },false);

}

function main() {
    var now = Date.now();
    var deltaTime = (now - lastTime) / 1000.0;

    //Update
    player.update(deltaTime);

    //Draw
    cx.fillStyle = "black";
    cx.fillRect(0,0,width,height);

    tMap.draw(5,5);
    player.draw();


    lastTime = now;
    requestAnimationFrame(main);
}

setup();
main();