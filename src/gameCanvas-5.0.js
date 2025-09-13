"use strict";

export default class GameCanvas {
  /*

    GameCanvas.js
    Version 5.1

    By Alfons Nilsson

  */
  
  constructor(settings = {}) {
    if (settings.hasOwnProperty("elementID")) {
      var element = document.getElementById(settings.elementID);
      if (typeof element !== "undefined" && element !== null) {
        if (element instanceof HTMLCanvasElement)
          this.canvas = element;
        else
          throw Error("Element is not a canvas!");
      }
      else
        throw Error("No element with the id '" + settings.elementID + "' was found!");
    }
    else if (settings.hasOwnProperty("elementClass")) {
      var element = document.getElementsByClassName(settings.elementClass)[0];
      if (typeof element !== "undefined" && element !== null) {
        if (element instanceof HTMLCanvasElement)
          this.canvas = element;
        else
          throw Error("Element is not a canvas!");
      }
      else
        throw Error("No element with the class '" + settings.elementClass + "' was found!");
    }
    else if (settings.hasOwnProperty("element")) {
      var element = settings.element;
      if (typeof element !== "undefined" && element !== null) {
        if (element instanceof HTMLCanvasElement)
          this.canvas = element;
        else
          throw Error("Element '" + element + "' is not a canvas!");
      }
      else
        throw Error("Element is null or undefined!");
    }
    else {
      this.canvas = document.createElement("canvas");
      document.body.appendChild(this.canvas);
    }

    if (settings.hasOwnProperty("width")) {
      if (!isNaN(settings.width))
        this.canvas.width = settings.width;
      else
        throw Error("Width is not a number: " + settings.width);
    }
    if (settings.hasOwnProperty("height")) {
      if (!isNaN(settings.height))
        this.canvas.height = settings.height;
      else
        throw Error("Height is not a number: " + settings.height);
    }

    if (!settings.hasOwnProperty("width") && !settings.hasOwnProperty("height") &&
        (!settings.hasOwnProperty("noFullscreen") ||
         (settings.hasOwnProperty("noFullscreen") && !settings.noFullscreen))) {
      this.canvas.width = Math.ceil(window.innerWidth) + 1;
      this.canvas.height = Math.ceil(window.innerHeight) + 1;

      this.canvas.style.position = "absolute";
      this.canvas.style.top = "0";
      this.canvas.style.bottom = "0";
      this.canvas.style.left = "0";
      this.canvas.style.right = "0";

      document.body.style.overflow = "hidden";

      this.disableContextMenu = settings.hasOwnProperty("disableContextMenu") ? settings.disableContextMenu : true;
      this.disableMiddleMouse = settings.hasOwnProperty("disableMiddleMouse") ? settings.disableMiddleMouse : true;
      this.disableScrollOnMobile = settings.hasOwnProperty("disableScrollOnMobile") ? settings.disableScrollOnMobile : true;
      this.disableKeyShortcuts = settings.hasOwnProperty("disableKeyShortcuts") ? settings.disableKeyShortcuts : false;
      this.updateCanvasSizeOnResize = settings.hasOwnProperty("updateCanvasSizeOnResize") ? settings.updateCanvasSizeOnResize : true;
      this.publicMethods = settings.hasOwnProperty("publicMethods") ? settings.publicMethods : true;
    }
    else {
      this.disableContextMenu = settings.hasOwnProperty("disableContextMenu") ? settings.disableContextMenu : false;
      this.disableMiddleMouse = settings.hasOwnProperty("disableMiddleMouse") ? settings.disableMiddleMouse : false;
      this.disableScrollOnMobile = settings.hasOwnProperty("disableScrollOnMobile") ? settings.disableScrollOnMobile : false;
      this.disableKeyShortcuts = settings.hasOwnProperty("disableKeyShortcuts") ? settings.disableKeyShortcuts : false;
      this.updateCanvasSizeOnResize = settings.hasOwnProperty("updateCanvasSizeOnResize") ? settings.updateCanvasSizeOnResize : false;
      this.publicMethods = settings.hasOwnProperty("publicMethods") ? settings.publicMethods : true;
    }

    this.ctx = this.canvas.getContext("2d");

    this.font = "Arial";
    this.images = [];
    this.imageData = undefined;
    this.imageDataData = undefined;
    this.audioContext = new (window.AudioContext || window.webkitAudioContext)();

    this.keys = {
      keysDown: [],
      ctrlPressed: false,
      shiftSPressed: false,
      altPressed: false
    };
    this.mouse = {
      x: 0, y: 0, lastX: 0, lastY: 0, movementX: 0, movementY: 0, left: false, right: false, middle: false, any: false
    };
    this.mouseLookupTable = [
      "left",
      "middle",
      "right"
    ];
    this.touch = {
      x: 0,
      y: 0,
      isTouching: false,
      nrTouches: 0,
      touches: []
    };

    this.eventFunctions = {
      "mousedown": typeof OnMouseDown !== "undefined",
      "mouseup": typeof OnMouseUp !== "undefined",
      "mousemove": typeof OnMouseMove !== "undefined",
      "contextmenu": typeof OnContextMenu !== "undefined",
      "touchstart": typeof OnTouchStart !== "undefined",
      "touchend": typeof OnTouchEnd !== "undefined",
      "touchmove": typeof OnTouchMove !== "undefined",
      "keydown": typeof OnKeyDown !== "undefined",
      "keyup": typeof OnKeyUp !== "undefined",
      "resize": typeof OnResize !== "undefined"
    };
    
    this.ENUM = {
      LINECAP: {
        DEFAULT: "butt",
        BUTT: "butt",
        ROUND: "round",
        SQUARE: "square"
      },
      TEXTALIGN: {
        X: {
          DEFAULT: "start",
          START: "start",
          END: "end",
          CENTER: "center",
          LEFT: "left",
          RIGHT: "right"
        },
        Y: {
          DEFAULT: "alphabetic",
          ALPHABETIC: "alphabetic",
          TOP: "top",
          HANGING: "hanging",
          MIDDLE: "middle",
          CENTER: "middle",
          IDEOGRAPHIC: "ideographic",
          BOTTOM: "bottom"
        }
      }
    }

    /*

      Key events

    */

    document.addEventListener("keydown", event => {
      this.keys.altPressed = event.altKey;
      this.keys.shiftPressed = event.shiftKey;
      this.keys.ctrlPressed = event.ctrlKey;

      this.keys.keysDown[event.key] = this.keys.keysDown[event.keyCode] = this.keys.keysDown[event.code] = true;
      this.eventFunctions["keydown"] && OnKeyDown(event);

      if (this.disableKeyShortcuts) {
        event.preventDefault();
        return false;
      }
    });
    document.addEventListener("keyup", event => {
      this.keys.altPressed = event.altKey;
      this.keys.shiftPressed = event.shiftKey;
      this.keys.ctrlPressed = event.ctrlKey;

      this.keys.keysDown[event.key] = this.keys.keysDown[event.keyCode] = this.keys.keysDown[event.code] = false;
      this.eventFunctions["keyup"] && OnKeyUp(event);
    });

    /*

      Mouse events

    */

    this.canvas.addEventListener("mousemove", event => {
      let br = this.canvas.getBoundingClientRect();
      this.mouse.x = (event.clientX - br.left) / (br.width / this.width);
      this.mouse.y = (event.clientY - br.top) / (br.height / this.height);
      this.mouse.movementX = event.movementX;
      this.mouse.movementY = event.movementY;

      this.eventFunctions["mousemove"] && OnMouseMove(event);
    });

    this.canvas.addEventListener("mousedown", event => {
      let button = event.button;
      if (button < 3)
        this.mouse[this.mouseLookupTable[button]] = true;
      this.mouse.any = this.mouse.left || this.mouse.right || this.mouse.middle;

      /*if (!this.audioContext)
        this.audioContext = new (window.AudioContext || window.webkitAudioContext)();*/

      this.eventFunctions["mousedown"] && OnMouseDown(event);

      if (button == 1 && this.disableMiddleMouse) {
        event.preventDefault();
        return false;
      }
    });

    this.canvas.addEventListener("mouseup", event => {
      let button = event.button;
      if (button < 3)
        this.mouse[this.mouseLookupTable[button]] = false;
      this.mouse.any = this.mouse.left || this.mouse.right || this.mouse.middle || this.touch.touches.length > 0;

      this.eventFunctions["mouseup"] && OnMouseUp(event);
    });

    this.canvas.addEventListener("contextmenu", event => {
      this.eventFunctions["contextmenu"] && OnContextMenu(event);

      if (this.disableContextMenu) {
        event.preventDefault();
        return false;
      }
      return true;
    });

    /*

      Touch events

    */

    this.updateTouches = function(event) {
      let br = this.canvas.getBoundingClientRect();

      this.touch.touches = [];
      for (let i = 0; i < event.touches.length; i++) {
        var e = event.touches[i];
        var x = (e.pageX - br.left) / (br.width / this.width);
        var y = (e.pageY - br.top) / (br.height / this.height);
        this.touch.touches[i] = {x, y, id: e.identifier, force: e.force, radiusX: e.radiusX, radiusY: e.radiusY, rotationAngle: e.rotationAngle};
      }
    }

    this.canvas.addEventListener("touchmove", event => {
      if (this.disableScrollOnMobile)
        event.preventDefault();

      this.updateTouches(event);
      this.touch.x = this.touch.touches[0].x;
      this.touch.y = this.touch.touches[0].y;

      this.eventFunctions["touchmove"] && OnTouchMove(event);
    });
    this.canvas.addEventListener("touchstart", event => {
      if (this.disableScrollOnMobile)
        event.preventDefault();

      this.updateTouches(event);
      this.touch.x = this.touch.touches[0].x;
      this.touch.y = this.touch.touches[0].y;
      this.touch.isTouching = true;
      this.mouse.any = true;

      /*if (!this.audioContext)
        this.audioContext = new (window.AudioContext || window.webkitAudioContext)();*/

      this.eventFunctions["touchstart"] && OnTouchStart(event);
    });
    this.canvas.addEventListener("touchend", event => {
      if (this.disableScrollOnMobile)
        event.preventDefault();

      this.updateTouches(event);
      this.touch.isTouching = this.touch.touches.length > 0;
      this.mouse.any = this.mouse.left || this.mouse.right || this.mouse.middle || this.touch.touches.length > 0;

      this.eventFunctions["touchend"] && OnTouchEnd(event);
    });
    
    /*
    
      Resize event
    
    */
    
    window.addEventListener('resize', event => {
      if (this.updateCanvasSizeOnResize) {
        this.width = Math.ceil(window.innerWidth) + 1;
        this.height = Math.ceil(window.innerHeight) + 1;
      }
      
      this.eventFunctions["resize"] && OnResize(event);
    });
    
    /*
    
      Helper functions
    
    */
    
    this.isPassed = function(x) {
      return typeof x !== "undefined";
    }

    if (this.publicMethods) {
      var methods = Object.getOwnPropertyNames(GameCanvas.prototype);
      for (var method of methods) {
        if (!["constructor", "width", "height"].includes(method))
          window[method] = this[method].bind(this);
      }

      var gettersetters = ["width", "height"];
      var getters = ["mouse", "touch"];

      for (var gettersetter of gettersetters) {
        Object.defineProperty(window, gettersetter, {
          get: (function(top, prop) {
            return function() {
              return top[prop];
            };
          })(this, gettersetter),
          set: (function(top, prop) {
            return function(x) {
              top[prop] = x;
            };
          })(this, gettersetter),
          configurable: true,
        });
      }

      for (var getter of getters) {
        Object.defineProperty(window, getter, {
          get: (function(top, prop) {
            return function() {
              return top[prop];
            };
          })(this, getter),
          configurable: true,
        });
      }
    }
  }

