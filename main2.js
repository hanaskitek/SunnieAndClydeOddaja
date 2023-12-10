import { GUI } from './lib/dat.gui.module.js';
import { ResizeSystem } from './common/engine/systems/ResizeSystem.js';
import { UpdateSystem } from './common/engine/systems/UpdateSystem.js';

import { GLTFLoader } from './common/engine/loaders/GLTFLoader.js';
import { UnlitRenderer } from './common/engine/renderers/UnlitRenderer.js';
import { FirstPersonController } from './common/engine/controllers/FirstPersonController.js';

import {
    Camera,
    Material,
    Model,
    Node,
    Primitive,
    Sampler,
    Texture,
    Transform,
} from './common/engine/core.js';

import {
    calculateAxisAlignedBoundingBox,
    mergeAxisAlignedBoundingBoxes,
} from './common/engine/core/MeshUtils.js';

import { Physics } from './Physics.js';

import { Renderer } from './Renderer.js';
import { Light } from './Light.js';

let audioElement = document.getElementById("pesem");
window.onload = function() {
    // var audioElement = document.getElementById("pesem");
    audioElement.volume = 0.03;
    
    audioElement.play().catch(function(error) {
        console.error("Playback was prevented:", error);
    });
}

var itemBadPickUp = new Audio("./Sounds/itemBadpickUp4.mp3");
var itemGoodPickUp = new Audio("./Sounds/itemGoodPickUp.mp3");
itemGoodPickUp.volume = 0.2;
var sunnieCollisionSound = new Audio("./Sounds/sunnieCollision2.wav");

const canvas = document.querySelector('canvas');
//TT const renderer = new UnlitRenderer(canvas);
const renderer = new Renderer(canvas); //TT
await renderer.initialize();

const loader = new GLTFLoader();
await loader.load('scena4.gltf');

const rjavaMaterial = loader.loadMaterial(0);
const zelenaMaterial = loader.loadMaterial(7); //4 ta je najbrz prava
const modraMaterial = loader.loadMaterial(15);
const rdecaMaterial = loader.loadMaterial(16);

let clydeSpeed = 0.22;

const tileMaterialMap = {
    // 1. vrsta
    "Polje_1_0": 0,
    "Polje_1_1": 1,
    "Polje_1_2": 2,
    "Polje_1_3": 3,
    "Polje_1_4": 4,
    "Polje_1_5": 5,
    "Polje_1_6": 6,
    "Polje_1_7": 7,
    "Polje_1_8": 8,
    // 2. vrsta
    "Polje_2_0": 9,
    "Polje_2_1": 10,
    "Polje_2_2": 11,
    "Polje_2_3": 12,
    "Polje_2_4": 13,
    "Polje_2_5": 14,
    "Polje_2_6": 15,
    "Polje_2_7": 16,
    "Polje_2_8": 17,
    "Polje_2_9": 18,
    // 3. vrsta
    "Polje_3_0": 19,
    "Polje_3_1": 20,
    "Polje_3_2": 21,
    "Polje_3_3": 22,
    "Polje_3_4": 23,
    "Polje_3_5": 24,
    "Polje_3_6": 25,
    "Polje_3_7": 26,
    "Polje_3_8": 27,
    "Polje_3_9": 28,
    "Polje_3_10": 29,
    // 4. vrsta
    "Polje_4_0": 30,
    "Polje_4_1": 31,
    "Polje_4_2": 32,
    "Polje_4_3": 33,
    "Polje_4_4": 34,
    "Polje_4_5": 35,
    "Polje_4_6": 36,
    "Polje_4_7": 37,
    "Polje_4_8": 38,
    "Polje_4_9": 39,
    // 5. vrsta
    "Polje_5_0": 40,
    "Polje_5_1": 41,
    "Polje_5_2": 42,
    "Polje_5_3": 43,
    "Polje_5_4": 44,
    "Polje_5_5": 45,
    "Polje_5_6": 46,
    "Polje_5_7": 47,
    "Polje_5_8": 48,
    "Polje_5_9": 49,
    "Polje_5_10": 50,
    // 6. vrsta
    "Polje_6_1": 51,
    "Polje_6_2": 52,
    "Polje_6_3": 53,
    "Polje_6_0": 54,
    "Polje_6_4": 55,
    "Polje_6_5": 56,
    "Polje_6_6": 57,
    "Polje_6_7": 58,
    "Polje_6_8": 59,
    "Polje_6_9": 60,
    // 7. vrsta
    "Polje_7_0": 61,
    "Polje_7_1": 62,
    "Polje_7_2": 63,
    "Polje_7_3": 64,
    "Polje_7_4": 65,
    "Polje_7_5": 66,
    "Polje_7_6": 67,
    "Polje_7_7": 68,
    "Polje_7_8": 69,
    "Polje_7_9": 70,
    "Polje_7_10": 71,
};

