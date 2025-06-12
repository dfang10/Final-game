class Platformer extends Phaser.Scene {
    constructor() {
        super("platformerScene");
    }

    init() {
        // variables and settings
        this.ACCELERATION = 400;
        this.DRAG = 1200;    // DRAG < ACCELERATION = icy slide
        this.BRAKE_DRAG = 1200;
        this.physics.world.gravity.y = 1500;
        this.JUMP_VELOCITY = -600;
        this.PARTICLE_VELOCITY = 50;
        this.SCALE = 2.0;
    }

    preload(){
        this.load.setPath("./assets/");
        this.load.audio("coinCollect", "powerUp4.ogg");
        this.load.audio("playerDamage", "zapThreeToneDown.ogg");
        this.load.audio("playerMove", "footstep_grass_001.ogg");
        this.load.audio("playerJump", "phaserUp2.ogg");
        this.load.audio("winJingle", "jingles_HIT11.ogg");

    }

    create() {
        this.map = this.add.tilemap("Design", 18, 18, 4320, 50); // Load the map

        // Add a tileset to the map
        // First parameter: name we gave the tileset in Tiled
        // Second parameter: key for the tilesheet (from this.load.image in Load.js)
        this.tileset = this.map.addTilesetImage("Pixel_Platformer", "tilemap_tiles");

        // Create a layer
        this.groundLayer = this.map.createLayer("Ground-n-Platforms", this.tileset, 0, 0);
        this.platformLayer = this.map.createLayer("Platforms", this.tileset, 0, 0);
        this.endingLayer = this.map.createLayer("Win", this.tileset, 0, 0);
        this.waterLayer = this.map.createLayer("Water", this.tileset, 0, 0);
        this.decoLayer = this.map.createLayer("Deco", this.tileset, 0, 0);
        this.spikesLayer = this.map.createLayer("Spikes", this.tileset, 0, 0);
        
    
        // Make it collidable
        this.groundLayer.setCollisionByProperty({
            collides: true
        });
        this.platformLayer.setCollisionByProperty({
            collides: true
        });
        this.endingLayer.setCollisionByProperty({
             collides: true
        });
        this.waterLayer.setCollisionByProperty({
            collides: true
        });
        this.spikesLayer.setCollisionByProperty({
            collides: true
        })
        this.playerSpawn = {
            x: 20,
            y: 600
        };

        // Find coins in the "Objects" layer in Phaser
        // Look for them by finding objects with the name "coin"
        // Assign the coin texture from the tilemap_sheet sprite sheet
        // Phaser docs:
        // https://newdocs.phaser.io/docs/3.80.0/focus/Phaser.Tilemaps.Tilemap-createFromObjects

        this.coins = this.map.createFromObjects("Objects", {
            name: "coin",
            key: "tilemap_sheet",
            frame: 151
        });

        // Since createFromObjects returns an array of regular Sprites, we need to convert 
        // them into Arcade Physics sprites (STATIC_BODY, so they don't move) 
        this.physics.world.enable(this.coins, Phaser.Physics.Arcade.STATIC_BODY);

        // Create a Phaser group out of the array this.coins
        // This will be used for collision detection below.
        this.coinGroup = this.add.group(this.coins);
        

        // set up player avatar
        my.sprite.player = this.physics.add.sprite(this.playerSpawn.x, this.playerSpawn.y, "platformer_characters", "tile_0000.png");
        my.sprite.player.setCollideWorldBounds(true);

        my.sprite.player.setDragX(this.DRAG);

        // Enable collision handling
        this.physics.add.collider(my.sprite.player, this.groundLayer);
        this.physics.add.collider(my.sprite.player, this.platformLayer);
        this.physics.add.collider(my.sprite.player, this.endingLayer, () =>{
             this.endCollide();
        });
        this.physics.add.collider(my.sprite.player, this.waterLayer, () =>{
            this.waterCollide();
        });
        this.physics.add.collider(my.sprite.player, this.spikesLayer, () =>{
            this.spikeCollide();
        }); 

        // Needed for some of the layers, player phases through if not included
        this.platformLayer.setCollisionByExclusion([-1]);
        this.endingLayer.setCollisionByExclusion([-1]);
        this.waterLayer.setCollisionByExclusion([-1]);
        this.spikesLayer.setCollisionByExclusion([-1]);


        my.vfx.coinCollect = this.add.particles(0, 0, "kenny-particles", { // Coin collect animation
            frame: ['star_07.png', 'star_08.png'],
            scale: {start: 0.03, end: 0.1},
            lifespan: 350,
            alpha: {start: 1, end: 0.1},
        });

        my.vfx.coinCollect.stop();

        // Handle collision detection with coins
        this.coinsCollected = 0;
        this.coinText = this.add.text(1500/4, 950/4, String(this.coinsCollected), { fontFamily: '"Lucida Console", "Courier New", monospace' }); // Score board for coin
        this.coinText.setScrollFactor(0);

        this.physics.add.overlap(my.sprite.player, this.coinGroup, (obj1, obj2) => { // Player collides with coin, play animation and add score
            obj2.destroy();
            my.vfx.coinCollect.setPosition(obj2.x, obj2.y);
            my.vfx.coinCollect.start();
            my.vfx.coinCollect.explode();
            this.sound.play("coinCollect");
            this.coinsCollected += 1;
            this.coinText.text = String(this.coinsCollected);
        });

        // set up Phaser-provided cursor key input
        cursors = this.input.keyboard.createCursorKeys();

        this.rKey = this.input.keyboard.addKey('R');
        this.lKey = this.input.keyboard.addKey('L'); // skip to next level

        // debug key listener (assigned to D key)
        this.input.keyboard.on('keydown-D', () => {
            this.physics.world.drawDebug = this.physics.world.drawDebug ? false : true
            this.physics.world.debugGraphic.clear()
        }, this);

        my.vfx.walking = this.add.particles(0, 0, "kenny-particles", { // Player moving animation
            frame: ['spark_01.png', 'spark_02.png'],
            random: true,
            scale: {start: 0.01, end: 0.04},
            //maxAliveParticles: 8,
            lifespan: 350,
            //gravityY: -400,
            alpha: {start: 1, end: 0.1}, 
            blendMode: 'ADD'
        });

        my.vfx.walking.stop();

        my.vfx.jumping = this.add.particles(0,0, "kenny-particles", { // Player jumping animation
            frame: ['spark_05.png'],
            scale: {start: 0.03, end: 0.05},
            lifespan: 350,
            alpha: {start: 1, end: 0.1},
            blendMode: 'ADD'
        });

        my.vfx.jumping.stop();
        

        // Camera physics
        this.physics.world.setBounds(0, 0, 4320, 900);
        this.cameras.main.setBounds(0, 0, this.map.widthInPixels, this.map.heightInPixels);
        this.cameras.main.startFollow(my.sprite.player); 
        this.cameras.main.setDeadzone(50, 50);
        this.cameras.main.setZoom(this.SCALE);
    }

    waterCollide() { // Player touches water, player is sent back to spawn and sound is played
        my.sprite.player.setPosition(this.playerSpawn.x, this.playerSpawn.y);
        this.sound.play("playerDamage");
        this.coinsCollected -=1;
        this.coinText.text = String(this.coinsCollected);
    }

    spikeCollide() { // Player touches spikes, player is sent back to spawn and sound is played
        my.sprite.player.setPosition(this.playerSpawn.x, this.playerSpawn.y);
        this.sound.play("playerDamage");
        this.coinsCollected -=1;
        this.coinText.text = String(this.coinsCollected);
    }

    endCollide() { // Player collides with ending flag, go to next scene
        this.sound.play("winJingle");
        this.scene.start("level2");
    }
    update() {
        if (cursors.left.isDown || cursors.right.isDown){ // Play sound for when player is moving left or right
            if (!this.playerMoving && my.sprite.player.body.blocked.down){
                this.playerMoving = true;
                this.time.delayedCall(300, () => {
                    this.sound.play("playerMove");
                    this.playerMoving = false;
                });
            }
        }
        if(cursors.left.isDown) { // Player moving left
            const vx = my.sprite.player.body.velocity.x;
            if (vx > 0) {          
                my.sprite.player.setAccelerationX(0);
                my.sprite.player.setDragX(this.DRAG);
            } else { 
                my.sprite.player.setDragX(0);
                my.sprite.player.setAccelerationX(-this.ACCELERATION);
            }
            my.sprite.player.resetFlip();
            my.sprite.player.anims.play('walk', true);
            my.vfx.walking.startFollow(my.sprite.player, my.sprite.player.displayWidth/2-10, my.sprite.player.displayHeight/2-5, false);

            my.vfx.walking.setParticleSpeed(this.PARTICLE_VELOCITY, 0);

            // Only play smoke effect if touching the ground

            if (my.sprite.player.body.blocked.down) {

                my.vfx.walking.start();

            }

        } else if(cursors.right.isDown) { // Player moving right
            const vx = my.sprite.player.body.velocity.x;
            if (vx < 0) { 
                my.sprite.player.setAccelerationX(0);
                my.sprite.player.setDragX(this.DRAG);
            } else { 
                my.sprite.player.setDragX(0);
                my.sprite.player.setAccelerationX(this.ACCELERATION);
            }
            my.sprite.player.setFlip(true, false);
            my.sprite.player.anims.play('walk', true);
            my.vfx.walking.startFollow(my.sprite.player, my.sprite.player.displayWidth/2-10, my.sprite.player.displayHeight/2-5, false);

            my.vfx.walking.setParticleSpeed(this.PARTICLE_VELOCITY, 0);

            // Only play smoke effect if touching the ground

            if (my.sprite.player.body.blocked.down) {

                my.vfx.walking.start();

            }

        } else {
            // Set acceleration to 0 and have DRAG take over
            my.sprite.player.setAccelerationX(0);
            my.sprite.player.setDragX(this.DRAG);
            my.sprite.player.anims.play('idle');
            my.vfx.walking.stop();
        }

        // player jump
        // note that we need body.blocked rather than body.touching b/c the former applies to tilemap tiles and the latter to the "ground"
        if(!my.sprite.player.body.blocked.down) {
            my.sprite.player.anims.play('jump');
        }
        if(my.sprite.player.body.blocked.down && Phaser.Input.Keyboard.JustDown(cursors.up)) {
            my.sprite.player.body.setVelocityY(this.JUMP_VELOCITY);
            this.sound.play("playerJump");
            my.vfx.jumping.startFollow(my.sprite.player, my.sprite.player.displayWidth/2-10, my.sprite.player.displayHeight/2-5, false);
            my.vfx.jumping.setParticleSpeed(this.PARTICLE_VELOCITY, 0);
            my.vfx.jumping.explode(10);
        }

        if (my.sprite.player.body.blocked.down) {
            my.vfx.jumping.stop();
        }

        if(Phaser.Input.Keyboard.JustDown(this.rKey)) {
            this.scene.restart();
        }
        if(Phaser.Input.Keyboard.JustDown(this.lKey)){
            this.scene.start("level2");
        }
    }
}