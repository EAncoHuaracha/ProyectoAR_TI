class OxExperience {

    LOGO = "Onirix_logo";

    // Información base sobre el juego
    CONFIG = {
        time: 30,
        chunks: [
            { chunk: 5, points: 50 },
            { chunk: 100, points: 50 }
        ],
        defaultPoints: 50,
        scorable_element_name: 'onirix',
        logos: 5,
        baseLogos: 5,
        bckSound: 'game_music'
    }

    // Constantes de nombres de animaciones
    onirix = "Onirix_";
    destruction = "_destruction";
    animation = "Animation";

    // Puntos de cada logo

    pointsTable = null;

    //Configuración del tiempo de juego
    timeInterval = null;

    // Indica si el juego está en progreso
    inProgress = false;

    // Tiempo actual
    time = 0;

    // Número de elementos atrapados
    catched = 0;

    // Puntos acumulados
    score = 0;

    // Pares de colores
    colors_pairs = [];

    // Color seleccionado primero
    delete_color = '';

    // Color seleccionado primero
    delete_color2 = '';

    // Identificador de escena
    currentScene = {
        oid: '',
        name: ''
    }

    // Indica qué colores fueron seleccionados
    hits = [];

    /**
     * Constructor
     * Inicializa el embedSDK y los puntos de la tabla
     * permite escuchar eventos y controlar el contenido de la escena
     * 
     * @param   embedsdk
     */
    constructor(embedSDK) {
        this.embedSDK = embedSDK;
        if (this.CONFIG.chunks && 0 < this.CONFIG.chunks.length) {
            this.pointsTable = this.CONFIG.chunks.map(chunk => {
                return {
                    seconds: Math.floor(chunk.chunk * (this.CONFIG.time) / 100),
                    points: chunk.points
                }
            });
            this.pointsTable.sort((a, b) => a.seconds - b.seconds);
        } else {
            this.pointsTable = [{ seconds: this.CONFIG.time, points: this.CONFIG.defaultPoints }];
        }
    }

    /**
     * Establece el número de logos e información sobre la escena
     * 
     * @param info
     */
    setParams(params) {
        this.currentScene.oid = params.oid;
        this.currentScene.name = params.name;
        if (params.elements) {
            this.CONFIG.logos = params.elements.filter(element => element.name.startsWith(this.CONFIG.scorable_element_name)).length;
        }
    }

    /**
     * Lógica sobre el clic en un elemento
     * 
     * @param info
     */
    handleElementClick(params) {

        if (params.name === this.LOGO) {
            this.onHideMsg();
            if (!this.inProgress) {
                this.start();
            }
        }
        if (params.name.startsWith(this.CONFIG.scorable_element_name)) {
            this.logoCatched(params.name, params.oid);
        }

        if (this.delete_color.length > 0 && this.delete_color2.length > 0) {
            let animacion = '';
            let animacion2 = '';
            let c1 = this.delete_color.split("_");
            if (c1.length > 2) {
                animacion = this.onirix + c1[1] + this.destruction + "_1";
            } else {
                animacion = this.onirix + c1[1] + this.destruction;
            }


            let c2 = this.delete_color2.split("_");
            if (c2.length > 2) {
                animacion2 = this.onirix + c2[1] + this.destruction + "_1";
            } else {
                animacion2 = this.onirix + c2[1] + this.destruction;
            }

            if (animacion.length > 0 && animacion2.length > 0) {

                this.embedSDK.enable(animacion);
                this.embedSDK.playAnimation(animacion, this.animation, false);
                this.embedSDK.disable(this.delete_color);
                this.embedSDK.disable(animacion, 1);

                this.embedSDK.enable(animacion2);
                this.embedSDK.playAnimation(animacion2, this.animation, false);
                this.embedSDK.disable(this.delete_color2);
                this.embedSDK.disable(animacion2, 1);

            }

            this.delete_color = '';
            this.delete_color2 = '';
        }

    }

    /**
     * Establece valores iniciales y comienza el juego
     * 
     * @internal
     */
    start() {
        this.inProgress = true;
        this.time = this.CONFIG.time;
        this.inProgress = true;
        this.score = 0;
        this.catched = 0;
        this.hits = [];
        if (this.scoreChange) {
            this.scoreChange(this.score);
        }
        if (this.onTimeChange) {
            this.onTimeChange(this.time);
        }
        this.timeInterval = window.setInterval(() => {
            this.time--;
            if (this.onTimeChange) {
                this.onTimeChange(this.time)
            }
            if (0 >= this.time) {
                this.inProgress = false;
                if (this.onGameEnd) {
                    this.onGameEnd(this.score);
                    this.embedSDK.pause(this.CONFIG.bckSound);
                }
                window.clearInterval(this.timeInterval);
            }
        }, 1000);
        if (this.onStart) {
            this.onStart();
        }
    };

    /**
     * Indica la cantidad de puntos necesarios para sumar
     * 
     * @internal
     * @param   tiempo para calcular los puntos
     * @return  cantidad de puntos
     */
    getPoints(currentTime) {
        const elapsedTime = this.CONFIG.time - currentTime;
        const points = this.pointsTable.find(chunk => chunk.seconds > elapsedTime);
        if (points) {
            return points.points;
        } else {
            return this.CONFIG.defaultPoints;
        }
    }

    /**
     * Aumenta la puntuación en uno y el número de logos clicados
     * 
     * @internal
     * @param
     */
    logoCatched(elementName) {
        let value = elementName.split("_")
        if (this.inProgress && 0 < this.time) {
            this.colors_pairs.push(elementName)
            if (this.colors_pairs.length == 2) {
                if (this.colors_pairs.every(word => word.includes(value[1]))) {
                    this.hits.push(value[1]);
                    const points = this.getPoints(this.time);
                    this.score += points;
                    this.catched++;
                } else {
                    const points = this.getPoints(this.time);
                    if (this.score > 0) {
                        this.score -= points;
                    }
                    this.catched++;
                    this.catched++;
                    this.delete_color = this.colors_pairs[0];
                    this.delete_color2 = this.colors_pairs[1];

                    if (this.delete_color.substr(-1) != "1") {
                        this.delete_color = this.delete_color + "_1";
                    } else {
                        this.delete_color = this.delete_color.substr(0, this.delete_color.length - 2);
                    }

                    if (this.delete_color2.substr(-1) != "1") {
                        this.delete_color2 = this.delete_color2 + "_1";
                    } else {
                        this.delete_color2 = this.delete_color2.substr(0, this.delete_color2.length - 2);
                    }
                }

                this.onScoreChange(this.score, this.catched);

                if (this.catched >= this.CONFIG.baseLogos) {
                    this.inProgress = false;
                    if (this.onGameEnd) {
                        this.onGameEnd(this.score);
                        this.embedSDK.pause(this.CONFIG.bckSound);
                    }
                    window.clearInterval(this.timeInterval);
                }
                this.colors_pairs = [];

            }

        }
    };

    /**
     * Aciertos
     * 
     * @return
     */
    getHits() {
        return this.hits;
    }

    /**
     * logos
     * 
     * @return
     */
    getLogos() {
        return this.CONFIG.baseLogos;
    }

    /**
     * Tiempo total
     * 
     * @return  
     */
    getTime() {
        return this.CONFIG.time;
    }

}

