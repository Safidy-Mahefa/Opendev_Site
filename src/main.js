import * as THREE from 'three';
import {GLTFLoader} from 'three/examples/jsm/loaders/GLTFLoader.js';
import {OrbitControls} from 'three/examples/jsm/controls/OrbitControls.js' //pour bouger la cam avec la souris

// Elements DOM
const wolfContainer = document.getElementById("wolfContainer")

// Souris
let mouseX = 0;
let mouseY = 0;

let model //Le model glb
let head //la tete du wolf
let baseRotation //rotation de base de la tete
let mixer //pour les animations propres

const scene = new THREE.Scene();

const camera = new THREE.PerspectiveCamera(
  75,
  wolfContainer.clientWidth / wolfContainer.clientHeight,
  0.1,
  1000
);


const renderer = new THREE.WebGLRenderer({
  antialias:true,
  alpha: true
});

const controls = new OrbitControls(camera, renderer.domElement);
renderer.setSize(wolfContainer.clientWidth,wolfContainer.clientHeight);
renderer.setClearColor(0x000000,0)

document.getElementById("wolfContainer").appendChild(renderer.domElement);

camera.position.set(1,1,2.2) //Position de la camera

// Lumière
const directionalLight = new THREE.DirectionalLight(0xffffff,3);
directionalLight.position.set(5,5,5);

scene.add(directionalLight);

//loader pour le 3D
const loader = new GLTFLoader();

loader.load(
  "./Wolf.glb",

  function (gltf){
    // Recuperer le loup avec ses animations
    model = gltf.scene;
    // Centrer le modele dans la scene
    const box = new THREE.Box3().setFromObject(model);
    const center = box.getCenter(new THREE.Vector3());
    model.position.sub(center)
    scene.add(model);
    // Récuperer la tete du loup
    head = model.getObjectByName("Head")
    // Récuperer les rotations de base de la tete pour éviter de détruire l'anim
    baseRotation = head.rotation.clone();
    console.log(head)
    

    mixer = new THREE.AnimationMixer(model);

    const animations = gltf.animations;
    console.log(animations)

    if(animations.length >0){
      //selectionner l'animation si il y en a
      const action = mixer.clipAction(animations[3]);
      //lancer l'anim
      action.play()
    }
    console.log("Modele chargé")
  },

  function(xhr){
    console.log((xhr.loaded / xhr.total * 100)+'% loaded');
  },

  function(err){
    console.error(err)
  }
);

// La cible que le loup regarde
const target= new THREE.Object3D();
scene.add(target)
// animation de l'obj
function animate(){
  requestAnimationFrame(animate);

  const delta = clock.getDelta();

  if(mixer){
    //mise a jour des mouvements à chaque frame
    mixer.update(delta);
  }
  
  // Faire tourner la tete en fonction de la souris
  target.position.set(mouseX * 2, 1 + mouseY * 2, 5)
  if(head){
    head.lookAt(target.position);
    // Reinjecter l'orientation initiale
    head.rotateX(-Math.PI /2)
    head.rotateZ(Math.PI)
  }
  renderer.render(scene,camera);

  controls.update()
}

const clock = new THREE.Clock()
animate();

// Listener quand la souris bouge
window.addEventListener("mousemove",(event)=>{
  mouseX = (event.clientX/window.innerWidth) * 2 - 1; //normaliser la souris
  mouseY = -(event.clientY / window.innerHeight) * 2 + 1;
});
