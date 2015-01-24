var colors = ['#F79945','#F59541','#F4913E','#F28D3B','#F18938','#EF8635',
	'#EE8232','#ED7E2E','#EB7A2B','#EA7628','#E87325','#E76F22','#E56B1F',
	'#E4671B','#E36318','#E16015','#E05C12','#DE580F','#DD540C','#DC5109',
	'#6ED8FC','#79DFF9','#85E7F6','#91EEF3','#9DF6F1','#A6FCEF'];

function Circle(v1, v2, v3) {
	var h, k, r; // h is x-offset, k is y-offset
	var center;

	var a = v1.x, a2 = v1.x * v1.x,
	    b = v1.y, b2 = v1.y * v1.y,
	    c = v2.x, c2 = v2.x * v2.x,
	    d = v2.y, d2 = v2.y * v2.y,
	    e = v3.x, e2 = v3.x * v3.x,
	    f = v3.y, f2 = v3.y * v3.y;

	k = ((a2+b2)*(e-c)+(c2+d2)*(a-e)+(e2+f2)*(c-a))/(b*(e-c)+d*(a-e)+f*(c-a))/2;
	h = ((a2+b2)*(f-d)+(c2+d2)*(b-f)+(e2+f2)*(d-b))/(a*(f-d)+c*(b-f)+e*(d-b))/2;
	r = Math.sqrt((a-h)*(a-h)+(b-k)*(b-k));

	center = new Vertex(h, k);

	this.k = k;
	this.h = h;
	this.r = r;
	this.center = center;
}

Circle.prototype = {
	angleOf: function(vertex) {
		var angle = Math.atan2(vertex.y - this.k, vertex.x - this.h);
		if(angle < 0) {
			angle += Math.PI*2;
		}
		return angle;
	},
	isOnPerimeter: function(vertex) {
		var xs = this.xAt(vertex.y),
		    ys = this.yAt(vertex.x);
		var isX = Math.round(vertex.x) === Math.round(xs[0]) || 
				Math.round(vertex.x) === Math.round(xs[1]),
		    isY = Math.round(vertex.y) === Math.round(ys[0]) || 
		    	Math.round(vertex.y) === Math.round(ys[1]);
		return isX && isY;
	},
	vertexAt: function(angle) {
		return new Vertex(this.r*Math.cos(angle)+this.h, this.r*Math.sin(angle)+this.k)
	},
	xAt: function(y) {
		var x = Math.sqrt(this.r*this.r - (y-this.k)*(y-this.k));
		return [this.h+x, this.h-x];
	},
	yAt: function(x) {
		var y = Math.sqrt(this.r*this.r - (x-this.h)*(x-this.h));
		return [this.k+y, this.k-y];
	}
}

function Line(v1orM, v2orB) {
	var m, b;
	var x = null; // if line is vertical, will be a number

	if(v1orM instanceof Vertex && v2orB instanceof Vertex) {
		m = (v1orM.y - v2orB.y) / (v1orM.x - v2orB.x);
		b = v1orM.y - m * v1orM.x;
		if(!Number.isFinite(m)) { // line is vertical, set x
			x = v1orM.x;
		}
	} else {
		m = v1orM;
		b = v2orB;
	}

	this.m = m;
	this.b = b;
	this.x = x;
}

Line.prototype = {
	intersectAt: function(line) {
		var x, y;

		if(x = this.x || line.x) { // one line is vertical
			// intersection happens at the x value of the vertical line and
			//  the y value of the non-vertical line
			y = (x == this.x) ? line.yAt(x) : this.yAt(x);
		} else {
			x = (line.b - this.b) / (this.m - line.m);
			y = this.yAt(x);
		}

		if(this.m - line.m == 0 || this.x && line.x) { // parallel
			return null;
		}

		return new Vertex(x, y);
	},
	perpendicularLine: function(v) {
		if(this.x) { // perpendicular line will be horizontal
			// create a line given a slope (0) and y-intercept (y coord of v)
			return new Line(0, v.y);
		} else if(this.m === 0) { // perpendicular line will be vertical
			// create a line with vertex v and a new vertex with same x coord
			return new Line(v, new Vertex(v.x, 0));
		}

		var m = -1/this.m,
		    b = v.y - m * v.x;
		return new Line(m, b);
	},
	isVertexOn: function(v) {
		return Math.abs(this.yAt(v.x) - v.y) < 10;
	},
	xAt: function(y) {
		if(this.x) { // line is vertical, for all values y, x is line.x
			return this.x;
		}
		return (y - this.b) / this.m;
	},
	yAt: function(x) {
		if(this.x) { // line is vertical, y is not defined (but we'll say null)
			return null;
		}
		return this.m * x + this.b;
	}
}