document.addEventListener('DOMContentLoaded', function(){
    let playButton = document.querySelector(".play-button");
    playButton.addEventListener('click', function(){
        window.location.href = "game.html";
        return false;
    });
});


//console.log("Default Scene: ", loader.defaultScene);
const scene = loader.loadScene(loader.defaultScene);
console.log("Scene: ", scene);
//console.log("Default Scene: ", loader.defaultScene);
const camera = loader.loadNode('Camera');
//camera.addComponent(new FirstPersonController(camera, canvas));
camera.isDynamic = true;
camera.aabb = {
    min: [-0.2, -0.2, -0.2],
    max: [0.2, 0.2, 0.2],
};

// const camera2 = new Node();
// camera2.addComponent(new Transform({
//     translation: [0, 15, 0],
//     rotation: [0, 90, 0, 1],
//     scale: [1, 1, 1],
// }));

// camera2.addComponent(new Camera({
//     orthographic: 1,    
//     aspect:1.7777777777777777,
// 	fovy:0.39959652046304894,
//     far:100,
// 	near:0.10000000149011612
// }));
const camera2 = loader.loadNode('Camera2');
//camera2.isDynamic = true;
camera2.aabb = {
    min: [-0.2, -0.2, -0.2],
    max: [0.2, 0.2, 0.2],
};
camera2.getComponentOfType(Transform).translation = [0, 15, 0];
camera2.getComponentOfType(Transform).rotation[2] += -0.15;
//camera2.getComponentOfType(Transform).rotation[3] += -0.2;

const light = new Node();
light.addComponent(new Light({
    direction: [0.78, 2.58, 2.8],
    //intensity: 10.0,
}));
scene.addChild(light);

let bucket = null;
let ogenj = null;
let ogenj1 = null;
let ogenj2 = null;
let stopwatch = null;
let stopwatch1 = null;
let stopwatch2 = null;
let healthpack = null;

//SKRIJEMO POWER-UPe
scene.traverse(node => {
    if(node.name == "BucketOfWater" ||
       node.name == "Ogenj" ||
       node.name == "Ogenj.001" ||
       node.name == "Ogenj.002" ||
       node.name == "Stopwatch" ||
       node.name == "Stopwatch.001" ||
       node.name == "Stopwatch.002" || 
       node.name == "Healthpack") {
        node.getComponentOfType(Transform).translation[0] = 200;
    }

    if(node.name == "BucketOfWater") {
        bucket = node;
    } else if(node.name == "Ogenj") {
        ogenj = node;
    } else if(node.name == "Ogenj.001") {
        ogenj1 = node;
    } else if(node.name == "Ogenj.002") {
        ogenj2 = node;
    } else if(node.name == "Stopwatch") {
        stopwatch = node;
    } else if(node.name == "Stopwatch.001") {
        stopwatch1 = node;
    } else if(node.name == "Stopwatch.002") {
        stopwatch2 = node;
    } else if(node.name == "Healthpack") {
        healthpack = node;
    }
});

function ponastavi_mesta_powerupov() {
    bucket.getComponentOfType(Transform).translation[0] = 200;
    ogenj.getComponentOfType(Transform).translation[0] = 200;
    ogenj1.getComponentOfType(Transform).translation[0] = 200;
    ogenj2.getComponentOfType(Transform).translation[0] = 200;
    stopwatch.getComponentOfType(Transform).translation[0] = 200;
    stopwatch1.getComponentOfType(Transform).translation[0] = 200;
    stopwatch2.getComponentOfType(Transform).translation[0] = 200;
    healthpack.getComponentOfType(Transform).translation[0] = 200;
}


const oblak = loader.loadNode('Clyde');
// console.log("OBLAK: ", oblak);
oblak.isDynamic = true;
//oblak.addComponent(new FirstPersonController(oblak, canvas));

// oblak.addComponent(new Transform({
//     translation: [0,
//         1.2600204944610596,
//         0.9640176892280579],
// }));
// HANA! Probi ce lahko tko: const cloudPosition = oblak.getComponentOfType(Transform).translation
// Pa das tam gor v translation te koordinate, k so tle spodi.
const cloudPosition = oblak.getComponentOfType(Transform).translation

const sunnie = loader.loadNode('Sunnie');
sunnie.isDynamic = true;

// sunnie.addComponent(new Transform({
//     translation: [-1.558300256729126,
//         1.6659927368164062,
//         4.757515907287598] }));
let sunniePosition = sunnie.getComponentOfType(Transform).translation
sunniePosition[0] = -8.6597;
sunniePosition[2] = -4.5114;

