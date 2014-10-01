var ParticleSystemBuilder = function(){
  var that = this;
  // default values.
  this.attachedSides        = {top:true,right:false,bottom:false,left:false};
  this.gravity         = 12;
  this.friction        = 0.03;
  this.mass            = 1;
  this.k               = 13;
  this.h               = 0.026;
  this.spawnDistance   = 10;
  this.springDistance  = 10;
  this.speedLimit      = 50 / this.h;

  this.setAttached = function(val){
    for(var prop in val){
      if(this.attachedSides.hasOwnProperty(prop)){
        this.attachedSides[prop] = val[prop];
      }
    }
  };
  this.setGravity = function (val) {
    this.gravity = val;
    return this;
  };
  this.setFriction = function (val) {
    this.friction = val;
    return this;
  };
  this.setMass = function (val) {
    this.mass = val;
    return this;
  };
  this.setK = function (val) {
    this.k = val;
    return this;
  };
  this.setStep = function (val) {
    this.h = val;
    return this;
  };
  this.setSpawnDistance = function (val) {
    this.spawnDistance = val;
    return this;
  };
  this.setSpringDistance = function (val) {
    this.springDistance = val;
    return this;
  };
  this.setSpeedLimit = function (val) {
    this.speedLimit = val;
    return this;
  };

  /*
   * returns a function for initializing processing.
   */
  this.create = function(){

    return function(g) {
      /*
       *  Particles and fields
       */
      var particles       = [];

      /*
       * Parameters for the physics calculations
       */
      var friction        = that.friction;
      var mass            = that.mass;
      var k               = that.k;
      var gr              = that.gravity;           // gravity
      var h               = that.h;                 // step size
      var spawnDistance   = that.spawnDistance;     // space between particles
      var springDistance  = that.springDistance;    // rest distance of the spring
      var speedLimit      = that.speedLimit;        // limit the speed to avoid numerical instability

      /*
       * Helper functions.
       * * * * * * * * * * * * * * * * */

      /*
       * Gets the angle between 2 points.
       */
      var getAngle = function (x1, y1, x2, y2) {
        var dx = x2 - x1;
        var dy = y2 - y1;
        return dy > 0 ? Math.atan2(dy, dx) : 2 * Math.PI + Math.atan2(dy, dx);
      };

      /*
       * Gets the distance between 2 points.
       */
      var getDistance = function (x1, y1, x2, y2) {
        return Math.max(Math.sqrt(Math.pow(x1 - x2, 2) + Math.pow(y1 - y2, 2)), 10);
      };
      var centerX = g.width / 2, centerY = g.height / 2;


      /*
       * Overrides the processing setup funciton, gets called once
       */
      g.setup = function () {
        g.size(800, 300);
        centerX = g.width / 2;
        centerY = g.height / 2;

        for (var j = 0; j < g.height-150; j += spawnDistance) {
          var row = [];
          for (var i = 250; i < g.width-250; i += spawnDistance) {
            var p = [i, j, 0, 0, i, j];
            row.push(p);
          }
          particles.push(row);
        }

        // I think we dont need a game loop accumulator at all since javascript is async so we can do:
        setInterval(update,0);
      };

      /*
       * Takes 2 points and returns the resultant force of adding a spring between them.
       */
      var makeSpring = function (x1, y1, x2, y2) {
        var angle = getAngle(x1, y1, x2, y2);
        var distance = getDistance(x1, y1, x2, y2);
        var displacement = springDistance - distance;

        return [-k * displacement * Math.cos(angle), -k * displacement * Math.sin(angle)];
      }

      /*
       * We put all our update logic in a separate update function
       */
      var updateCount = 0;
      var update = function () {

        for (var i = particles.length - 1; i >= 0; i--) {
          var row = particles[i];
          for (var j = row.length - 1; j >= 0; j--) {
            var particle = row[j];
            if (i === 0 && that.attachedSides.top) {
              continue;
            }
            if (i === particles.length-1 && that.attachedSides.bottom) {
              continue;
            }
            if (j === 0 && that.attachedSides.left) {
              continue;
            }
            if (j === row.length-1 && that.attachedSides.right) {
              continue;
            }
            var force = {x:0,y:gr*mass};
            //force = {x:0,y:0};
            // create neighbors
            var neighbors = [];
            if (i - 1 >= 0) {
              neighbors.push(particles[i - 1][j]);
            }
            if (j - 1 >= 0) {
              neighbors.push(particles[i][j - 1]);
            }
            if (j + 1 < row.length) {
              neighbors.push(particles[i][j + 1]);
            }
            if (i + 1 < particles.length) {
              neighbors.push(particles[i + 1][j]);
            }

            var poslimit = {};
            for (var k = 0; k < neighbors.length; k++) {
              var nb = neighbors[k];
              var spring = makeSpring(particle[0], particle[1], nb[0], nb[1])
              force.x += spring[0];
              force.y += spring[1];
            }
            // very important to reset our aux variables!
            particle[4] = particle[0];
            particle[5] = particle[1];

            particle[2] += force.x / mass;
            particle[3] += force.y / mass;
            particle[2] -= particle[2] * friction;
            particle[3] -= particle[3] * friction;
            var magnitude = getDistance(0, 0, particle[2], particle[3]);
            if (magnitude > speedLimit) {
              particle[2] = speedLimit * Math.cos(getAngle(0, 0, particle[2], particle[3]));
              particle[3] = speedLimit * Math.sin(getAngle(0, 0, particle[2], particle[3]));
            }

            // update position for future
            particle[4] += h * particle[2];
            particle[5] += h * particle[3];
          }
        }

        for (var i = particles.length - 1; i >= 0; i--) {
          var row = particles[i];
          for (var j = row.length - 1; j >= 0; j--) {
            var particle = row[j];
            particle[0] = particle[4];
            particle[1] = particle[5];
          }
        }
        if (mouseparticle !== null) {
          mouseparticle[0] = g.mouseX;
          mouseparticle[1] = g.mouseY;
        }
      };

      var mouseparticle = null;

      /*
       * On mouse press get the closest particle and attaches it to the mouse.
       */
      g.mousePressed = function () {
        var distance = 1000;
        for (var i = 0; i < particles.length; i++) {
          for (var j = 0; j < particles[i].length; j++) {

            var obj = particles[i][j];
            var d = getDistance(g.mouseX, g.mouseY, obj[0], obj[1]);
            if (d < distance) {
              distance = d;
              mouseparticle = obj;
            }
          }
        }
      };
      /*
       * releases the particle form the mouse constrain
       */
      g.mouseReleased = function () {
        mouseparticle = null;
      };

      // Override draw function, by default it will be called 60 times per second
      g.draw = function () {
        g.background(22, 200, 30);
        g.fill(0);
        for (var i = 0; i < particles.length; i++) {
          var row = particles[i];
          for (var j = 0; j < row.length; j++) {
            var o = row[j];
            g.set(o[0] + 1, o[1] + 1, 22);
            g.set(o[0] + 1, o[1], 22);
            g.set(o[0], o[1] + 1, 22);
            g.set(o[0], o[1], 22);
          }
        }
      };
    }
  }

};