  get width() {
    return this.canvas.width;
  }
  get height() {
    return this.canvas.height;
  }
  set width(w) {
    this.canvas.width = w;
  }
  set height(h) {
    this.canvas.height = h;
  }

  /*

    Fullscreen and pointer lock

  */

  requestFullscreen() {
    if (this.canvas.requestFullscreen)
      this.canvas.requestFullscreen();
    else if (this.canvas.mozRequestFullScreen)
      this.canvas.mozRequestFullScreen();
    else if (this.canvas.webkitRequestFullscreen)
      this.canvas.webkitRequestFullscreen();
    else if (this.canvas.msRequestFullscreen)
      this.canvas.msRequestFullscreen();
  }
  exitFullscreen() {
    if(document.exitFullscreen)
      document.exitFullscreen();
    else if(document.mozCancelFullScreen)
      document.mozCancelFullScreen();
    else if(document.webkitExitFullscreen)
      document.webkitExitFullscreen();
    else if(document.msExitFullscreen)
      document.msExitFullscreen();
  }
  lockPointer() {
    this.canvas.requestPointerLock = this.canvas.requestPointerLock || this.canvas.mozRequestPointerLock;
    this.canvas.requestPointerLock();
  }
  unlockPointer() {
    document.exitPointerLock = document.exitPointerLock || document.mozExitPointerLock;
    document.exitPointerLock();
  }