// loader.loadNode('Circle').isStatic = true;
// loader.loadNode('Circle.001').isStatic = true;
// loader.loadNode('Circle.002').isStatic = true;
// loader.loadNode('Circle.003').isStatic = true;
// loader.loadNode('Circle.004').isStatic = true;
// loader.loadNode('Circle.006').isStatic = true;
// loader.loadNode('Circle.007').isStatic = true;
// loader.loadNode('Smreka').isStatic = true;
// loader.loadNode('Smreka.001').isStatic = true;
// loader.loadNode('Smreka.002').isStatic = true;
// loader.loadNode('Smreka.003').isStatic = true;
// loader.loadNode('Smreka.004').isStatic = true;
// loader.loadNode('Smreka.005').isStatic = true;
// loader.loadNode('Listavec').isStatic = true;
// loader.loadNode('Listavec.001').isStatic = true;
// loader.loadNode('Listavec.002').isStatic = true;


let aliJePavza = false;

document.addEventListener('keydown', (event) => {
    if(gameOver || aliJePavza) {
        return;
    }

    const cloudTransform = oblak.getComponentOfType(Transform);
    
    switch (event.key) {
        case 'ArrowUp':
            cloudPosition[2] -= clydeSpeed;
            break;
        case 'ArrowDown':
            cloudPosition[2] += clydeSpeed;
            break;
        case 'ArrowLeft':
            cloudPosition[0] -= clydeSpeed;
            break;
        case 'ArrowRight':
            cloudPosition[0] += clydeSpeed;
            break;
    }

    // Update the cloud's position.
    cloudTransform.translation = cloudPosition;
});

const physics = new Physics(scene);
scene.traverse(node => {
    // console.log("Processing Node:", node.name)
    const model = node.getComponentOfType(Model);
    //console.log(model);
    if (!model) {
        return;
    }
    
    //console.log("tukaj!");
    const boxes = model.primitives.map(primitive => calculateAxisAlignedBoundingBox(primitive.mesh));
    //console.log("Boxes: ", boxes);
    node.aabb = mergeAxisAlignedBoundingBoxes(boxes);
    //console.log(node.nodeIndex);
    //console.log("node.aabb: ", node.aabb);
});


function getNodeByName(nodeName) {
    // console.log("Node name:", nodeName)
    let foundNode = null;

    //foundNode = loader.findByNameOrIndex(scene.children, nodeName);

    scene.traverse(node => {
        //console.log("Node name:", node.name)
        if (node.name === nodeName) {
            foundNode = node;
            //console.log("Nodefound: ", foundNode);
            return foundNode;
        }
    });

    return foundNode;
}   

function getNodePosition(nodeName) {
    const objekt = getNodeByName(nodeName);

    if (objekt) {
        //console.log("Translation ", objekt.getComponentOfType(Transform).translation)
        return objekt.getComponentOfType(Transform).translation;
    } else {
        console.error(`Node not found: ${nodeName}`);
        return null;
    }
}


let indeks_postavitve_0 = 0;
let indeks_postavitve_1 = 0;
let indeks_postavitve_2 = 0;

// Powerup booleans
let bucket_bool = false;
let ogenj_bool = false;
let stopwatch_bool = false;
let healthpack_bool = false;


// Timers for each tile for Clyde
const tileTimersClyde = {};
Object.keys(tileMaterialMap).forEach(tile => tileTimersClyde[tile] = 0);

// Timers for each tile for Sunnie
const tileTimersSunnie = {};
Object.keys(tileMaterialMap).forEach(tile => tileTimersSunnie[tile] = 0);
//console.log("tiletimers: ", tileTimers);

// Function to check if Clyde is above a tile
function isClydeAboveTile(clydePosition, tilePosition, thresholdX = 0.8, thresholdY = 1.3) {
    // Check if Clyde is within a certain distance (threshold) in the 'x' and 'y' axes
    const distanceX = Math.abs(clydePosition[0] - tilePosition[0]);
    const distanceY = Math.abs(clydePosition[2] - tilePosition[2]);

    return distanceX <= thresholdX && distanceY <= thresholdY;
}

function isSunnieAboveTile(sunniePosition, tilePosition, thresholdX = 0.8, thresholdY = 1.3) {
    // Check if Sunnie is within a certain distance (threshold) in the 'x' and 'y' axes
    const distanceX = Math.abs(sunniePosition[0] - tilePosition[0]);
    const distanceY = Math.abs(sunniePosition[2] - tilePosition[2]);

    return distanceX <= thresholdX && distanceY <= thresholdY;
}

