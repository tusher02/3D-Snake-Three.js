/////////////////////// game screen ///////////////////////

var GameScreen = Class.extend({

    init: function (game, scene, camera) {
        this.game = game;
        this.scene = scene;
        this.camera = camera;
        this.level = 1;
        this.lastLevel = 1;
        this.setup();
    },

    setup: function () {
        this.clearLevel();

        this.size = { x_min: -80, x_max: 80, y_min: -80, y_max: 80 };

        this.fruitsToEat = 200;
        this.randomFruitSize = true;
        this.cameraPosition = { x: -120, y: -50, z: 250 };

        this.createWalls();

        this.player = player(this.scene, {
            x: this.size.x_min + 32,
            y: this.size.y_min + 16
        });

        this.addObstacles();

        // Set valid fruit positions
        this.xPositions = [];
        this.yPositions = [];

        for (var x = this.size.x_min + SNAKE.TILE_SIZE; x < this.size.x_max; x = x + SNAKE.TILE_SIZE) {
            this.xPositions.push(x);
        }
        for (var y = this.size.y_min + SNAKE.TILE_SIZE; y < this.size.y_max; y = y + SNAKE.TILE_SIZE) {
            this.yPositions.push(y);
        }

        // create fruit inside
        this.fruit = this.createFruit();
        this.score = 0;
        this.fruitsEaten = 0;
        $('#info').show();
        this.setScore(0);
    },

    addObstacles: function () {

        this.obstacles = [];

        // bottom
        for (var x = -40; x < 40; x = x + SNAKE.TILE_SIZE) {
            var position = { x: x, y: -40 };
            this.obstacles.push(position);
            this.createWall(position);
        }
        // right
        for (var y = -20; y < 20; y = y + SNAKE.TILE_SIZE) {
            var position = { x: 40, y: y };
            this.obstacles.push(position);
            this.createWall(position);
        }
        // left
        for (var y = -40; y < 8; y = y + SNAKE.TILE_SIZE) {
            var position = { x: -52, y: y };
            this.obstacles.push(position);
            this.createWall(position);
        }
        // right eye
        for (var y = 0; y < 36; y = y + SNAKE.TILE_SIZE) {
            var position = { x: 20, y: y };
            this.obstacles.push(position);
            this.createWall(position);
        }
        // left eye
        for (var y = 0; y < 36; y = y + SNAKE.TILE_SIZE) {
            var position = { x: -20, y: y };
            this.obstacles.push(position);
            this.createWall(position);
        }
    },

    // Removes other objects before start the game
    clearLevel: function () {
        var length = this.scene.children.length;
        var removeMe = [];

        for (var i = 0; i < length; i++) {
            var child = this.scene.children[i];

            if (child.name !== 'save-me') {
                removeMe.push(child);
            }
        }
        for (var i = 0; i < removeMe.length; i++) {
            this.scene.remove(removeMe[i]);
        }
    },

    createWall: function (position) {

        var color24 = Math.random() * 255 << 8;

        // width, height, depth
        var geometry = new THREE.CubeGeometry(SNAKE.TILE_SIZE, SNAKE.TILE_SIZE, Math.random() * SNAKE.TILE_SIZE + 2);

        // this material used for simple shading
        var material = new THREE.MeshLambertMaterial({ color: color24 });

        var wallBit = new THREE.Mesh(geometry, material);

        wallBit.position.x = position.x;
        wallBit.position.y = position.y;

        this.scene.add(wallBit);

        return wallBit;
    },

    createWalls: function () {
        // Top and bottom wall
        for (var x = this.size.x_min; x < this.size.x_max; x = x + SNAKE.TILE_SIZE) {
            this.createWall({ x: x, y: this.size.y_max });
            this.createWall({ x: x, y: this.size.y_min });
        }

        // Left and right wall
        for (var y = this.size.y_min; y < this.size.y_max; y = y + SNAKE.TILE_SIZE) {
            this.createWall({ x: this.size.x_min, y: y });
            this.createWall({ x: this.size.x_max, y: y });
        }
    },


    // fruit inside walls
    getRandomPosition: function () {
        var x = this.xPositions[Math.round(Math.random() * (this.xPositions.length - 1))];
        var y = this.yPositions[Math.round(Math.random() * (this.yPositions.length - 1))];

        return { x: x, y: y };
    },


    createFruit: function () {
        // Check obstacle positions
        var pos;
        while (true) {
            pos = this.getRandomPosition();
            if (this.okPosition(pos)) {
                break;
            }
        }

        return sphere({
            scene: this.scene,
            radius: this.randomFruitSize ? Math.random() * 5 + 5 : 2,
            mesh: Math.random() > 0.5 ? true : false,
            x: pos.x,
            y: pos.y
        });
    },

    okPosition: function (pos) {
        var length = this.obstacles.length;
        var obstacle;
        for (var i = 0; i < length; i++) {
            obstacle = this.obstacles[i];
            if (obstacle.x == pos.x && obstacle.y == pos.y) {
                return false;
            }
        }

        return true;
    },

    // Check collisions with outer walls and obstacles.

    checkBounds: function () {
        var pos = this.player.getPosition();

        if (pos.x < (this.size.x_min + SNAKE.TILE_SIZE) || pos.x > (this.size.x_max - SNAKE.TILE_SIZE) ||
            pos.y < (this.size.y_min + SNAKE.TILE_SIZE) || pos.y > this.size.y_max - SNAKE.TILE_SIZE) {

            this.player.die();
        }

        var length = this.obstacles.length;
        var obstacle;
        for (var i = 0; i < length; i++) {
            obstacle = this.obstacles[i];
            if (obstacle.x == pos.x && obstacle.y == pos.y) {
                this.player.die();
            }
        }
    },


    zeroPad: function (num, places) {
        var zero = places - num.toString().length + 1;
        return Array(+(zero > 0 && zero)).join("0") + num;
    },

    setScore: function (score) {
        $('.score').html(this.zeroPad(score, 6));
    },


    updateLevelGoal: function () {
        var current = this.fruitsToEat - this.fruitsEaten;

        if (current == 0) {

            this.levelFinished = true;

            if (this.level == this.lastLevel) {
                $('#done').html('Game clear. Congratulations!').show('slow');
            }
        }
    },

    update: function () {

        this.fruit.update();
        this.player.update();

        if (this.player.collidesWith(this.fruit)) {

            this.score += Math.round(this.fruit.getRadius() * 10);

            this.setScore(this.score);

            this.fruitsEaten++;

            this.player.addBody(2);

            this.scene.remove(this.fruit.getMesh());

            if (!this.levelFinished) {
                this.fruit = this.createFruit();
            }
        }

        this.checkBounds();
    }
});