  /*

    Render functions

  */

  clearScreen() {
    this.ctx.clearRect(0, 0, this.width, this.height);
  }

  background(color) {
    this.ctx.fillStyle = color;
    this.ctx.fillRect(0, 0, this.width, this.height);
  }

  arc(x, y, radius, startAngle, endAngle, counterclockwise) {
    this.ctx.arc(x, y, radius, startAngle, endAngle, counterclockwise)
  }

  circle(x, y, radius, color, strokeColor, lineWidth) {
    this.ctx.beginPath();
    this.ctx.arc(x, y, radius, 0, Math.PI * 2);
    this.ctx.fillStyle = color;
    if (strokeColor) this.ctx.strokeStyle = strokeColor;
    if (lineWidth) this.ctx.lineWidth = lineWidth;
    this.ctx.fill();
    if (strokeColor) this.ctx.stroke();
  }

  ring(x, y, radius, color, lineWidth) {
    this.ctx.beginPath();
    this.ctx.arc(x, y, radius, 0, Math.PI * 2);
    this.ctx.strokeStyle = color;
    if (lineWidth) this.ctx.lineWidth = lineWidth;
    this.ctx.stroke();
  }

  ellipse(x, y, radiusX, radiusY, color, rotation = 0, strokeColor, lineWidth) {
    this.ctx.beginPath();
    this.ctx.ellipse(x, y, radiusX, radiusY, rotation, 0, Math.PI * 2);
    this.ctx.fillStyle = color;
    if (strokeColor) this.ctx.strokeStyle = strokeColor;
    if (lineWidth) this.ctx.lineWidth = lineWidth;
    this.ctx.fill();
    if (strokeColor) this.ctx.stroke();
  }