// Function to change the texture of a tile
function changeTileTexture(tileName, character) {
    // const materialIndex = tileMaterialMap[tileName];
    
    const tile = getNodeByName(tileName)
    // console.log("TILE: ", tile);
    //console.log("TILE null");    

    // const meshIndex = tileNode.mesh;
    // const mesh = scene.meshes[meshIndex];

    // mesh.primitives[0].material = newTextureIndex;

    const tileModel = tile.getComponentOfType(Model);
    if(character == "sunnie") {
        tileModel.primitives[0].addMaterial(rjavaMaterial);
    } else if (character == "clyde") {
        tileModel.primitives[0].addMaterial(zelenaMaterial);
    } else if(character == "bucket") {
        tileModel.primitives[0].addMaterial(modraMaterial);
    } else if(character == "ogenj") {
        tileModel.primitives[0].addMaterial(rdecaMaterial);
    }
    


    // mesh.primitives.forEach(primitive => {
    //     const materialIndex = primitive.material;
    //     const material = scene.materials[materialIndex];

    //     if (material && material.pbrMetallicRoughness && material.pbrMetallicRoughness.baseColorTexture) {
    //         material.pbrMetallicRoughness.baseColorTexture.index = newTextureIndex;
    //     } else {
    //         console.error(`Material or texture not found for tile: ${tileName}`);
    //     }
    // });
}

let maxHealthPoints = 50;

function getKeyByValue(object, value) {
    return Object.keys(object).find(key => object[key] === value);
}

function spremeniRdecaModraPolja() {

    for(let i = 0; i < tabelaPobarvanihTileov.length; i++) {

        if(tabelaPobarvanihTileov[i][2] == 2) {
            let tileIme = getKeyByValue(tileMaterialMap, i);
            changeTileTexture(tileIme, 'clyde');
            tabelaPobarvanihTileov[i][2] = 0;

        } else if(tabelaPobarvanihTileov[i][2] == 3) {
            let tileIme = getKeyByValue(tileMaterialMap, i);
            changeTileTexture(tileIme, 'sunnie');
            tabelaPobarvanihTileov[i][2] = 1;
        }
    }
}

function bucketOgenjEffect(tileName, effect) {
    let tile = getNodeByName(tileName);
    //console.log(tile);
    let effect_position = tile.getComponentOfType(Transform).translation;

    Object.keys(tileTimersClyde).forEach(node => {
        const node_position = getNodePosition(node);
        //console.log(node);
        //if(typeof node.getComponentOfType(Transform) !== 'undefined') {
        //console.log("TA DA!");
        //let node_position = node.getComponentOfType(Transform).translation;
        let indeks_nodea = tileMaterialMap[node];
      //  console.log("indeks: ", indeks_nodea);  // DEBUG

        if(node_position[0] >= (effect_position[0] - 3) && node_position[0] <= (effect_position[0] + 3) &&
        node_position[2] >= (effect_position[2] - 3) && node_position[2] <= (effect_position[2] + 3)) {
            if(effect == 'bucket') {
                //console.log("bucket notri");
                tabelaPobarvanihTileov[indeks_nodea][2] = 2;
                changeTileTexture(node, 'bucket');                

            } else if(effect == 'ogenj') {
                //console.log("ogenj notri");
                tabelaPobarvanihTileov[indeks_nodea][2] = 3;
                changeTileTexture(node, 'ogenj');

            }
        }
        //}
        
    });
}

function prestejRjaveTile() {
    let stRjavih = 0;
    for(let i = 0; i < tabelaPobarvanihTileov.length; i++) {
        if(tabelaPobarvanihTileov[i][2] == 1) {
            stRjavih++;
        }
    }

    return stRjavih;
}

function healthpackEffect() {
    let stRjavihTileov = prestejRjaveTile();

    let stOdpobarvaj = Math.min(stRjavihTileov, 6);

    for(let i = 0; i < stOdpobarvaj; i++) {
        let indeks = Math.floor(Math.random() * 72);

        while(tabelaPobarvanihTileov[indeks][2] != 1) {
            //console.log("while healthpackEffect");
            indeks = Math.floor(Math.random() * 72);
        }

        let tileName = getKeyByValue(tileMaterialMap, indeks);
        //console.log(tileName);
        changeTileTexture(tileName, 'clyde');
        tabelaPobarvanihTileov[indeks][2] = 0;
    }
}

function aktivirajPowerUp(tile) {
    // Check if Clyde is on Powerup
    
    if(bucket_bool || healthpack_bool) {
        // console.log("tileMaterialMapIX: ", tileMaterialMap[tile]);
        // console.log("indeks postavitve: ", indeks_postavitve_0);
        if(tileMaterialMap[tile] == indeks_postavitve_0) {
            
            //console.log("pobrali bucket/healthpack.")
            itemGoodPickUp.play();
            ponastavi_mesta_powerupov();
            if(bucket_bool) {
                //console.log("Naj bi bil tile name: ", tile);
                bucketOgenjEffect(tile, 'bucket');
                bucket_bool = false;

            } else if(healthpack_bool) {
                healthpackEffect();
                healthpack_bool = false;

            }
        }

    } else if(ogenj_bool || stopwatch_bool) {
        let ix = tileMaterialMap[tile];
        // console.log("ixOgenjStopwatch: ", ix);
        // console.log("indeksi postavitev: ", indeks_postavitve_0, indeks_postavitve_1, indeks_postavitve_2);
        if(ix == indeks_postavitve_0 || ix == indeks_postavitve_1 || ix == indeks_postavitve_2) {
            itemBadPickUp.play();
            ponastavi_mesta_powerupov();
            //console.log("pobrali ogenj/stopwatch.");
            if(ogenj_bool) {
                bucketOgenjEffect(tile, 'ogenj');
                ogenj_bool = false;

            } else if(stopwatch_bool) {
                clydeSpeed = 0.05;
                stopwatch_bool = false;

            }
        }

    }
}


