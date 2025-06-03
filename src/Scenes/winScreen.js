class WinScreen extends Phaser.Scene {
    constructor() {
        super("winScreen");
        
        this.text = {};  
    }

    preload() {
        this.load.setPath("./assets/");

        this.load.bitmapFont("rocketSquare", "KennyRocketSquare_0.png", "KennyRocketSquare.fnt");
    }

    create() {
        this.restartGame = this.input.keyboard.addKey("R");

        this.add.text(320, 300, "Level complete!", {
            fontFamily: 'Brush, serif',
            fontSize: 100,
            wordWrap: {
                width: 0
            }
        });

        this.add.text(320, 400, "Press R to restart", {
            fontFamily: 'Brush, serif',
            fontSize: 50,
            wordWrap: {
                width: 0
            }
        });
    }

    update(){
        if (Phaser.Input.Keyboard.JustDown(this.restartGame)) {
            this.scene.stop("winScreen");
            this.scene.start("platformerScene");
        }
    }
}