/////////////////////// start screen ///////////////////////

var IntroScreen = Class.extend({
    init: function (game, scene, camera) {

        $('#intro a').click(function () {
            $('#intro').hide('slow');
            game.setScreen(new GameScreen(game, scene, camera));
        });
    },
});


/////////////////////// player ///////////////////////

var player = function (scene, startPosition) {
    var that = {};

    var UP = 0;
    var DOWN = 1;
    var LEFT = 2;
    var RIGHT = 3;

    var input = playerInput();


    var createSnake = function (length) {
        var head = new THREE.Mesh(geometry, material);

        // Start in the screen facing right
        head.position.x = startPosition.x;
        head.position.y = startPosition.y;
        scene.add(head);
        snake.push(head);

        // Add body parts
        for (var i = 0; i < length; i++) {
            var body = new THREE.Mesh(geometry, material);
            body.position.x = snake[i].position.x - TILE_SIZE;
            body.position.y = snake[i].position.y;
            scene.add(body);
            snake.push(body);
        }
    };

    var pythagorasDistance = function (pos1, pos2) {
        var dx = pos2.x - pos1.x;
        var dy = pos2.y - pos1.y;
        return Math.sqrt(dx * dx + dy * dy);
    };

    // player collides with fruit when distance < fruit radius

    that.collidesWith = function (fruit) {
        return (fruit && pythagorasDistance(snake[0].position, fruit.getPosition()) < fruit.getRadius());
    };


    // Adds a body part at beginning of snake
    // before setting tail to head in update

    that.addBody = function (parts) {
        add = true;
        bodyParts = parts;
        timeBetweenFrames -= 0.002;//snake faster hobe 
    };

    var bodyParts;

    var timeBetweenFrames = 1 / 15;
    var timeSinceLastFrame = timeBetweenFrames;
    var lastFrame = Date.now();


    that.update = function () {

        var thisFrame = Date.now();
        var dt = (thisFrame - lastFrame) / 1000;
        lastFrame = thisFrame;
        timeSinceLastFrame = timeSinceLastFrame - dt;

        if (timeSinceLastFrame <= 0) {
            timeSinceLastFrame = timeBetweenFrames;

            if (dead) {
                return;
            }

            var head = snake[0];

            if (input.buttons[input.BUTTON_UP] && (direction != UP && direction != DOWN)) {
                direction = UP;
            }
            else if (input.buttons[input.BUTTON_DOWN] && (direction != UP && direction != DOWN)) {
                direction = DOWN;
            }
            else if (input.buttons[input.BUTTON_LEFT] && (direction != LEFT && direction != RIGHT)) {
                direction = LEFT;
            }
            else if (input.buttons[input.BUTTON_RIGHT] && (direction != LEFT && direction != RIGHT)) {
                direction = RIGHT;
            }

            if (add) {
                for (var i = 0; i < bodyParts; i++) {
                    var newBit = new THREE.Mesh(geometry, material);
                    if (i == 0) {
                        newBit.scale.set(1.5, 1.5, 1.5);
                        newBit.name = "scaled";
                    }
                    newBit.position.x = head.position.x;
                    newBit.position.y = head.position.y;
                    scene.add(newBit);
                    snake.unshift(newBit);
                    add = false;
                }
            }

            // Put tail at heads position
            var tail = snake.pop();
            if (tail.name === 'scaled') {
                tail.scale.set(1, 1, 1);
                tail.name = '';
            }

            tail.position.x = head.position.x;
            tail.position.y = head.position.y;
            snake.unshift(tail);

            var speed = TILE_SIZE;

            switch (direction) {
                case UP:
                    tail.position.y += speed;
                    break;
                case DOWN:
                    tail.position.y -= speed;
                    break;
                case LEFT:
                    tail.position.x -= speed;
                    break;
                case RIGHT:
                    tail.position.x += speed;
                    break;
            }

            // Check collide with self
            head = snake[0];
            var length = snake.length;
            for (var i = 1; i < length; i++) {
                var test = snake[i];
                if (head.position.x == test.position.x && head.position.y == test.position.y) {
                    that.die();
                }
            }

            // Update snake color
            var time = Date.now() * 0.00005;
            material.color.setHSV(time % 1, 1, 1);
        }
    };

    that.die = function () {
        if (dead) {
            return;
        }

        dead = true;

        $('#gameover').show('slow');
    };

    that.getPosition = function () { return { x: snake[0].position.x, y: snake[0].position.y }; };

    var snake = [];
    var TILE_SIZE = 4;
    var color24 = Math.random();
    var material = new THREE.MeshLambertMaterial({ color: color24 });
    var geometry = new THREE.CubeGeometry(TILE_SIZE, TILE_SIZE, TILE_SIZE);
    var direction = RIGHT;
    var add = false;
    var dead = false;

    createSnake(4);

    return that;
};


