// Create starry background
function createStars() {
  const starCount = 100;
  const container = document.body;

  for (let i = 0; i < starCount; i++) {
    const star = document.createElement("div");
    star.className = "star";

    // Random size (0.5px to 2px)
    const size = Math.random() * 1.5 + 0.5;
    star.style.width = `${size}px`;
    star.style.height = `${size}px`;

    // Random position
    star.style.left = `${Math.random() * 100}%`;
    star.style.top = `${Math.random() * 100}%`;

    // Random opacity
    star.style.opacity = `${Math.random() * 0.7 + 0.3}`;

    container.appendChild(star);
  }
}

// Node class for the simulation
class Node {
  constructor(
    id,
    name,
    influence,
    canvasWidth,
    canvasHeight,
    relationships = []
  ) {
    this.id = id;
    this.name = name;
    this.influence = Math.max(1, Math.min(10, influence)); // Ensure influence is between 1 and 10
    this.relationships = relationships;

    // Physical properties
    this.mass = this.influence * 3; // Mass is proportional to influence
    this.radius = this.influence * 5; // Size is proportional to influence

    // Position and velocity
    this.x = Math.random() * canvasWidth;
    this.y = Math.random() * canvasHeight;
    this.vx = 0;
    this.vy = 0;

    // Store canvas dimensions
    this.canvasWidth = canvasWidth;
    this.canvasHeight = canvasHeight;

    // Orbital properties
    this.angle = Math.random() * Math.PI * 2;
    this.orbitRadius = 0; // Will be calculated
    this.orbitSpeed = 0; // Will be calculated

    // UI states
    this.isDragging = false;
    this.isHovered = false;
  }

  // Apply forces from other nodes and handle orbital motion
  applyForce(nodes, centralNode) {
    if (this.isDragging) return; // Skip physics if being dragged

    // Reset acceleration
    this.ax = 0;
    this.ay = 0;

    // If this is the central node, apply different physics
    if (centralNode && this.id === centralNode.id) {
      // Central node has gentle movement toward center of canvas
      const centerForce = 0.01;
      this.ax = (this.canvasWidth / 2 - this.x) * centerForce;
      this.ay = (this.canvasHeight / 2 - this.y) * centerForce;
      return;
    }

    // Calculate forces from all other nodes
    nodes.forEach((otherNode) => {
      if (otherNode.id === this.id) return; // Skip self

      // Calculate direction vector
      const dx = otherNode.x - this.x;
      const dy = otherNode.y - this.y;

      // Distance between nodes (with a minimum to prevent extreme forces)
      const distance = Math.max(20, Math.sqrt(dx * dx + dy * dy));

      // Base repulsion force (all nodes repel slightly)
      const repulsionStrength = 300; // Reduced from 500
      const repulsionForce = repulsionStrength / (distance * distance);

      // Calculate normalized direction
      const nx = dx / distance;
      const ny = dy / distance;

      // Apply repulsion
      this.ax -= nx * repulsionForce;
      this.ay -= ny * repulsionForce;

      // Apply attraction if there's a relationship
      const hasRelationship =
        this.relationships.includes(otherNode.id) ||
        otherNode.relationships.includes(this.id);

      if (hasRelationship) {
        // Attraction strength based on combined influence
        const attractionStrength = (this.influence + otherNode.influence) * 1.5; // Reduced from 2
        const attractionForce = (attractionStrength * distance) / 100; // Reduced from 50

        // Apply attraction force
        this.ax += nx * attractionForce;
        this.ay += ny * attractionForce;
      }
    });

    // Apply center gravity to keep nodes from flying off-screen
    const centerForce = 0.005; // Reduced from 0.01
    this.ax += (this.canvasWidth / 2 - this.x) * centerForce;
    this.ay += (this.canvasHeight / 2 - this.y) * centerForce;

    // If we have a central node, add orbital tendency around it
    if (centralNode && this.id !== centralNode.id) {
      // Vector from central node to this node
      const dx = this.x - centralNode.x;
      const dy = this.y - centralNode.y;
      const distance = Math.sqrt(dx * dx + dy * dy);

      // Normalized perpendicular vector for orbital motion
      const px = -dy / distance;
      const py = dx / distance;

      // Calculate orbital force (stronger for less influential nodes)
      const orbitalFactor = (0.05 * (11 - this.influence)) / 10;

      // Apply orbital force
      this.ax += px * orbitalFactor;
      this.ay += py * orbitalFactor;
    }
  }

