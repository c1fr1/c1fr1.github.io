class VBO {
  //int id;
  //int dim;
  constructor(gl, vertices, dim) {
    this.id = gl.createBuffer();
    this.dim = dim;
    gl.bindBuffer(gl.ARRAY_BUFFER, this.id);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);
  }
  bind(gl, loc) {
    gl.bindBuffer(gl.ARRAY_BUFFER, this.id);
    gl.vertexAttribPointer(loc, this.dim, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(loc);
  }
}
class IBO {
  //int id;
  constructor(gl, indices) {
    this.id = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.id);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indices), gl.STATIC_DRAW);
  }
  bind(gl) {
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.id);
  }
}
class VAO {
  //VBO[] vbos;
  //IBO ibo;
  //int indexCount;
  constructor(vbos, ibo, indexCount) {
    this.vbos = vbos;
    this.ibo = ibo;
    this.indexCount = indexCount;
  }
  static makeVertices(gl, vertices, dim, indices) {
    return new VAO([new VBO(gl, vertices, dim)], new IBO(gl, indices), indices.length);
  }
  static makeSquare(gl, width, height) {
    const vertices = [
    -width/2,  height/2,
     width/2,  height/2,
    -width/2, -height/2,
     width/2, -height/2
    ]
    const colors = [
    0.0, 0.0,
    1.0, 0.0,
    0.0, 1.0,
    1.0, 1.0
    ]
    const indices = [0, 1, 2, 1, 2, 3];
    return new VAO([new VBO(gl, vertices, 2), new VBO(gl, colors, 2)], new IBO(gl, indices), indices.length);
  }
  prepareRender(gl, program) {
    for (var i = 0; i < this.vbos.length && i < program.attribPositions.length; ++i) {
      this.vbos[i].bind(gl, program.attribPositions[i]);
    }
    this.ibo.bind(gl);
  }
  draw(gl) {
    gl.drawElements(gl.TRIANGLES, this.indexCount, gl.UNSIGNED_SHORT, 0);
  }
  fullRender(gl, program) {
    this.prepareRender(gl, program);
    this.draw(gl);
  }
}
class ShaderProgram {
  //int id;
  //int[] attribPositions;
  //int[] vertUniformPositions;
  //int[] fragUniformPositions;
  constructor(gl, vert, frag, attribNames, uniformNames) {
    const vertShader = ShaderProgram.loadShader(gl, gl.VERTEX_SHADER, vert);
    const fragShader = ShaderProgram.loadShader(gl, gl.FRAGMENT_SHADER, frag);

    this.id = gl.createProgram();
    gl.attachShader(this.id, vertShader);
    gl.attachShader(this.id, fragShader);
    gl.linkProgram(this.id);

    if (!gl.getProgramParameter(this.id, gl.LINK_STATUS)) {
      alert('Unable to initialize the shader program: ' + gl.getProgramInfoLog(this.id));
      this.id = -1;
    }
    this.attribPositions = [];
    for (var i = 0; i < attribNames.length; ++i) {
      this.attribPositions.push(gl.getAttribLocation(this.id, attribNames[i]));
    }
    this.uniformPositions = [[], []];
    for (var i = 0; i < uniformNames[0].length; ++i) {
      this.uniformPositions[0].push(gl.getUniformLocation(this.id, uniformNames[0][i]))
    }
    for (var i = 0; i < uniformNames[1].length; ++i) {
      this.uniformPositions[1].push(gl.getUniformLocation(this.id, uniformNames[1][i]))
    }
  }
  static makeProgram(gl, name, attribNames, uniformNames) {
    return new ShaderProgram(gl, document.querySelector("#" + name + "-vert").textContent, document.querySelector("#" + name + "-frag").textContent, attribNames, uniformNames);
  }

