export default function GameCanvas() {
  /*
  
  - Touch events
  - 
  
  */
  
  var top = this;
  
  this.canvas = null;
  this.ctx = null;
  
  this.width = 0;
  this.height = 0;
  
  this.ENUM = {COLOR: {RGB: "RGB", HSL: "HSL"}, ANGLE: {DEG: "DEG", RAD: "RAD"}, RENDER: {FILL: "FILL", STROKE: "STROKE", STROKEFILL: "STROKEFILL"}};
  this.colorMode = "RGB";
  this.angleMode = "DEG";
  this.renderMode = "FILL";
  
  this.font = "Arial";
  
  this.storedImages = [];
  
  this.mouse = {x: 0,
                y: 0,
                left: false,
                middle: false,
                right: false,
                click: {left: function(){},
                        middle: function(){},
                        right: function(){}}};
  
  this.touch = {touching: false,
                touchPoints: []};
  
  this.keys = [];
  this.keyPressedFunction = [];
  
  window.mouse = this.mouse;
  window.touch = this.touch;
  window.keys = this.keys;
  window.width = this.width;
  window.height = this.height;
  
  //
  // Setup
  //
  
  window.createCanvas ? console.warn("A function with the name 'createCanvas' has already been defined somewhere in your code") : window.createCanvas = function(width, height, center) {
    if (width == "FULLSCREEN") {
      width = window.innerWidth;
      height = window.innerHeight;
      
      document.body.style.margin = "0";
      document.body.style.padding = "0";
      
      document.body.style.overflow = 'hidden';
      document.body.scroll = "no";
      
      document.addEventListener('contextmenu', event => event.preventDefault());
    }
    
    top.canvas = document.createElement('canvas');
    top.ctx = top.canvas.getContext('2d');
    
    top.canvas.width = width;
    top.canvas.height = height;
    top.width = width;
    top.height = height;
    
    if (center == "CENTER")
      top.canvas.setAttribute('style', "position: absolute; left: 50%; margin-left: " + -(width / 2) + "px; top: 50%; margin-top: " + -(height / 2) + "px; border: 2px solid black");
    
    top.canvas.onmousemove = function(event) {
      var canvasPosition = top.canvas.getBoundingClientRect();
      
      top.mouse.x = event.clientX - canvasPosition.left;
      top.mouse.y = event.clientY - canvasPosition.top;
    }
    
    top.canvas.onmousedown = function(event) {
      switch (event.button) {
        case 0:
          top.mouse.left = true;
          top.mouse.click.left();
          break;
        case 1:
          top.mouse.middle = true;
          top.mouse.click.middle();
          return false;
          break;
        case 2:
          top.mouse.right = true;
          top.mouse.click.right();
          break;
      }
    }
    top.canvas.onmouseup = function(event) {
      switch (event.button) {
        case 0:
          top.mouse.left = false;
          break;
        case 1:
          top.mouse.middle = false;
          break;
        case 2:
          top.mouse.right = false;
          break;
      }
    }
    
    document.addEventListener("keydown", function(event) {
      top.keys[event.code] = true;
      top.keys[event.keyCode] = true;
      
      for (var i = 0; i < top.keyPressedFunction.length; i++) {
        var k = top.keyPressedFunction[i];
        if (event.keyCode == k.key || event.code == k.key)
          k.func();
      }
    });
    document.addEventListener("keyup", function(event) {
      top.keys[event.code] = false;
      top.keys[event.keyCode] = false;
    });
    
    /*document.addEventListener("touchstart", function(event) {
      console.log("touch");
      
      //top.touch.touchPoints.push({x: event.touches[event.touches.length].pageX, y: event.touches[event.touches.length].pageY, id: event.touches[event.touches.length].identifier});
    });*/
    
    document.body.appendChild(top.canvas);
  }
  
  //
  // Drawing
  //
  
  window.setColorMode ? console.warn("A function with the name 'setColorMode' has already been defined somewhere in your code") : window.setColorMode = function(colorMode) {
    if (typeof colorMode != "string")
      console.error("colorMode must be a string");
    else {
      colorMode = colorMode.toUpperCase();
      
      if (!top.ENUM.COLOR[colorMode])
        console.error("colorMode must be one of following:\n" + JSON.stringify(top.ENUM.COLOR, null, 4));
      else
        top.colorMode = colorMode;
    }
  }
  
  window.setAngleMode ? console.warn("A function with the name 'setAngleMode' has already been defined somewhere in your code") : window.setAngleMode = function(angleMode) {
    angleMode = angleMode.toUpperCase();

    if (!top.ENUM.ANGLE[angleMode])
      console.error("angleMode must be one of following:\n" + JSON.stringify(top.ENUM.ANGLE, null, 4));
    else
      top.angleMode = angleMode;
  }
  
  window.setRenderMode ? console.warn("A function with the name 'setRenderMode' has already been defined somewhere in your code") : window.setRenderMode = function(renderMode) {
    renderMode = renderMode.toUpperCase();

    if (!top.ENUM.RENDER[renderMode])
      console.error("renderMode must be one of following:\n" + JSON.stringify(top.ENUM.RENDER, null, 4));
    else
      top.renderMode = renderMode;
  }
  
  window.fillStyle ? console.warn("A function with the name 'fillStyle' has already been defined somewhere in your code") : window.fillStyle = function(r, g, b) {
    if (r && g == undefined && b == undefined)
      top.ctx.fillStyle = r;
    else {
      r = parseInt(r);
      g = parseInt(g);
      b = parseInt(b);
      
      var cm = top.colorMode;
      top.ctx.fillStyle = cm.toLowerCase() + "(" + r + "," + g + (cm == top.ENUM.COLOR.HSL ? "%" : "") + "," + b + (cm == top.ENUM.COLOR.HSL ? "%" : "") + ")";
    }
  }
  
  window.strokeStyle ? console.warn("A function with the name 'strokeStyle' has already been defined somewhere in your code") : window.strokeStyle = function(r, g, b) {
    if (r && g == undefined && b == undefined)
      top.ctx.strokeStyle = r;
    else {
      r = parseInt(r);
      g = parseInt(g);
      b = parseInt(b);
      
      var cm = top.colorMode;
      top.ctx.strokeStyle = cm.toLowerCase() + "(" + r + "," + g + (cm == top.ENUM.COLOR.HSL ? "%" : "") + "," + b + (cm == top.ENUM.COLOR.HSL ? "%" : "") + ")";
    }
  }
  
  window.lineWidth ? console.warn("A function with the name 'lineWidth' has already been defined somewhere in your code") : window.lineWidth = function(lineWidth) {
    top.ctx.lineWidth = lineWidth;
  }
  
  window.clearScreen ? console.warn("A function with the name 'clearScreen' has already been defined somewhere in your code") : window.clearScreen = function() {
    top.ctx.clearRect(0, 0, top.width, top.height);
  }
  
  window.rectangle ? console.warn("A function with the name 'rectangle' has already been defined somewhere in your code") : window.rectangle = function(x, y, width, height, color) {
    if (x == undefined || y == undefined || width == undefined || height == undefined)
      console.error("x, y, width or height has not been defined");
    else {
      if (color != undefined) {
        if (Array.isArray(color)) {
          if (top.renderMode == top.ENUM.RENDER.FILL)
            fillStyle(color[0], color[1], color[2]);
          else if (top.renderMode == top.ENUM.RENDER.STROKE)
            strokeStyle(color[0], color[1], color[2]);
          else {
            fillStyle(color[0], color[1], color[2]);
            strokeStyle(color[0], color[1], color[2]);
          }
        }
        if (typeof color == "string") {
          if (top.renderMode == top.ENUM.RENDER.FILL)
            fillStyle(color);
          else if (top.renderMode == top.ENUM.RENDER.STROKE)
            strokeStyle(color);
          else {
            fillStyle(color);
            strokeStyle(color);
          }
        }
      }
      
      if (top.renderMode == top.ENUM.RENDER.FILL)
        top.ctx.fillRect(x, y, width, height);
      else if (top.renderMode == top.ENUM.RENDER.STROKE)
        top.ctx.strokeRect(x, y, width, height);
      else {
        top.ctx.beginPath();
        top.ctx.rect(x, y, width, height);
        top.ctx.fill();
        top.ctx.stroke();
        top.ctx.closePath();
      }
    }
  }
  
  window.circle ? console.warn("A function with the name 'circle' has already been defined somewhere in your code") : window.circle = function(x, y, radius, color) {
    if (x == undefined || y == undefined || radius == undefined)
      console.error("x, y or radius has not been defined");
    else {
      if (color != undefined) {
        if (Array.isArray(color)) {
          if (top.renderMode == top.ENUM.RENDER.FILL)
            fillStyle(color[0], color[1], color[2]);
          else if (top.renderMode == top.ENUM.RENDER.STROKE)
            strokeStyle(color[0], color[1], color[2]);
          else {
            fillStyle(color[0], color[1], color[2]);
            strokeStyle(color[0], color[1], color[2]);
          }
        }
        if (typeof color == "string") {
          if (top.renderMode == top.ENUM.RENDER.FILL)
            fillStyle(color);
          else if (top.renderMode == top.ENUM.RENDER.STROKE)
            strokeStyle(color);
          else {
            fillStyle(color);
            strokeStyle(color);
          }
        }
      }
      
      top.ctx.beginPath();
      top.ctx.arc(x, y, radius, 0, 6.2831);
      if (top.renderMode == top.ENUM.RENDER.FILL)
        top.ctx.fill();
      else if (top.renderMode == top.ENUM.RENDER.STROKE)
        top.ctx.stroke();
      else {
        top.ctx.fill();
        top.ctx.stroke();
      }
    }
  }
  
  window.line ? console.warn("A function with the name 'line' has already been defined somewhere in your code") : window.line = function(x, y, x2, y2, width, color) {
    if (x == undefined || y == undefined || x2 == undefined || y2 == undefined)
      console.error("x, y, x2, or y2 has not been defined");
    else {
      if (width) {
        top.ctx.lineWidth = width;
      }
      if (color) {
        if (Array.isArray(color))
          strokeStyle(color[0], color[1], color[2]);
        if (typeof color == "string")
          strokeStyle(color);
      }
      
      top.ctx.beginPath();
      top.ctx.moveTo(x, y);
      top.ctx.lineTo(x2, y2);
      top.ctx.stroke();
    }
  }
  
  window.shape ? console.warn("A function with the name 'shape' has already been defined somewhere in your code") : window.shape = function(vertices) {
    top.ctx.beginPath();
    top.ctx.moveTo(vertices[0][0], vertices[0][1]);
    
    for (var i = 1; i < vertices.length; i++) {
      var v = vertices[i];
      top.ctx.lineTo(v[0], v[1]);
    }
    top.ctx.lineTo(vertices[0][0], vertices[0][1]);
    
    if (top.renderMode == top.ENUM.RENDER.FILL)
      top.ctx.fill();
    else if (top.renderMode == top.ENUM.RENDER.STROKE)
      top.ctx.stroke();
    else {
      top.ctx.fill();
      top.ctx.stroke();
    }
  }
  
  window.text ? console.warn("A function with the name 'text' has already been defined somewhere in your code") : window.text = function(x, y, size, text, color) {
    if (x == undefined || y == undefined || size == undefined || text == undefined)
      console.error("x, y, size or text has not been defined");
    else {
      if (color != undefined) {
        if (Array.isArray(color)) {
          if (top.renderMode == top.ENUM.RENDER.FILL)
            fillStyle(color[0], color[1], color[2]);
          else if (top.renderMode == top.ENUM.RENDER.STROKE)
            strokeStyle(color[0], color[1], color[2]);
          else {
            fillStyle(color[0], color[1], color[2]);
            strokeStyle(color[0], color[1], color[2]);
          }
        }
        if (typeof color == "string") {
          if (top.renderMode == top.ENUM.RENDER.FILL)
            fillStyle(color);
          else if (top.renderMode == top.ENUM.RENDER.STROKE)
            strokeStyle(color);
          else {
            fillStyle(color);
            strokeStyle(color);
          }
        }
      }
      
      top.ctx.beginPath();
      top.ctx.font = size + "px " + top.font;
      
      if (top.renderMode == top.ENUM.RENDER.FILL)
        top.ctx.fillText(text, x, y);
      else if (top.renderMode == top.ENUM.RENDER.STROKE)
        top.ctx.strokeText(text, x, y);
      else {
        top.ctx.text(text, x, y);
        top.ctx.fill();
        top.ctx.stroke();
      }
    }
  }
  
  window.image ? console.warn("A function with the name 'image' has already been defined somewhere in your code") : window.image = function(image, x, y, width, height) {
    if (image == undefined || x == undefined || y == undefined || width == undefined || height == undefined) {
      console.error("image, x, y, width or height has not been defined");
    }
    else {
      if (top.storedImages[image] == undefined) {
        if (typeof image == "string") {
          top.storedImages[image] = new Image();
          top.storedImages[image].src = image;
        }
        else if (typeof image == "object") {
          top.storedImages[image] = image;
        }
      }
      else if (top.storedImages[image].complete) {
        top.ctx.drawImage(top.storedImages[image], x, y, width, height);
        
        var src = typeof image == "object" ? image.src : image;
        if (top.storedImages[image].src != src) {
            top.storedImages[image] = undefined;
        }
      }
    }
  }

  //
  // ETC
  //
  
  window.distance ? console.warn("A function with the name 'distance' has already been defined somewhere in your code") : window.distance = function(x, y, x2, y2) {
    return Math.sqrt((x2 - x) * (x2 - x) + (y2 - y) * (y2 - y));
  }
  
  window.angle ? console.warn("A function with the name 'angle' has already been defined somewhere in your code") : window.angle = function(x, y, x2, y2) {
    var multi;
    top.angleMode == top.ENUM.ANGLE.DEG ? multi = 180 / Math.PI : multi = 1;
    return Math.atan2(y2 - y, x2 - x) * multi;
  }
  
  window.random ? console.warn("A function with the name 'random' has already been defined somewhere in your code") : window.random = function(from, to) {
    if (from != undefined && to != undefined)
      return Math.random() * (to - from + 1) + from;
    else if (from != undefined)
      return Math.random() * from;
    else
      return Math.random();
  }
  
  window.randomColor ? console.warn("A function with the name 'randomColor' has already been defined somewhere in your code") : window.randomColor = function() {
    return "rgb(" + random(255) + "," + random(255) + "," + random(255) + ")";
  }
  
  window.map ? console.warn("A function with the name 'map' has already been defined somewhere in your code") : window.map = function(x, in_min, in_max, out_min, out_max) {
    return (x - in_min) * (out_max - out_min) / (in_max - in_min) + out_min;
  }
  
  //
  // Client input
  //
  
  window.keyPressed ? console.warn("A function with the name 'keyPressed' has already been defined somewhere in your code") : window.keyPressed = function(key, func) {
    top.keyPressedFunction.push({key: key, func: func});
  }
}