class Title extends Phaser.Scene {
    constructor() {
        super("titleScene");
    }

    preload(){
    }

    create() {
        this.map = this.add.tilemap("Title", 18, 18, 30, 20); // Load title map

        this.startGame = this.input.keyboard.addKey("R"); // Start game
        this.credits = this.input.keyboard.addKey("H"); // Credits

        this.add.text(180, 250, "Outta Here!", { // Add title
            fontFamily: '"Lucida Console", "Courier New", monospace',
            fontSize: 50,
            wordWrap: {
                width: 0
            }
        });
        this.add.text(200, 350, "Press R to start the game!", { // Add text to start game
            fontFamily: '"Lucida Console", "Courier New", monospace',
            fontSize: 30,
            wordWrap: {
                width: 0
            }
        });
        this.add.text(200, 400, "Press H for credits", { // Add text to view credits
            fontFamily: '"Lucida Console", "Courier New", monospace',
            fontSize: 30,
            wordWrap: {
                width: 0
            }
        });

        // Add a tileset to the map
        // First parameter: name we gave the tileset in Tiled
        // Second parameter: key for the tilesheet (from this.load.image in Load.js)
        this.tileset = this.map.addTilesetImage("Pixel_Platformer", "tilemap_tiles");

        // Create a layer
        this.groundLayer = this.map.createLayer("Ground-n-Platforms", this.tileset, 0, 0);
    }
    update() {
        if (Phaser.Input.Keyboard.JustDown(this.startGame)) { // Start first level
            this.scene.stop("Title");
            this.scene.start("platformerScene");
        }
        else if (Phaser.Input.Keyboard.JustDown(this.credits)){ // Start credits scene
            this.scene.stop("Title");
            this.scene.start("credits");
        }
    }
}