  // Update node position based on forces
  update() {
    if (this.isDragging) return; // Skip physics if being dragged

    // Update velocity with acceleration and damping
    this.vx += this.ax;
    this.vy += this.ay;
    this.vx *= 0.92; // Higher damping to prevent excessive motion
    this.vy *= 0.92;

    // Limit maximum velocity to prevent erratic movement
    const maxVelocity = 2.0;
    const velocityMagnitude = Math.sqrt(this.vx * this.vx + this.vy * this.vy);
    if (velocityMagnitude > maxVelocity) {
      const factor = maxVelocity / velocityMagnitude;
      this.vx *= factor;
      this.vy *= factor;
    }

    // Update position
    this.x += this.vx;
    this.y += this.vy;

    // Contain within canvas bounds with a little padding
    const padding = this.radius + 10;
    this.x = Math.max(padding, Math.min(this.canvasWidth - padding, this.x));
    this.y = Math.max(padding, Math.min(this.canvasHeight - padding, this.y));
  }

  // Get color based on influence (light blue to dark red)
  getInfluenceColor() {
    // Map influence (1-10) to a color gradient
    // Lower influence: light blue (#90e0ef)
    // Higher influence: dark red (#880d1e)

    // RGB values for light blue
    const lowR = 144; // 90 in hex
    const lowG = 224; // e0 in hex
    const lowB = 239; // ef in hex

    // RGB values for dark red
    const highR = 136; // 88 in hex
    const highG = 13; // 0d in hex
    const highB = 30; // 1e in hex

    // Normalized influence (0 to 1)
    const t = (this.influence - 1) / 9;

    // Linear interpolation between colors
    const r = Math.round(lowR + t * (highR - lowR));
    const g = Math.round(lowG + t * (highG - lowG));
    const b = Math.round(lowB + t * (highB - lowB));

    return `rgb(${r}, ${g}, ${b})`;
  }

  // Draw the node on the canvas
  draw(ctx, highlightNode = null) {
    const isHighlighted =
      highlightNode &&
      (this.id === highlightNode.id ||
        this.relationships.includes(highlightNode.id) ||
        highlightNode.relationships.includes(this.id));

    // Get influence-based color
    const nodeColor = this.getInfluenceColor();

    // Extract RGB components for glow effect
    const rgbMatch = nodeColor.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
    const r = rgbMatch ? parseInt(rgbMatch[1]) : 100;
    const g = rgbMatch ? parseInt(rgbMatch[2]) : 150;
    const b = rgbMatch ? parseInt(rgbMatch[3]) : 200;

    // Node body (glowing circle)
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);

    // Create gradient for glow effect
    const glowRadius = this.radius * (isHighlighted ? 1.5 : 1.2);
    const gradient = ctx.createRadialGradient(
      this.x,
      this.y,
      this.radius * 0.5,
      this.x,
      this.y,
      glowRadius
    );

    gradient.addColorStop(
      0,
      `rgba(${r}, ${g}, ${b}, ${isHighlighted ? 0.9 : 0.7})`
    );
    gradient.addColorStop(1, `rgba(${r}, ${g}, ${b}, 0)`);

    ctx.fillStyle = gradient;
    ctx.fill();

