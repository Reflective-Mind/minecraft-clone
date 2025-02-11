// Remove WebSocket variables and initialization
// let ws;
// let playerId;
// const otherPlayers = new Map();

// Initialize the game
document.addEventListener('DOMContentLoaded', () => {
    // Try to load saved world first
    if (!loadWorldFromLocalStorage()) {
        // If no saved world, generate new one
        generateWorld();
    }
});

// Add autosave every 30 seconds
setInterval(saveWorldToLocalStorage, 30000);

// Add escape key handler for world reset
document.addEventListener('keydown', (event) => {
    if (event.code === 'Escape') {
        toggleMenu(document.getElementById('menuScreen').style.display !== 'flex');
    }
});

// Remove WebSocket connection setup
// function connectToServer() { ... }

// Remove WebSocket-related functions
// function addOtherPlayer() { ... }
// function updateOtherPlayer() { ... }
// function removeOtherPlayer() { ... }
// function handleBlockUpdate() { ... }

// Update the animation loop to remove WebSocket position updates
animate = function() {
    requestAnimationFrame(animate);

    if (controls.isLocked) {
        const time = performance.now();
        const delta = (time - prevTime) / 1000;

        velocity.x -= velocity.x * 10.0 * delta;
        velocity.z -= velocity.z * 10.0 * delta;
        velocity.y -= 9.8 * 10.0 * delta; // Gravity

        direction.z = Number(moveForward) - Number(moveBackward);
        direction.x = Number(moveRight) - Number(moveLeft);
        direction.normalize();

        if (moveForward || moveBackward) velocity.z -= direction.z * 100.0 * delta;
        if (moveLeft || moveRight) velocity.x -= direction.x * 100.0 * delta;

        controls.moveRight(-velocity.x * delta);
        controls.moveForward(-velocity.z * delta);

        camera.position.y += velocity.y * delta;

        // Simple collision detection with ground
        if (camera.position.y < 1) {
            velocity.y = 0;
            camera.position.y = 1;
            canJump = true;
        }

        prevTime = time;
    }

    renderer.render(scene, camera);
};

// Add local storage functions at the top
function saveWorldToLocalStorage() {
    try {
        const worldData = {
            blocks: Array.from(blocks.entries()).map(([key, block]) => ({
                key,
                position: {
                    x: block.position.x,
                    y: block.position.y,
                    z: block.position.z
                },
                blockType: block.blockType,
                blockSize: block.blockSize
            })),
            lastSaved: Date.now()
        };
        localStorage.setItem('minecraft_world', JSON.stringify(worldData));
        console.log('World saved to local storage');
    } catch (error) {
        console.error('Error saving world to local storage:', error);
    }
}

function loadWorldFromLocalStorage() {
    try {
        const savedData = localStorage.getItem('minecraft_world');
        if (savedData) {
            console.log('Found saved world in local storage');
            const worldData = JSON.parse(savedData);
            
            // Clear existing blocks
            blocks.forEach(block => {
                scene.remove(block);
            });
            blocks.clear();
            
            // Load saved blocks
            worldData.blocks.forEach(blockData => {
                createBlock(
                    new THREE.Vector3(
                        blockData.position.x,
                        blockData.position.y,
                        blockData.position.z
                    ),
                    blockData.blockType,
                    blockData.blockSize || 1
                );
            });
            console.log('World loaded from local storage');
            return true;
        }
        return false;
    } catch (error) {
        console.error('Error loading world from local storage:', error);
        return false;
    }
}

function resetWorld() {
    if (confirm('Are you sure you want to reset the world? This cannot be undone!')) {
        try {
            localStorage.removeItem('minecraft_world');
            
            // Clear existing blocks
            blocks.forEach(block => {
                scene.remove(block);
            });
            blocks.clear();
            
            // Generate new world
            generateWorld();
            alert('World reset successfully!');
            toggleMenu(false);
        } catch (error) {
            console.error('Error resetting world:', error);
            alert('Failed to reset world: ' + error.message);
        }
    }
}