  static loadShader(gl, type, source) {
    const id = gl.createShader(type);
    gl.shaderSource(id, source);
    gl.compileShader(id);
    if (!gl.getShaderParameter(id, gl.COMPILE_STATUS)) {
      alert("An error occurred compiling shader with type: " + type + "error: " + gl.getShaderInfoLog(vertShader));
      gl.deleteShader(id);
      this.id = -1;
      return;
    }
    return id;
  }
  enable(gl) {
    gl.useProgram(this.id);
  }
  setUniformf(gl, shader, pos, value) {
    gl.uniform1f(this.uniformPositions[shader][pos], value);
  }
  setUniform2f(gl, shader, pos, value) {
    gl.uniform2f(this.uniformPositions[shader][pos], new Float32Array([value.x, value.y]));
  }
  setUniform3f(gl, shader, pos, value) {
    gl.uniform3f(this.uniformPositions[shader][pos], new Float32Array([value.x, value.y, value.z]));
  }
  setUniform4f(gl, shader, pos, value) {
    gl.uniform4f(this.uniformPositions[shader][pos], new Float32Array([value.x, value.y, value.z, value.w]));
  }
  setUniformi(gl, shader, pos, value) {
    gl.uniform1i(this.uniformPositions[shader][pos], value);
  }
  setUnifromt(gl, shader, pos, value) {
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, value.id);
    gl.uniform1i(this.uniformPositions[shader][pos], 0);
  }
  setUniform4M(gl, shader, pos, value) {
    gl.uniformMatrix4fv(this.uniformPositions[shader][pos], false, new Float32Array([
      value.x.x, value.x.y, value.x.z, value.x.w,
      value.y.x, value.y.y, value.y.z, value.y.w,
      value.z.x, value.z.y, value.z.z, value.z.w,
      value.w.x, value.w.y, value.w.z, value.w.w
      ]))
  }
}
class Texture {
  //int id;
  constructor(gl, url) {
    const id = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, id);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array([0, 0, 255, 255]));
  
    const image = new Image();
    image.setAttribute('crossorigin', 'anonymous');
    image.onload = function() {
      gl.bindTexture(gl.TEXTURE_2D, id);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);

      if ((image.width & (image.width - 1)) == 0 && (image.height & (image.height - 1)) == 0) {
         gl.generateMipmap(gl.TEXTURE_2D);
      } else {
         gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
         gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
         gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      }
    };
    image.src = url;
    this.id = id;
  }
}
class Vector2 {
  //float x;
  //float y;
  constructor(x, y) {
    this.x = x;
    this.y = y;
  }
  dot(right) {
    return this.x * right.x + this.y * right.y;
  }
}
class Vector3 {
  //float x;
  //float y;
  //float z;
  constructor(x, y, z) {
    this.x = x;
    this.y = y;
    this.z = z;
  }
  dot(right) {
    return this.x * right.x + this.y * right.y + this.z * right.z;
  }
  cross(right, target) {
    if (target == null) {
      return new Vector3(this.y * right.z - this.z * right.y, this.z * right.x - this.x * right.z, this.x * right.y - this.y * right.x);
    }else {
      target.x = this.y * right.z - this.z * right.y;
      target.y = this.z * right.x - this.x * right.z;
      target.z = this.x * right.y - this.y * right.x;
      return target;
    }
  }
}
class Vector4 {
  //float x;
  //float y;
  //float z;
  //float w;
  constructor(x, y, z, w) {
    this.x = x;
    this.y = y;
    this.z = z;
    this.w = w;
  }
  dot(right) {
    return this.x * right.x + this.y * right.y + this.z * right.z + this.w * right.w;
  }
}
class Matrix4 {
  //Vector4 x;// [x.x y.x z.x w.x]
  //Vector4 y;// [x.y y.y z.y w.y]
  //Vector4 z;// [x.z y.z z.z w.z]
  //Vector4 w;// [x.w y.w z.w w.w]
  constructor(xx, yx, zx, wx, xy, yy, zy, wy, xz, yz, zz, wz, xw, yw, zw, ww) {
    this.x = new Vector4(xx, xy, xz, xw);
    this.y = new Vector4(yx, yy, yz, yw);
    this.z = new Vector4(zx, zy, zz, zw);
    this.w = new Vector4(wx, wy, wz, ww);
  }
  static setIdentity() {
    return new Matrix4(
      1, 0, 0, 0,
      0, 1, 0, 0,
      0, 0, 1, 0,
      0, 0, 0, 1
      );
  }
  static setOrthographic(width, height, close, far) {
    return new Matrix4(
      2/width, 0       , 0              , 0                           ,
      0      , 2/height, 0              , 0                           ,
      0      , 0       , 2/(close - far), -(far + close)/(far - close),
      0      , 0       , 0              , 1
      );
  }
  static set2D(width, height) {
    return new Matrix4(
      2/width, 0       , 0, 0 ,
      0      , 2/height, 0, 0 ,
      0      , 0       , 0, -1,
      0      , 0       , 0, 1
      );
  }
  static setPerspective(fov, aspectRatio, minRenderDist, maxRenderDist) {
    return new Matrix4(
      1/(aspectRatio * Math.tan(fov/2)), 0, 0, 0,
      0, 1/(Math.tan(fov/2)), 0, 0,
      0, 0, (maxRenderDist + minRenderDist)/(minRenderDist - maxRenderDist), 2 * maxRenderDist * minRenderDist/(minRenderDist - maxRenderDist),
      0, 0, -1, 0
      );
  }
  static setRotationX(theta) {
    return new Matrix4(
      1, 0              , 0               , 0,
      0, Math.cos(theta), -Math.sin(theta), 0,
      0, Math.sin(theta),  Math.cos(theta), 0,
      0, 0              , 0               , 1
      );
  }
  static setRotationY(theta) {
    return new Matrix4(
       Math.cos(theta), 0, Math.sin(theta), 0,
      0               , 1, 0              , 0,
      -Math.sin(theta), 0, Math.cos(theta) , 0,
      0, 0               , 0              , 1
      );
  }
  static setRotationZ(theta) {
    return new Matrix4(
      Math.cos(theta), -Math.sin(theta), 0, 0,
      Math.sin(theta),  Math.cos(theta), 0, 0,
      0              , 0               , 1, 0,
      0              , 0               , 0, 1
      );
  }
  static setTranslationXYZ(dx, dy, dz) {
    return new Matrix4(
      1, 0, 0, dx,
      0, 1, 0, dy,
      0, 0, 1, dz,
      0, 0, 0, 1
      );
  }
  static setTranslationX(dx) {
    return new Matrix4(
      1, 0, 0, dx,
      0, 1, 0, 0,
      0, 0, 1, 0,
      0, 0, 0, 1
      );
  }
  static setTranslationY(dy) {
    return new Matrix4(
      1, 0, 0, 0,
      0, 1, 0, dy,
      0, 0, 1, 0,
      0, 0, 0, 1
      );
  }
  static setTranslationZ(dz) {
    return new Matrix4(
      1, 0, 0, 0,
      0, 1, 0, 0,
      0, 0, 1, dz,
      0, 0, 0, 1
      );
  }
  static setScale(c) {
    return new Matrix4(
      c, 0, 0, 0,
      0, c, 0, 0,
      0, 0, c, 0,
      0, 0, 0, 1
      );
  }
  static setScaleX(c) {
    return new Matrix4(
      c, 0, 0, 0,
      0, 1, 0, 0,
      0, 0, 1, 0,
      0, 0, 0, 1
      );
  }
  static setScaleY(c) {
    return new Matrix4(
      1, 0, 0, 0,
      0, c, 0, 0,
      0, 0, 1, 0,
      0, 0, 0, 1
      );
  }
  static setScaleZ(c) {
    return new Matrix4(
      1, 0, 0, 0,
      0, 1, 0, 0,
      0, 0, c, 0,
      0, 0, 0, 1
      );
  }
  static setTranslation(t) {//Vector3 right
    return setTranslation(t.x, t.y, t.z);
  }
  mulV(right, target) {//Vector4 right;
    target.x = right.x * this.x.x + right.y * this.y.x + right.z * this.z.x + right.w * this.w.x;
    target.y = right.x * this.x.y + right.y * this.y.y + right.z * this.z.y + right.w * this.w.y;
    target.z = right.x * this.x.z + right.y * this.y.z + right.z * this.z.z + right.w * this.w.z;
    target.w = right.x * this.x.w + right.y * this.y.w + right.z * this.z.w + right.w * this.w.w;
    return target;
  }
  mulM(right, target) {//Matrix4 right;
    if (target == null) {
      const x = right.mulV(this.x);
      const y = right.mulV(this.y);
      const z = right.mulV(this.z);
      const w = right.mulV(this.w);
      return new Matrix4(
        x.x, y.x, z.x, w.x,
        x.y, y.y, z.y, w.y,
        x.z, y.z, z.z, w.z,
        x.w, y.w, z.w, w.w
        );
    } else {
      right.mulV(this.x, target.x);
      right.mulV(this.y, target.y);
      right.mulV(this.z, target.z);
      right.mulV(this.w, target.w);
      return target;
    }
  }
  rotateX(theta) {
    this.mulM(Matrix4.setRotationX(theta), this);
  }
  rotateY(theta) {
    this.mulM(Matrix4.setRotationY(theta), this);
  }
  rotateZ(theta) {
    this.mulM(Matrix4.setRotationZ(theta), this);
  }
  translateXYZ(dx, dy, dz) {
    this.mulM(Matrix4.setTranslationXYZ(dx, dy, dz), this);
  }
  translateX(dx) {
    this.mulM(Matrix4.setTranslationX(dx), this);
  }
  translateY(dy) {
    this.mulM(Matrix4.setTranslationY(dy), this);
  }
  translateZ(dz) {
    this.mulM(Matrix4.setTranslationZ(dz), this);
  }
  translate(t) {
    this.mulM(Matrix4.setTranslation(t), this);
  }
  scale(c) {
    this.mulM(Matrix4.setScale(c), this);
  }
  scaleX(c) {
    this.mulM(Matrix4.setScaleX(c), this);
  }
  scaleY(c) {
    this.mulM(Matrix4.setScaleY(c), this);
  }
  scaleZ(c) {
    this.mulM(Matrix4.setScaleZ(c), this);
  }
  log() {
    console.log(
      "[" + this.x.x + " " + this.y.x + " " + this.z.x + " " + this.w.x + "]\n" +
      "[" + this.x.y + " " + this.y.y + " " + this.z.y + " " + this.w.y + "]\n" +
      "[" + this.x.z + " " + this.y.z + " " + this.z.z + " " + this.w.z + "]\n" +
      "[" + this.x.w + " " + this.y.w + " " + this.z.w + " " + this.w.w + "]\n"
      )
  }
}