    // Node core
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius * 0.7, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${isHighlighted ? 1 : 0.8})`;
    ctx.fill();

    // Node label
    const fontSize = Math.max(12, Math.min(16, this.influence + 6));
    ctx.font = `${fontSize}px Arial`;
    ctx.fillStyle = "#ffffff";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    // Add text shadow for readability
    ctx.shadowColor = "rgba(0, 0, 0, 0.8)";
    ctx.shadowBlur = 4;
    ctx.shadowOffsetX = 1;
    ctx.shadowOffsetY = 1;
    ctx.fillText(this.name, this.x, this.y);

    // Reset shadow
    ctx.shadowColor = "transparent";
    ctx.shadowBlur = 0;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;
  }

  // Check if mouse is over this node
  isPointInside(x, y) {
    const distance = Math.sqrt(
      Math.pow(this.x - x, 2) + Math.pow(this.y - y, 2)
    );
    return distance <= this.radius;
  }
}

// GravMap application class
class GravMap {
  constructor(canvasId) {
    this.canvas = document.getElementById(canvasId);
    this.ctx = this.canvas.getContext("2d");
    this.nodes = [];
    this.nextNodeId = 1;
    this.draggedNode = null;
    this.hoveredNode = null;
    this.centralNode = null; // Reference to the most influential node
    this.animation = null;

    // Initialize event listeners
    this.initEventListeners();

    // Load sample data
    this.loadSampleData();

    // Find the most influential node
    this.updateCentralNode();

    // Start animation loop
    this.animate();

    // Update the UI node list and relationship options
    this.updateUINodeList();
    this.updateRelationshipOptions();
  }

  // Load sample data
  loadSampleData() {
    const sampleData = [
      { name: "CEO", influence: 9, relationships: [2, 3] },
      { name: "Designer", influence: 6, relationships: [1] },
      { name: "Engineer", influence: 7, relationships: [1] },
    ];

    sampleData.forEach((data) => {
      this.nodes.push(
        new Node(
          this.nextNodeId++,
          data.name,
          data.influence,
          this.canvas.width,
          this.canvas.height,
          data.relationships
        )
      );
    });
  }

  // Find the most influential node to use as the central orbital point
  updateCentralNode() {
    this.centralNode = null;
    let maxInfluence = 0;

    this.nodes.forEach((node) => {
      if (node.influence > maxInfluence) {
        maxInfluence = node.influence;
        this.centralNode = node;
      }
    });

    // If central node exists, move it toward the center immediately
    if (this.centralNode) {
      this.centralNode.x = this.canvas.width / 2 + (Math.random() - 0.5) * 50;
      this.centralNode.y = this.canvas.height / 2 + (Math.random() - 0.5) * 50;
    }
  }

  // Initialize all event listeners
  initEventListeners() {
    // Canvas mouse events for dragging and hovering
    this.canvas.addEventListener("mousedown", this.handleMouseDown.bind(this));
    this.canvas.addEventListener("mousemove", this.handleMouseMove.bind(this));
    this.canvas.addEventListener("mouseup", this.handleMouseUp.bind(this));
    this.canvas.addEventListener("mouseleave", this.handleMouseUp.bind(this));

    // Button click handlers
    document
      .getElementById("add-node-btn")
      .addEventListener("click", this.addNode.bind(this));
    document
      .getElementById("randomize-btn")
      .addEventListener("click", this.randomizePositions.bind(this));
  }

  // Handle mouse down for dragging nodes
  handleMouseDown(e) {
    const rect = this.canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Check if any node was clicked
    for (let i = this.nodes.length - 1; i >= 0; i--) {
      if (this.nodes[i].isPointInside(x, y)) {
        this.draggedNode = this.nodes[i];
        this.draggedNode.isDragging = true;
        return;
      }
    }
  }

  // Handle mouse move for dragging and hovering
  handleMouseMove(e) {
    const rect = this.canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Update dragged node position
    if (this.draggedNode) {
      this.draggedNode.x = x;
      this.draggedNode.y = y;
      return;
    }

    // Check for hover
    let hoveredNode = null;
    for (let i = this.nodes.length - 1; i >= 0; i--) {
      if (this.nodes[i].isPointInside(x, y)) {
        hoveredNode = this.nodes[i];
        break;
      }
    }

    // Update hovered node and tooltip
    if (this.hoveredNode !== hoveredNode) {
      this.hoveredNode = hoveredNode;
      this.updateTooltip(e);
    } else if (this.hoveredNode) {
      // Update tooltip position if still hovering
      this.updateTooltip(e);
    }
  }

  // Update tooltip content and position
  updateTooltip(e) {
    const tooltip = document.getElementById("tooltip");

    if (!this.hoveredNode) {
      tooltip.style.opacity = "0";
      return;
    }

    // Set tooltip content
    tooltip.innerHTML = `
          <strong>${this.hoveredNode.name}</strong><br>
          Influence: ${this.hoveredNode.influence}/10<br>
          Relationships: ${this.getRelationshipNames(this.hoveredNode)}
      `;

    // Position tooltip near the cursor
    tooltip.style.left = `${e.clientX + 10}px`;
    tooltip.style.top = `${e.clientY + 10}px`;
    tooltip.style.opacity = "1";
  }

  // Get relationship names for tooltip
  getRelationshipNames(node) {
    if (node.relationships.length === 0) return "None";

    return node.relationships
      .map((id) => {
        const relatedNode = this.nodes.find((n) => n.id === id);
        return relatedNode ? relatedNode.name : "Unknown";
      })
      .join(", ");
  }

  // Handle mouse up to stop dragging
  handleMouseUp() {
    if (this.draggedNode) {
      this.draggedNode.isDragging = false;
      this.draggedNode = null;
    }
  }

  // Add a new node from the input form
  addNode() {
    const nameInput = document.getElementById("node-name");
    const influenceInput = document.getElementById("influence-score");
    const relationshipsSelect = document.getElementById("relationships-select");
    const errorContainer = document.getElementById("error-container");

    // Validate inputs
    const name = nameInput.value.trim();
    const influence = parseInt(influenceInput.value, 10);

    if (!name) {
      errorContainer.textContent = "Please enter a name.";
      return;
    }

    if (isNaN(influence) || influence < 1 || influence > 10) {
      errorContainer.textContent =
        "Influence must be a number between 1 and 10.";
      return;
    }

    // Clear any previous errors
    errorContainer.textContent = "";

    // Get selected relationships
    const relationships = [];
    const relationshipItems =
      relationshipsSelect.querySelectorAll(".relationship-item");

    relationshipItems.forEach((item) => {
      if (item.dataset.selected === "true") {
        relationships.push(parseInt(item.dataset.id, 10));
      }
    });

    // Create new node
    const newNode = new Node(
      this.nextNodeId++,
      name,
      influence,
      this.canvas.width,
      this.canvas.height,
      relationships
    );

    // Position near the center with some randomness
    newNode.x = this.canvas.width / 2 + (Math.random() - 0.5) * 100;
    newNode.y = this.canvas.height / 2 + (Math.random() - 0.5) * 100;

    // Add to nodes array
    this.nodes.push(newNode);

    // Reset input form
    nameInput.value = "";
    influenceInput.value = "5";
    relationshipItems.forEach((item) => {
      item.dataset.selected = "false";
      item.style.backgroundColor = "#48cae4";
    });

    // Update central node if needed
    this.updateCentralNode();

    // Update UI
    this.updateUINodeList();
    this.updateRelationshipOptions();
  }

  // Remove a node
  removeNode(id) {
    // Remove the node
    this.nodes = this.nodes.filter((node) => node.id !== id);

    // Remove this id from all relationship arrays
    this.nodes.forEach((node) => {
      node.relationships = node.relationships.filter((relId) => relId !== id);
    });

    // Update central node if needed
    this.updateCentralNode();

    // Update UI
    this.updateUINodeList();
    this.updateRelationshipOptions();
  }

  // Randomize all node positions
  randomizePositions() {
    this.nodes.forEach((node) => {
      // If this is the central node, keep it near center
      if (this.centralNode && node.id === this.centralNode.id) {
        node.x = this.canvas.width / 2 + (Math.random() - 0.5) * 50;
        node.y = this.canvas.height / 2 + (Math.random() - 0.5) * 50;
      } else {
        node.x = Math.random() * this.canvas.width;
        node.y = Math.random() * this.canvas.height;
      }
      node.vx = 0;
      node.vy = 0;
    });
  }

  // Update the node list in the UI
  updateUINodeList() {
    const nodeList = document.getElementById("node-list");
    nodeList.innerHTML = "";

    this.nodes.forEach((node) => {
      const nodeItem = document.createElement("div");
      nodeItem.className = "node-item";

      // Check if this is the central node
      const isCentral = this.centralNode && node.id === this.centralNode.id;

      nodeItem.innerHTML = `
              <strong>${node.name}</strong> (Influence: ${node.influence})
              ${
                isCentral
                  ? '<span style="color: #90e0ef;"> (Central)</span>'
                  : ""
              }
              <button class="remove-btn">×</button>
          `;

      // Add remove button handler
      const removeBtn = nodeItem.querySelector(".remove-btn");
      removeBtn.addEventListener("click", () => this.removeNode(node.id));

      nodeList.appendChild(nodeItem);
    });
  }

  // Update relationship options in the multi-select
  updateRelationshipOptions() {
    const relationshipsSelect = document.getElementById("relationships-select");
    relationshipsSelect.innerHTML = "";

    this.nodes.forEach((node) => {
      const item = document.createElement("div");
      item.className = "relationship-item";
      item.textContent = node.name;
      item.dataset.id = node.id;
      item.dataset.selected = "false";

      // Toggle selection on click
      item.addEventListener("click", function () {
        const isSelected = this.dataset.selected === "true";
        this.dataset.selected = isSelected ? "false" : "true";
        this.style.backgroundColor = isSelected ? "#48cae4" : "#ef476f";
      });

      relationshipsSelect.appendChild(item);
    });
  }

  // Animation loop
  animate() {
    // Clear canvas
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    // Draw connections first (so they appear under nodes)
    this.drawConnections();

    // Apply physics to each node
    this.nodes.forEach((node) => {
      node.applyForce(this.nodes, this.centralNode);
      node.update();
    });

    // Draw all nodes
    this.nodes.forEach((node) => {
      node.draw(this.ctx, this.hoveredNode);
    });

    // Continue animation loop
    this.animation = requestAnimationFrame(this.animate.bind(this));
  }

  // Draw connections between related nodes
  drawConnections() {
    this.nodes.forEach((node) => {
      node.relationships.forEach((relatedId) => {
        const relatedNode = this.nodes.find((n) => n.id === relatedId);
        if (!relatedNode) return;

        // Determine if this connection should be highlighted
        const isHighlighted =
          this.hoveredNode &&
          (node.id === this.hoveredNode.id ||
            relatedNode.id === this.hoveredNode.id);

        // Calculate connection strength based on combined influence
        const connectionStrength =
          (node.influence + relatedNode.influence) / 20;

        // Draw curved connection
        this.drawCurvedConnection(
          node,
          relatedNode,
          connectionStrength,
          isHighlighted
        );
      });
    });
  }

  // Draw a curved connection between two nodes
  drawCurvedConnection(nodeA, nodeB, strength, isHighlighted) {
    const ctx = this.ctx;

    // Calculate midpoint with slight offset for curve
    const mpX = (nodeA.x + nodeB.x) / 2;
    const mpY = (nodeA.y + nodeB.y) / 2;

    // Calculate distance for curve control point
    const dx = nodeB.x - nodeA.x;
    const dy = nodeB.y - nodeA.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    // Perpendicular offset for control point
    const offsetX = -dy * 0.2;
    const offsetY = dx * 0.2;

    // Control point for the curve
    const cpX = mpX + offsetX;
    const cpY = mpY + offsetY;

    // Line width based on connection strength
    const lineWidth = Math.max(1, Math.min(5, strength * 2));

    // Create color gradient based on influence
    const gradient = ctx.createLinearGradient(
      nodeA.x,
      nodeA.y,
      nodeB.x,
      nodeB.y
    );

    // Calculate colors based on node influence
    const colorA = this.influenceToColor(nodeA.influence);
    const colorB = this.influenceToColor(nodeB.influence);

    gradient.addColorStop(0, colorA);
    gradient.addColorStop(1, colorB);

    // Draw the curved connection
    ctx.beginPath();
    ctx.moveTo(nodeA.x, nodeA.y);
    ctx.quadraticCurveTo(cpX, cpY, nodeB.x, nodeB.y);
    ctx.lineWidth = isHighlighted ? lineWidth * 1.5 : lineWidth;
    ctx.strokeStyle = gradient;
    ctx.globalAlpha = isHighlighted ? 0.9 : 0.6;
    ctx.stroke();
    ctx.globalAlpha = 1.0;
  }

  // Convert influence score to color
  influenceToColor(influence) {
    // Blue (low) to red (high)
    const r = Math.min(255, Math.round(influence * 25));
    const g = Math.min(255, Math.round(100 + influence * 10));
    const b = Math.min(255, Math.round(250 - influence * 20));
    return `rgb(${r}, ${g}, ${b})`;
  }
}

// Initialize the GravMap when the page loads
window.onload = function () {
  // Set up the canvas to fill the window
  const canvas = document.getElementById("gravmap-canvas");
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;

  // Create stars for background
  createStars();

  // Initialize the GravMap
  const gravMap = new GravMap("gravmap-canvas");

  // Handle window resize
  window.addEventListener("resize", function () {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    // Reposition nodes within new canvas bounds
    gravMap.randomizePositions();
  });
};
