class VBO {
  //int id;
  //int dim;
  constructor(vertices, dim) {
    this.id = gl.createBuffer();
    this.dim = dim;
    gl.bindBuffer(gl.ARRAY_BUFFER, this.id);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);
  }
  bind(loc) {
    gl.bindBuffer(gl.ARRAY_BUFFER, this.id);
    gl.vertexAttribPointer(loc, this.dim, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(loc);
  }
}
class IBO {
  //int id;
  constructor(indices) {
    this.id = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.id);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indices), gl.STATIC_DRAW);
  }
  bind() {
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
  static makeVertices(vertices, dim, indices) {
    return new VAO([new VBO(vertices, dim)], new IBO(indices), indices.length);
  }
  static makeSquare(width, height) {
    const vertices = [
    -width/2,  height/2,
     width/2,  height/2,
    -width/2, -height/2,
     width/2, -height/2
    ]
    const textCoords = [
    0.0, 0.0,
    1.0, 0.0,
    0.0, 1.0,
    1.0, 1.0
    ]
    const indices = [0, 1, 2, 1, 2, 3];
    return new VAO([new VBO(vertices, 2), new VBO(textCoords, 2)], new IBO(indices), indices.length);
  }
  static makeTranslatedSquare(x, y, width, height) {
    const vertices = [
    x - width/2, y + height/2,
    x + width/2, y + height/2,
    x - width/2, y - height/2,
    x + width/2, y - height/2
    ]
    const textCoords = [
    0.0, 0.0,
    1.0, 0.0,
    0.0, 1.0,
    1.0, 1.0
    ]
    const indices = [0, 1, 2, 1, 2, 3];
    return new VAO([new VBO(vertices, 2), new VBO(textCoords, 2)], new IBO(indices), indices.length);
  }
  prepareRender(program) {
    for (var i = 0; i < this.vbos.length && i < program.attribPositions.length; ++i) {
      this.vbos[i].bind(program.attribPositions[i]);
    }
    this.ibo.bind();
  }
  draw() {
    gl.drawElements(gl.TRIANGLES, this.indexCount, gl.UNSIGNED_SHORT, 0);
  }
  fullRender(program) {
    this.prepareRender(program);
    this.draw();
  }
}
class ShaderProgram {
  //int id;
  //int[] attribPositions;
  //int[] vertUniformPositions;
  //int[] fragUniformPositions;
  constructor(vert, frag, attribNames, uniformNames) {
    const vertShader = ShaderProgram.loadShader(gl.VERTEX_SHADER, vert);
    const fragShader = ShaderProgram.loadShader(gl.FRAGMENT_SHADER, frag);

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
  static makeProgram(name, attribNames, uniformNames) {
    return new ShaderProgram(document.querySelector("#" + name + "-vert").textContent, document.querySelector("#" + name + "-frag").textContent, attribNames, uniformNames);
  }

  static loadShader(type, source) {
    const id = gl.createShader(type);
    gl.shaderSource(id, source);
    gl.compileShader(id);
    if (!gl.getShaderParameter(id, gl.COMPILE_STATUS)) {
      alert("An error occurred compiling shader with type: " + type + "error: " + gl.getShaderInfoLog(id));
      gl.deleteShader(id);
      this.id = -1;
      return;
    }
    return id;
  }
  enable() {
    gl.useProgram(this.id);
  }
  setUniformf(shader, pos, value) {
    gl.uniform1f(this.uniformPositions[shader][pos], value);
  }
  setUniform2f(shader, pos, value) {
    gl.uniform2f(this.uniformPositions[shader][pos], new Float32Array([value.x, value.y]));
  }
  setUniform3f(shader, pos, value) {
    gl.uniform3f(this.uniformPositions[shader][pos], new Float32Array([value.x, value.y, value.z]));
  }
  setUniform4f(shader, pos, value) {
    gl.uniform4f(this.uniformPositions[shader][pos],value.x, value.y, value.z, value.w);
  }
  setUniformi(shader, pos, value) {
    gl.uniform1i(this.uniformPositions[shader][pos], value);
  }
  setUnifromt(shader, pos, value) {
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, value.id);
    gl.uniform1i(this.uniformPositions[shader][pos], 0);
  }
  setUniform4M(shader, pos, value) {
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
  constructor(url) {
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
  add(right, target) {
    if (target == null) {
      return new Vector2(this.x + right.x, this.y + right.y);
    } else {
      target.x = this.x + right.x;
      target.y = this.y + right.y;
      return target;
    }
  }
  sub(right, target) {
    if (target == null) {
      return new Vector2(this.x - right.x, this.y - right.y);
    } else {
      target.x = this.x - right.x;
      target.y = this.y - right.y;
      return target;
    }
  }
  scale(factor, target) {
    if (target == null) {
      return new Vector2(this.x * factor, this.y * factor);
    } else {
      target.x = this.x * factor;
      target.y = this.y * factor;
      return target
    }
  }
  normalize(target) {
    const length = this.getLength();
    if (target == null) {
      return new Vector2(this.x / length, this.y / length);
    }else {
      target.x = this.x / length;
      target.y = this.y / length;
      return target;
    }
  }
  resize(size, target) {
    const length = size / this.getLength();
    if (target == null) {
      return new Vector2(length * this.x, length * this.y);
    }else {
      target.x = lenght * this.x;
      target.y = length * this.y;
      return target;
    }
  }
  dot(right) {
    return this.x * right.x + this.y * right.y;
  }
  getLengthSquared() {
    return this.x * this.x + this.y * this.y;
  }
  getLength() {
    return Math.sqrt(this.getLengthSquared());
  }
  linearlyInterpolate(other, t, target) {
    if (target == null) {
      return new Vector2(this.x + (other.x - this.x) * t, this.y + (other.y - this.y) * t);
    }else {
      target.x = this.x + (other.x - this.x) * t;
      target.y = this.y + (other.y - this.y) * t;
      return target;
    }
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
  add(right, target) {
    if (target == null) {
      return new Vector2(this.x + right.x, this.y + right.y, this.z + right.z);
    } else {
      target.x = this.x + right.x;
      target.y = this.y + right.y;
      target.z = this.z + right.z;
      return target;
    }
  }
  sub(right, target) {
    if (target == null) {
      return new Vector2(this.x - right.x, this.y - right.y, this.z - right.z);
    } else {
      target.x = this.x - right.x;
      target.y = this.y - right.y;
      target.z = this.z - right.z;
      return target;
    }
  }
  scale(factor, target) {
    if (target == null) {
      return new Vector2(this.x * factor, this.y * factor, this.z * factor);
    } else {
      target.x = this.x * factor;
      target.y = this.y * factor;
      target.z = this.z * factor;
      return target
    }
  }
  normalize(target) {
    const length = this.getLength();
    if (target == null) {
      return new Vector2(this.x / length, this.y / length, this.z / length);
    }else {
      target.x = this.x / length;
      target.y = this.y / length;
      target.z = this.z / length;
      return target;
    }
  }
  resize(size, target) {
    const length = size / this.getLength();
    if (target == null) {
      return new Vector2(length * this.x, length * this.y, length * this.z);
    }else {
      target.x = length * this.x;
      target.y = length * this.y;
      target.z = length * this.z;
      return target;
    }
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
  getLengthSquared() {
    return this.x * this.x + this.y * this.y + this.z * this.z;
  }
  getLength() {
    return Math.sqrt(this.getLengthSquared());
  }
  linearlyInterpolate(other, t, target) {
    if (target == null) {
      return new Vector2(this.x + (other.x - this.x) * t, this.y + (other.y - this.y) * t, this.z + (other.z - this.z) * t);
    }else {
      target.x = this.x + (other.x - this.x) * t;
      target.y = this.y + (other.y - this.y) * t;
      target.z = this.z + (other.z - this.z) * t;
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
  add(right, target) {
    if (target == null) {
      return new Vector2(this.x + right.x, this.y + right.y, this.z + right.z, this.w + right.w);
    } else {
      target.x = this.x + right.x;
      target.y = this.y + right.y;
      target.z = this.z + right.z;
      target.w = this.w + right.w;
      return target;
    }
  }
  sub(right, target) {
    if (target == null) {
      return new Vector2(this.x - right.x, this.y - right.y, this.z - right.z, this.w - right.w);
    } else {
      target.x = this.x - right.x;
      target.y = this.y - right.y;
      target.z = this.z - right.z;
      target.w = this.w - right.w;
      return target;
    }
  }
  scale(factor, target) {
    if (target == null) {
      return new Vector2(this.x * factor, this.y * factor, this.z * factor, this.w * factor);
    } else {
      target.x = this.x * factor;
      target.y = this.y * factor;
      target.z = this.z * factor;
      target.w = this.w * factor;
      return target
    }
  }
  normalize(target) {
    const length = this.getLength();
    if (target == null) {
      return new Vector2(this.x / length, this.y / length, this.z / length, this.w / length);
    }else {
      target.x = this.x / length;
      target.y = this.y / length;
      target.z = this.z / length;
      target.w = this.w / length;
      return target;
    }
  }
  resize(size, target) {
    const length = size / this.getLength();
    if (target == null) {
      return new Vector2(length * this.x, length * this.y, length * this.z, length * this.w);
    }else {
      target.x = length * this.x;
      target.y = length * this.y;
      target.z = length * this.z;
      target.w = length * this.w;
      return target;
    }
  }
  dot(right) {
    return this.x * right.x + this.y * right.y + this.z * right.z + this.w * right.w;
  }
  getLengthSquared() {
    return this.x * this.x + this.y * this.y + this.z * this.z + this.w *  this.w;
  }
  getLength() {
    return Math.sqrt(this.getLengthSquared());
  }
  linearlyInterpolate(other, t, target) {
    if (target == null) {
      return new Vector2(this.x + (other.x - this.x) * t, this.y + (other.y - this.y) * t, this.z + (other.z - this.z) * t, this.w + (other.w - this.w) * t);
    }else {
      target.x = this.x + (other.x - this.x) * t;
      target.y = this.y + (other.y - this.y) * t;
      target.z = this.z + (other.z - this.z) * t;
      target.w = this.w + (other.w - this.w) * t;
      return target;
    }
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
  static copy(other) {
    return new Matrix4(
      other.x.x, other.y.x, other.z.x, other.w.x,
      other.x.y, other.y.y, other.z.y, other.w.y,
      other.x.z, other.y.z, other.z.z, other.w.z,
      other.x.w, other.y.w, other.z.w, other.w.w
      );
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
    if (target != null) {
      target.x = right.x * this.x.x + right.y * this.y.x + right.z * this.z.x + right.w * this.w.x;
      target.y = right.x * this.x.y + right.y * this.y.y + right.z * this.z.y + right.w * this.w.y;
      target.z = right.x * this.x.z + right.y * this.y.z + right.z * this.z.z + right.w * this.w.z;
      target.w = right.x * this.x.w + right.y * this.y.w + right.z * this.z.w + right.w * this.w.w;
      return target;
    } else {
      const x = right.x * this.x.x + right.y * this.y.x + right.z * this.z.x + right.w * this.w.x;
      const y = right.x * this.x.y + right.y * this.y.y + right.z * this.z.y + right.w * this.w.y;
      const z = right.x * this.x.z + right.y * this.y.z + right.z * this.z.z + right.w * this.w.z;
      const w = right.x * this.x.w + right.y * this.y.w + right.z * this.z.w + right.w * this.w.w;
      return new Vector4(x, y, z, w);
    }
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
      const x = right.mulV(this.x);
      const y = right.mulV(this.y);
      const z = right.mulV(this.z);
      const w = right.mulV(this.w);
      target.x = x;
      target.y = y;
      target.z = z;
      target.w = w;
      return target;
    }
  }
  rotateX(theta) {
    return this.mulM(Matrix4.setRotationX(theta), this);
  }
  rotateY(theta) {
    return this.mulM(Matrix4.setRotationY(theta), this);
  }
  rotateZ(theta) {
    return this.mulM(Matrix4.setRotationZ(theta), this);
  }
  translateXYZ(dx, dy, dz) {
    return this.mulM(Matrix4.setTranslationXYZ(dx, dy, dz), this);
  }
  translateX(dx) {
    return this.mulM(Matrix4.setTranslationX(dx), this);
  }
  translateY(dy) {
    return this.mulM(Matrix4.setTranslationY(dy), this);
  }
  translateZ(dz) {
    return this.mulM(Matrix4.setTranslationZ(dz), this);
  }
  translate(t) {
    return this.mulM(Matrix4.setTranslation(t), this);
  }
  scale(c) {
    return this.mulM(Matrix4.setScale(c), this);
  }
  scaleX(c) {
    return this.mulM(Matrix4.setScaleX(c), this);
  }
  scaleY(c) {
    return this.mulM(Matrix4.setScaleY(c), this);
  }
  scaleZ(c) {
    return this.mulM(Matrix4.setScaleZ(c), this);
  }
  linearlyInterpolate(other, t, target) {
    if (target == null) {
      return new Matrix4(
        this.x.x + (other.x.x - this.x.x) * t, this.y.x + (other.y.x - this.y.x) * t, this.z.x + (other.z.x - this.z.x) * t, this.w.x + (other.w.x - this.w.x) * t,
        this.x.y + (other.x.y - this.x.y) * t, this.y.y + (other.y.y - this.y.y) * t, this.z.y + (other.z.y - this.z.y) * t, this.w.y + (other.w.y - this.w.y) * t,
        this.x.z + (other.x.z - this.x.z) * t, this.y.z + (other.y.z - this.y.z) * t, this.z.z + (other.z.z - this.z.z) * t, this.w.z + (other.w.z - this.w.z) * t,
        this.x.w + (other.x.w - this.x.w) * t, this.y.w + (other.y.w - this.y.w) * t, this.z.w + (other.z.w - this.z.w) * t, this.w.w + (other.w.w - this.w.w) * t,
        );
    }else {
      this.x.linearlyInterpolate(other.x, t, target.x);
      this.y.linearlyInterpolate(other.y, t, target.y);
      this.z.linearlyInterpolate(other.z, t, target.z);
      this.w.linearlyInterpolate(other.w, t, target.w);
      return target;
    }
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
}
function glSetup() {

  const gl = canvas.getContext("webgl");
  if (gl === null) {
    alert("Unable to initialize WebGL. Your browser or machine may not support it.");
    return;
  }
  gl.clearColor(0.1, 0.1, 0.1, 1.0);
  return gl;
}

const canvas = document.querySelector("#glCanvas");
var keys = new Array(349);
var mouseLeft = 0;
var mouseRight = 0;
var clientX = 0.0;
var clientY = 0.0;
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
canvas.addEventListener("mousedown", function(event) {
  if (event.which == 1) {
    mouseLeft = 3;
  }else if (event.which == 3) {
    mouseRight = 3;
  }
});
canvas.addEventListener("mouseup", function(event) {
  if (event.which == 1) {
    mouseLeft = 1;
  }else if (event.which == 3) {
    mouseRight = 1;
  }
});

canvas.onmousemove = (function(event) {
  const rect = canvas.getBoundingClientRect();
  if (rect.width > 721) {
    console.log("fullscreen");
    const aspectRatio = rect.width / rect.height;
    if (aspectRatio > 1.5) {
      //width > height
      const difference = (rect.width - 1.5 * rect.height) / 2;

      clientX = 2 * (event.pageX - rect.left - difference) / (1.5 * rect.height) - 1;
      clientY = -2 * (event.pageY - rect.top) / rect.height + 1;
    } else {
      const difference = (rect.height - (2 / 3) * rect.width) / 2;

      clientX = 2 * (event.pageX - rect.left) / (1.5 * rect.height) - 1;
      clientY = -2 * (event.pageY - rect.top - difference) / ((2 / 3) * rect.width) + 1;
    }
  } else {
    clientX = 2 * (event.pageX - rect.left) / rect.width - 1;
    clientY = -2 * (event.pageY - rect.top) / rect.height + 1;
  }
});

//start program

class Line {
  //Vector2 a;
  //Vector2 b;
  //Vector2 delta;
  //int intersections;
  constructor(a, b, lines) {
    if (lines == null) {
      this.intersections = 0;
      this.a = a;
      this.b = b;
      this.delta = b.sub(a);
    } else {
      this.a = a;
      this.b = b;
      this.delta = b.sub(a);
      this.intersections = 0;
      for (var i = 0; i < lines.length; ++i) {
        if (this.intersectsWith(lines[i])) {
          if (lines[i].intersections < 2) {
            ++this.intersections;
            ++lines[i].intersections;
          } else {
            lines[i].remove(lines, i);
            lines.splice(i, 1);
            --i;
          }
        }
      }
    }
  }
  static createNew(a, lines, cx, cy) {
    var b = new Vector2(clientX * 50 * gl.canvas.width / gl.canvas.height - cx, clientY * 50 - cy);
    var delta = b.sub(a);
    const length = delta.getLength();
    if (length > 30) {
      b = a.add(delta.scale(30 / length));
    }
    if (Line.countIntersections(a, b, lines) < 3) {
      return new Line(a, b, lines);
    }
  }
  static createRandom(centerX, centerY, lines) {
    const angle = 2 * Math.PI * Math.random();
    const fx = Math.random() * 600 + centerX - 300;
    const fy = Math.random() * 600 + centerY - 300;
    const distance = Math.random() * 25 + 25;
    const lx = fx + Math.cos(angle) * distance;
    const ly = fy + Math.sin(angle) * distance;
    return new Line(new Vector2(fx, fy), new Vector2(lx, ly), lines);
  }
  static createRandoms(num, centerX, centerY, lines) {
    for (var i = 0; i < num; ++i) {
      lines.push(Line.createRandom(centerX, centerY, lines));
    }
  }
  static checkIntersectPoints(a, b, c, d) {
    const abT = ((d.x - c.x) * (c.y - a.y) + (a.x - c.x) * (d.y - c.y)) / ((d.x - c.x) * (b.y - a.y) - (b.x - a.x) * (d.y - c.y));
    const cdT = ((b.x - a.x) * (a.y - c.y) + (c.x - a.x) * (b.y - a.y)) / ((b.x - a.x) * (d.y - c.y) - (d.x - c.x) * (b.y - a.y));
    if (abT > 0) {
      if (cdT > 0) {
        if (abT < 1) {
          if (cdT < 1) {
            return true;
          }
        }
      }
    }
    return false;
  }
  static checkIntersectLines(a, b) {
    const abT = (b.delta.x * (b.a.y - a.a.y) + b.delta.y * (a.a.x - b.a.x)) / (b.delta.x * a.delta.y - b.delta.y * a.delta.x);
    const cdT = (a.delta.x * (a.a.y - b.a.y) + a.delta.y * (b.a.x - a.a.x)) / (a.delta.x * b.delta.y - a.delta.y * b.delta.x);
    if (abT > 0) {
      if (cdT > 0) {
        if (abT < 1) {
          if (cdT < 1) {
            return true;
          }
        }
      }
    }
    return false;
  }
  static countIntersections(a, b, lines) {
    var ret = 0;
    for (var i = 0; i < lines.length; ++i) {
      if (Line.checkIntersectPoints(a, b, lines[i].a, lines[i].b)) {
        ++ret;
      }
    }
    return ret;
  }
  intersectsWith(other) {
    return Line.checkIntersectLines(this, other);
  }
  render(vao, mat, shader) {
    //scale rotate translate
    var nmat = Matrix4.setIdentity();
    nmat.scaleX(this.delta.getLength());
    nmat.rotateZ(Math.atan2(this.delta.y, this.delta.x));
    nmat.translateXYZ(this.a.x, this.a.y, 0);
    nmat.mulM(mat, nmat);
    shader.setUniform4M(0, 0, nmat);
    if (this.intersections >= 0) {
      shader.setUniform4f(1, 0, new Vector4(this.intersections / 2, 1 - this.intersections / 2, 0, 1));
    } else {
      shader.setUniform4f(1, 0, new Vector4(0, 0, 1 - this.intersections / 5, 1));
    }
    vao.draw();
  }
  remove(lines) {
    for (var i = 0; i < lines.length; ++i) {
      if (this.intersectsWith(lines[i])) {
        --lines[i].intersections;
      }
    }
  }
  static renderTemp(a, vao, mat, shader, lines) {
    var nmat = Matrix4.setIdentity();
    const delta = new Vector2((clientX - mat.w.x) * 50 * gl.canvas.width / gl.canvas.height - a.x, (clientY - mat.w.y) * 50 - a.y);

    var length = delta.getLength();
    if (length > 30) {
      delta.scale(30 / length, delta);
    }

    nmat.scaleX(delta.getLength());
    nmat.rotateZ(Math.atan2(delta.y, delta.x));
    nmat.translateXYZ(a.x, a.y, 0);
    nmat.mulM(mat, nmat);
    shader.setUniform4M(0, 0, nmat);

    const b = a.add(delta);
    if (Line.countIntersections(a, b, lines) < 3) {
      shader.setUniform4f(1, 0, new Vector4(0, 1, 0, 1));
    } else {
      shader.setUniform4f(1, 0, new Vector4(0.7, 0.7, 0.7, 1));
    }
    vao.draw();
  }
  static renderLines(a, vao, mat, shader, lines) {
    shader.enable();
    vao.prepareRender(shader);
    Line.renderTemp(a, vao, mat, shader, lines);
    for (var i = 0; i < lines.length; ++i) {
      lines[i].render(vao, mat, shader);
    }
  }
}

const gl = glSetup();
main();


function main() {
  gl.clear(gl.COLOR_BUFFER_BIT);
  
  var program = ShaderProgram.makeProgram("color", ["vert"], [["mat"], ["clr"]]);
  var firstVector = new Vector2(0, 0);
  var intersections = 0;
  var lineList = [];
  Line.createRandoms(200, 0, 0, lineList);
  for (var i = 0; i < lineList.length; ++i) {
    console.log(lineList.b);
  }
  const vao = VAO.makeTranslatedSquare(0.5, 0, 1, 1);

  const perspectiveMatrix = Matrix4.setOrthographic(100 * gl.canvas.width / gl.canvas.height, 100, 0, 1);
  var translationMatrix = Matrix4.setIdentity();

  function render(dTime) {

    const targetPos = firstVector.linearlyInterpolate(new Vector2(clientX * 50 * gl.canvas.width / gl.canvas.height - translationMatrix.w.x, clientY * 50 - translationMatrix.w.y), 0.25); 

    var targetCam = Matrix4.setTranslationXYZ(-targetPos.x, -targetPos.y, 0);
    translationMatrix.linearlyInterpolate(targetCam, 0.05, translationMatrix);

    const totalMatrix = translationMatrix.mulM(perspectiveMatrix);

    if (mouseLeft == 1) {
      const size = lineList.length;
      var n = Line.createNew(firstVector, lineList, translationMatrix.w.x, translationMatrix.w.y);
      intersections -= (size - lineList.length) * 2
      console.log(intersections - lineList.length);
      if (n != null) {
        lineList.push(n);
        firstVector = lineList[lineList.length - 1].b;
        intersections += n.intersections;
      }
    }//create line

    program.enable();
    vao.prepareRender(program);
    Line.renderTemp(firstVector, vao, totalMatrix, program, lineList);
    for (var i = 0; i < lineList.length; ++i) {
      lineList[i].render(vao, totalMatrix, program);
    }
  }

  var lastFrameTime = 0;
  function loop(currentTime) {

    currentTime *= 0.001;
    const deltaTime = currentTime - lastFrameTime;
    lastFrameTime = currentTime;

    gl.clear(gl.COLOR_BUFFER_BIT);

    render(deltaTime);

    for (var i = 0; i < 349; ++i) {
      if (keys[i] == 2) {
        --keys[i];
      }
    }
    if (mouseLeft % 2 == 1) {
      --mouseLeft;
    }
    if (mouseRight % 2 == 1) {
      --mouseRight;
    }

    requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);
}