  rectangle(x, y, width, height, color, strokeColor, lineWidth) {
    if (color) this.ctx.fillStyle = color;
    if (lineWidth) this.ctx.lineWidth = lineWidth;
    if (strokeColor) {
      this.ctx.beginPath();
      this.ctx.strokeStyle = strokeColor;
      this.ctx.rect(x, y, width, height);
      if (color) this.ctx.fill();
      this.ctx.stroke();
    }
    else
      this.ctx.fillRect(x, y, width, height);
  }

  roundedRectangle(x, y, w, h, color, cornerRadii, strokeColor, lineWidth) {
    if (typeof cornerRadii === "number") cornerRadii = [cornerRadii, cornerRadii, cornerRadii, cornerRadii];
    this.ctx.beginPath();
    this.ctx.arc(x + cornerRadii[0], y + cornerRadii[0], cornerRadii[0], Math.PI, Math.PI * 1.5);
    this.ctx.lineTo(x + w - cornerRadii[1], y);
    this.ctx.arc(x + w - cornerRadii[1], y + cornerRadii[1], cornerRadii[1], Math.PI * 1.5, Math.PI * 2);
    this.ctx.lineTo(x + w, y + h - cornerRadii[2]);
    this.ctx.arc(x + w - cornerRadii[2], y + h - cornerRadii[2], cornerRadii[2], 0, Math.PI * 0.5);
    this.ctx.lineTo(x + cornerRadii[3], y + h);
    this.ctx.arc(x + cornerRadii[3], y + h - cornerRadii[3], cornerRadii[3], Math.PI * 0.5, Math.PI);
    this.ctx.closePath();
    if (strokeColor) {
      if (lineWidth) this.ctx.lineWidth = lineWidth;
      this.ctx.strokeStyle = strokeColor;
      this.ctx.stroke();
    }
    this.ctx.fillStyle = color;
    this.ctx.fill();
  }

