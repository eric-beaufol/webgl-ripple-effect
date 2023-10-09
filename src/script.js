import './style.css'
import * as THREE from 'three'
import * as dat from 'lil-gui'
import rippleFragment from './shaders/ripple/fragment.glsl'
import rippleVertex from './shaders/ripple/vertex.glsl'
import Stats from 'stats.js'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'

/**
 * Base
 */

// Constants
const MAX_WAVES = 250
const WAVES = []
const PREV_MOUSE = { x: 0, y: 0 }
const MOUSE = { x: 0, y: 0 }
let currentWave = 0

// Debug
const gui = new dat.GUI()
const params = {}

// Stats
const stats = new Stats()
document.body.appendChild(stats.dom)

// canvas
const canvas = document.querySelector('canvas.webgl')

// Scenes
const scene = new THREE.Scene()
const rippleScene = new THREE.Scene()

/**
 * Sizes
 */
const sizes = {
  width: window.innerWidth,
  height: window.innerHeight
}

/**
 * Render target
 */

const renderTargetResolution = innerWidth > 728
  ? 1024
  : 512

const renderTarget = new THREE.WebGLRenderTarget(renderTargetResolution, renderTargetResolution)
renderTarget.texture.type = THREE.HalfFloatType
renderTarget.texture.minFilter = THREE.LinearMipmapLinearFilter
renderTarget.texture.magFilter = THREE.LinearFilter
renderTarget.texture.generateMipmaps = true

/**
 * Camera
 */
// Base camera
const { width, height } = sizes
const frustum = height
const aspect = width / height
const camera = new THREE.OrthographicCamera(
  frustum * aspect / -2, 
  frustum * aspect / 2, 
  frustum / 2, 
  frustum / -2, 
  -1000, 1000
)
// const camera = new THREE.PerspectiveCamera(75, width / height, .1, 100)
camera.position.set(0, 1, 2)
scene.add(camera)

// Controls
// const controls = new OrbitControls(camera, canvas)
// controls.target.set(0, 0, 0)
// controls.enableDamping = true
// controls.autoRotateSpeed = 0.5
// controls.autoRotate = true

/**
 * Renderer
 */
const renderer = new THREE.WebGLRenderer({
  canvas: canvas,
  antialias: true,
  background: 0xff0000
})
renderer.shadowMap.enabled = true
renderer.shadowMap.type = THREE.PCFSoftShadowMap
renderer.setSize(sizes.width, sizes.height)
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))

function onResize() {
  // Update sizes
  sizes.width = window.innerWidth
  sizes.height = window.innerHeight

  // Update camera
  // camera.aspect = sizes.width / sizes.height
  // camera.updateProjectionMatrix()

  const textureResolution = textureSize.width / textureSize.height
  const screenResolution = sizes.width / sizes.height
  const rX = textureResolution > screenResolution
    ? screenResolution / textureResolution
    : 1
  const rY = textureResolution > screenResolution
    ? 1
    : textureResolution / screenResolution

  console.log(textureResolution > screenResolution)

  const resolution = new THREE.Vector2(rX, rY)

  // uniforms update
  screenPlane.material.uniforms.uResolution.value = resolution

  // Update renderer
  renderer.setSize(sizes.width, sizes.height)
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
}

window.addEventListener('resize', onResize)

/**
 * Animate
 */
const clock = new THREE.Clock()
let previousTime = 0

const createWaves = () => {
  for (let i = 0; i < MAX_WAVES; i++) {
    const mesh = new THREE.Mesh(
      new THREE.PlaneGeometry(100, 100, 1, 1),
      new THREE.MeshBasicMaterial({
        map: new THREE.TextureLoader().load('/brush.png'),
        transparent: true,
        depthTest: false,
        depthWrite: false,
        blending: THREE.AdditiveBlending
      })
    )
    mesh.rotation.z = Math.PI * 2 * Math.random()
    mesh.visible = false
    rippleScene.add(mesh)
    WAVES.push(mesh)
  }
}

const addEvents = () => {
  window.addEventListener('mousemove', e => {
    MOUSE.x = e.clientX - sizes.width / 2
    MOUSE.y = - e.clientY + sizes.height / 2
  })
}

const addWave = (x, y, index) => {
  WAVES[index].visible = true
  WAVES[index].material.opacity = 1
  WAVES[index].position.x = x
  WAVES[index].position.y = y
  WAVES[index].scale.x = WAVES[index].scale.y = 1
}

let screenPlane, textureSize = { width: 0, height: 0 }
let texture = new THREE.TextureLoader().load('/ocean.jpeg', tex => {
  textureSize.width = tex.image.width
  textureSize.height = tex.image.height
  onResize()
})

const addPlane = () => {
  screenPlane = new THREE.Mesh(
    new THREE.PlaneGeometry(sizes.width, sizes.height),
    new THREE.ShaderMaterial({
      uniforms: {
        uImage: { value: texture },
        uDisplacement: { value: renderTarget.texture },
        uResolution: { value: new THREE.Vector2(sizes.width, sizes.height)}
      },
      vertexShader: rippleVertex,
      fragmentShader: rippleFragment,
      transparent: true
    })
  )

  scene.add(screenPlane)
}

const tick = () => {
  stats.begin()

  const elapsedTime = clock.getElapsedTime()
  const deltaTime = elapsedTime - previousTime
  previousTime = elapsedTime

  // Update controls
  // controls.update(elapsedTime)

  WAVES.forEach(wave => {
    if (wave.visible) {
      wave.rotation.z += 0.02
      wave.scale.x = wave.scale.y = wave.scale.x * 0.98 + 0.1
      wave.material.opacity *= 0.98

      if (wave.material.opacity < 0.001) {
        wave.visible = false
      }
    }
  })

  if (
    Math.abs(MOUSE.x - PREV_MOUSE.x) > 4 ||
    Math.abs(MOUSE.y - PREV_MOUSE.y) > 4
  ) {
    addWave(MOUSE.x, MOUSE.y, currentWave)
    currentWave = (currentWave + 1) % (MAX_WAVES - 1)
  }

  // Render target
  renderer.setRenderTarget(renderTarget)
  renderer.render(rippleScene, camera)

  // Normal
  renderer.setRenderTarget(null)
  renderer.render(scene, camera)

  stats.end()

  // Call tick again on the next frame
  window.requestAnimationFrame(tick)

  PREV_MOUSE.x = MOUSE.x
  PREV_MOUSE.y = MOUSE.y
}

tick()
createWaves()
addEvents()
addPlane()