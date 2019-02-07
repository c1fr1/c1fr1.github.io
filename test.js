class VBO {
  constructor(gl, vertices) {
    this.id = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, this.id);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);
  }
}
class ShaderProgram {
  constructor(gl, vert, frag) {
    const vertShader = gl.createShader(gl.VERTEX_SHADER);
    gl.shaderSource(vertShader, vert);
    gl.compileShader(vertShader);
    if (!gl.getShaderParameter(vertShader, gl.COMPILE_STATUS)) {
      alert('An error occurred compiling the vertex shader: ' + gl.getShaderInfoLog(vertShader));
      gl.deleteShader(vertShader);
      this.id = -1;
      return;
    }
    const fragShader = gl.createShader(gl.FRAGMENT_SHADER);
    gl.shaderSource(fragShader, frag);
    gl.compileShader(fragShader);
    if (!gl.getShaderParameter(fragShader, gl.COMPILE_STATUS)) {
      alert('An error occurred compiling the fragment shader: ' + gl.getShaderInfoLog(fragShader));
      gl.deleteShader(fragShader);
      this.id = -1;
      return;
    }

    this.id = gl.createProgram();
    gl.attachShader(this.id, vertShader);
    gl.attachShader(this.id, fragShader);
    gl.linkProgram(this.id);

    if (!gl.getProgramParameter(this.id, gl.LINK_STATUS)) {
      alert('Unable to initialize the shader program: ' + gl.getProgramInfoLog(this.id));
      this.id = -1;
    }

    this.vertAttribLocation = gl.getAttribLocation(this.id, "vert");
  }
  enable(gl) {
  }
}
function main() {
  const canvas = document.querySelector("#glCanvas");
  const gl = canvas.getContext("webgl");
  if (gl === null) {
    alert("Unable to initialize WebGL. Your browser or machine may not support it.");
    return;
  }
  gl.clearColor(0.0, 0.0, 0.0, 1.0);
  gl.clear(gl.COLOR_BUFFER_BIT);

  const vsSource = `
    attribute vec2 vert;

    void main() {
      gl_Position = vec4(vert, 0, 1);
    }
  `;
  const fsSource = `
    void main() {
      gl_FragColor = vec4(1.0, 1.0, 1.0, 1.0);
    }
  `;

  var program = new ShaderProgram(gl, vsSource, fsSource);
  var vertexBuffer = new VBO(gl, [-0.5, 0.5, 0.5, 0.5, -0.5, -0.5]);

  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

  
  gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer.id);
  gl.vertexAttribPointer(program.vertAttribLocation, 2, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(program.vertAttribLocation);
  
  gl.useProgram(program.id);

  gl.drawArrays(gl.TRIANGLE_STRIP, 0, 3);
  
}
main();