/**
 * Se encarga de manejar la interacción con el código HTML y CSS personalizado.
 */
class OxExperienceUI {

    CARD1 = "card1";
    CARD2 = "card2";
    CARD3 = "card3";
    BUTTON_CARD1 = "button_card1";
    BUTTON_CARD2 = "button_card2";
    BUTTON_CARD3 = "button_card3";
    SKIPS = "ox-onboarding-button-skip";
    SCREEN = "ox-onboarding";
    TOP_CATCHED = "ox-game-top__catched";
    GAME_SCORE = "ox-game-score";
    CLOCK_SECONDS = "ox-game-clock__seconds";
    CLOCK = "ox-game-clock";
    GO_HOME = "ox-button--go_home";
    SHARE = "share-button";
    END_GAME_POINTS = "ox-end__game-points";
    END = "ox-end";
    END_LOGO = "ox-end-logo";
    END_LOGO2 = "ox-end-logo2";
    CARD_HEADER = "card-header";
    TEXT_STANDAR = "text_standar";
    SUCCESS_STANDAR = "succes_standar";
    FAIL_STANDAR = "fail_standar";
    GAME_TOP = 'ox-game-top';

    TEXT_PURPLE = "text_purple";
    SUCCESS_PURPLE = "succes_purple";
    FAIL_PURPLE = "fail_purple";

