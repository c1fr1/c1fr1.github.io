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
    1.0, 1.0, 1.0,
    1.0, 0.0, 0.0,
    0.0, 1.0, 0.0,
    0.0, 0.0, 1.0
    ]
    const indices = [0, 1, 2, 1, 2, 3];
    return new VAO([new VBO(gl, vertices, 2), new VBO(gl, colors, 3)], new IBO(gl, indices), indices.length);
    /*console.log(vertices);
    return new VAO([new VBO(gl, vertices, 2)], new IBO(gl, [0, 1, 2, 1, 2 ,3], 6));*/
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
  constructor(gl, vert, frag, attribNames) {
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
    for (var i = 0; i < attribNames.length;++i) {
      this.attribPositions.push(gl.getAttribLocation(this.id, attribNames[i]));
    }
  }
  static makeProgram(gl, name, attribNames) {
    return new ShaderProgram(gl, document.querySelector("#" + name + "-vert").textContent, document.querySelector("#" + name + "-frag").textContent, attribNames);
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
}

class Texture {
  //int id;
  //boolean loaded;
  constructor(gl, url) {
    const id = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, id);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array([0, 0, 255, 255]));
  
    const image = new Image();
    console.log("kek");
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
      console.log("kek");
    };
    image.src = url;
    this.id = id;
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
  
  var program = ShaderProgram.makeProgram(gl, "normal", ["vert", "clr"]);
  const vao = VAO.makeSquare(gl, 1, 1);

  gl.clear(gl.COLOR_BUFFER_BIT);
  
  program.enable(gl);

  vao.fullRender(gl, program);

  const tex = new Texture(gl, "favicon.png");
}
main();