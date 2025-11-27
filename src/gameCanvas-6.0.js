"use strict";

const TRANSPARENT = "transparent";

/**
 * PredefinedColorSpace
 * @typedef {"display-p3" | "srgb"} PredefinedColorSpace
 */

/**
 * CanvasRenderingContext2DSettings
 * @typedef {{
 *   alpha?: boolean;
 *   colorSpace?: PredefinedColorSpace;
 *   desynchronized?: boolean;
 *   willReadFrequently?: boolean;
 * }} CanvasRenderingContext2DSettings
 */

/**
 * GameCanvas settings
 * @typedef {{
 *  width?: number;
 *  height?: number;
 *  fullscreen?: boolean;
 *  disableContextMenu?: boolean;
 *  disableMiddleMouse?: boolean;
 *  disableScrollOnMobile?: boolean;
 *  disableKeyShortcuts?: boolean;
 *  publicMethods?: boolean;
 *  contextAttributes?: CanvasRenderingContext2DSettings;
 * }} GameCanvasSettings
 */

export default class GameCanvas {
  /*

    GameCanvas.js
    Version 6.3

    By Alfons Nilsson

  */
  
  /**
   * @param {HTMLCanvasElement | string | undefined | null} [canvas] 
   * @param {GameCanvasSettings} [settings]
   */
  constructor(canvas, settings = {}) {
    // Make sure `settings` is an object
    if (typeof settings !== "object") {
      settings = {};
    }

    // Custom event handler
    this.eventHandler = new EventHandler();
    this.on = this.eventHandler.on.bind(this.eventHandler);

    // Canvas
    this.canvas = getCanvas(canvas);
    this.ctx = this.canvas.getContext("2d", settings.contextAttributes);

    // Canvas size
    this.fastStyleWidth = 0;
    this.fastStyleHeight = 0;
    this.fastBufferWidth = this.canvas.width;
    this.fastBufferHeight = this.canvas.height;

    // DPR
    this.dpr = 1;
    reactivePixelRatio(this);
    this._forceUpdatePixelRatio = () => {
      this.dpr = window.devicePixelRatio || 1;
    };

    const hasSetSize = (
      Object.prototype.hasOwnProperty.call(settings, "width") ||
      Object.prototype.hasOwnProperty.call(settings, "height")
    );
    this.isFullpage = settings.fullscreen !== false && (settings.fullscreen === true || !hasSetSize);

    if (this.isFullpage) {
      this.disableContextMenu = Object.prototype.hasOwnProperty.call(settings, "disableContextMenu") ? settings.disableContextMenu : true;
      this.disableMiddleMouse = Object.prototype.hasOwnProperty.call(settings, "disableMiddleMouse") ? settings.disableMiddleMouse : true;
      this.disableScrollOnMobile = Object.prototype.hasOwnProperty.call(settings, "disableScrollOnMobile") ? settings.disableScrollOnMobile : true;
      this.disableKeyShortcuts = Object.prototype.hasOwnProperty.call(settings, "disableKeyShortcuts") ? settings.disableKeyShortcuts : false;
      this.publicMethods = Object.prototype.hasOwnProperty.call(settings, "publicMethods") ? settings.publicMethods : true;

      const setCanvasFullpageSize = () => {
        // "+ 1" fills remaining space around canvas when zoomed in a lot
        setCanvasSize(this, window.innerWidth + 1, window.innerHeight + 1);
      };

      document.body.append(this.canvas);
      this.canvas.style.position = "fixed";
      this.canvas.style.top = "0";
      this.canvas.style.left = "0";

      document.body.style.overflow = "hidden";

      window.addEventListener("resize", setCanvasFullpageSize);
      setCanvasFullpageSize();
    }
    else {
      this.disableContextMenu = Object.prototype.hasOwnProperty.call(settings, "disableContextMenu") ? settings.disableContextMenu : false;
      this.disableMiddleMouse = Object.prototype.hasOwnProperty.call(settings, "disableMiddleMouse") ? settings.disableMiddleMouse : false;
      this.disableScrollOnMobile = Object.prototype.hasOwnProperty.call(settings, "disableScrollOnMobile") ? settings.disableScrollOnMobile : false;
      this.disableKeyShortcuts = Object.prototype.hasOwnProperty.call(settings, "disableKeyShortcuts") ? settings.disableKeyShortcuts : false;
      this.publicMethods = Object.prototype.hasOwnProperty.call(settings, "publicMethods") ? settings.publicMethods : true;

      // Dynamic size
      if (!hasSetSize) {
        const parent = this.canvas.parentElement;
        const resizeCallback = () => {
          const styles = getComputedStyle(parent);
          const width = getContentWidth(parent, styles);
          const height = getContentHeight(parent, styles);
          setCanvasSize(this, Math.floor(width), Math.floor(height));
        };
        const resizeObserver = new ResizeObserver(resizeCallback);
        resizeObserver.observe(parent);
        resizeCallback();
      }
      // Static size
      else {
        const { width, height } = getSizeOption(settings);
        setCanvasSize(this, width, height);
      }
    }

    this.font = "Arial";
    this.fontWeight = "normal";
    this.images = [];
    this.imageData = undefined;
    this.imageDataData = undefined;
    this.audioContext = new (window.AudioContext || window.webkitAudioContext)();

    this.keys = {
      keysDown: [],
      ctrlPressed: false,
      shiftPressed: false,
      altPressed: false
    };
    this.mouse = {
      x: 0,
      y: 0,
      lastX: 0,
      lastY: 0,
      movementX: 0,
      movementY: 0,
      left: false,
      right: false,
      middle: false,
      any: false,
      scrollX: 0,
      scrollY: 0,
      scrollZ: 0,
    };
    this.mouseLookupTable = [
      "left",
      "middle",
      "right"
    ];
    this.touch = {
      lastX: 0,
      lastY: 0,
      x: 0,
      y: 0,
      movementX: 0,
      movementY: 0,
      isTouching: false,
      nrTouches: 0,
      touches: [],
      lastTouches: []
    };

    this.pan = {
      isPanning: false
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
    };

    /*

      Key events

    */

    document.addEventListener("keydown", event => {
      this.keys.altPressed = event.altKey;
      this.keys.shiftPressed = event.shiftKey;
      this.keys.ctrlPressed = event.ctrlKey;

      this.keys.keysDown[event.key] = this.keys.keysDown[event.keyCode] = this.keys.keysDown[event.code] = true;

      this.eventHandler.fireEvent("keydown", event);
      if (typeof window.OnKeyDown === "function") {
        window.OnKeyDown(event);
      }

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
      
      this.eventHandler.fireEvent("keyup", event);
      if (typeof window.OnKeyUp === "function") {
        window.OnKeyUp(event);
      }
    });

    /*

      Mouse events

    */

    document.addEventListener("mousemove", event => {
      let br = this.canvas.getBoundingClientRect();
      this.mouse.x = (event.clientX - br.left) / (br.width / this.width);
      this.mouse.y = (event.clientY - br.top) / (br.height / this.height);
      this.mouse.movementX = event.movementX;
      this.mouse.movementY = event.movementY;

      this.eventHandler.fireEvent("mousemove", event);
      if (typeof window.OnMouseMove === "function") {
        window.OnMouseMove(event);
      }
    });

    // Panning
    document.addEventListener("mousemove", event => {
      if (this.pan.isPanning) {
        this.eventHandler.fireEvent("pan", {
          x: event.movementX,
          y: event.movementY
        });
      }
    });

    this.canvas.addEventListener("mousedown", event => {
      let button = event.button;
      if (button < 3)
        this.mouse[this.mouseLookupTable[button]] = true;
      this.mouse.any = this.mouse.left || this.mouse.right || this.mouse.middle;

      /*if (!this.audioContext)
        this.audioContext = new (window.AudioContext || window.webkitAudioContext)();*/

      this.eventHandler.fireEvent("mousedown", event);
      if (typeof window.OnMouseDown === "function") {
        window.OnMouseDown(event);
      }

      this.pan.isPanning = true;

      if (button == 1 && this.disableMiddleMouse) {
        event.preventDefault();
        return false;
      }
    });

    document.addEventListener("mouseup", () => {
      this.pan.isPanning = false;
    }, { passive: true });

    document.addEventListener("mouseup", event => {
      let button = event.button;
      if (button < 3)
        this.mouse[this.mouseLookupTable[button]] = false;
      this.mouse.any = this.mouse.left || this.mouse.right || this.mouse.middle || this.touch.touches.length > 0;

      this.eventHandler.fireEvent("mouseup", event);
      if (typeof window.OnMouseUp === "function") {
        window.OnMouseUp(event);
      }
    });

    this.canvas.addEventListener("contextmenu", event => {
      this.eventHandler.fireEvent("contextmenu", event);
      if (typeof window.OnContextMenu === "function") {
        window.OnContextMenu(event);
      }

      if (this.disableContextMenu) {
        event.preventDefault();
        return false;
      }
      return true;
    });

    document.body.addEventListener("wheel", event => {
      this.mouse.scrollX = event.deltaX;
      this.mouse.scrollY = event.deltaY;
      this.mouse.scrollZ = event.deltaZ;

      this.eventHandler.fireEvent("scroll", event);
      if (typeof window.OnScroll === "function") {
        window.OnScroll(event);
      }
    });

    /*

      Touch events

    */

    this.updateTouches = function(event) {
      const br = this.canvas.getBoundingClientRect();

      this.touch.touches = [];
      for (let i = 0; i < event.touches.length; i++) {
        const e = event.touches[i];
        const x = (e.pageX - br.left) / (br.width / this.width);
        const y = (e.pageY - br.top) / (br.height / this.height);
        this.touch.touches[i] = {x, y, id: e.identifier, force: e.force, radiusX: e.radiusX, radiusY: e.radiusY, rotationAngle: e.rotationAngle};
      }
    };

    this.canvas.addEventListener("touchmove", event => {
      if (this.disableScrollOnMobile)
        event.preventDefault();

      this.updateTouches(event);
      this.touch.x = this.touch.touches[0].x;
      this.touch.y = this.touch.touches[0].y;
      // this.touch.movementX = this.touch.x - this.touch.lastX;
      // this.touch.movementY = this.touch.y - this.touch.lastY;

      if (this.touch.touches.length === this.touch.lastTouches.length) {
        const averageX = averageArray(this.touch.touches.map(t => t.x));
        const averageY = averageArray(this.touch.touches.map(t => t.y));
        const lastAverageX = averageArray(this.touch.lastTouches.map(t => t.x));
        const lastAverageY = averageArray(this.touch.lastTouches.map(t => t.y));
        this.touch.movementX = averageX - lastAverageX;
        this.touch.movementY = averageY - lastAverageY;
      }
      else {
        this.touch.movementX = 0;
        this.touch.movementY = 0;
      }

      this.eventHandler.fireEvent("touchmove", event);
      if (typeof window.OnTouchMove === "function") {
        window.OnTouchMove(event);
      }

      if (this.pan.isPanning) {
        this.eventHandler.fireEvent("pan", {
          x: this.touch.movementX,
          y: this.touch.movementY
        });
      }

      // console.log(event.touches.length);
      const isPinching = this.touch.touches.length === 2 && this.touch.lastTouches.length === 2;
      if (isPinching) {
        const distance = this.getDistance(this.touch.touches[0].x, this.touch.touches[0].y, this.touch.touches[1].x, this.touch.touches[1].y);
        const lastDistance = this.getDistance(this.touch.lastTouches[0].x, this.touch.lastTouches[0].y, this.touch.lastTouches[1].x, this.touch.lastTouches[1].y);
        
        const pinch = (lastDistance - distance) * 10;
        const center = {
          x: (this.touch.touches[0].x + this.touch.touches[1].x) / 2,
          y: (this.touch.touches[0].y + this.touch.touches[1].y) / 2,
        };

        this.eventHandler.fireEvent("pinch", {
          pinch,
          center
        });
        
        // document.body.innerHTML = "test";
      }

      this.touch.lastX = this.touch.x;
      this.touch.lastY = this.touch.y;
      this.touch.lastTouches = [...this.touch.touches];
    });
    this.canvas.addEventListener("touchstart", event => {
      if (this.disableScrollOnMobile)
        event.preventDefault();

      this.updateTouches(event);
      this.touch.x = this.touch.touches[0].x;
      this.touch.y = this.touch.touches[0].y;
      this.touch.isTouching = true;
      this.mouse.any = true;

      this.pan.isPanning = true;

      /*if (!this.audioContext)
        this.audioContext = new (window.AudioContext || window.webkitAudioContext)();*/

      this.eventHandler.fireEvent("touchstart", event);
      if (typeof window.OnTouchStart === "function") {
        window.OnTouchStart(event);
      }

      this.touch.lastX = this.touch.x;
      this.touch.lastY = this.touch.y;
      this.touch.lastTouches = [...this.touch.touches];
    });
    this.canvas.addEventListener("touchend", event => {
      if (this.disableScrollOnMobile)
        event.preventDefault();

      this.updateTouches(event);
      this.touch.isTouching = this.touch.touches.length > 0;
      this.mouse.any = this.mouse.left || this.mouse.right || this.mouse.middle || this.touch.touches.length > 0;

      if (!this.touch.isTouching) {
        this.pan.isPanning = false;
      }

      this.eventHandler.fireEvent("touchend", event);
      if (typeof window.OnTouchEnd === "function") {
        window.OnTouchEnd(event);
      }
    });
    
    /*
    
      Resize event
    
    */
    
    window.addEventListener("resize", event => {  
      this.eventHandler.fireEvent("resize", event);
      if (typeof window.OnResize === "function") {
        window.OnResize(event);
      }
    });

    /*

      Make methods public

    */

    if (this.publicMethods) {
      const skipProperties = ["constructor", "width", "height", "moveTo"];
      const gettersetters = ["width", "height"];
      const getters = ["mouse", "touch"];

      const methods = Object.getOwnPropertyNames(GameCanvas.prototype);
      for (const method of methods) {
        if (skipProperties.includes(method)) {
          continue;
        }

        if (Object.prototype.hasOwnProperty.call(window, method)) {
          console.warn("[GameCanvas] Window already has property: " + method);
          continue;
        }

        window[method] = this[method].bind(this);
      }

      for (const gettersetter of gettersetters) {
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

      for (const getter of getters) {
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
    return this.canvas.width / this.dpr;
  }
  get height() {
    return this.canvas.height / this.dpr;
  }
  set width(w) {
    setCanvasSize(this, w, null);
  }
  set height(h) {
    setCanvasSize(this, null, h);
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
    this.ctx.arc(x, y, radius, startAngle, endAngle, counterclockwise);
  }

  circle(x, y, radius, color, strokeColor, lineWidth) {
    this.ctx.beginPath();
    this.ctx.arc(x, y, radius, 0, Math.PI * 2);
    this.ctx.fillStyle = color;
    if (lineWidth) this.ctx.lineWidth = lineWidth;
    if (shouldRender(color)) {
      this.ctx.fill();
    }
    if (shouldRender(strokeColor)) {
      this.ctx.strokeStyle = strokeColor;
      this.ctx.stroke();
    }
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
    if (lineWidth) this.ctx.lineWidth = lineWidth;
    if (shouldRender(color)) {
      this.ctx.fill();
    }
    if (shouldRender(strokeColor)) {
      this.ctx.strokeStyle = strokeColor;
      this.ctx.stroke();
    }
  }

  rectangle(x, y, width, height, color, strokeColor, lineWidth) {
    if (shouldRender(color)) this.ctx.fillStyle = color;
    if (lineWidth) this.ctx.lineWidth = lineWidth;
    if (shouldRender(strokeColor)) {
      this.ctx.beginPath();
      this.ctx.strokeStyle = strokeColor;
      this.ctx.rect(x, y, width, height);
      if (shouldRender(color)) this.ctx.fill();
      this.ctx.stroke();
    }
    else if (shouldRender(color))
      this.ctx.fillRect(x, y, width, height);
  }

  pixelPerfectRectangle(x, y, width, height, color, strokeColor, lineWidth) {
    const x1 = makePixelPerfect(this, x, lineWidth);
    const y1 = makePixelPerfect(this, y, lineWidth);
    const x2 = makePixelPerfect(this, x + width, lineWidth);
    const y2 = makePixelPerfect(this, y + height, lineWidth);
    width = x2 - x1;
    height = y2 - y1;

    const recDPR = 1 / this.dpr;

    this.rectangle(x1, y1, width, height, color, strokeColor, lineWidth * recDPR);
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
    if (shouldRender(strokeColor)) {
      if (lineWidth) this.ctx.lineWidth = lineWidth;
      this.ctx.strokeStyle = strokeColor;
      this.ctx.stroke();
    }
    if (shouldRender(color)) {
      this.ctx.fillStyle = color;
      this.ctx.fill();
    }
  }

  triangle(x1, y1, x2, y2, x3, y3, color, strokeColor, lineWidth) {
    this.ctx.beginPath();
    this.ctx.moveTo(x1, y1);
    this.ctx.lineTo(x2, y2);
    this.ctx.lineTo(x3, y3);
    this.ctx.closePath();
    this.ctx.fillStyle = color;
    if (lineWidth) this.ctx.lineWidth = lineWidth;
    if (shouldRender(color)) {
      this.ctx.fill();
    }
    if (shouldRender(strokeColor)) {
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

  pixelPerfectLine(x1, y1, x2, y2, color, strokeWeight) {
    const v = x1 === x2 ? 0 : 1;
    const h = y1 === y2 ? 0 : 1;

    x1 = makePixelPerfect(this, x1, strokeWeight * h);
    y1 = makePixelPerfect(this, y1, strokeWeight * v);
    x2 = makePixelPerfect(this, x2, strokeWeight * h);
    y2 = makePixelPerfect(this, y2, strokeWeight * v);

    const recDPR = 1 / this.dpr;

    this.line(x1, y1, x2, y2, color, strokeWeight * recDPR);
  }

  clippedPicture(url, sx, sy, swidth, sheight, x, y, width, height) {
    const imageElement = this.images[url];
    if (!imageElement) {
      const img = new Image();
      img.src = url;
      img.onload = () => {
        width = width || img.width;
        height = height || img.height;
        this.ctx.drawImage(img, sx, sy, swidth, sheight, x, y, width, height);
      };
      this.images[url] = img;
    }
    else if (!imageIsBroken(imageElement)) {
      width = width || imageElement.width;
      height = height || imageElement.height;
      this.ctx.drawImage(imageElement, sx, sy, swidth, sheight, x, y, width, height);
    }
  }

  picture(url, x, y, width, height) {
    if (url instanceof HTMLImageElement) {
      const img = url;
      this.ctx.drawImage(img, x, y, width, height);
      return;
    }

    const imageElement = this.images[url];
    if (!imageElement) {
      const img = new Image();
      img.src = url;
      img.onload = () => {
        width = width || img.width;
        height = height || img.height;
        this.ctx.drawImage(img, x, y, width, height);
      };
      this.images[url] = img;
    }
    else if (!imageIsBroken(imageElement)) {
      width = width || imageElement.width;
      height = height || imageElement.height;
      this.ctx.drawImage(imageElement, x, y, width, height);
    }
  }

  text(textString, x, y, fontSize, color, strokeColor, lineWidth) {
    if (fontSize < 1) {
      return;
    }

    this.ctx.font = this.fontWeight + " " + fontSize + "px " + this.font;
    
    if (shouldRender(color)) {
      this.ctx.fillStyle = color;
      this.ctx.fillText(textString, x, y);
    }
    if (shouldRender(strokeColor)) {
      if (lineWidth) this.ctx.lineWidth = lineWidth;
      this.ctx.strokeStyle = strokeColor;
      this.ctx.strokeText(textString, x, y);
    }
  }

  drawVector(x, y, vector, scale = 1, color = "black") {
    const triangleScale = 10;

    const len = Math.sqrt(vector.x * vector.x + vector.y * vector.y);
    if (len === 0) {
      this.circle(x, y, 4, color);
      return;
    }

    const tangent = this.normalizeVector(vector);
    const normal = {
      x: -tangent.y,
      y: tangent.x
    };

    const endX = x + vector.x * scale;
    const endY = y + vector.y * scale;

    this.line(
      x, y,
      endX - tangent.x * triangleScale, endY - tangent.y * triangleScale,
      color,
      2
    );
    this.triangle(
      endX, endY,
      endX - tangent.x * triangleScale + normal.x * triangleScale * 0.4, endY - tangent.y * triangleScale + normal.y * triangleScale * 0.4,
      endX - tangent.x * triangleScale - normal.x * triangleScale * 0.4, endY - tangent.y * triangleScale - normal.y * triangleScale * 0.4,
      color
    );
  }
  
  polygon(points, x, y, closedPath, fillColor, strokeColor, lineWidth) {
    this.ctx.beginPath();
    this.ctx.moveTo(points[0].x + x, points[0].y + y);
    for (let i = 1; i < points.length; i++) {
      const p = points[i];
      this.ctx.lineTo(p.x + x, p.y + y);
    }
    if (closedPath) this.ctx.closePath();
    if (shouldRender(fillColor)) {
      this.ctx.fillStyle = fillColor;
      this.ctx.fill();
    }
    if (shouldRender(strokeColor)) {
      if (lineWidth) this.ctx.lineWidth = lineWidth;
      this.ctx.strokeStyle = strokeColor;
      this.ctx.stroke();
    }
  }

  /*
    Color generators
  */
  
  rgb(r = 0, g = 0, b = 0) {
    return `rgb(${r}, ${g}, ${b})`;
  }

  rgba(r = 0, g = 0, b = 0, a = 1) {
    return `rgba(${r}, ${g}, ${b}, ${a})`;
  }

  hsl(h = 0, s = 0, l = 0) {
    return `hsl(${h}, ${s}%, ${l}%)`; 
  }

  hsla(h = 0, s = 0, l = 0, a = 1) {
    return `hsla(${h}, ${s}%, ${l}%, ${a})`;
  }

  grayscale(value = 0) {
    return this.rgb(value, value, value);
  }

  greyscale(value = 0) {
    return this.grayscale(value);
  }

  /*

    Pixel manipulation

  */

  getPixelData() {
    this.imageData = this.ctx.getImageData(0, 0, this.fastBufferWidth, this.fastBufferHeight);
    this.imageDataData = this.imageData.data;
  }

  updatePixel(x, y, r, g, b, a = 255) {
    if (!this.imageDataData) {
      throw new Error("Call getPixelData before updating pixels");
    }

    let i = (x + y * this.fastBufferWidth) * 4;

    this.imageDataData[i] = r;
    this.imageDataData[i + 1] = g;
    this.imageDataData[i + 2] = b;
    this.imageDataData[i + 3] = a;
  }

  updatePixelIndex(index, r, g, b, a = 255) {
    if (!this.imageDataData) {
      throw new Error("Call getPixelData before updating pixels");
    }

    const i = index * 4;
    this.imageDataData[i] = r;
    this.imageDataData[i + 1] = g;
    this.imageDataData[i + 2] = b;
    this.imageDataData[i + 3] = a;
  }

  getPixel(x, y) {
    if (!this.imageDataData) {
      throw new Error("Call getPixelData before reading pixels");
    }

    let i = (x + y * this.fastBufferWidth) * 4;
    return [
      this.imageDataData[i],
      this.imageDataData[i + 1],
      this.imageDataData[i + 2],
      this.imageDataData[i + 3]
    ];
  }

  getPixelIndex(index) {
    if (!this.imageDataData) {
      throw new Error("Call getPixelData before reading pixels");
    }

    let i = index * 4;
    return [
      this.imageDataData[i],
      this.imageDataData[i + 1],
      this.imageDataData[i + 2],
      this.imageDataData[i + 3]
    ];
  }

  renderPixelData(x = 0, y = 0) {
    /*createImageBitmap(this.imageData).then(function(imgBitmap) {
      this.ctx.drawImage(imgBitmap, 0, 0);
    });*/

    if (!this.imageData) {
      throw new Error("Call getPixelData before rendering pixels");
    }

    this.ctx.putImageData(
      this.imageData,
      x * this.dpr,
      y * this.dpr
    );
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

  // window.moveTo is already a function
  penTo(x, y) {
    this.ctx.moveTo(x, y);
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
    if (align === "center") {
      align = "middle";
    }
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

    Shadow
  
  */

  setShadowOffset(x = 0, y = 0) {
    this.ctx.shadowOffsetX = x;
    this.ctx.shadowOffsetY = y;
  }

  setShadowBlur(blurRadius = 0) {
    this.ctx.shadowBlur = blurRadius;
  }

  setShadowColor(color = "transparent") {
    this.ctx.shadowColor = color;
  }

  applyShadow(cssShadow) {
    const values = cssShadow.split(" ");
    const offsetX = values[0].replace("px", "");
    const offsetY = values[1].replace("px", "");
    const blur = values[2].replace("px", "");
    const color = values[3];

    this.ctx.shadowOffsetX = offsetX;
    this.ctx.shadowOffsetY = offsetY;
    this.ctx.shadowBlur = blur;
    this.ctx.shadowColor = color;
  }

  clearShadow() {
    this.ctx.shadowBlur = 0;
    this.ctx.shadowOffsetX = 0;
    this.ctx.shadowOffsetY = 0;
    this.ctx.shadowColor = this.rgba(0, 0, 0, 0);
  }

  /*

    Audio

  */

  createSound(url, volume = 1, startTime = 0, looping = false) {
    const audio = new Audio(url);
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
    const audio = new Audio(url);
    audio.loop = true;
    audio.play();
    return audio;
  }

  fadeOutSound(sound, time = 1) {
    const startVolume = sound.volume;
    let count = 0;
    const interv = setInterval(() => {
      sound.audio.volume = (startVolume / (time * 20)) * (time * 20 - count);
      count++;
      if (count > time * 20) {
        sound.audio.pause();
        clearInterval(interv);
      }
    }, 50);
  }

  playTone(freq = 440, time = 1, volume = 1, type = "sine") {
    const oscillator = this.audioContext.createOscillator();

    const gainNode = this.audioContext.createGain();
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
    const a = x1 - x2;
    const b = y1 - y2;
    return a * a + b * b;
  }

  getDistanceSqr3D(x1, y1, x2, y2, z1, z2) {
    const a = x1 - x2;
    const b = y1 - y2;
    const c = z1 - z2;
    return a * a + b * b + c * c;
  }

  getDistance(x1, y1, x2, y2) {
    return Math.sqrt(this.getDistanceSqr(x1, y1, x2, y2));
  }

  getDistance3D(x1, y1, x2, y2, z1, z2) {
    return Math.sqrt(this.getDistanceSqr3D(x1, y1, x2, y2, z1, z2));
  }

  getAngle(x1, y1, x2, y2) {
    return Math.atan2(y2 - y1, x2 - x1);
  }

  vectorLength(v) {
    return Math.sqrt(v.x * v.x + v.y * v.y); 
  }

  normalize(x, y) {
    const len = Math.sqrt(x * x + y * y);
    return {
      x: x / len,
      y: y / len
    };
  }

  normalizeVector(v) {
    const len = Math.sqrt(v.x * v.x + v.y * v.y);

    if (len === 0) {
      return {
        x: 0,
        y: 0
      };
    }

    return {
      x: v.x / len,
      y: v.y / len
    };
  }

  normalize3D(x, y, z) {
    const len = Math.sqrt(x * x + y * y + z * z);

    if (len === 0) {
      return {
        x: 0,
        y: 0,
        z: 0
      };
    }

    return {
      x: x / len,
      y: y / len,
      z: z / len
    };
  }

  // bruh
  normalize3DVector(x) {
    const len = Math.sqrt(x.x * x.x + x.y * x.y + x.z * x.z);
    return {
      x: x.x / len,
      y: x.y / len,
      z: x.z / len
    };
  }

  // bruh
  lengthVector(v) {
    return Math.sqrt(v.x * v.x + v.y * v.y);
  }

  // bruh
  length3DVector(v) {
    return Math.sqrt(v.x * v.x + v.y * v.y + v.z * v.z);
  }

  // bruh
  dot(a, b) {
    return a.x * b.x + a.y * b.y;
  }

  // bruh
  dot3D(a, b) {
    return a.x * b.x + a.y * b.y + a.z * b.z;
  }

  // bruh
  crossProduct3D(v1, v2) {
    return {
      x: v1.y * v2.z - v1.z * v2.y,
      y: v1.z * v2.x - v1.x * v2.z,
      z: v1.x * v2.y - v1.y * v2.x
    };
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
    const circleDistanceX = Math.abs(x1 - (x2 + w2 / 2));
    const circleDistanceY = Math.abs(y1 - (y2 + h2 / 2));

    if (circleDistanceX > (w2 / 2 + r1)) return false;
    if (circleDistanceY > (h2 / 2 + r1)) return false;

    if (circleDistanceX <= (w2 / 2)) return true; 
    if (circleDistanceY <= (h2 / 2)) return true;

    const a = circleDistanceX - w2 / 2;
    const b = circleDistanceY - h2 / 2;
    const cornerDistance_sq = a * a + b * b;

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
      const colorStep = 256 / colorDepth;
      const r = Math.ceil(Math.floor(Math.random() * 256) / colorStep) * colorStep;
      const g = Math.ceil(Math.floor(Math.random() * 256) / colorStep) * colorStep;
      const b = Math.ceil(Math.floor(Math.random() * 256) / colorStep) * colorStep;

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
    return this.canvas.toDataURL();
  }

  canvasToImage() {
    const img = new Image();
    img.src = this.canvas.toDataURL();
    return img;
  }

  saveToFile(filename = "canvas.png") {
    const a = document.createElement("a");
    a.download = filename;
    a.href = this.canvas.toDataURL();
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

    const cname = name + "=";
    const split = document.cookie.split(";");
    for (let i = 0; i < split.length; i++) {
      let s = split[i];
      const index = s.indexOf(cname);
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

  shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }

    return array;
  }

  shuffledArray(array) {
    const arrayCopy = [...array];

    for (let i = arrayCopy.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arrayCopy[i], arrayCopy[j]] = [arrayCopy[j], arrayCopy[i]];
    }

    return arrayCopy;
  }

  map2DArray(array, func) {
    const rows = array.length;
    const columns = array[0].length;

    let index = 0;
    for (let i = 0; i < rows; i++) {
      for (let j = 0; j < columns; j++) {
        array[i][j] = func(i, j, index);
        index++;
      }
    }
  }

  create2DArray(rows, columns, value = (_x, _y) => 0) {
    const array = new Array(rows);
    for (let i = 0; i < rows; i++) {
      array[i] = new Array(columns);
      for (let j = 0; j < columns; j++) {
        array[i][j] = value(i, j);
      }
    }

    return array;
  }

  copy2DArray(from, to) {
    const fromRows = from.length;
    const fromColumns = from[0].length;

    const toRows = from.length;
    const toColumns = from[0].length;

    if (fromRows != toRows || fromColumns != toColumns) {
      throw new Error("Dimension mismatch");
    }

    for (let i = 0; i < fromRows; i++) {
      for (let j = 0; j < fromColumns; j++) {
        to[i][j] = from[i][j];
      }
    }

    return to;
  }

  clamp(x, a, b) {
    return Math.max(a, Math.min(b, x));
  }

  clamp01(x) {
    return this.clamp(x, 0, 1);
  }
  
  lerp(x, y, t) {
    return x * (1 - t) + y * t;
  }

  mapValue(x, in_min, in_max, out_min, out_max) {
    return (x - in_min) * (out_max - out_min) / (in_max - in_min) + out_min;
  }

  roundNearest(x, nearest) {
    return Math.round(x / nearest) * nearest;
  }

  floorNearest(x, nearest) {
    return Math.floor(x / nearest) * nearest;
  }

  ceilNearest(x, nearest) {
    return Math.ceil(x / nearest) * nearest;
  }
  
  gradient(startColor, endColor, x1, y1, x2, y2) {
    const grd = this.ctx.createLinearGradient(x1, y1, x2, y2);
    grd.addColorStop(0, startColor);
    grd.addColorStop(1, endColor);
    return grd;
  }
  
  prettyPrint(obj) {
    console.log(JSON.stringify(obj, null, 2));
  }

  setCursor(cursor) {
    this.canvas.style.cursor = cursor;
  }
}

/**
 * Basic event handler with trigger function and listeners.
 */
export function EventHandler() {
  this.events = {};

  this.addEvent = this.on = function(name, func) {
    if (typeof func != "function") {
      throw new Error("[EventHandler]: Not a function");
    }

    if (this.events[name]) {
      this.events[name].functions.push(func);
    }
    else {
      this.events[name] = {
        functions: [ func ]
      };
    }
  };

  this.removeEvent = this.off = function(name, func) {
    var event = this.events[name];
    if (!event) return;

    var index = event.functions.indexOf(func);
    if (index === -1) return;

    event.functions.splice(index, 1);
  };

  /**
   * Fire event
   * @param {string} name 
   * @param  {...unknown} args 
   * @returns {boolean}
   */
  this.fireEvent = function(name, ...args) {
    if (this.events[name]) {
      for (var func of this.events[name].functions) {
        func(...args);
      }
      return true;
    }

    return false;
  };

  /**
   * Fire event and gather all return results
   * @param {string} name 
   * @param  {...unknown} args 
   * @returns {unknown[]}
   */
  this.fireEventAndGetResult = function(name, ...args) {
    if (this.events[name]) {
      const results = this.events[name].functions.map(f => {
        return f(...args);
      });
      return results;
    }

    return [];
  };
}

/**
 * Average array of numbers
 * @param {number[]} values 
 * @returns {number}
 */
function averageArray(values) {
  return values.reduce((a, b) => a + b, 0) / values.length;
}

/**
 * Check if an image can be rendered
 * @param {HTMLImageElement} image 
 * @returns {boolean}
 */
function imageIsBroken(image) {
  if (!image.complete) {
    return true;
  }
 
  if (image.naturalWidth === 0) {
    return true;
  }

  return false;
}

/**
 * Set canvas size. Takes dpr into account.
 * @param {GameCanvas} gc 
 * @param {number} width 
 * @param {number} height 
 */
function setCanvasSize(gc, width, height) {
  gc._forceUpdatePixelRatio();
  const dpr = gc.dpr;

  if (width != null) {
    const bufferWidth = Math.ceil(width * dpr);
    gc.canvas.width = bufferWidth;
    gc.canvas.style.width = `${bufferWidth / dpr}px`;

    gc.fastBufferWidth = bufferWidth;
    gc.fastStyleWidth = Math.round(bufferWidth / dpr);
  }

  if (height != null) {
    const bufferHeight = Math.ceil(height * dpr);
    gc.canvas.height = bufferHeight;
    gc.canvas.style.height = `${bufferHeight / dpr}px`;

    gc.fastBufferHeight = bufferHeight;
    gc.fastStyleHeight = Math.round(bufferHeight / dpr);
  }

  gc.ctx.scale(dpr, dpr);
}

/**
 * Round coordinate to render pixel perfect lines
 * @param {GameCanvas} gc 
 * @param {number} x 
 * @param {number} strokeWeight 
 * @returns {number}
 */
function makePixelPerfect(gc, x, strokeWeight) {
  const recDPR = 1 / gc.dpr;
  return gc.floorNearest(x, recDPR) + recDPR / 2 * strokeWeight;
}

/**
 * Detect when pixel ratio changes
 * @param {GameCanvas} gc 
 */
function reactivePixelRatio(gc) {
  let remove = null;

  const updatePixelRatio = () => {
    if (remove != null) {
      remove();
    }

    const mqString = `(resolution: ${window.devicePixelRatio}dppx)`;
    const media = matchMedia(mqString);
    media.addEventListener("change", updatePixelRatio);
    remove = () => {
      media.removeEventListener("change", updatePixelRatio);
    };

    gc.dpr = window.devicePixelRatio || 1;
    gc.eventHandler.fireEvent("dprChange", gc.dpr);
  };

  updatePixelRatio();
}

/**
 * Check if a color has to be rendered
 * @param {string | undefined | null} color 
 * @returns {boolean}
 */
function shouldRender(color) {
  return (
    color &&
    color !== TRANSPARENT
  )
}

/**
 * Get the width of the content of an element
 * without border and padding
 * @param {HTMLElement} element 
 * @param {CSSStyleDeclaration | undefined} styles 
 * @returns {number}
 */
function getContentWidth(element, styles) {
  if (!styles) {
    styles = getComputedStyle(element);
  }

  const width = element.clientWidth
    - parseFloat(styles.paddingLeft)
    - parseFloat(styles.paddingRight);

  return width;
}

/**
 * Get the height of the content of an element
 * without border and padding
 * @param {HTMLElement} element 
 * @param {CSSStyleDeclaration | undefined} styles 
 * @returns {number}
 */
function getContentHeight(element, styles) {
  if (!styles) {
    styles = getComputedStyle(element);
  }

  const height = element.clientHeight
    - parseFloat(styles.paddingTop)
    - parseFloat(styles.paddingBottom);

  return height;
}

/**
 * Query or create canvas from query string, element or undefined
 * @param {HTMLCanvasElement | string | undefined | null} canvas 
 * @returns {HTMLCanvasElement}
 */
function getCanvas(canvas) {
  if (canvas instanceof HTMLCanvasElement) {
    return canvas;
  }
  else if (typeof canvas === "string") {
    const element = document.querySelector(canvas);
    if (!element) {
      throw new Error("Could not find " + canvas);
    }

    if (!(element instanceof HTMLCanvasElement)) {
      throw new Error("Query element is not a canvas");
    }

    return element;
  }
  else if (typeof canvas === "undefined" || canvas === null) {
    canvas = document.createElement("canvas");
    document.body.appendChild(canvas);
    return canvas;
  }
  else {
    console.error("Value passed:", canvas);
    throw new Error("Value passed as canvas is not a canvas element");
  }
}

/**
 * Extract and parse canvas size from settings
 * @param {{
 * width?: number;
 * height?: number;
 * } | undefined} settings 
 * @returns {{
 * width: number;
 * height: number;
 * }}
 */
function getSizeOption(settings) {
  let width = 300;
  let height = 150;

  if (typeof settings !== "object") {
    return {
      width,
      height
    }
  }

  if (Object.prototype.hasOwnProperty.call(settings, "width")) {
    if (!isNaN(settings.width))
      width = settings.width;
    else
      throw Error("Width is not a number: " + settings.width);
  }

  if (Object.prototype.hasOwnProperty.call(settings, "height")) {
    if (!isNaN(settings.height))
      height = settings.height;
    else
      throw Error("Height is not a number: " + settings.height);
  }

  return {
    width,
    height
  }
}