    TEXT_ORANGE = "text_orange";
    SUCCESS_ORANGE = "succes_orange";
    FAIL_ORANGE = "fail_orange";

    TEXT_BLUE = "text_blue";
    SUCCESS_BLUE = "succes_blue";
    FAIL_BLUE = "fail_blue";

    TEXT_GOLD = "text_gold";
    SUCCESS_GOLD = "succes_gold";
    FAIL_GOLD = "fail_gold";

    GAME_MSG = "ox-game-msg";

    CLOCK_RUNNING = "ox-game-clock--running";
    CLOCK_ENDING = "ox-game-clock--ending";

    ONBOARDING = "ox-onboarding";

    OX_AUDIO = 'ox-audio';
    CLOSE = 'ox-audio__close';

    CONTEXT_MENU = "webar-context-menu";
    CONTEXT_BUTTON = "webar-context-button";


    text_color = "#211f1f";

    shareData = {
        title: 'Proyecto_TT',
        text: 'Empareja colores',
        url: 'https://studio.onirix.com/exp/e28bvL'
    }

    /**
     * Indica el tiempo que el mensaje estará disponible
     */
    availableTime = 3000;

    /**
     * Reinicia los valores
     */
    reset() {
        document.getElementById(this.END).style.display = "none";
        document.getElementById(this.SCREEN).style.display = "none";
        const clock = document.getElementById(this.CLOCK);
        clock.classList.remove(this.CLOCK_ENDING);
        clock.style.display = "none";
        window.clearInterval(this.timeInterval);
        this.changeScore(0, 0);
        this.updateTime(30);
    }


    /**
     * Inicializa la interfaz de usuario y sus acciones
     */
    initUi() {
        document.getElementById(this.CONTEXT_BUTTON).addEventListener("click", () => {
            document.getElementById(this.CONTEXT_MENU).addEventListener("click", () => {
                this.reset();
            })
        })
        document.getElementById(this.SCREEN).style.display = "flex";
        document.getElementById(this.CARD1).style.display = "flex";
        document.getElementById(this.GAME_TOP).style.display = 'flex';
        document.getElementById(this.GAME_MSG).style.display = 'flex';
        document.getElementById(this.CLOCK).style.display = 'flex';
        document.getElementById(this.GO_HOME).onclick = () => document.location.reload();
        document.getElementById(this.GO_HOME).addEventListener("click", () => {
            window.reload();
        });

        document.getElementById(this.SHARE).addEventListener("click", () => {
            navigator.share(this.shareData)
        });

        document.getElementById(this.BUTTON_CARD1).addEventListener("click", () => {
            document.getElementById(this.CARD1).style.display = "none";
            document.getElementById(this.CARD2).style.display = "flex";
        });

        document.getElementById(this.BUTTON_CARD2).addEventListener("click", () => {
            document.getElementById(this.CARD2).style.display = "none";
            document.getElementById(this.CARD3).style.display = "flex";
        });

        document.getElementById(this.BUTTON_CARD3).addEventListener("click", () => {
            document.getElementById(this.CARD3).style.display = "none";
            document.getElementById(this.SCREEN).style.display = "none";
        });

        const skips = Object.values(document.getElementsByClassName(this.SKIPS));
        skips.forEach(skip => {
            skip.addEventListener("click", () => {
                document.getElementById(this.CARD1).style.display = "none";
                document.getElementById(this.CARD2).style.display = "none";
                document.getElementById(this.CARD3).style.display = "none";
                document.getElementById(this.SCREEN).style.display = "none";
            });
        })
        document.getElementById(this.ONBOARDING).style.display = 'flex';
    }



