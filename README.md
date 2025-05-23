# GravMap: Organizational Influence Visualization
[![Visual Studio Code](https://custom-icon-badges.demolab.com/badge/Visual%20Studio%20Code-0078d7.svg?logo=vsc&logoColor=white)](#)
[![HTML](https://img.shields.io/badge/HTML-%23E34F26.svg?logo=html5&logoColor=white)](#)
[![CSS](https://img.shields.io/badge/CSS-1572B6?logo=css3&logoColor=fff)](#)
[![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?logo=javascript&logoColor=000)](#)
[![Markdown](https://img.shields.io/badge/Markdown-%23000000.svg?logo=markdown&logoColor=white)](#)


![Screenshot](https://github.com/user-attachments/assets/e84a370e-d27d-4038-9ebc-39ea9f73ab05)


## Overview

GravMap is an interactive web-based tool that visualizes organizational relationships and influence through a physics-based network diagram. Unlike traditional hierarchical org charts, GravMap represents team dynamics as a gravitational system where each person's influence affects others through attractive and repulsive forces.

## Features

- **Physics-Based Visualization**: Nodes (people) interact through simulated gravitational forces based on influence scores and relationships
- **Dynamic Relationships**: Connect individuals to visualize reporting lines and cross-functional relationships
- **Interactive Interface**: Drag, hover, and explore the network
- **Real-Time Updates**: Add and remove nodes
- **Influence Gradient**: Visual representation of influence levels through color coding and node size
- **Beautiful UI**: Starry background and glowing node effects 

## Live Demo

[View the live demo](https://edisedis777.github.io/GravMap/)

## How It Works

GravMap uses a custom physics engine to simulate organizational dynamics:

1. **Nodes**: Each person is represented as a node with properties:
   - Name: The individual's name or role
   - Influence: A score from 1-10 representing their organizational impact
   - Relationships: Connections to other nodes

2. **Physics**:
   - Related nodes attract each other, with force proportional to combined influence
   - The most influential node becomes the "central node" that others orbit around
   - Nodes with lower influence tend to orbit those with higher influence

3. **Visual Cues**:
   - Node size represents influence

## Getting Started

### Prerequisites

- A modern web browser (Chrome, Firefox, Safari, or Edge)

### Installation

1. Clone the repository:
   ```
   git clone https://github.com/edisedis777/gravmap.git
   ```

2. Open `index.html` in your browser

That's it! No build process or dependencies to install.

### Usage

1. **Add a Node**: Enter name, influence score (1-10), and select relationships
2. **Remove a Node**: Click the "×" button on the node in the list
3. **Randomize**: Shuffle node positions while maintaining physics rules
4. **Explore**: Hover over nodes to see detailed information
5. **Interact**: Drag nodes to manually position them

## Technical Details

GravMap is built with pure JavaScript, HTML and CSS. The visualization uses the Canvas API for efficient rendering.

- `script.js`: Core application logic, physics engine, and rendering
- `styles.css`: Visual styling and layout
- `index.html`: Application structure and UI elements


## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request


## Credits

GravMap was inspired by the article [Gravity Maps: An Alternative to Org Charts](https://www.leadinginproduct.com/p/gravity-maps-an-alternative-to-org-charts) by Janna Bastow. The article describes how traditional org charts fail to capture the complex dynamics of modern organizations and proposes gravity maps as a more nuanced representation.


## License

Distributed under the GNU Affero General Public License v3.0 License. See `LICENSE` for more information.