/////////////////////// player input ///////////////////////

var playerInput = function () {
    var that = {};

    that.buttons = [false, false, false, false];
    oldButtons = [false, false, false, false];

    var KEY_UP = 38;
    var KEY_DOWN = 40;
    var KEY_LEFT = 37;
    var KEY_RIGHT = 39;

    that.BUTTON_LEFT = 0;
    that.BUTTON_RIGHT = 1;
    that.BUTTON_UP = 2;
    that.BUTTON_DOWN = 3;

    var set = function (keynr, pressed) {
        var button = -1;

        if (keynr === KEY_UP) { button = that.BUTTON_UP; }
        if (keynr === KEY_DOWN) { button = that.BUTTON_DOWN; }
        if (keynr === KEY_LEFT) { button = that.BUTTON_LEFT; }
        if (keynr === KEY_RIGHT) { button = that.BUTTON_RIGHT; }

        if (button != -1) {
            that.buttons[button] = pressed;
        }
    }

    document.onkeydown = function (event) {
        var keynr = event.which;
        set(keynr, true);
    }

    document.onkeyup = function (event) {
        var keynr = event.which;
        set(keynr, false);
    }

    that.update = function () {
        for (var i = 0; i < that.buttons.length; i++) {
            oldButtons[i] = that.buttons[i];
        }
    }

    return that;
}