// Tabela tile-ov za sonce
const rows = 72;
const columns = 3;
let tabelaPobarvanihTileov = new Array(rows).fill(null).map(() => new Array(columns).fill(0.0));
let i = 0;
Object.keys(tileMaterialMap).forEach(tile => {
    const tilePosition = getNodePosition(tile);
    //console.log(tilePosition);
    // x kooordinata
    tabelaPobarvanihTileov[i][0] = tilePosition[0];
    // y koordinata
    tabelaPobarvanihTileov[i][1] = tilePosition[2];
    // ali je tile posusen (1 => posusen; 0 => ni posusen; 2 => voda; 3 => ogenj)
    tabelaPobarvanihTileov[i][2] = 0.0;
    i += 1
});

//console.log(tabelaPobarvanihTileov);
let collisionKazen = 0;

function updateHealthBar(currentHealthPoints) {
    //const maxHealthPoints = 30;
    let healthPercentage = ((maxHealthPoints - currentHealthPoints - collisionKazen) / maxHealthPoints) * 100;

    const healthBar = document.getElementById('health-bar');
    const healthTextRight = document.getElementById('health-text-right');

    healthBar.style.width = healthPercentage + '%';
    //healthTextRight.textContent = currentHealthPoints + '/' + maxHealthPoints;
    healthPercentage = Math.max(healthPercentage, 0);
    healthTextRight.textContent = Math.round(healthPercentage) + '%';

    // Change text color based on health percentage
    if (healthPercentage <= 45) {
        healthTextRight.style.color = 'white';
    } else {
        healthTextRight.style.color = 'black';
    }

    return healthPercentage;
}

function prestejPobarvaneTile() {
    let stPobarvanih = 0;
    for(let i = 0; i < tabelaPobarvanihTileov.length; i++) {
        if(tabelaPobarvanihTileov[i][2] == 3 || tabelaPobarvanihTileov[i][2] == 1) {
            stPobarvanih++;
        }
    }
    //console.log("stPobarvanih: ", stPobarvanih);

    // let displayArea = document.getElementById("displayArea");
    // displayArea.textContent = 30 - stPobarvanih;

    //let health = document.getElementById("health")
    //health.value = 30 - stPobarvanih;

    //const healthPrecents = ((30-stPobarvanih) / 30) * 100;
    //updateHealthBar(stPobarvanih);

    return stPobarvanih;
}

// scene.traverse(node => {
//     //console.log("Node name:", node.name)
//     if (node.name === nodeName) {
//         foundNode = node;
//         //console.log("Nodefound: ", foundNode);
//         return foundNode;
//     }
// });


function izberiCilj() {
    // Izberemo random stevilo od 0 do 71 (to je index tile-a v tabeli tabelaPobarvanihTileov)
    let indeks_izbranega_tilea = Math.floor(Math.random() * 72);

    // Ce je ta tile ze posusen, izberemo novega.
    while(tabelaPobarvanihTileov[indeks_izbranega_tilea][2] == 1) {
        //console.log("while izberiCilj");
        indeks_izbranega_tilea = Math.floor(Math.random() * 72);
    }

    return indeks_izbranega_tilea;
}

function clydeSunnieCollision(clydePosition, sunniePosition) {
    const distanceX = Math.abs(sunniePosition[0] - clydePosition[0]);
    const distanceY = Math.abs(sunniePosition[2] - clydePosition[2]);

    return distanceX <= 1 && distanceY <= 1;
}

function spremeniBarvoHealthbara(nacin) {
    let healthBarContainer = document.getElementById('health-bar-container');
    let healthBar = document.getElementById('health-bar');
   
    if(nacin === 'rdeca') { // Spremeni v rdeco
        healthBarContainer.style.backgroundColor = '#b10f0f';
        healthBarContainer.style.border = '2px solid #820606';
        healthBarContainer.style.boxShadow = '0 4px #820606, 0px 0px 50px rgba(177, 15, 15, 0.9)';

        healthBar.style.backgroundColor = '#dc382d'//'#ff4b4b';

    } else if(nacin === 'zelena') { // Spremeni nazaj v zeleno-rjavo
        healthBarContainer.style.backgroundColor = '#ae4119';
        healthBarContainer.style.border = '2px solid #64260f';
        healthBarContainer.style.boxShadow = '0 4px #64260f, 5px 8px 8px rgba(0, 0, 0, 0.5)';

        healthBar.style.backgroundColor = '#92d03d';
    }   
}

