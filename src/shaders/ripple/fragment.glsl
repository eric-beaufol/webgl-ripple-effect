#define PI 3.1415926535897932384626433832795

uniform sampler2D uDisplacement;
uniform sampler2D uImage;
uniform vec2 uResolution;

varying vec2 vUv;

void main() {
  vec2 position = (vUv - 0.5) * uResolution + vec2(0.5);

  vec4 displacement = texture2D(uDisplacement, vUv);
  float theta = displacement.r * 2. * PI;

  vec2 dir = vec2(sin(theta), cos(theta));
  vec2 uv = position + dir * displacement.r * 0.1;

  vec4 color = texture2D(uImage, uv);

  gl_FragColor = color;
}