/////////////////////// game environment ///////////////////////

var startGame = function () {
    var that = {};

    var WIDTH = window.innerWidth - 5;
    var HEIGHT = window.innerHeight - 5;

    var renderer = new THREE.WebGLRenderer({
        antialias: true	// get smoother output
    });
    renderer.setSize(WIDTH, HEIGHT);
    $('#container').append(renderer.domElement);

    var scene = new THREE.Scene();

    var VIEW_ANGLE = 45,
        ASPECT = WIDTH / HEIGHT,
        NEAR = 0.1,
        FAR = 10000;
    var CAMERA_POSITION = 250;
    var TILE_SIZE = 4;

    var camera =
        new THREE.PerspectiveCamera(
            VIEW_ANGLE,
            ASPECT,
            NEAR,
            FAR);
    camera.name = "save-me";

    // change camera position from here
    camera.position.x = -50;
    camera.position.y = 169;
    camera.position.z = CAMERA_POSITION;

    camera.lookAt(scene.position);
    scene.add(camera);

    SNAKE = {};
    SNAKE.TILE_SIZE = 4;
    SNAKE.CAMERA_DEBUG = true;


    // Create point light. Obstacle will be black otherwise
    var pointLight = new THREE.PointLight(0xFFFFFF);
    pointLight.name = "save-me";

    pointLight.position.x = 10;
    pointLight.position.y = 50;
    pointLight.position.z = 130;

    scene.add(pointLight);

    $('#intro').show();

    // Camera movement 
    if (SNAKE.CAMERA_DEBUG) {
        var mouseX;
        var mouseY;
        var mouseWheel = 0;
        var updateCameraPosition = false;
        var updateCameraZoom = false;

        $('canvas').mousemove(function () {
            mouseX = event.clientX - (WIDTH / 2);
            mouseY = event.clientY - (HEIGHT / 2);
        });

        $('canvas').mousedown(function () {
            document.body.style.cursor = "move";
            updateCameraPosition = true;
            return false;  // Disable text selection on the canvas
        });

        $('canvas').mouseup(function () {
            document.body.style.cursor = "default";
            updateCameraPosition = false;
        });
    }

    that.setScreen = function (newScreen) {
        screen = newScreen;
    };

    $('#gameover a').click(function () {
        $('#gameover').hide('slow');
        that.setScreen(new GameScreen(that, scene, camera));
    });

    var update = function () {
        requestAnimationFrame(update);

        screen.update();

        if (SNAKE.CAMERA_DEBUG) {
            if (updateCameraPosition) {
                camera.position.x += (mouseX - camera.position.x) * 0.01;
                camera.position.y += (- mouseY - camera.position.y) * 0.01;
                camera.lookAt(scene.position);
            }

            // Zoom camera
            if (updateCameraZoom) {
                camera.position.z = CAMERA_POSITION + mouseWheel;
            }
        }

        renderer.render(scene, camera);
    };

    var screen = new IntroScreen(that, scene, camera);
    requestAnimationFrame(update);

    return that;
};

$(document).ready(function () {
    if (!Detector.webgl) {
        Detector.addGetWebGLMessage();
        return;
    }

    startGame();
});


/////////////////////// sphere ///////////////////////

var sphere = function (options) {
    var that = {};
    var scene = options.scene;
    var r = options.radius;
    var mesh = options.mesh;
    var x = options.x;
    var y = options.y;

    var createSphere = function () {
        var radius = r;
        var segments = 60;
        var rings = 60;
        var color24 = Math.random() * 255 << 16 | Math.random() * 255 << 8 | Math.random() * 255;


        var sphereMaterial =
            new THREE.MeshLambertMaterial({
                color: color24,
                wireframe: mesh
            });

        var sphere = new THREE.Mesh(
            new THREE.SphereGeometry(
                radius,
                segments,
                rings),
            sphereMaterial);

        sphere.position.x = x;
        sphere.position.y = y;
        sphere.radius = radius;

        scene.add(sphere);

        return sphere;
    };

    that.update = function () {

    };

    that.getPosition = function () { return sphere.position; }
    that.getRadius = function () { return sphere.radius; }
    that.getMesh = function () { return sphere; }

    var sphere = createSphere();

    return that;
};