  triangle(x1, y1, x2, y2, x3, y3, color, strokeColor, lineWidth) {
    this.ctx.beginPath();
    this.ctx.moveTo(x1, y1);
    this.ctx.lineTo(x2, y2);
    this.ctx.lineTo(x3, y3);
    this.ctx.closePath();
    this.ctx.fillStyle = color;
    if (lineWidth) this.ctx.lineWidth = lineWidth;
    this.ctx.fill();
    if (strokeColor) {
      this.ctx.strokeStyle = strokeColor;
      this.ctx.stroke();
    }
  }

  line(x1, y1, x2, y2, color, strokeWeight) {
    this.ctx.beginPath();
    this.ctx.moveTo(x1, y1);
    this.ctx.lineTo(x2, y2);
    if (color) this.ctx.strokeStyle = color;
    if (strokeWeight) this.ctx.lineWidth = strokeWeight;
    this.ctx.stroke();
  }

  clippedPicture(url, sx, sy, swidth, sheight, x, y, width, height) {
    var imageElement = this.images[url];
    if (!imageElement) {
      var img = new Image();
      img.src = url;
      img.onload = () => {
        width = width || img.width;
        height = height || img.height;
        this.ctx.drawImage(img, sx, sy, swidth, sheight, x, y, width, height);
      }
      this.images[url] = img;
    }
    else if (imageElement.complete && imageElement.naturalWidth !== 0) {
      width = width || imageElement.width;
      height = height || imageElement.height;
      this.ctx.drawImage(imageElement, sx, sy, swidth, sheight, x, y, width, height);
    }
  }

  picture(url, x, y, width, height) {
    var imageElement = this.images[url];
    if (!imageElement) {
      var img = new Image();
      img.src = url;
      img.onload = () => {
        width = width || img.width;
        height = height || img.height;
        this.ctx.drawImage(img, x, y, width, height);
      }
      this.images[url] = img;
    }
    else if (imageElement.complete) {
      width = width || imageElement.width;
      height = height || imageElement.height;
      this.ctx.drawImage(imageElement, x, y, width, height);
    }
  }

  text(textString, x, y, fontSize, color, strokeColor, lineWidth) {
    this.ctx.beginPath();
    this.ctx.font = fontSize + "px " + this.font;
    this.ctx.fillStyle = color;
    if (lineWidth) this.ctx.lineWidth = lineWidth;
    this.ctx.fillText(textString, x, y);
    if (strokeColor) {
      this.ctx.strokeStyle = strokeColor;
      this.ctx.strokeText(textString, x, y);
    }
  }

  drawVector(x, y, vector, length = 1, color = "black") {
    var triangleScale = 7;

    var normalizedVector = this.normalizeVector(vector);
    var rotatedNormVector = {
      x: -normalizedVector.y,
      y: normalizedVector.x
    }

    var endX = x + normalizedVector.x * length;
    var endY = y + normalizedVector.y * length;
    this.line(x, y, endX, endY, 3, color);
    this.triangle(endX, endY, endX - normalizedVector.x * triangleScale + rotatedNormVector.x * triangleScale, endY - normalizedVector.y * triangleScale + rotatedNormVector.y * triangleScale, endX - normalizedVector.x * triangleScale - rotatedNormVector.x * triangleScale, endY - normalizedVector.y * triangleScale - rotatedNormVector.y * triangleScale, color);
  }
  
  polygon(points, x, y, closedPath, fillColor, strokeColor, lineWidth) {
    this.ctx.beginPath();
    this.ctx.moveTo(points[0].x + x, points[0].y + y);
    for (var i = 1; i < points.length; i++) {
      var p = points[i];
      this.ctx.lineTo(p.x + x, p.y + y);
    }
    if (closedPath) this.ctx.closePath();
    if (fillColor) {
      this.ctx.fillStyle = fillColor;
      this.ctx.fill();
    }
    if (strokeColor) {
      if (lineWidth) this.ctx.lineWidth = lineWidth;
      this.ctx.strokeStyle = strokeColor;
      this.ctx.stroke();
    }
  }
  
  rgb(r = 0, g = 0, b = 0) {
    return `rgb(${r}, ${g}, ${b})`;
  }