// Update createBlock function to save after block placement
createBlock = function(position, type, size = 1) {
    let geometry;
    let mesh;

    // Enhanced snapping logic for perfect alignment
    if (snapToGrid) {
        // Snap to the smallest grid size (0.125) first, then adjust based on current block size
        const baseGrid = 0.125;
        position.x = Math.round(position.x / baseGrid) * baseGrid;
        position.y = Math.round(position.y / baseGrid) * baseGrid;
        position.z = Math.round(position.z / baseGrid) * baseGrid;

        // Ensure the position is aligned with the current block size
        if (size > baseGrid) {
            position.x = Math.round(position.x / size) * size;
            position.y = Math.round(position.y / size) * size;
            position.z = Math.round(position.z / size) * size;
        }
    }

    // Create geometry based on size
    geometry = new THREE.BoxGeometry(size, size, size);

    switch(type.material) {
        case 'STONE':
            if (size === 1) {
                // Only add detail variations to full-size blocks
                geometry = new THREE.BoxGeometry(size, size, size, 2, 2, 2);
                const positionAttribute = geometry.attributes.position;
                for(let i = 0; i < positionAttribute.count; i++) {
                    const x = positionAttribute.getX(i);
                    const y = positionAttribute.getY(i);
                    const z = positionAttribute.getZ(i);
                    
                    positionAttribute.setX(i, x + (Math.random() - 0.5) * 0.05 * size);
                    positionAttribute.setY(i, y + (Math.random() - 0.5) * 0.05 * size);
                    positionAttribute.setZ(i, z + (Math.random() - 0.5) * 0.05 * size);
                }
                positionAttribute.needsUpdate = true;
                geometry.computeVertexNormals();
            }
            mesh = new THREE.Mesh(geometry, materials[type.material]);
            break;

        case 'GRASS':
            const materialArray = [];
            for (let i = 0; i < 6; i++) {
                if (i === 2) { // top face
                    const topMaterial = materials[type.material].top.clone();
                    topMaterial.bumpScale = 0.05 * size;
                    materialArray.push(topMaterial);
                } else if (i === 3) { // bottom face
                    materialArray.push(materials[type.material].bottom);
                } else { // side faces
                    const sideMaterial = materials[type.material].side.clone();
                    sideMaterial.bumpScale = 0.03 * size;
                    materialArray.push(sideMaterial);
                }
            }
            mesh = new THREE.Mesh(geometry, materialArray);
            break;

        case 'WOOD':
            const woodMaterialArray = [];
            for (let i = 0; i < 6; i++) {
                if (i === 2 || i === 3) { // top and bottom faces
                    woodMaterialArray.push(materials[type.material].top);
                } else { // side faces
                    const sideMaterial = materials[type.material].side.clone();
                    sideMaterial.bumpScale = 0.05 * size;
                    woodMaterialArray.push(sideMaterial);
                }
            }
            mesh = new THREE.Mesh(geometry, woodMaterialArray);
            break;

        default:
            mesh = new THREE.Mesh(geometry, materials[type.material]);
    }

    // Add grid helper lines for smaller blocks
    if (size < 1) {
        const edges = new THREE.EdgesGeometry(geometry);
        const line = new THREE.LineSegments(
            edges,
            new THREE.LineBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.2 })
        );
        mesh.add(line);
    }

    mesh.position.copy(position);
    mesh.blockType = type;
    mesh.blockSize = size;
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    scene.add(mesh);
    
    // Use precise positioning for the key
    const key = `${position.x},${position.y},${position.z}`;
    blocks.set(key, mesh);

    // Save to local storage if not during world generation
    if (!isGeneratingWorld) {
        saveWorldToLocalStorage();
    }
    
    return mesh;
};

// Update removeBlock function to save after block removal
removeBlock = function(block) {
    if (block && block.position) {
        const key = `${block.position.x},${block.position.y},${block.position.z}`;
        console.log('Removing block with key:', key);
        
        scene.remove(block);
        blocks.delete(key);
        
        // Save to local storage if not during world generation
        if (!isGeneratingWorld) {
            saveWorldToLocalStorage();
        }
    }
};

// Add menu handling functions
function toggleMenu(show) {
    const menuScreen = document.getElementById('menuScreen');
    if (show) {
        menuScreen.style.display = 'flex';
        controls.unlock();
    } else {
        menuScreen.style.display = 'none';
        controls.lock();
    }
}

function saveWorld() {
    try {
        const worldData = {
            blocks: Array.from(blocks.entries()).map(([key, block]) => ({
                key,
                position: {
                    x: block.position.x,
                    y: block.position.y,
                    z: block.position.z
                },
                blockType: block.blockType,
                blockSize: block.blockSize
            })),
            lastSaved: Date.now()
        };
        localStorage.setItem('minecraft_world', JSON.stringify(worldData));
        alert('World saved successfully!');
    } catch (error) {
        console.error('Error saving world:', error);
        alert('Failed to save world: ' + error.message);
    }
}

function loadWorld() {
    try {
        const savedData = localStorage.getItem('minecraft_world');
        if (savedData) {
            const worldData = JSON.parse(savedData);
            
            // Clear existing blocks
            blocks.forEach(block => {
                scene.remove(block);
            });
            blocks.clear();
            
            // Load saved blocks
            worldData.blocks.forEach(blockData => {
                createBlock(
                    new THREE.Vector3(
                        blockData.position.x,
                        blockData.position.y,
                        blockData.position.z
                    ),
                    blockData.blockType,
                    blockData.blockSize || 1
                );
            });
            alert('World loaded successfully!');
            toggleMenu(false);
        } else {
            alert('No saved world found!');
        }
    } catch (error) {
        console.error('Error loading world:', error);
        alert('Failed to load world: ' + error.message);
    }
}

// ... rest of your existing game.js code ... 