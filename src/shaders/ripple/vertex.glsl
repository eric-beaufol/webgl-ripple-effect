varying vec3 vWorldPos;
varying vec2 vUv;
varying vec3 vPosition;

void main() {
  vec4 worldPos = modelMatrix * vec4(position, 1.0);
  vec4 mvPosition = viewMatrix * worldPos;

  gl_Position = projectionMatrix * mvPosition;

  vUv = uv;
  vPosition = position;
}