let sunnieCilj = izberiCilj();

// Hranimo stevilo posusenih polj, ker ce so vsa posusena, se igra konca.
//let stPosusenihPolj = 0;

// Pavza Play
// let aliJePavza = false;
document.getElementById('pauseButton').addEventListener("click", pavzaPlayFunkcija);
document.getElementById('playButton').addEventListener("click", pavzaPlayFunkcija);
//document.getElementById('noButton').addEventListener("click", pavzaPlayFunkcija);
function pavzaPlayFunkcija() {
    //console.log("klik na pavzo");
    aliJePavza = !aliJePavza;
}

document.getElementById('homeButton').addEventListener("click", homeButtonFunkcija);
function homeButtonFunkcija() {
    aliJePavza = true;
}

let prejsnjaPozicijaSunnie = getNodePosition("Sunnie").map((x) => x);
console.log(prejsnjaPozicijaSunnie)

let gameOver = false;
let vsotaDt = 0;

let gameOverTime = false;
let casIgranja = 0.0;

let prejsnjiClydeSunnieCollision = false;

// Animacija power upov
let originalY = bucket.getComponentOfType(Transform).translation[1];
let amplitude = 0.04;
let frequency = 6;

let casVPavzi = 0;

function update(time, dt) {
    //console.log("Cilj: ", sunnieCilj);
    //console.log("Time: ", time);
    //console.log("dt: ", dt);
    scene.traverse(node => {
        for (const component of node.components) {
            component.update?.(time, dt);
        }
    });

    physics.update(time, dt);
    //console.log(aliJePavza);

    

    let stPosusenihPolj = prestejPobarvaneTile();
    let healthPercentage = updateHealthBar(stPosusenihPolj);

    if(aliJePavza) {
        casVPavzi += dt;
        audioElement.pause();

    } else if(healthPercentage > 0) {
        audioElement.play();
        // Animacija power upov
        //bucket.getComponentOfType(Transform).translation[1] = originalY + amplitude * Math.sin(frequency * time);
        ogenj.getComponentOfType(Transform).translation[1] = originalY + amplitude * Math.sin(frequency * time);
        ogenj1.getComponentOfType(Transform).translation[1] = originalY + amplitude * Math.sin(frequency * time);
        ogenj2.getComponentOfType(Transform).translation[1] = originalY + amplitude * Math.sin(frequency * time);
        stopwatch.getComponentOfType(Transform).translation[1] = originalY + amplitude * Math.sin(frequency * time);
        stopwatch1.getComponentOfType(Transform).translation[1] = originalY + amplitude * Math.sin(frequency * time);
        stopwatch2.getComponentOfType(Transform).translation[1] = originalY + amplitude * Math.sin(frequency * time);
        healthpack.getComponentOfType(Transform).translation[1] = originalY + amplitude * Math.sin(frequency * time);

        if(time > 5) {
            vsotaDt += dt;

            if(vsotaDt > 8) {
                bucket_bool = false;
                ogenj_bool = false;
                stopwatch_bool = false;
                healthpack_bool = false;
                ponastavi_mesta_powerupov();
            }

            if(vsotaDt > 10) {
                //console.log("10 sek je minilo.");
                clydeSpeed = 0.15;
                spremeniRdecaModraPolja();
                // Izberemo random stevilo od 0 do 3
                let st_powerup = Math.floor(Math.random() * 4);
                //st_powerup = 0;
                if(st_powerup == 0) {   // Bucket
                    bucket_bool = true;
                    indeks_postavitve_0 = Math.floor(Math.random() * 72);
                    bucket.getComponentOfType(Transform).translation[0] = tabelaPobarvanihTileov[indeks_postavitve_0][0];
                    bucket.getComponentOfType(Transform).translation[2] = tabelaPobarvanihTileov[indeks_postavitve_0][1];

                } else if(st_powerup == 1) {    // Healthpack
                    healthpack_bool = true;
                    indeks_postavitve_0 = Math.floor(Math.random() * 72);
                    healthpack.getComponentOfType(Transform).translation[0] = tabelaPobarvanihTileov[indeks_postavitve_0][0];
                    healthpack.getComponentOfType(Transform).translation[2] = tabelaPobarvanihTileov[indeks_postavitve_0][1];

                } else if(st_powerup == 2) {    // Ogenj
                    ogenj_bool = true;
                    indeks_postavitve_0 = Math.floor(Math.random() * 72);
                    indeks_postavitve_1 = Math.floor(Math.random() * 72);
                    indeks_postavitve_2 = Math.floor(Math.random() * 72);

                    while(indeks_postavitve_1 == indeks_postavitve_0) {
                        indeks_postavitve_1 = Math.floor(Math.random() * 72);
                    }
                    while(indeks_postavitve_2 == indeks_postavitve_0 || indeks_postavitve_2 == indeks_postavitve_1) {
                        indeks_postavitve_2 = Math.floor(Math.random() * 72);
                    }

                    ogenj.getComponentOfType(Transform).translation[0] = tabelaPobarvanihTileov[indeks_postavitve_0][0];
                    ogenj.getComponentOfType(Transform).translation[2] = tabelaPobarvanihTileov[indeks_postavitve_0][1];

                    ogenj1.getComponentOfType(Transform).translation[0] = tabelaPobarvanihTileov[indeks_postavitve_1][0];
                    ogenj1.getComponentOfType(Transform).translation[2] = tabelaPobarvanihTileov[indeks_postavitve_1][1];

                    ogenj2.getComponentOfType(Transform).translation[0] = tabelaPobarvanihTileov[indeks_postavitve_2][0];
                    ogenj2.getComponentOfType(Transform).translation[2] = tabelaPobarvanihTileov[indeks_postavitve_2][1];

                } else if(st_powerup == 3) {    // Stopwatch
                    stopwatch_bool = true;
                    indeks_postavitve_0 = Math.floor(Math.random() * 72);
                    indeks_postavitve_1 = Math.floor(Math.random() * 72);
                    indeks_postavitve_2 = Math.floor(Math.random() * 72);

                    while(indeks_postavitve_1 == indeks_postavitve_0) {
                        indeks_postavitve_1 = Math.floor(Math.random() * 72);
                    }
                    while(indeks_postavitve_2 == indeks_postavitve_0 || indeks_postavitve_2 == indeks_postavitve_1) {
                        indeks_postavitve_2 = Math.floor(Math.random() * 72);
                    }

                    stopwatch.getComponentOfType(Transform).translation[0] = tabelaPobarvanihTileov[indeks_postavitve_0][0];
                    stopwatch.getComponentOfType(Transform).translation[2] = tabelaPobarvanihTileov[indeks_postavitve_0][1];

                    stopwatch1.getComponentOfType(Transform).translation[0] = tabelaPobarvanihTileov[indeks_postavitve_1][0];
                    stopwatch1.getComponentOfType(Transform).translation[2] = tabelaPobarvanihTileov[indeks_postavitve_1][1];

                    stopwatch2.getComponentOfType(Transform).translation[0] = tabelaPobarvanihTileov[indeks_postavitve_2][0];
                    stopwatch2.getComponentOfType(Transform).translation[2] = tabelaPobarvanihTileov[indeks_postavitve_2][1];

                }

                vsotaDt = 0;
            }
        }
        // Ce je Clyde nad tile-om, se spremeni texture tile-a
        const clydePosition = getNodePosition("Clyde");
        const sunniePosition = getNodePosition("Sunnie");
        //console.log("SunniePosition: ", sunniePosition2);

        Object.keys(tileTimersClyde).forEach(tile => {
            //console.log("tile: ", tile);
            const tilePosition = getNodePosition(tile);
            //pridobi indeks tile-a
            let ix = tileMaterialMap[tile];
            //console.log("indeks tilea: ", ix);
            //console.log("NodeName: ", getNodeByName(tile))
            
            if (isClydeAboveTile(clydePosition, tilePosition)) {
                tileTimersClyde[tile] += dt;
                if (tileTimersClyde[tile] >= 0.1 && tabelaPobarvanihTileov[ix][2] != 2 && tabelaPobarvanihTileov[ix][2] != 3) {
                    changeTileTexture(tile, "clyde" /* newTextureIndex */);
                    //stPosusenihPolj -= 1;
                    tabelaPobarvanihTileov[ix][2] = 0;
                    tileTimersClyde[tile] = 0; // Reset the timer
                }
                aktivirajPowerUp(tile);
            } else {
                tileTimersClyde[tile] = 0; // Reset if Clyde moves away
            }

            // if (isSunnieAboveTile(sunniePosition, tabelaPobarvanihTileov[sunnieCilj][0], tabelaPobarvanihTileov[sunnieCilj][1])) {
            if (isSunnieAboveTile(sunniePosition, tilePosition)) {
                tileTimersSunnie[tile] += dt;
                if (tileTimersSunnie[tile] >= 0.1 && tabelaPobarvanihTileov[ix][2] != 2 && tabelaPobarvanihTileov[ix][2] != 3) {
                    changeTileTexture(tile, "sunnie" /* newTextureIndex */);
                    //stPosusenihPolj += 1;
                    tabelaPobarvanihTileov[ix][2] = 1;
                    tileTimersSunnie[tile] = 0; // Reset the timer
                }
            } else {
                tileTimersSunnie[tile] = 0; // Reset if Sunnie moves away
            }
        });

        if(clydeSunnieCollision(clydePosition, sunniePosition)) {
            if(!prejsnjiClydeSunnieCollision) { // Ce se je zgodil nov collision, odbijemo tocke.
                collisionKazen += 2;
                spremeniBarvoHealthbara('rdeca');
                // Predvajaj zvok
                sunnieCollisionSound.play();
            }

            prejsnjiClydeSunnieCollision = true;
        } else {
            prejsnjiClydeSunnieCollision = false;
            spremeniBarvoHealthbara('zelena');
        }

        // Premikanje sonca
        let speedSunnie = 3 * dt;
        const x_coor_cilj = tabelaPobarvanihTileov[sunnieCilj][0];
        const y_coor_cilj = tabelaPobarvanihTileov[sunnieCilj][1];      

        let aliSeJePremaknil = false;

        if(sunniePosition[0] < (x_coor_cilj - 0.3)) {
            sunniePosition[0] += speedSunnie;
            aliSeJePremaknil = true;
        } else if(sunniePosition[0] > (x_coor_cilj + 0.3)) {
            sunniePosition[0] -= speedSunnie;
            aliSeJePremaknil = true;
        }

        if(sunniePosition[2] < (y_coor_cilj - 0.3)) {
            sunniePosition[2] += speedSunnie;
            aliSeJePremaknil = true;
        } else if(sunniePosition[2] > (y_coor_cilj + 0.3)) {
            sunniePosition[2] -= speedSunnie;
            aliSeJePremaknil = true;
        }

        //console.log("speed: ", speedSunnie);

        //console.log("Sunnie position: ", sunniePosition);
        //console.log("Prejsnji position: ", prejsnjaPozicijaSunnie);

        //let sunniePos = getNodePosition('Sunnie');
        if((aliSeJePremaknil == false) ||
            ((prejsnjaPozicijaSunnie[0] <= sunniePosition[0] + (speedSunnie - 0.001)) && (prejsnjaPozicijaSunnie[0] >= sunniePosition[0] - (speedSunnie - 0.001))) &&
            ((prejsnjaPozicijaSunnie[2] <= sunniePosition[2] + (speedSunnie - 0.001)) && (prejsnjaPozicijaSunnie[2] >= sunniePosition[2] - (speedSunnie - 0.001)))) {
            
            //console.log("tukaj notr");
            sunnieCilj = izberiCilj();
        }
        //console.log("Sunnie cilj: ",sunnieCilj);

        prejsnjaPozicijaSunnie = sunniePosition.map((x) => x);

    } else {
        gameOver = true;
        
        if(!gameOverTime) {
            casIgranja = time - casVPavzi;
            gameOverTime = true;
        }

        document.getElementById('timeDisplay').innerText = Math.round(casIgranja * 100) / 100; // Update time
        document.getElementById('gameOverModal').style.display = 'block'; // Show modal

        // document.getElementById('replayButton').addEventListener('click', function() {
        //     window.location.href = 'index.html';
        // });

        // document.getElementById('homepageButton').addEventListener('click', function() {
        //     window.location.href = 'home2.html';
        // });

        //console.log("GAME OVER!")
    }
    

}