function Triangle(v1, v2, v3) {
	this.vertices = [v1, v2, v3];
	this.color = colors[Math.floor(Math.random()*colors.length)];
}

Triangle.prototype = {
	get area() {
		var v1 = this.vertices[0],
		    v2 = this.vertices[1],
		    v3 = this.vertices[2];

		return Math.abs(1/2 * (
			v1.x * (v2.y - v3.y) +
			v2.x * (v3.y - v1.y) +
			v3.x * (v1.y - v2.y)
		));
	},
	get center() {
		var v1 = this.vertices[0],
		    v2 = this.vertices[1],
		    v3 = this.vertices[2];

		return new Vertex(
			(v1.x + v2.x + v3.x) / 3,
			(v1.y + v2.y + v3.y) / 3
		);
	},
	oppositeVertex: function(i) {
		var v1 = this.vertices[i % 3],
		    v2 = this.vertices[(i+1) % 3],
		    v3 = this.vertices[(i+2) % 3];

		var line = new Line(v2, v3);
		var perpedicular = line.perpendicularLine(v1);

		return line.intersectAt(perpedicular);
	}
}

function Vertex(x, y) {
	this.x = x;
	this.y = y;
}

Vertex.prototype = {
	distanceTo: function(vertex) {
		return Math.sqrt(
			Math.pow(this.x - vertex.x, 2) +
			Math.pow(this.y - vertex.y, 2)
		);
	},
	equalTo: function(vertex) {
		return (Math.abs(this.x - vertex.x) < 2 && Math.abs(this.y - vertex.y) < 2);
	},
	midpointBetween: function(v) {
		return new Vertex(
			(this.x + v.x) / 2,
			(this.y + v.y) / 2
		);
	},
	move: function(xOrVertex, y) {
		if(xOrVertex instanceof Vertex) {
			this.x = xOrVertex.x;
			this.y = xOrVertex.y;
		} else {
			this.x = xOrVertex;
			this.y = y;
		}
	},
	translate: function(dx, dy) {
		this.x += dx;
		this.y += dy;
	}
}