    /**
     * Muestra la pantalla final con la puntuación obtenida
     * 
     * @param  
     */
    showOnirixEnd(points) {
        const hits = this.onGetHits();
        document.getElementById(this.GAME_TOP).style.display = 'none';
        document.getElementById(this.END_GAME_POINTS).innerHTML = ` +${points}pts`;
        document.getElementById(this.END).style.display = 'flex';

        if (points < 100) {
            document.getElementById(this.END_LOGO).style.display = "none";
            document.getElementById(this.END_LOGO2).style.display = "flex";
            document.getElementById(this.CARD_HEADER).innerHTML = "¿Quieres intentarlo de nuevo?";
        }

        if (hits.some(word => word.includes("standar"))) {
            document.getElementById(this.TEXT_STANDAR).innerHTML = "+50";
            document.getElementById(this.TEXT_STANDAR).style.color = this.text_color;
            document.getElementById(this.SUCCESS_STANDAR).style.display = "inline";
            document.getElementById(this.FAIL_STANDAR).style.display = "none";
        } else {
            document.getElementById(this.TEXT_STANDAR).innerHTML = "-25";
            document.getElementById(this.TEXT_STANDAR).style.color = "#b6b1b9";
            document.getElementById(this.SUCCESS_STANDAR).style.display = "none";
            document.getElementById(this.FAIL_STANDAR).style.display = "inline";
        }

        if (hits.some(word => word.includes("purple"))) {
            document.getElementById(this.TEXT_PURPLE).innerHTML = "+50";
            document.getElementById(this.TEXT_PURPLE).style.color = this.text_color;
            document.getElementById(this.SUCCESS_PURPLE).style.display = "inline";
            document.getElementById(this.FAIL_PURPLE).style.display = "none";
        } else {
            document.getElementById(this.TEXT_PURPLE).innerHTML = "-25";
            document.getElementById(this.TEXT_PURPLE).style.color = "#b6b1b9";
            document.getElementById(this.SUCCESS_PURPLE).style.display = "none";
            document.getElementById(this.FAIL_PURPLE).style.display = "inline";
        }

        if (hits.some(word => word.includes("orange"))) {
            document.getElementById(this.TEXT_ORANGE).innerHTML = "+50";
            document.getElementById(this.TEXT_ORANGE).style.color = this.text_color;
            document.getElementById(this.SUCCESS_ORANGE).style.display = "inline";
            document.getElementById(this.FAIL_ORANGE).style.display = "none";
        } else {
            document.getElementById(this.TEXT_ORANGE).innerHTML = "-25";
            document.getElementById(this.TEXT_ORANGE).style.color = "#b6b1b9";
            document.getElementById(this.SUCCESS_ORANGE).style.display = "none";
            document.getElementById(this.FAIL_ORANGE).style.display = "inline";
        }

        if (hits.some(word => word.includes("blue"))) {
            document.getElementById(this.TEXT_BLUE).innerHTML = "+50";
            document.getElementById(this.TEXT_BLUE).style.color = this.text_color;
            document.getElementById(this.SUCCESS_BLUE).style.display = "inline";
            document.getElementById(this.FAIL_BLUE).style.display = "none";
        } else {
            document.getElementById(this.TEXT_BLUE).innerHTML = "-25";
            document.getElementById(this.TEXT_BLUE).style.color = "#b6b1b9";
            document.getElementById(this.SUCCESS_BLUE).style.display = "none";
            document.getElementById(this.FAIL_BLUE).style.display = "inline";
        }

        if (hits.some(word => word.includes("gold"))) {
            document.getElementById(this.TEXT_GOLD).innerHTML = "+50";
            document.getElementById(this.TEXT_GOLD).style.color = this.text_color;
            document.getElementById(this.SUCCESS_GOLD).style.display = "inline";
            document.getElementById(this.FAIL_GOLD).style.display = "none";
        } else {
            document.getElementById(this.TEXT_GOLD).innerHTML = "-25";
            document.getElementById(this.TEXT_GOLD).style.color = "#b6b1b9";
            document.getElementById(this.SUCCESS_GOLD).style.display = "none";
            document.getElementById(this.FAIL_GOLD).style.display = "inline";
        }

    }