function render() {
  
   //CALL RENDER SHADOW MAP BEFORE RENDER (Z novo kamero)  renderer.renderShadowMap(scene, camera2, light);
   //camera2.getComponentOfType(Camera).orthographic = 1;
   //camera2.getComponentOfType(Camera).near = 0.3;
    //camera2.getComponentOfType(Camera).fovy = 0.5;
   camera2.getComponentOfType(Camera).far = 30;
   //camera.getComponentOfType(Transform).rotation = [1,0,0,1];
   camera2.getComponentOfType(Camera).orthographic = 1;

   renderer.renderShadowMap(scene, camera2, light);
  
   //renderer.showShadowMap();

   renderer.render(scene, camera, light);
}

function resize({ displaySize: { width, height }}) {
    camera.getComponentOfType(Camera).aspect = width / height;
}

new ResizeSystem({ canvas, resize }).start();
new UpdateSystem({ update, render }).start();

// const gui = new GUI();
// gui.add(renderer, 'perFragment');

// const lightSettings = light.getComponentOfType(Light);
// const lightFolder = gui.addFolder('Light');
// lightFolder.open();
// lightFolder.addColor(lightSettings, 'color');

// const lightDirection = lightFolder.addFolder('Direction');
// lightDirection.open();
// lightDirection.add(lightSettings.direction, 0, -4, 4).name('x');
// lightDirection.add(lightSettings.direction, 1, -4, 4).name('y');
// lightDirection.add(lightSettings.direction, 2, -4, 4).name('z');