function World(canvas) {
	var vertices = generateVertices(50);
	var delaunarray = triangulate(vertices);
	var graph = generateGraph(delaunarray);
	var triangles = generateTriangles(delaunarray, vertices);
	var affiliation = generateAffiliation(vertices, triangles);
	var neighbors = generateNeighbors(affiliation, vertices, triangles);

	this.vertices = vertices;
	this.graph = graph;
	this.triangles = triangles;
	this.affiliation = affiliation;
	this.neighbors = neighbors;
	this.flipping = [];

	this.ctx = canvas.getContext('2d');
	this.width = canvas.width;
	this.height = canvas.height;

	graph.getDegree = function(index) {
		return graph[index].length;
	}

	function generateAffiliation(vertices, triangles) {
		var affiliation = {};

		for(var i = 0; i < vertices.length; i++) {
			affiliation[i] = [];
		}

		triangles.forEach(function(t) {
			t.vertices.forEach(function(v) {
				affiliation[vertices.indexOf(v)].push(t);
			});
		});

		return affiliation;
	}

	function generateGraph(delaunarray) {
		var graph = {};
		var v1, v2, v3;

		for(var i = 0; i < delaunarray.length; i += 3) {
			v1 = delaunarray[i];
			v2 = delaunarray[i+1];
			v3 = delaunarray[i+2];

			connect(graph, v1, v2);
			connect(graph, v1, v3);

			connect(graph, v2, v1);
			connect(graph, v2, v3);

			connect(graph, v3, v1);
			connect(graph, v3, v2);
		}

		return graph;

		function connect(graph, a, b) {
			if(graph[a] === undefined) {
				graph[a] = [];
			}

			if(graph[a].indexOf(b) === -1) {
				graph[a].push(b);
			}
		}
	}

	function generateNeighbors(affiliation, vertices, triangles) {
		var neighbors = [];

		var vID;

		for(var i = 0; i < triangles.length; i++) {
			neighbors[i] = {
				triangle: triangles[i],
				touching: [],
				adjacent: []
			};

			// for each point in a triangle, add the triangles that point is
			//  affiliated with and add it to neighbors.touching
			// if the triangle is already in the touching list, put it in
			//  neighbors.adjacent, since it therefore shares two points
			triangles[i].vertices.forEach(function(v) {
				vID = vertices.indexOf(v);
				affiliation[vID].forEach(function(t) {
					if(triangles[i] != t) {
						if(neighbors[i].touching.indexOf(t) != -1) {
							neighbors[i].adjacent.push(t);
						} else {
							neighbors[i].touching.push(t);
						}
					}
				});
			});
		}

		return neighbors;
	}

	function generateTriangles(delaunarray, vertices) {
		var triangles = [];
		var v1, v2, v3;

		for(var i = 0; i < delaunarray.length; i += 3) {
			v1 = vertices[delaunarray[i]];
			v2 = vertices[delaunarray[i+1]];
			v3 = vertices[delaunarray[i+2]];

			triangles.push(new Triangle(v1, v2, v3));
		}

		return triangles;
	}

	function generateVertices(count) {
		var vertices = new Array(count);
		var x, y;

		for(var i = count - 1; i >= 0; --i) {
			do {
				x = Math.random() - 0.5;
				y = Math.random() - 0.5;
			} while(x * x + y * y > 0.25);

			x = (x * 0.96875 + 0.5) * canvas.width;
			y = (y * 0.96875 + 0.5) * canvas.height;

			vertices[i] = new Vertex(Math.floor(x), Math.floor(y), 0);
		}

		return vertices;
	}

	function triangulate(vertices) {
		var delaunarray = Delaunay.triangulate(
			vertices.reduce(
				function(accum, current) {
					accum.push([current.x, current.y]);
					return accum;
				}, []));

		return delaunarray;
	}
}

