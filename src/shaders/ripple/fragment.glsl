uniform sampler2D uTexture;
uniform sampler2D uImage;

void main() {
  vec3 color = vec3(1.);

  gl_FragColor = vec4(color, 1.);
}