    /**
     * Muestra el reloj 
     */
    showMainScreen() {
        document.getElementById(this.GAME_MSG).style.display = 'none';
        document.getElementById(this.CLOCK).classList.add(this.CLOCK_RUNNING)
    }

    /**
     * Cambia el tiempo mostrado en la pantalla
     * 
     * @param 
     */
    updateTime(currentTime) {
        document.getElementById(this.CLOCK_SECONDS).innerHTML = `${currentTime}s`;
        if (11 > currentTime) {
            const clock = document.getElementById(this.CLOCK);
            clock.classList.remove(this.CLOCK_RUNNING);
            clock.classList.add(this.CLOCK_ENDING);
        }
    }

    /**
     * Cambia la puntuación mostrada en la pantalla
     * 
     * @param   number of points
     * @param   number of logos catched
     */
    changeScore(currentScore, currentCatched) {
        document.getElementById(this.GAME_SCORE).innerHTML = `${currentScore} puntos`;
        document.getElementById(this.TOP_CATCHED).innerHTML = `${currentCatched}/${this.onGetLogos()}`;
    }

    /**
     * Ocultar el mensaje superior
     */
    hideMsg() {
        document.getElementById(this.GAME_MSG).style.display = "none";
    }

    /**
     * Muestra el mensaje de audio
     */
    toggleAudioToast() {
        document.getElementById(this.OX_AUDIO).style.display = 'block';
        setTimeout(() => {
            document.getElementById(this.OX_AUDIO).style.display = 'none';
        }, this.availableTime);

        document.getElementById(this.CLOSE).addEventListener('click', () => {
            document.getElementById(this.OX_AUDIO).style.display = 'none';
        })
    }
}

import OnirixEmbedSDK from "https://unpkg.com/@onirix/embed-sdk@1.2.3/dist/ox-embed-sdk.esm.js";
const embedSDK = new OnirixEmbedSDK();
await embedSDK.connect();
const oxExperience = new OxExperience(embedSDK);
const oxExperienceUi = new OxExperienceUI();

embedSDK.subscribe(OnirixEmbedSDK.Events.SCENE_LOAD_END, (params) => {
    oxExperience.setParams(params);
    oxExperienceUi.initUi();
    oxExperienceUi.toggleAudioToast();
});

embedSDK.subscribe(OnirixEmbedSDK.Events.ELEMENT_CLICK, (params) => {
    oxExperience.handleElementClick(params);
});

oxExperience.onGameEnd = function (points) {
    oxExperienceUi.showOnirixEnd(points);
}

oxExperience.onStart = function () {
    oxExperienceUi.showMainScreen();
}

oxExperience.onTimeChange = function (currentTime) {
    oxExperienceUi.updateTime(currentTime);

}

/**
 * 
 * @param   actual pointes
 * @param   number of logos catched
 */
oxExperience.onScoreChange = function (currentScore, currentCatched) {
    oxExperienceUi.changeScore(currentScore, currentCatched);

}

oxExperience.onHideMsg = () => {
    oxExperienceUi.hideMsg();
}

oxExperienceUi.onGetHits = () => {
    return oxExperience.getHits();
}

oxExperienceUi.onGetLogos = () => {
    return oxExperience.getLogos();
}

oxExperienceUi.onGetTime = () => {
    return oxExperience.getTime();
}