function goFullScreen() {
  if (gl.canvas.requestFullScreen) {
    gl.canvas.requestFullScreen();
  } else if (gl.canvas.mozRequestFullScreen) {
    gl.canvas.mozRequestFullScreen();
  } else if (gl.canvas.webkitRequestFullScreen) {
    gl.canvas.webkitRequestFullScreen();
  } else if (gl.canvas.msRequestFullScreen) {
    gl.canvas.msRequestFullScreen();
  }
  gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
}

function glSetup() {
  const canvas = document.querySelector("#glCanvas");

  const gl = canvas.getContext("webgl");
  if (gl === null) {
    alert("Unable to initialize WebGL. Your browser or machine may not support it.");
    return;
  }
  gl.clearColor(0.0, 0.0, 0.0, 1.0);
  return gl;
}

function main(gl) {
  gl.clear(gl.COLOR_BUFFER_BIT);
  
  var program = ShaderProgram.makeProgram(gl, "normal", ["vert", "textureCoordinates"], [["mat"], ["tex"]]);
  const vao = VAO.makeSquare(gl, 50, 50);

  const tex = new Texture(gl, "favicon.png");

  const matrix = Matrix4.set2D(100 * gl.canvas.width / gl.canvas.height, 100);
  matrix.log();

  function render(dTime) {
    gl.clear(gl.COLOR_BUFFER_BIT);
  
    program.enable(gl);

    program.setUnifromt(gl, 1, 0, tex);

    program.setUniform4M(gl, 0, 0, matrix);

    if (keys[65] > 0) {
      matrix.translateX(-0.01);
    }
    if (keys[68] > 0) {
      matrix.translateX(0.01);
    }
    if (keys[87] > 0) {
      matrix.translateY(0.01);
    }
    if (keys[83] > 0) {
      matrix.translateY(-0.01);
    }

    vao.fullRender(gl, program);
  }

  var lastFrameTime = 0;
  function loop(currentTime) {
    currentTime *= 0.001;
    const deltaTime = currentTime - lastFrameTime;
    lastFrameTime = currentTime;

    render(deltaTime);

    for (var i = 0; i < 349; ++i) {
      if (keys[i] == 2) {
        --keys[i];
      }
    }

    requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);
}
var keys = new Array(349);
for (var i = 0; i < 349; ++i) {
  keys[i] = 0;
}
document.addEventListener("keydown", function(event) {
    if (event.keyCode >= 0 && event.keyCode < 349) {
      keys[event.keyCode] = 2;
    }

});
document.addEventListener("keyup", function(event) {
    if (event.keyCode >= 0 && event.keyCode < 349) {
      keys[event.keyCode] = 0;
    }
});
const gl = glSetup();
main(gl);