  /*

    Pixel manipulation

  */

  getPixelData() {
    this.imageData = this.ctx.getImageData(0, 0, this.width, this.height);
    this.imageDataData = this.imageData.data;
  }

  updatePixel(x, y, r, g, b, a = 255) {
    let i = (x + y * this.width) * 4;
    this.imageDataData[i] = r;
    this.imageDataData[i + 1] = g;
    this.imageDataData[i + 2] = b;
    this.imageDataData[i + 3] = a;
  }

  updatePixelIndex(index, r, g, b, a = 255) {
    var i = index * 4;
    this.imageDataData[i] = r;
    this.imageDataData[i + 1] = g;
    this.imageDataData[i + 2] = b;
    this.imageDataData[i + 3] = a;
  }

  getPixel(x, y) {
    let i = (x + y * this.width) * 4;
    return [
      this.imageDataData[i],
      this.imageDataData[i + 1],
      this.imageDataData[i + 2],
      this.imageDataData[i + 3]
    ];
  }

  getPixelIndex(index) {
    let i = index * 4;
    return [
      this.imageDataData[i],
      this.imageDataData[i + 1],
      this.imageDataData[i + 2],
      this.imageDataData[i + 3]
    ];
  }

  renderPixelData() {
    /*createImageBitmap(this.imageData).then(function(imgBitmap) {
      this.ctx.drawImage(imgBitmap, 0, 0);
    });*/

    this.ctx.putImageData(this.imageData, 0, 0);
  }

  /*

    Coordinate system transform

  */

  save() {
    this.ctx.save();
  }

  restore() {
    this.ctx.restore();
  }

  rotate(angle) {
    this.ctx.rotate(angle);
  }

  translate(x, y) {
    this.ctx.translate(x, y);
  }

  /*

    Paths

  */

  beginPath() {
    this.ctx.beginPath();
  }

  closePath() {
    this.ctx.closePath();
  }

  moveTo(x, y) {
    this.ctx.moveTo(x, y);
  }

  lineTo(x, y) {
    this.ctx.lineTo(x, y);
  }

  quadraticCurveTo(cpx, cpy, x, y) {
    this.ctx.quadraticCurveTo(cpx, cpy, x, y);
  }

  quadraticTo(cpx, cpy, x, y) {
    this.ctx.quadraticCurveTo(cpx, cpy, x, y);
  }

