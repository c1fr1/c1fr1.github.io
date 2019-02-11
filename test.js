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
      value.x.x, value.y.x, value.z.x, value.w.x,
      value.x.y, value.y.y, value.z.y, value.w.y,
      value.x.z, value.y.z, value.z.z, value.w.z,
      value.x.w, value.y.w, value.z.w, value.w.w
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
class Vector4f {
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
}
class Vector3f {
  //float x;
  //float y;
  //float z;
  constructor(x, y, z) {
    this.x = x;
    this.y = y;
    this.z = z;
  }
}
class Vector2f {
  //float x;
  //float y;
  constructor(x, y) {
    this.x = x;
    this.y = y;
  }
}
class Matrix4f {
  //Vector4f x;// [x.x y.x z.x w.x]
  //Vector4f y;// [x.y y.y z.y w.y]
  //Vector4f z;// [x.z y.z z.z w.z]
  //Vector4f w;// [x.w y.w z.w w.w]
  constructor(xx, yx, zx, wx, xy, yy, zy, wy, xz, yz, zz, wz, xw, yw, zw, ww) {
    this.x = new Vector4f(xx, xy, xz, xw);
    this.y = new Vector4f(yx, yy, yz, yw);
    this.z = new Vector4f(zx, zy, zz, zw);
    this.w = new Vector4f(wx, wy, wz, ww);
  }
  static setOrthographic(width, height, close, far) {
    return new Matrix4f(
      2/width, 0       , 0              , 0                           ,
      0      , 2/height, 0              , 0                           ,
      0      , 0       , 2/(close - far), -(far + close)/(far - close),
      0      , 0       , 0              , 1
      );
  }
  static set2D(width, height) {
    return new Matrix4f(
      2/width, 0       , 0, 0 ,
      0      , 2/height, 0, 0 ,
      0      , 0       , 0, -1,
      0      , 0       , 0, 1
      );
  }
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

function main() {
  const gl = glSetup();
  gl.clear(gl.COLOR_BUFFER_BIT);
  
  var program = ShaderProgram.makeProgram(gl, "normal", ["vert", "textureCoordinates"], [["mat"], ["tex"]]);
  const vao = VAO.makeSquare(gl, 1, 1);

  const tex = new Texture(gl, "favicon.png");

  const matrix = Matrix4f.set2D(2, 2);

  function render(gl) {
    gl.clear(gl.COLOR_BUFFER_BIT);
  
    program.enable(gl);

    program.setUnifromt(gl, 1, 0, tex);

    program.setUniform4M(gl, 0, 0, matrix);

    vao.fullRender(gl, program);
  }

  var lastFrameTime = 0;
  function loop(currentTime) {
    currentTime *= 0.001;
    const deltaTime = currentTime - lastFrameTime;
    lastFrameTime = currentTime;

    render(gl);

    requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);
}
main();