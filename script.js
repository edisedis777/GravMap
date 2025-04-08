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
    this.orbitVisible = false; // Whether to show orbit path
    this.orbitPath = []; // Points for orbit visualization

    // UI states
    this.isDragging = false;
    this.isHovered = false;
  }

  applyForce(nodes, centralNode) {
    if (this.isDragging) return; // Skip physics if being dragged

    // Reset acceleration
    this.ax = 0;
    this.ay = 0;

    // If this is the central node, apply different physics
    if (centralNode && this.id === centralNode.id) {
      const centerForce = 0.005; // Reduced for more stability
      this.ax = (this.canvasWidth / 2 - this.x) * centerForce;
      this.ay = (this.canvasHeight / 2 - this.y) * centerForce;
      return;
    }

    // For solar system-like orbits
    if (centralNode && this.id !== centralNode.id) {
      const dx = this.x - centralNode.x;
      const dy = this.y - centralNode.y;
      const distanceToCenter = Math.sqrt(dx * dx + dy * dy);

      if (!this.orbitRadius) {
        this.orbitRadius = 100 + (11 - this.influence) * 40;
        this.orbitRadius += Math.random() * 30;
        this.orbitSpeed = 0.0008 * (1 / (this.orbitRadius / 200));
        this.angle = Math.random() * Math.PI * 2;
        this.x = centralNode.x + Math.cos(this.angle) * this.orbitRadius;
        this.y = centralNode.y + Math.sin(this.angle) * this.orbitRadius;
      }

      this.angle += this.orbitSpeed;
      const targetX = centralNode.x + Math.cos(this.angle) * this.orbitRadius;
      const targetY = centralNode.y + Math.sin(this.angle) * this.orbitRadius;

      this.ax = (targetX - this.x) * 0.1;
      this.ay = (targetY - this.y) * 0.1;

      if (!this.orbitVisible) {
        this.orbitVisible = true;
        this.orbitPath = [];
        for (let i = 0; i < 60; i++) {
          const angle = (i / 60) * Math.PI * 2;
          this.orbitPath.push({
            x: centralNode.x + Math.cos(angle) * this.orbitRadius,
            y: centralNode.y + Math.sin(angle) * this.orbitRadius,
          });
        }
      }
      return;
    }

    // Calculate forces from all other nodes
    nodes.forEach((otherNode) => {
      if (otherNode.id === this.id) return;

      const dx = otherNode.x - this.x;
      const dy = otherNode.y - this.y;
      const distance = Math.max(40, Math.sqrt(dx * dx + dy * dy));
      const repulsionStrength = 900;
      const repulsionForce = repulsionStrength / (distance * distance);
      const nx = dx / distance;
      const ny = dy / distance;

      this.ax -= nx * repulsionForce;
      this.ay -= ny * repulsionForce;

      const hasRelationship =
        this.relationships.includes(otherNode.id) ||
        otherNode.relationships.includes(this.id);

      if (hasRelationship) {
        const attractionStrength = (this.influence + otherNode.influence) * 1.5;
        const attractionForce = (attractionStrength * distance) / 200;
        this.ax += nx * attractionForce;
        this.ay += ny * attractionForce;
      }
    });

    const centerForce = 0.003;
    this.ax += (this.canvasWidth / 2 - this.x) * centerForce;
    this.ay += (this.canvasHeight / 2 - this.y) * centerForce;
  }

  update() {
    if (this.isDragging) return;

    this.vx += this.ax;
    this.vy += this.ay;
    this.vx *= 0.98;
    this.vy *= 0.98;

    const maxVelocity = 0.8;
    const velocityMagnitude = Math.sqrt(this.vx * this.vx + this.vy * this.vy);
    if (velocityMagnitude > maxVelocity) {
      const factor = maxVelocity / velocityMagnitude;
      this.vx *= factor;
      this.vy *= factor;
    }

    this.x += this.vx;
    this.y += this.vy;

    const padding = this.radius + 10;
    this.x = Math.max(padding, Math.min(this.canvasWidth - padding, this.x));
    this.y = Math.max(padding, Math.min(this.canvasHeight - padding, this.y));
  }

  getInfluenceColor() {
    const colorScales = [
      { influence: 1, color: "#87CEEB" },
      { influence: 3, color: "#4682B4" },
      { influence: 5, color: "#32CD32" },
      { influence: 7, color: "#FFD700" },
      { influence: 10, color: "#FF4500" },
    ];

    let lowerColor, upperColor, lowerInfluence, upperInfluence;
    for (let i = 0; i < colorScales.length - 1; i++) {
      if (
        this.influence >= colorScales[i].influence &&
        this.influence <= colorScales[i + 1].influence
      ) {
        lowerColor = colorScales[i].color;
        upperColor = colorScales[i + 1].color;
        lowerInfluence = colorScales[i].influence;
        upperInfluence = colorScales[i + 1].influence;
        break;
      }
    }

    if (!lowerColor) {
      return this.influence <= colorScales[0].influence
        ? colorScales[0].color
        : colorScales[colorScales.length - 1].color;
    }

    const hexToRgb = (hex) => {
      const r = parseInt(hex.substring(1, 3), 16);
      const g = parseInt(hex.substring(3, 5), 16);
      const b = parseInt(hex.substring(5, 7), 16);
      return { r, g, b };
    };

    const rgbLower = hexToRgb(lowerColor);
    const rgbUpper = hexToRgb(upperColor);
    const range = upperInfluence - lowerInfluence;
    const factor = (this.influence - lowerInfluence) / range;

    const r = Math.round(rgbLower.r + factor * (rgbUpper.r - rgbLower.r));
    const g = Math.round(rgbLower.g + factor * (rgbUpper.g - rgbLower.g));
    const b = Math.round(rgbLower.b + factor * (rgbUpper.b - rgbLower.b));

    return `rgb(${r}, ${g}, ${b})`;
  }

  draw(ctx, highlightNode = null) {
    const isHighlighted =
      highlightNode &&
      (this.id === highlightNode.id ||
        this.relationships.includes(highlightNode.id) ||
        highlightNode.relationships.includes(this.id));

    if (this.orbitVisible && this.orbitPath.length > 0) {
      ctx.beginPath();
      ctx.moveTo(this.orbitPath[0].x, this.orbitPath[0].y);
      for (let i = 1; i < this.orbitPath.length; i++) {
        ctx.lineTo(this.orbitPath[i].x, this.orbitPath[i].y);
      }
      ctx.closePath();
      ctx.strokeStyle = "rgba(255, 255, 255, 0.15)";
      ctx.lineWidth = 1;
      ctx.stroke();
    }

    const nodeColor = this.getInfluenceColor();
    const rgbMatch = nodeColor.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
    const r = rgbMatch ? parseInt(rgbMatch[1]) : 100;
    const g = rgbMatch ? parseInt(rgbMatch[2]) : 150;
    const b = rgbMatch ? parseInt(rgbMatch[3]) : 200;

    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
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

    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius * 0.7, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${isHighlighted ? 1 : 0.8})`;
    ctx.fill();

    const fontSize = Math.max(12, Math.min(16, this.influence + 6));
    ctx.font = `${fontSize}px Arial`;
    ctx.fillStyle = "#ffffff";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.shadowColor = "rgba(0, 0, 0, 0.8)";
    ctx.shadowBlur = 4;
    ctx.shadowOffsetX = 1;
    ctx.shadowOffsetY = 1;
    ctx.fillText(this.name, this.x, this.y);
    ctx.shadowColor = "transparent";
    ctx.shadowBlur = 0;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;
  }

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
    this.centralNode = null;
    this.animation = null;
    this.isMobile = window.innerWidth <= 768;

    this.initEventListeners();
    this.updateCentralNode();
    this.animate();
    this.updateUINodeList();
    this.updateRelationshipOptions();
    this.createExportButtons();
    this.initMobileFeatures();
  }

  initMobileFeatures() {
    // Add panel toggle functionality for mobile
    const panelToggle = document.getElementById("panel-toggle");
    const gravMapContainer = document.getElementById("gravmap-container");

    // Hide panel toggle on desktop
    if (!this.isMobile) {
      panelToggle.style.display = "none";
    }

    panelToggle.addEventListener("click", () => {
      gravMapContainer.classList.toggle("panel-collapsed");
      panelToggle.textContent = gravMapContainer.classList.contains(
        "panel-collapsed"
      )
        ? "☰"
        : "✕";
    });

    // Add touch event handlers
    this.canvas.addEventListener(
      "touchstart",
      this.handleTouchStart.bind(this),
      { passive: false }
    );
    this.canvas.addEventListener("touchmove", this.handleTouchMove.bind(this), {
      passive: false,
    });
    this.canvas.addEventListener("touchend", this.handleTouchEnd.bind(this));
  }

  handleTouchStart(e) {
    e.preventDefault(); // Prevent scrolling when interacting with canvas
    if (e.touches.length === 1) {
      const touch = e.touches[0];
      const rect = this.canvas.getBoundingClientRect();
      const x = touch.clientX - rect.left;
      const y = touch.clientY - rect.top;

      for (let i = this.nodes.length - 1; i >= 0; i--) {
        if (this.nodes[i].isPointInside(x, y)) {
          this.draggedNode = this.nodes[i];
          this.draggedNode.isDragging = true;
          if (this.draggedNode.id !== this.centralNode?.id) {
            this.draggedNode.orbitRadius = 0;
            this.draggedNode.orbitVisible = false;
          }
          return;
        }
      }
    }
  }

  handleTouchMove(e) {
    e.preventDefault(); // Prevent scrolling when dragging
    if (e.touches.length === 1 && this.draggedNode) {
      const touch = e.touches[0];
      const rect = this.canvas.getBoundingClientRect();
      const x = touch.clientX - rect.left;
      const y = touch.clientY - rect.top;

      this.draggedNode.x = x;
      this.draggedNode.y = y;
    }
  }

  handleTouchEnd(e) {
    if (this.draggedNode) {
      this.draggedNode.isDragging = false;
      this.draggedNode = null;
    }
  }

  createExportButtons() {
    const exportContainer = document.createElement("div");
    exportContainer.className = "export-buttons";

    const pdfButton = document.createElement("button");
    pdfButton.id = "export-pdf-btn";
    pdfButton.className = "export-btn";
    pdfButton.innerHTML =
      '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>' +
      (this.isMobile ? "" : " PDF");
    pdfButton.addEventListener("click", this.exportToPDF.bind(this));

    const pngButton = document.createElement("button");
    pngButton.id = "export-png-btn";
    pngButton.className = "export-btn";
    pngButton.innerHTML =
      '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21 15 16 10 5 21"></polyline></svg>' +
      (this.isMobile ? "" : " PNG");
    pngButton.addEventListener("click", this.exportToPNG.bind(this));

    exportContainer.appendChild(pdfButton);
    exportContainer.appendChild(pngButton);
    document.getElementById("canvas-container").appendChild(exportContainer);
  }

  exportToPDF() {
    this.showExportNotification("Exporting as PDF...");
    const imgData = this.canvas.toDataURL("image/png");
    setTimeout(() => {
      try {
        if (typeof jspdf !== "undefined") {
          const pdf = new jspdf.jsPDF();
          const imgWidth = 210;
          const imgHeight = (this.canvas.height * imgWidth) / this.canvas.width;
          pdf.addImage(imgData, "PNG", 0, 0, imgWidth, imgHeight);
          pdf.save("gravmap-export.pdf");
          this.showExportNotification("PDF exported successfully!", "success");
        } else {
          const link = document.createElement("a");
          link.download = "gravmap-export.png";
          link.href = imgData;
          link.click();
          this.showExportNotification(
            "PDF export not available. Downloaded as PNG instead.",
            "warning"
          );
        }
      } catch (err) {
        console.error("PDF export failed:", err);
        this.showExportNotification("PDF export failed.", "error");
      }
    }, 100);
  }

  // Export to PNG
  exportToPNG() {
    this.showExportNotification("Exporting as PNG...");
    try {
      const imgData = this.canvas.toDataURL("image/png");
      const link = document.createElement("a");
      link.download = "gravmap-export.png";
      link.href = imgData;
      link.click();
      this.showExportNotification("PNG exported successfully!", "success");
    } catch (err) {
      console.error("PNG export failed:", err);
      this.showExportNotification("PNG export failed.", "error");
    }
  }

  showExportNotification(message, type = "info") {
    let notification = document.getElementById("export-notification");
    if (!notification) {
      notification = document.createElement("div");
      notification.id = "export-notification";
      document.body.appendChild(notification);
    }
    notification.className = `export-notification ${type}`;
    notification.textContent = message;
    notification.style.display = "block";
    notification.style.opacity = "1";
    setTimeout(() => {
      notification.style.opacity = "0";
      setTimeout(() => (notification.style.display = "none"), 500);
    }, 3000);
  }

  initEventListeners() {
    this.canvas.addEventListener("mousedown", this.handleMouseDown.bind(this));
    this.canvas.addEventListener("mousemove", this.handleMouseMove.bind(this));
    this.canvas.addEventListener("mouseup", this.handleMouseUp.bind(this));
    this.canvas.addEventListener("mouseleave", this.handleMouseUp.bind(this));
    document
      .getElementById("add-node-btn")
      .addEventListener("click", this.addNode.bind(this));
  }

  handleMouseDown(e) {
    const rect = this.canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    for (let i = this.nodes.length - 1; i >= 0; i--) {
      if (this.nodes[i].isPointInside(x, y)) {
        this.draggedNode = this.nodes[i];
        this.draggedNode.isDragging = true;
        if (this.draggedNode.id !== this.centralNode?.id) {
          this.draggedNode.orbitRadius = 0;
          this.draggedNode.orbitVisible = false;
        }
        return;
      }
    }
  }

  handleMouseMove(e) {
    const rect = this.canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    if (this.draggedNode) {
      this.draggedNode.x = x;
      this.draggedNode.y = y;
      return;
    }

    let hoveredNode = null;
    for (let i = this.nodes.length - 1; i >= 0; i--) {
      if (this.nodes[i].isPointInside(x, y)) {
        hoveredNode = this.nodes[i];
        break;
      }
    }

    if (this.hoveredNode !== hoveredNode) {
      this.hoveredNode = hoveredNode;
      this.updateTooltip(e);
    } else if (this.hoveredNode) {
      this.updateTooltip(e);
    }
  }

  updateTooltip(e) {
    const tooltip = document.getElementById("tooltip");
    if (!this.hoveredNode) {
      tooltip.style.opacity = "0";
      return;
    }
    tooltip.innerHTML = `
      <strong>${this.hoveredNode.name}</strong><br>
      Influence: ${this.hoveredNode.influence}/10<br>
      Relationships: ${this.getRelationshipNames(this.hoveredNode)}
    `;
    tooltip.style.left = `${e.clientX + 10}px`;
    tooltip.style.top = `${e.clientY + 10}px`;
    tooltip.style.opacity = "1";
  }

  getRelationshipNames(node) {
    if (node.relationships.length === 0) return "None";
    return node.relationships
      .map((id) => {
        const relatedNode = this.nodes.find((n) => n.id === id);
        return relatedNode ? relatedNode.name : "Unknown";
      })
      .join(", ");
  }

  handleMouseUp() {
    if (this.draggedNode) {
      this.draggedNode.isDragging = false;
      this.draggedNode = null;
    }
  }

  addNode() {
    const nameInput = document.getElementById("node-name");
    const influenceInput = document.getElementById("influence-score");
    const relationshipsSelect = document.getElementById("relationships-select");
    const errorContainer = document.getElementById("error-container");

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

    errorContainer.textContent = "";

    const relationships = [];
    const relationshipItems =
      relationshipsSelect.querySelectorAll(".relationship-item");
    relationshipItems.forEach((item) => {
      if (item.dataset.selected === "true") {
        relationships.push(parseInt(item.dataset.id, 10));
      }
    });

    const newNode = new Node(
      this.nextNodeId++,
      name,
      influence,
      this.canvas.width,
      this.canvas.height,
      relationships
    );
    this.nodes.push(newNode);

    nameInput.value = "";
    influenceInput.value = "5";
    relationshipItems.forEach((item) => {
      item.dataset.selected = "false";
      item.style.backgroundColor = "#48cae4";
    });

    this.updateCentralNode();
    this.nodes.forEach((node) => {
      if (node.id !== this.centralNode?.id) {
        node.orbitRadius = 0;
        node.orbitVisible = false;
      }
    });

    this.updateUINodeList();
    this.updateRelationshipOptions();
  }

  removeNode(id) {
    this.nodes = this.nodes.filter((node) => node.id !== id);
    this.nodes.forEach((node) => {
      node.relationships = node.relationships.filter((relId) => relId !== id);
    });
    this.updateCentralNode();
    this.nodes.forEach((node) => {
      if (node.id !== this.centralNode?.id) {
        node.orbitRadius = 0;
        node.orbitVisible = false;
      }
    });
    this.updateUINodeList();
    this.updateRelationshipOptions();
  }

  updateUINodeList() {
    const nodeList = document.getElementById("node-list");
    nodeList.innerHTML = "";
    this.nodes.forEach((node) => {
      const nodeItem = document.createElement("div");
      nodeItem.className = "node-item";
      const isCentral = this.centralNode && node.id === this.centralNode.id;
      nodeItem.innerHTML = `
        <strong>${node.name}</strong> (Influence: ${node.influence})
        ${isCentral ? '<span style="color: #FFD700;"> (Central)</span>' : ""}
        <button class="remove-btn">×</button>
      `;
      const removeBtn = nodeItem.querySelector(".remove-btn");
      removeBtn.addEventListener("click", () => this.removeNode(node.id));
      nodeList.appendChild(nodeItem);
    });
  }

  updateRelationshipOptions() {
    const relationshipsSelect = document.getElementById("relationships-select");
    relationshipsSelect.innerHTML = "";
    this.nodes.forEach((node) => {
      const item = document.createElement("div");
      item.className = "relationship-item";
      item.textContent = node.name;
      item.dataset.id = node.id;
      item.dataset.selected = "false";
      item.addEventListener("click", function () {
        const isSelected = this.dataset.selected === "true";
        this.dataset.selected = isSelected ? "false" : "true";
        this.style.backgroundColor = isSelected ? "#48cae4" : "#ef476f";
      });
      relationshipsSelect.appendChild(item);
    });
  }

  updateCentralNode() {
    this.centralNode = null;
    let maxInfluence = 0;
    this.nodes.forEach((node) => {
      if (node.influence > maxInfluence) {
        maxInfluence = node.influence;
        this.centralNode = node;
      }
    });
    if (this.centralNode) {
      this.centralNode.x = this.canvas.width / 2;
      this.centralNode.y = this.canvas.height / 2;
      this.nodes.forEach((node) => {
        if (node.id !== this.centralNode.id) {
          node.orbitRadius = 0;
          node.orbitVisible = false;
        }
      });
    }
  }

  animate() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.drawConnections();
    this.nodes.forEach((node) => {
      node.applyForce(this.nodes, this.centralNode);
      node.update();
    });
    this.nodes.forEach((node) => node.draw(this.ctx, this.hoveredNode));
    this.animation = requestAnimationFrame(this.animate.bind(this));
  }

  drawConnections() {
    this.nodes.forEach((node) => {
      node.relationships.forEach((relatedId) => {
        const relatedNode = this.nodes.find((n) => n.id === relatedId);
        if (!relatedNode) return;
        const isHighlighted =
          this.hoveredNode &&
          (node.id === this.hoveredNode.id ||
            relatedNode.id === this.hoveredNode.id);
        const connectionStrength =
          (node.influence + relatedNode.influence) / 20;
        this.drawCurvedConnection(
          node,
          relatedNode,
          connectionStrength,
          isHighlighted
        );
      });
    });
  }

  drawCurvedConnection(nodeA, nodeB, strength, isHighlighted) {
    const ctx = this.ctx;
    const mpX = (nodeA.x + nodeB.x) / 2;
    const mpY = (nodeA.y + nodeB.y) / 2;
    const dx = nodeB.x - nodeA.x;
    const dy = nodeB.y - nodeA.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    const offsetX = -dy * 0.2;
    const offsetY = dx * 0.2;
    const cpX = mpX + offsetX;
    const cpY = mpY + offsetY;
    const lineWidth = Math.max(1, Math.min(5, strength * 2));

    const gradient = ctx.createLinearGradient(
      nodeA.x,
      nodeA.y,
      nodeB.x,
      nodeB.y
    );
    const colorA = this.influenceToColor(nodeA.influence);
    const colorB = this.influenceToColor(nodeB.influence);
    gradient.addColorStop(0, colorA);
    gradient.addColorStop(1, colorB);

    ctx.beginPath();
    ctx.moveTo(nodeA.x, nodeA.y);
    ctx.quadraticCurveTo(cpX, cpY, nodeB.x, nodeB.y);
    ctx.lineWidth = isHighlighted ? lineWidth * 1.5 : lineWidth;
    ctx.strokeStyle = gradient;
    ctx.globalAlpha = isHighlighted ? 0.9 : 0.6;
    ctx.stroke();
    ctx.globalAlpha = 1.0;
  }

  influenceToColor(influence) {
    const r = Math.min(255, Math.round(influence * 25));
    const g = Math.min(255, Math.round(100 + influence * 10));
    const b = Math.min(255, Math.round(250 - influence * 20));
    return `rgb(${r}, ${g}, ${b})`;
  }

  updateCanvasDimensions(width, height) {
    this.nodes.forEach((node) => {
      node.canvasWidth = width;
      node.canvasHeight = height;
    });
  }
}

// Initialize the GravMap when the page loads
window.onload = function () {
  const canvas = document.getElementById("gravmap-canvas");
  canvas.width = canvas.clientWidth;
  canvas.height = canvas.clientHeight;

  createStars();
  const gravMap = new GravMap("gravmap-canvas");

  window.addEventListener("resize", function () {
    canvas.width = canvas.clientWidth;
    canvas.height = canvas.clientHeight;
    gravMap.updateCanvasDimensions(canvas.clientWidth, canvas.clientHeight);
    if (gravMap.centralNode) {
      gravMap.centralNode.x = canvas.clientWidth / 2;
      gravMap.centralNode.y = canvas.clientHeight / 2;
    }
  });
};