  bezierCurveTo(cp1x, cp1y, cp2x, cp2y, x, y) {
    this.ctx.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, x, y);
  }

  bezierTo(cp1x, cp1y, cp2x, cp2y, x, y) {
    this.ctx.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, x, y);
  }

  fill() {
    this.ctx.fill();
  }

  stroke() {
    this.ctx.stroke();
  }

  fillStyle(color) {
    this.ctx.fillStyle = color;
  }

  strokeStyle(color) {
    this.ctx.strokeStyle = color;
  }

  setLineWidth(lineWidth) {
    this.ctx.lineWidth = lineWidth;
  }

  lineWidth(lineWidth) {
    this.ctx.lineWidth = lineWidth;
  }

  strokeWeight(lineWidth) {
    this.ctx.lineWidth = lineWidth;
  }

  setLineCap(lineCap) {
    this.ctx.lineCap = lineCap;
  }

  resetLineCap() {
    this.ctx.lineCap = "butt";
  }

  setFont(font) {
    this.font = font;
  }

  setTextAlign(align) {
    this.ctx.textAlign = align;
  }

  setTextXAlign(align) {
    this.ctx.textAlign = align;
  }

  setTextAlignX(align) {
    this.ctx.textAlign = align;
  }

  setTextYAlign(align) {
    this.ctx.textBaseline = align;
  }

  setTextAlignY(align) {
    this.ctx.textBaseline = align;
  }

  resetTextXAlign() {
    this.ctx.textAlign = "left";
  }

  resetTextAlignX() {
    this.ctx.textAlign = "left";
  }

  resetTextYAlign() {
    this.ctx.textBaseline = "alphabetic";
  }

  resetTextAlignY() {
    this.ctx.textBaseline = "alphabetic";
  }

  clip() {
    this.ctx.clip();
  }

  /*

    Audio

  */

  createSound(url, volume = 1, startTime = 0, looping = false) {
    var audio = new Audio(url);
    audio.loop = looping;
    audio.currentTime = startTime;
    audio.volume = volume;

    return {
      volume,
      startTime,
      audio
    };
  }

  playSound(sound) {
    sound.audio.currentTime = sound.startTime;
    sound.audio.volume = sound.volume;
    sound.audio.play();
  }

  stopSound(sound) {
    sound.audio.stop();
  }

  pauseSound(sound) {
    sound.audio.pause();
  }

  backgroundMusic(url) {
    var audio = new Audio(url);
    audio.loop = true;
    audio.play();
    return audio;
  }

  fadeOutSound(sound, time = 1) {
    var startVolume = sound.volume;
    var count = 0;
    var interv = setInterval(() => {
      sound.audio.volume = (startVolume / (time * 20)) * (time * 20 - count);
      count++;
      if (count > time * 20) {
        sound.audio.pause();
        clearInterval(interv);
      }
    }, 50);
  }

  playTone(freq = 440, time = 1, volume = 1, type = "sine") {
    var oscillator = this.audioContext.createOscillator();

    var gainNode = this.audioContext.createGain()
    gainNode.gain.value = volume;
    gainNode.connect(this.audioContext.destination);

    oscillator.type = type;
    oscillator.frequency.value = freq;
    oscillator.connect(gainNode);
    oscillator.start();

    setTimeout(() => {
      oscillator.stop();
    }, time * 1000);
  }

  /*

    Math

  */

  getDistanceSqr(x1, y1, x2, y2) {
    var a = x1 - x2;
    var b = y1 - y2;
    return a * a + b * b;
  }

  getDistanceSqr3D(x1, y1, x2, y2, z1, z2) {
    var a = x1 - x2;
    var b = y1 - y2;
    var c = z1 - z2;
    return a * a + b * b + c * c;
  }

  getDistance(x1, y1, x2, y2) {
    return Math.sqrt(top.getDistanceSqr(x1, y1, x2, y2));
  }

  getDistance3D(x1, y1, x2, y2, z1, z2) {
    return Math.sqrt(top.getDistanceSqr3D(x1, y1, x2, y2, z1, z2));
  }

  getAngle(x1, y1, x2, y2) {
    return Math.atan2(y2 - y1, x2 - x1);
  }

  normalize(x, y) {
    var len = Math.sqrt(x * x + y * y);
    return {
      x: x / len,
      y: y / len
    };
  }

  normalizeVector(v) {
    var len = Math.sqrt(v.x * v.x + v.y * v.y);
    return {
      x: v.x / len,
      y: v.y / len
    };
  }

  normalize3D(x, y, z) {
    var len = Math.sqrt(x * x + y * y + z * z);
    return {
      x: x / len,
      y: y / len,
      z: z / len
    };
  }

  normalize3DVector(x) {
    var len = Math.sqrt(x.x * x.x + x.y * x.y + x.z * x.z);
    return {
      x: x.x / len,
      y: x.y / len,
      z: x.z / len
    };
  }

  lengthVector(v) {
    return Math.sqrt(v.x * v.x + v.y * v.y);
  }

  length3DVector(v) {
    return Math.sqrt(v.x * v.x + v.y * v.y + v.z * v.z);
  }

  dot(a, b) {
    return a.x * b.x + a.y * b.y;
  }

  dot3D(a, b) {
    return a.x * b.x + a.y * b.y + a.z * b.z;
  }

  crossProduct3D(v1, v2) {
    return {
      x: v1.y * v2.z - v1.z * v2.y,
      y: v1.z * v2.x - v1.x * v2.z,
      z: v1.x * v2.y - v1.y * v2.x
    }
  }
  
  clamp(x, a, b) {
    return Math.max(a, Math.min(b, x));
  }
  
  lerp(x, y, t) {
    return x * (1 - t) + y * t;
  }

  /*

    Intersection detection

  */

  rectanglesIntersect(x1, y1, w1, h1, x2, y2, w2, h2) {
    return x1 + w1 > x2 && x1 < x2 + w2 && y1 + h1 > y2 && y1 < y2 + h2;
  }

  circlesIntersect(x1, y1, r1, x2, y2, r2) {
    return this.getDistance(x1, y1, x2, y2) < r1 + r2;
  }

  circleRectangleIntersect(x1, y1, r1, x2, y2, w2, h2) {
    var circleDistanceX = Math.abs(x1 - (x2 + w2 / 2));
    var circleDistanceY = Math.abs(y1 - (y2 + h2 / 2));

    if (circleDistanceX > (w2 / 2 + r1)) return false;
    if (circleDistanceY > (h2 / 2 + r1)) return false;

    if (circleDistanceX <= (w2 / 2)) return true; 
    if (circleDistanceY <= (h2 / 2)) return true;

    var a = circleDistanceX - w2 / 2;
    var b = circleDistanceY - h2 / 2;
    var cornerDistance_sq = a * a + b * b;

    return cornerDistance_sq <= (r1 * r1);
  }

  /*

    Random

  */

  random(max) {
    return Math.random() * max;
  }

  randomInt(max) {
    return Math.random() * max >> 0;
  }

  randomArray(array) {
    return array[Math.floor(Math.random() * array.length)];
  }

  randomColor(colorDepth) {
    if (typeof colorDepth === "number" && !isNaN(colorDepth)) {
      if (colorDepth === 0) throw Error("Colordepth cannot be 0");
      var colorStep = 256 / colorDepth;
      var r = Math.ceil(Math.floor(Math.random() * 256) / colorStep) * colorStep;
      var g = Math.ceil(Math.floor(Math.random() * 256) / colorStep) * colorStep;
      var b = Math.ceil(Math.floor(Math.random() * 256) / colorStep) * colorStep;

      return "rgb(" + r + "," + g + "," + b + ")";
    }
    else {
      return "rgb(" + (Math.random() * 256 >> 0) + "," + (Math.random() * 256 >> 0) + "," + (Math.random() * 256 >> 0) + ")";
    }
  }

  /*

    Export

  */

  canvasToURL() {
    return top.canvas.toDataURL();
  }

  canvasToImage() {
    var img = new Image();
    img.src = top.canvas.toDataURL();
    return img;
  }

  saveToFile(filename = "canvas.png") {
    var a = document.createElement("a");
    a.download = filename;
    a.href = top.canvas.toDataURL();
    a.click();
  }

  /*

    Cookies

  */

  setCookie(name, value, expireDays = 36500) {
    let d = new Date();
    d.setTime(d.getTime() + (expireDays * 24 * 60 * 60 * 1000));
    let expires = "expires=" + d.toUTCString();
    document.cookie = name + "=" + value + ";" + expires + ";path=/";
  }

  getCookie(name) {
    if (name.length == 0)
      return false;

    var cname = name + "=";
    var split = document.cookie.split(";");
    for (let i = 0; i < split.length; i++) {
      let s = split[i];
      var index = s.indexOf(cname);
      if (index > 0) {
        return s.substr(index + cname.length);
      }
    }
    return false;
  }

  deleteCookie(name) {
    document.cookie = name + "=;expires=Thu, 01 Jan 1970 00:00:00 UTC;path=/";
  }

  /*

    Key functions

  */

  isCtrlPressed() {
    return this.keys.ctrlPressed;
  }
  isAltPressed() {
    return this.keys.AltPressed;
  }
  isShiftPressed() {
    return this.keys.shiftPressed;
  }

  key(key) {
    return !!this.keys.keysDown[key];
  }

  /*

    Misc.

  */

  create2DArray(rows, columns, value = (x, y) => 0) {
    var array = new Array(rows);
    for (var i = 0; i < rows; i++) {
      array[i] = new Array(columns);
      for (var j = 0; j < columns; j++) {
        array[i][j] = value(i, j);
      }
    }

    return array;
  }

  mapValue(x, in_min, in_max, out_min, out_max) {
    return (x - in_min) * (out_max - out_min) / (in_max - in_min) + out_min;
  }
  
  gradient(startColor, endColor, x1, y1, x2, y2) {
    var grd = this.ctx.createLinearGradient(x1, y1, x2, y2);
    grd.addColorStop(0, startColor);
    grd.addColorStop(1, endColor);
    return grd;
  }
  
  prettyprint(obj) {
    if (typeof obj === "object") {
      console.log(JSON.stringify(obj, null, 2));
    }
  }
}