World.prototype = {
	draw: function(obj) {
		if(obj instanceof Circle) {
			this.drawCircle(obj);
		} else if(obj instanceof Line) {
			this.drawLine(obj);
		} else if(obj instanceof Triangle) {
			this.drawTriangle(obj);
		} else if(obj instanceof Vertex) {
			this.drawVertex(obj);
		} else {
			this.tick();
		}
	},
	drawCircle: function(circle) {
		this.ctx.beginPath();
		this.ctx.arc(circle.h, circle.k, circle.r, 0, 2 * Math.PI, false);
		this.ctx.lineWidth = 1;
		this.ctx.strokeStyle = 'black';
		this.ctx.stroke();
	},
	drawLine: function(line) {
		this.ctx.beginPath();
		if(line.x) { // line is vertical
			this.ctx.moveTo(line.x, 0);
			this.ctx.lineTo(line.x, this.width);
		} else {
			this.ctx.moveTo(0, line.yAt(0));
			this.ctx.lineTo(this.width, line.yAt(this.width));
		}
		this.ctx.lineWidth = 1;
		this.ctx.strokeStyle = 'black';
		this.ctx.stroke();
	},
	drawTriangle: function(triangle) {
		this.ctx.beginPath();
		this.ctx.moveTo(triangle.vertices[0].x, triangle.vertices[0].y);
		this.ctx.lineTo(triangle.vertices[1].x, triangle.vertices[1].y);
		this.ctx.lineTo(triangle.vertices[2].x, triangle.vertices[2].y);
		this.ctx.closePath();
		this.ctx.fillStyle = triangle.color;
		this.ctx.fill();
		this.ctx.lineWidth = 0.5;
		this.ctx.strokeStyle = 'white';
		this.ctx.stroke();
	},
	drawTriangles: function() {
		this.ctx.canvas.width = this.ctx.canvas.width;
		this.triangles.forEach(World.prototype.drawTriangle, this);
	},
	drawVertex: function(vertex, radius) {
		if(typeof vertex === 'number') { // shortcut for drawing vertex
			vertex = this.vertices[vertex];
		}
		radius = radius || 1;
		this.ctx.beginPath();
		this.ctx.arc(vertex.x, vertex.y, radius, 2*Math.PI, false);
		this.ctx.fillStyle = 'black';
		this.ctx.fill();
	},
	randomFlip: function() {
		var tFrom = randomTriangle.call(this);
		var tTo = flipTo.call(this, tFrom);
		var tFlipping;
		var vFrom, vTo, vFlipping;
		var edgeMid, edge = [];
		var path;
		var flipInstructions;
		var aFrom, aTo;
		var direction;

		tFrom.vertices.forEach(function(v) {
			if(tTo.vertices.indexOf(v) == -1) {
				vFrom = v;
			} else {
				edge.push(v);
			}
		});

		tTo.vertices.forEach(function(v) {
			if(tFrom.vertices.indexOf(v) == -1) {
				vTo = v;
			}
		});

		vFlipping = new Vertex(vFrom.x, vFrom.y);
		tFlipping = new Triangle(edge[0], edge[1], vFlipping);
		tFlipping.color = tFrom.color;

		edgeMid = edge[0].midpointBetween(edge[1]);
		edge = new Line(edge[0], edge[1]);

		// if the circle would be too big (vertices are along the same line)
		//  create a line instead of a circle for the path
		if(new Line(vFrom, vTo).isVertexOn(edgeMid)) {
			path = new Line(vFrom, vTo);
		} else {
			path = new Circle(vFrom, vTo, edgeMid);
		}

		if(path instanceof Circle) {
			aFrom = path.angleOf(vFrom);
			aTo = path.angleOf(vTo);

			// 1 is clockwise around the circle, -1 is counterclockwise
			if(aFrom > aTo) {
				direction = (aFrom - aTo < Math.PI) ? -1 : 1;
			} else {
				direction = (aTo - aFrom < Math.PI) ? 1 : -1;
			}
		}
		if(path instanceof Line) {
			// 1 is increase in x, -1 is decrease in x
			direction = (vFrom.x < vTo.x) ? 1 : -1;
			// still need to figure out what to do about vertical lines
		}

		tFrom.color = colors[Math.floor(Math.random()*colors.length)];

		flipInstructions = {
			tFlipping: tFlipping,
			tFrom: tFrom,
			tTo: tTo,
			vFrom: vFrom,
			vTo: vTo,
			vFlipping: vFlipping,
			edge: edge,
			edgeMid: edgeMid,
			path: path,
			direction: direction
		};

		this.flipping.push(flipInstructions);

		return flipInstructions;

		function randomTriangle() {
			return this.triangles[
				Math.floor(Math.random()*this.triangles.length)
			];
		}

		function flipTo(triangle) {
			var adjacent = 
				this.neighbors[this.triangles.indexOf(triangle)].adjacent;
			return adjacent[Math.floor(Math.random()*adjacent.length)];
		}
	},
	tick: function() {
		this.drawTriangles();
		if(Math.random() < 0.02) {
			this.randomFlip();
		}
		if(this.flipping.length) {
			this.flipping.forEach(function(f) {
				if(!f.vFlipping.equalTo(f.vTo)) {
					if(f.path instanceof Circle) {
						f.vFlipping.move(f.path.vertexAt(f.path.angleOf(f.vFlipping) + f.direction * 0.01));
					} else if(f.path instanceof Line) {
						f.vFlipping.move(new Vertex(f.vFlipping.x + f.direction, f.path.yAt(f.vFlipping.x + f.direction)));
					}
				} else {
					f.tTo.color = f.tFlipping.color;
					this.flipping.splice(this.flipping.indexOf(f), 1);
				}
				this.drawTriangle(f.tFlipping);
			}, this);
		}

		if(!still) {
			window.requestAnimationFrame(this.tick.bind(this));
		}
	}
}

var world = new World(document.getElementById('triangles'));

var still = false;

if(!still) {
	window.requestAnimationFrame(world.tick.bind(world));
} else {
	world.tick();
}