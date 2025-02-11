// Game configuration
const WORLD_SIZE = 32;
const CHUNK_SIZE = 16;
const BLOCK_SIZE = 1;

// Biome definitions
const BIOMES = {
    PLAINS: {
        heightScale: 8,
        heightOffset: 4,
        treeChance: 0.02,
        blockTypes: {
            surface: 'GRASS',
            subsurface: 'DIRT',
            deep: 'STONE'
        }
    },
    DESERT: {
        heightScale: 6,
        heightOffset: 2,
        treeChance: 0.01,
        blockTypes: {
            surface: 'SAND',
            subsurface: 'SAND',
            deep: 'SANDSTONE'
        }
    },
    MOUNTAINS: {
        heightScale: 16,
        heightOffset: 8,
        treeChance: 0.03,
        blockTypes: {
            surface: 'STONE',
            subsurface: 'STONE',
            deep: 'STONE'
        }
    },
    FOREST: {
        heightScale: 10,
        heightOffset: 5,
        treeChance: 0.08,
        blockTypes: {
            surface: 'GRASS',
            subsurface: 'DIRT',
            deep: 'STONE'
        }
    }
};

// Three.js setup
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// Renderer settings for better graphics
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.outputEncoding = THREE.sRGBEncoding;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.0;

// Sky and lighting setup
const sky = new THREE.Color(0x87CEEB);
scene.background = sky;
scene.fog = new THREE.Fog(sky, 20, 60);

// Dynamic lighting setup
const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
scene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
directionalLight.position.set(50, 50, 30);
directionalLight.castShadow = true;
directionalLight.shadow.mapSize.width = 2048;
directionalLight.shadow.mapSize.height = 2048;
directionalLight.shadow.camera.near = 0.5;
directionalLight.shadow.camera.far = 500;
directionalLight.shadow.camera.left = -50;
directionalLight.shadow.camera.right = 50;
directionalLight.shadow.camera.top = 50;
directionalLight.shadow.camera.bottom = -50;
scene.add(directionalLight);

// Day/Night cycle
let dayTime = 0;
const DAY_LENGTH = 600;

function updateDayNightCycle() {
    dayTime = (dayTime + 1) % DAY_LENGTH;
    const timeOfDay = dayTime / DAY_LENGTH;
    
    const skyColorNight = new THREE.Color(0x1a1a2a);
    const skyColorDay = new THREE.Color(0x87CEEB);
    const currentSkyColor = skyColorDay.clone().lerp(skyColorNight, Math.sin(timeOfDay * Math.PI));
    
    scene.background = currentSkyColor;
    scene.fog.color = currentSkyColor;
    
    const lightIntensity = Math.cos(timeOfDay * Math.PI * 2) * 0.5 + 0.5;
    directionalLight.intensity = lightIntensity * 0.8;
    ambientLight.intensity = lightIntensity * 0.4;
}

// Texture loader
const textureLoader = new THREE.TextureLoader();

// Material definitions with distinct appearances
const materials = {
    GRASS: {
        top: new THREE.MeshStandardMaterial({
            color: 0x3bba1a,
            roughness: 0.8,
            metalness: 0.1
        }),
        side: new THREE.MeshStandardMaterial({
            color: 0x967c4b,
            roughness: 0.9,
            metalness: 0.1
        }),
        bottom: new THREE.MeshStandardMaterial({
            color: 0x8b4513,
            roughness: 0.9,
            metalness: 0.1
        })
    },
    DIRT: new THREE.MeshStandardMaterial({
        color: 0x8b4513,
        roughness: 0.9,
        metalness: 0.1
    }),
    STONE: new THREE.MeshStandardMaterial({
        color: 0x808080,
        roughness: 0.7,
        metalness: 0.2,
        flatShading: true
    }),
    WOOD: {
        side: new THREE.MeshStandardMaterial({
            color: 0x966F33,
            roughness: 0.9,
            metalness: 0.1,
            flatShading: true
        }),
        top: new THREE.MeshStandardMaterial({
            color: 0x7F5C2A,
            roughness: 0.9,
            metalness: 0.1,
            flatShading: true
        })
    },
    GOLD: new THREE.MeshStandardMaterial({
        color: 0xFFD700,
        roughness: 0.3,
        metalness: 0.8,
        envMapIntensity: 1.0
    }),
    DIAMOND: new THREE.MeshStandardMaterial({
        color: 0x00FFFF,
        roughness: 0.2,
        metalness: 0.9,
        envMapIntensity: 1.0
    }),
    GLASS: new THREE.MeshStandardMaterial({
        color: 0xFFFFFF,
        roughness: 0.1,
        metalness: 0.2,
        transparent: true,
        opacity: 0.3,
        envMapIntensity: 1.0
    }),
    BEDROCK: new THREE.MeshStandardMaterial({
        color: 0x4a4a4a,
        roughness: 1.0,
        metalness: 0.0,
        flatShading: true
    }),
    SAND: new THREE.MeshStandardMaterial({
        color: 0xFFE4B5,
        roughness: 1.0,
        metalness: 0.0
    }),
    LAVA: new THREE.MeshStandardMaterial({
        color: 0xFF4500,
        roughness: 0.3,
        metalness: 0.0,
        emissive: 0xFF4500,
        emissiveIntensity: 0.5
    }),
    ICE: new THREE.MeshStandardMaterial({
        color: 0xADD8E6,
        roughness: 0.1,
        metalness: 0.3,
        transparent: true,
        opacity: 0.8
    }),
    LEAVES: new THREE.MeshStandardMaterial({
        color: 0x2d5a27,
        roughness: 0.8,
        metalness: 0.1,
        transparent: true,
        opacity: 0.9
    })
};

// Controls
const controls = new THREE.PointerLockControls(camera, document.body);
// Disable the built-in Escape key handling
controls.enabled = false;

// Block types with more distinct appearances
const blockTypes = {
    GRASS: { id: 1, material: 'GRASS', displayColor: '#3bba1a' },
    DIRT: { id: 2, material: 'DIRT', displayColor: '#8b4513' },
    STONE: { id: 3, material: 'STONE', displayColor: '#808080' },
    WOOD: { id: 4, material: 'WOOD', displayColor: '#966F33' },
    GOLD: { id: 5, material: 'GOLD', displayColor: '#FFD700' },
    DIAMOND: { id: 6, material: 'DIAMOND', displayColor: '#00ffff' },
    GLASS: { id: 7, material: 'GLASS', displayColor: '#add8e6' },
    BEDROCK: { id: 8, material: 'BEDROCK', displayColor: '#4a4a4a' },
    SAND: { id: 9, material: 'SAND', displayColor: '#FFE4B5' },
    LAVA: { id: 10, material: 'LAVA', displayColor: '#FF4500' },
    ICE: { id: 11, material: 'ICE', displayColor: '#ADD8E6' },
    LEAVES: { id: 12, material: 'LEAVES', displayColor: '#2d5a27' }
};

// World data
const blocks = new Map();

// Player movement
let moveForward = false;
let moveBackward = false;
let moveLeft = false;
let moveRight = false;
let canJump = true;

const velocity = new THREE.Vector3();
const direction = new THREE.Vector3();
let prevTime = performance.now();

// Add these variables near the top with other game state variables
let isPlacing = false;
let isRemoving = false;
let lastBlockUpdateTime = 0;
const BLOCK_UPDATE_INTERVAL = 100;

// Update block size control variables
let currentBlockSize = 1;
const BLOCK_SIZES = [0.125, 0.25, 0.5, 1]; // Only sizes 1x and smaller, all powers of 2 for perfect alignment
let snapToGrid = true;

// Menu handling functions
function toggleMenu(show) {
    const menuScreen = document.getElementById('menuScreen');
    const blueprintMenu = document.getElementById('blueprintMenu');
    
    if (show) {
        menuScreen.style.display = 'flex';
        blueprintMenu.style.display = 'none';
        document.getElementById('blockMenu').style.display = 'none';
        controls.unlock();
        // Reset movement flags when menu is shown
        moveForward = false;
        moveBackward = false;
        moveLeft = false;
        moveRight = false;
    } else {
        menuScreen.style.display = 'none';
        if (blueprintMenu.style.display !== 'block') {
            document.getElementById('blockMenu').style.display = 'flex';
            controls.lock();
        }
    }
}

// Initialize controls
document.addEventListener('click', function(event) {
    const menuScreen = document.getElementById('menuScreen');
    const blueprintMenu = document.getElementById('blueprintMenu');
    
    // Don't lock controls if clicking within menus
    if (event.target.closest('#menuScreen') || event.target.closest('#blueprintMenu')) {
        return;
    }
    
    // Only lock controls if no menus are visible
    if (menuScreen.style.display !== 'flex' && blueprintMenu.style.display !== 'block') {
        controls.lock();
    }
});

controls.addEventListener('lock', function() {
    const blueprintMenu = document.getElementById('blueprintMenu');
    if (blueprintMenu.style.display !== 'block') {
        document.getElementById('blockMenu').style.display = 'flex';
    }
});

controls.addEventListener('unlock', function() {
    const blueprintMenu = document.getElementById('blueprintMenu');
    const menuScreen = document.getElementById('menuScreen');
    // Only hide block menu if a menu is being shown
    if (blueprintMenu.style.display === 'block' || menuScreen.style.display === 'flex') {
        document.getElementById('blockMenu').style.display = 'none';
    }
});

// Handle Escape key
document.addEventListener('keydown', function(event) {
    if (event.code === 'Escape') {
        event.preventDefault();
        const menuScreen = document.getElementById('menuScreen');
        const isMenuVisible = menuScreen.style.display === 'flex';
        toggleMenu(!isMenuVisible);
        return;
    }

    // Only handle movement keys if menu is not shown and controls are locked
    if (!controls.isLocked || document.getElementById('menuScreen').style.display === 'flex') {
        return;
    }

    switch(event.code) {
        case 'ArrowUp':
        case 'KeyW':
            moveForward = true;
            break;
        case 'ArrowDown':
        case 'KeyS':
            moveBackward = true;
            break;
        case 'ArrowLeft':
        case 'KeyA':
            moveLeft = true;
            break;
        case 'ArrowRight':
        case 'KeyD':
            moveRight = true;
            break;
        case 'Space':
            if (canJump) velocity.y += 20;
            canJump = false;
            break;
    }
});

// Add keyup handler for movement
document.addEventListener('keyup', function(event) {
    // Only handle movement keys if controls are locked
    if (!controls.isLocked) return;

    switch(event.code) {
        case 'ArrowUp':
        case 'KeyW':
            moveForward = false;
            break;
        case 'ArrowDown':
        case 'KeyS':
            moveBackward = false;
            break;
        case 'ArrowLeft':
        case 'KeyA':
            moveLeft = false;
            break;
        case 'ArrowRight':
        case 'KeyD':
            moveRight = false;
            break;
    }
});

function createMaterial(textureUrl, properties = {}) {
    const texture = textureLoader.load(textureUrl);
    texture.magFilter = THREE.NearestFilter;
    texture.minFilter = THREE.NearestFilter;
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    
    return new THREE.MeshStandardMaterial({
        map: texture,
        roughness: properties.roughness || 0.8,
        metalness: properties.metalness || 0.1,
        transparent: properties.transparent || false,
        opacity: properties.opacity || 1.0,
        color: properties.color || 0xFFFFFF,
        normalScale: new THREE.Vector2(1, 1)
    });
}

// Improved block creation with better snapping
function createBlock(position, type, size = 1) {
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
                for(let i = 0; i < geometry.vertices.length; i++) {
                    geometry.vertices[i].x += (Math.random() - 0.5) * 0.05 * size;
                    geometry.vertices[i].y += (Math.random() - 0.5) * 0.05 * size;
                    geometry.vertices[i].z += (Math.random() - 0.5) * 0.05 * size;
                }
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
    const key = `${position.x.toFixed(4)},${position.y.toFixed(4)},${position.z.toFixed(4)},${size}`;
    blocks.set(key, mesh);
    return mesh;
}

// Generate initial world
function generateWorld() {
    // Create ground
    for (let x = -WORLD_SIZE/2; x < WORLD_SIZE/2; x++) {
        for (let z = -WORLD_SIZE/2; z < WORLD_SIZE/2; z++) {
            createBlock(new THREE.Vector3(x, -1, z), blockTypes.GRASS);
            
            // Random terrain generation
            if (Math.random() < 0.1) {
                const height = Math.floor(Math.random() * 3) + 1;
                for (let y = 0; y < height; y++) {
                    createBlock(new THREE.Vector3(x, y, z), blockTypes.DIRT);
                }
            }
        }
    }
}

// Raycasting for block placement/removal
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

// Block selection
let selectedBlockType = blockTypes.GRASS;

// Update keyboard controls for block selection
document.addEventListener('keydown', (event) => {
    // First check for blueprint menu toggle
    if (event.code === 'KeyB') {
        event.preventDefault();
        const blueprintMenu = document.getElementById('blueprintMenu');
        const isVisible = blueprintMenu.style.display === 'block';
        toggleBlueprintMenu(!isVisible);
        return;
    }

    // Only handle block selection if menu is not shown
    if (document.getElementById('menuScreen').style.display === 'flex' ||
        document.getElementById('blueprintMenu').style.display === 'block') {
        return;
    }

    let blockChanged = true;
    switch (event.code) {
        case 'Digit1': selectedBlockType = blockTypes.GRASS; break;
        case 'Digit2': selectedBlockType = blockTypes.DIRT; break;
        case 'Digit3': selectedBlockType = blockTypes.STONE; break;
        case 'Digit4': selectedBlockType = blockTypes.WOOD; break;
        case 'Digit5': selectedBlockType = blockTypes.GOLD; break;
        case 'Digit6': selectedBlockType = blockTypes.DIAMOND; break;
        case 'Digit7': selectedBlockType = blockTypes.GLASS; break;
        case 'Digit8': selectedBlockType = blockTypes.SAND; break;
        case 'Digit9': selectedBlockType = blockTypes.ICE; break;
        default: blockChanged = false;
    }

    if (blockChanged) {
        isPlacingBlueprint = false;
        selectedBlueprint = null;
        updateBlockMenu();
    }
});

// Update block menu display
function updateBlockMenu() {
    const blockMenu = document.getElementById('blockMenu');
    if (!blockMenu || !selectedBlockType) return;
    
    // Set the background color based on the selected block type
    blockMenu.style.backgroundColor = `rgba(0, 0, 0, 0.7)`;
    
    // Convert decimal to fraction for display
    let sizeDisplay;
    if (currentBlockSize === 1) sizeDisplay = "1";
    else if (currentBlockSize === 0.5) sizeDisplay = "1/2";
    else if (currentBlockSize === 0.25) sizeDisplay = "1/4";
    else if (currentBlockSize === 0.125) sizeDisplay = "1/8";
    
    // Create a colored square to represent the block
    const blockColor = selectedBlockType.displayColor || '#ffffff';
    blockMenu.innerHTML = `
        <div style="
            width: 20px;
            height: 20px;
            background-color: ${blockColor};
            border: 1px solid white;
            margin-right: 10px;
            display: inline-block;
        "></div>
        <span>${selectedBlockType.material}<br>Size: ${sizeDisplay}x<br>${snapToGrid ? 'Snapping ON' : 'Snapping OFF'}</span>
    `;
}

// Update block selection from menu
document.addEventListener('DOMContentLoaded', () => {
    // Handle block selection from the blocks tab
    document.querySelectorAll('.block-item[data-block]').forEach(item => {
        item.addEventListener('click', (event) => {
            event.preventDefault();
            event.stopPropagation();
            
            const blockType = item.getAttribute('data-block');
            console.log('Selected block:', blockType);
            
            if (blockTypes[blockType]) {
                selectedBlockType = blockTypes[blockType];
                isPlacingBlueprint = false;
                selectedBlueprint = null;
                updateBlockMenu();
                toggleBlueprintMenu(false);
            }
        });
    });

    // Handle blueprint selection
    document.querySelectorAll('.blueprint-item[data-blueprint]').forEach(item => {
        item.addEventListener('click', (event) => {
            event.preventDefault();
            event.stopPropagation();
            
            const blueprintId = item.getAttribute('data-blueprint');
            console.log('Selected blueprint:', blueprintId);
            
            if (window.blueprints[blueprintId]) {
                selectedBlueprint = window.blueprints[blueprintId];
                isPlacingBlueprint = true;
                updateBlueprintMenu();
                toggleBlueprintMenu(false);
                controls.lock();
            }
        });
    });
});

// Fix continuous block placement/removal
let blockUpdateInterval;

document.addEventListener('mousedown', (event) => {
    if (!controls.isLocked) return;
    
    if (event.button === 0) { // Left click - Start placing
        isPlacing = true;
        startBlockUpdates();
    } else if (event.button === 2) { // Right click - Start removing
        isRemoving = true;
        startBlockUpdates();
    }
});

document.addEventListener('mouseup', (event) => {
    if (event.button === 0) { // Left click release
        isPlacing = false;
    } else if (event.button === 2) { // Right click release
        isRemoving = false;
    }
    
    if (!isPlacing && !isRemoving) {
        clearInterval(blockUpdateInterval);
    }
});

function startBlockUpdates() {
    updateBlocks(); // Immediate first update
    clearInterval(blockUpdateInterval); // Clear any existing interval
    blockUpdateInterval = setInterval(updateBlocks, 100); // Continue updates every 100ms
}

// Update block placement logic
function updateBlocks() {
    const currentTime = performance.now();
    if (currentTime - lastBlockUpdateTime < BLOCK_UPDATE_INTERVAL) return;
    lastBlockUpdateTime = currentTime;

    if (!isPlacing && !isRemoving) return;

    raycaster.setFromCamera(new THREE.Vector2(), camera);
    const intersects = raycaster.intersectObjects(scene.children);

    if (intersects.length > 0) {
        const intersect = intersects[0];
        
        if (isPlacing) {
            const normal = intersect.face.normal.multiplyScalar(currentBlockSize * 0.5);
            const position = intersect.point.add(normal);
            
            // Create position vector with high precision
            const roundedPos = new THREE.Vector3(
                parseFloat(position.x.toFixed(4)),
                parseFloat(position.y.toFixed(4)),
                parseFloat(position.z.toFixed(4))
            );
            
            const key = `${roundedPos.x.toFixed(4)},${roundedPos.y.toFixed(4)},${roundedPos.z.toFixed(4)},${currentBlockSize}`;
            
            if (!blocks.has(key)) {
                createBlock(roundedPos, selectedBlockType, currentBlockSize);
            }
        } else if (isRemoving) {
            removeBlock(intersects[0].object);
        }
    }

    // Continue updating if still placing/removing
    if (isPlacing || isRemoving) {
        requestAnimationFrame(updateBlocks);
    }
}

// Initialize block menu
updateBlockMenu();

// Prevent context menu on right click
document.addEventListener('contextmenu', (event) => event.preventDefault());

// Animation loop
function animate() {
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
}

// Handle window resize
window.addEventListener('resize', onWindowResize, false);

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

// Initialize the game
generateWorld();
camera.position.set(0, 2, 5);
animate();

// Add new block types
const newMaterials = {
    SANDSTONE: new THREE.MeshStandardMaterial({
        color: 0xDEB887,
        roughness: 0.9,
        metalness: 0.1,
        flatShading: true
    }),
    WATER: new THREE.MeshStandardMaterial({
        color: 0x3498db,
        roughness: 0.1,
        metalness: 0.3,
        transparent: true,
        opacity: 0.8
    }),
    SNOW: new THREE.MeshStandardMaterial({
        color: 0xFFFFFF,
        roughness: 0.3,
        metalness: 0.1
    })
};

// Merge new materials with existing ones
Object.assign(materials, newMaterials);

// Add new block types
const newBlockTypes = {
    SANDSTONE: { id: 13, material: 'SANDSTONE', displayColor: '#DEB887' },
    WATER: { id: 14, material: 'WATER', displayColor: '#3498db' },
    SNOW: { id: 15, material: 'SNOW', displayColor: '#FFFFFF' }
};

// Merge new block types with existing ones
Object.assign(blockTypes, newBlockTypes);

// Improved terrain generation with biomes
function generateTerrain() {
    const noise = new SimplexNoise();
    const biomeNoise = new SimplexNoise();
    
    // Generate biome map
    const biomeMap = new Map();
    
    for (let x = -WORLD_SIZE/2; x < WORLD_SIZE/2; x++) {
        for (let z = -WORLD_SIZE/2; z < WORLD_SIZE/2; z++) {
            // Use noise to determine biome
            const biomeValue = biomeNoise.noise2D(x * 0.02, z * 0.02);
            let biome;
            
            if (biomeValue < -0.5) {
                biome = BIOMES.DESERT;
            } else if (biomeValue < 0) {
                biome = BIOMES.PLAINS;
            } else if (biomeValue < 0.5) {
                biome = BIOMES.FOREST;
            } else {
                biome = BIOMES.MOUNTAINS;
            }
            
            biomeMap.set(`${x},${z}`, biome);
            
            // Generate height using multiple noise layers
            const frequency1 = 0.05;
            const frequency2 = 0.1;
            const height1 = noise.noise2D(x * frequency1, z * frequency1) * biome.heightScale;
            const height2 = noise.noise2D(x * frequency2, z * frequency2) * (biome.heightScale * 0.5);
            const totalHeight = Math.floor(Math.abs(height1 + height2) + biome.heightOffset);
            
            // Create terrain layers
            for (let y = -1; y <= totalHeight; y++) {
                let blockType;
                
                if (y === totalHeight) {
                    blockType = blockTypes[biome.blockTypes.surface];
                } else if (y > totalHeight - 3) {
                    blockType = blockTypes[biome.blockTypes.subsurface];
                } else {
                    blockType = blockTypes[biome.blockTypes.deep];
                }
                
                // Add random ores
                if (y < totalHeight - 3) {
                    if (y < -10 && Math.random() < 0.02) {
                        blockType = blockTypes.DIAMOND;
                    } else if (y < -5 && Math.random() < 0.03) {
                        blockType = blockTypes.GOLD;
                    }
                }
                
                createBlock(new THREE.Vector3(x, y, z), blockType);
            }
            
            // Generate trees based on biome
            if (Math.random() < biome.treeChance && totalHeight > 0) {
                generateTree(x, totalHeight + 1, z);
            }
            
            // Add water in low areas
            if (totalHeight < 0) {
                for (let y = totalHeight; y <= 0; y++) {
                    createBlock(new THREE.Vector3(x, y, z), blockTypes.WATER);
                }
            }
        }
    }
}

// Enhanced tree generation
function generateTree(x, y, z) {
    const trunkHeight = Math.floor(Math.random() * 3) + 4;
    const leafRadius = Math.floor(Math.random() * 2) + 2;
    
    // Create trunk
    for (let i = 0; i < trunkHeight; i++) {
        createBlock(new THREE.Vector3(x, y + i, z), blockTypes.WOOD);
    }
    
    // Create leaves in a more natural, random pattern
    for (let lx = -leafRadius; lx <= leafRadius; lx++) {
        for (let ly = 0; ly <= leafRadius + 1; ly++) {
            for (let lz = -leafRadius; lz <= leafRadius; lz++) {
                const distance = Math.sqrt(lx * lx + ly * ly + lz * lz);
                if (distance <= leafRadius + 0.5 && Math.random() < 0.7) {
                    const leafPos = new THREE.Vector3(
                        x + lx,
                        y + trunkHeight + ly - 1,
                        z + lz
                    );
                    createBlock(leafPos, blockTypes.LEAVES);
                }
            }
        }
    }
}

// Add particle effects for block breaking
function createBlockBreakParticles(position, material, size = 1) {
    const particleCount = Math.floor(10 * size);
    const particleSize = 0.1 * size;
    const geometry = new THREE.BoxGeometry(particleSize, particleSize, particleSize);
    const particles = [];

    for (let i = 0; i < particleCount; i++) {
        const particle = new THREE.Mesh(geometry, material);
        particle.position.copy(position);
        particle.velocity = new THREE.Vector3(
            (Math.random() - 0.5) * 0.3 * size,
            Math.random() * 0.5 * size,
            (Math.random() - 0.5) * 0.3 * size
        );
        particle.lifetime = 1.0;
        scene.add(particle);
        particles.push(particle);
    }

    function updateParticles() {
        let allDead = true;
        particles.forEach(particle => {
            if (particle.lifetime > 0) {
                allDead = false;
                particle.position.add(particle.velocity);
                particle.velocity.y -= 0.02 * size;
                particle.lifetime -= 0.02;
                particle.material.opacity = particle.lifetime;
            } else {
                scene.remove(particle);
            }
        });
        
        if (!allDead) {
            requestAnimationFrame(updateParticles);
        }
    }
    
    updateParticles();
}

// Add sound management
let lastSoundTime = 0;
const SOUND_COOLDOWN = 100; // Minimum time between sounds in milliseconds

// Update block removal to include particles and sound
function removeBlock(block) {
    if (!block || !block.position || block.position.y <= -1) return;
    
    // Play sound with cooldown
    const currentTime = performance.now();
    if (currentTime - lastSoundTime > SOUND_COOLDOWN) {
        const sound = document.getElementById('blockBreakSound');
        if (sound) {
            sound.currentTime = 0; // Reset sound to start
            sound.volume = 0.3; // Reduce volume to be less intrusive
            sound.playbackRate = 0.8 + Math.random() * 0.4; // Randomize pitch slightly
            sound.play().catch(e => console.log('Error playing sound:', e));
            lastSoundTime = currentTime;
        }
    }

    createBlockBreakParticles(block.position, block.material, block.blockSize);
    scene.remove(block);
    const key = `${block.position.x.toFixed(4)},${block.position.y.toFixed(4)},${block.position.z.toFixed(4)},${block.blockSize}`;
    blocks.delete(key);
}

// Add mousewheel handler for block size adjustment
document.addEventListener('wheel', (event) => {
    if (!controls.isLocked) return;
    
    const currentIndex = BLOCK_SIZES.indexOf(currentBlockSize);
    if (event.deltaY < 0) {
        // Scroll up - increase size
        currentBlockSize = BLOCK_SIZES[Math.min(currentIndex + 1, BLOCK_SIZES.length - 1)];
    } else {
        // Scroll down - decrease size
        currentBlockSize = BLOCK_SIZES[Math.max(currentIndex - 1, 0)];
    }
    
    updateBlockMenu();
});

// Add toggle for snapping
document.addEventListener('keydown', (event) => {
    if (event.code === 'KeyV') {
        snapToGrid = !snapToGrid;
        updateBlockMenu();
    }
});

// Initialize the game with the new terrain generation
generateTerrain();
camera.position.set(0, 20, 5); // Start higher to see the new terrain
animate();

// Add menu handling functions
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

// Blueprint system
window.blueprints = {
    beautifulTree: {
        name: "Beautiful Tree",
        description: "A majestic tree with a detailed canopy and custom trunk design",
        preview: "🌳",
        blocks: [
            // Trunk base (wider at bottom)
            { pos: [0, 0, 0], type: 'WOOD', size: 1, repeat: [2, 1, 2] },
            // Main trunk
            { pos: [0.5, 1, 0.5], type: 'WOOD', size: 1, repeat: [1, 4, 1] },
            // Trunk details (using smaller blocks)
            { pos: [0.25, 1, 0], type: 'WOOD', size: 0.5, repeat: [1, 3, 1] },
            { pos: [1.25, 1, 1], type: 'WOOD', size: 0.5, repeat: [1, 3, 1] },
            // Leaves layers (bottom to top)
            { pos: [-1, 3, -1], type: 'LEAVES', size: 1, repeat: [4, 1, 4] },
            { pos: [-0.5, 4, -0.5], type: 'LEAVES', size: 1, repeat: [3, 1, 3] },
            { pos: [0, 5, 0], type: 'LEAVES', size: 1, repeat: [2, 1, 2] },
            // Detailed leaves (smaller blocks for better shape)
            { pos: [-1.5, 3.5, -1.5], type: 'LEAVES', size: 0.5, repeat: [6, 1, 6] },
            { pos: [-1, 4.5, -1], type: 'LEAVES', size: 0.5, repeat: [4, 1, 4] },
            // Top decoration
            { pos: [0.5, 6, 0.5], type: 'LEAVES', size: 0.5, repeat: [1, 1, 1] }
        ]
    },
    cozyHouse: {
        name: "Cozy House",
        description: "A small, comfortable house with windows and a detailed roof",
        preview: "🏠",
        blocks: [
            // Foundation
            { pos: [0, 0, 0], type: 'STONE', size: 1, repeat: [5, 1, 6] },
            // Walls
            { pos: [0, 1, 0], type: 'WOOD', size: 1, repeat: [5, 3, 1] }, // Front wall
            { pos: [0, 1, 5], type: 'WOOD', size: 1, repeat: [5, 3, 1] }, // Back wall
            { pos: [0, 1, 1], type: 'WOOD', size: 1, repeat: [1, 3, 4] }, // Left wall
            { pos: [4, 1, 1], type: 'WOOD', size: 1, repeat: [1, 3, 4] }, // Right wall
            // Windows
            { pos: [1, 2, 0], type: 'GLASS', size: 1, repeat: [1, 1, 1] }, // Front window
            { pos: [3, 2, 0], type: 'GLASS', size: 1, repeat: [1, 1, 1] }, // Front window
            { pos: [1, 2, 5], type: 'GLASS', size: 1, repeat: [1, 1, 1] }, // Back window
            { pos: [3, 2, 5], type: 'GLASS', size: 1, repeat: [1, 1, 1] }, // Back window
            // Door frame
            { pos: [2, 1, 0], type: 'WOOD', size: 0.5, repeat: [1, 2, 1] }, // Door
            // Roof
            { pos: [-1, 4, -1], type: 'WOOD', size: 1, repeat: [7, 1, 8] }, // Roof base
            { pos: [-1, 5, 0], type: 'WOOD', size: 1, repeat: [7, 1, 6] }, // Roof middle
            { pos: [-1, 6, 1], type: 'WOOD', size: 1, repeat: [7, 1, 4] }, // Roof top
            // Chimney
            { pos: [3, 4, 2], type: 'STONE', size: 0.5, repeat: [1, 4, 1] }
        ]
    },
    magicPortal: {
        name: "Magic Portal",
        description: "A mystical portal frame with glowing elements",
        preview: "🌀",
        blocks: [
            // Base platform
            { pos: [-1, 0, -1], type: 'STONE', size: 1, repeat: [3, 1, 3] },
            // Portal frame
            { pos: [-1, 1, -1], type: 'GOLD', size: 1, repeat: [1, 3, 1] }, // Left pillar
            { pos: [1, 1, -1], type: 'GOLD', size: 1, repeat: [1, 3, 1] }, // Right pillar
            { pos: [-1, 4, -1], type: 'GOLD', size: 1, repeat: [3, 1, 1] }, // Top frame
            // Portal interior
            { pos: [0, 1, -1], type: 'DIAMOND', size: 0.5, repeat: [1, 3, 1] }, // Portal effect
            // Decorative elements
            { pos: [-1.5, 1, -1.5], type: 'STONE', size: 0.5, repeat: [4, 1, 4] }, // Base details
            { pos: [-1, 5, -1], type: 'GOLD', size: 0.5, repeat: [3, 1, 1] }, // Top decoration
            // Glowing elements
            { pos: [-1, 2, -1.5], type: 'DIAMOND', size: 0.25, repeat: [3, 2, 1] }
        ]
    },
    crystalGarden: {
        name: "Crystal Garden",
        description: "A beautiful garden with crystal formations and magical elements",
        preview: "💎",
        blocks: [
            // Base platform
            { pos: [-2, 0, -2], type: 'STONE', size: 1, repeat: [5, 1, 5] },
            // Crystal formations
            { pos: [-1, 1, -1], type: 'DIAMOND', size: 1, repeat: [1, 2, 1] },
            { pos: [1, 1, 1], type: 'DIAMOND', size: 1, repeat: [1, 3, 1] },
            { pos: [-1, 1, 1], type: 'ICE', size: 1, repeat: [1, 2, 1] },
            // Garden elements
            { pos: [-2, 1, -2], type: 'GRASS', size: 0.5, repeat: [9, 1, 9] },
            // Decorative water features
            { pos: [0, 1, 0], type: 'WATER', size: 0.5, repeat: [1, 1, 1] },
            // Small crystal clusters
            { pos: [-1.5, 1, -1.5], type: 'DIAMOND', size: 0.25, repeat: [2, 1, 2] },
            { pos: [1.5, 1, 1.5], type: 'DIAMOND', size: 0.25, repeat: [2, 1, 2] },
            // Glowing elements
            { pos: [-2, 1, 0], type: 'GOLD', size: 0.25, repeat: [1, 1, 1] },
            { pos: [2, 1, 0], type: 'GOLD', size: 0.25, repeat: [1, 1, 1] }
        ]
    }
};

let selectedBlueprint = null;
let isPlacingBlueprint = false;

// Function to toggle blueprint menu
function toggleBlueprintMenu(show) {
    const blueprintMenu = document.getElementById('blueprintMenu');
    const blockMenu = document.getElementById('blockMenu');
    const menuScreen = document.getElementById('menuScreen');
    
    console.log('Toggling blueprint menu:', show);
    
    if (show) {
        blueprintMenu.style.display = 'block';
        blockMenu.style.display = 'none';
        menuScreen.style.display = 'none';
        controls.unlock();
        
        // Reset movement flags when menu is shown
        moveForward = false;
        moveBackward = false;
        moveLeft = false;
        moveRight = false;
    } else {
        blueprintMenu.style.display = 'none';
        if (menuScreen.style.display !== 'flex') {
            blockMenu.style.display = 'flex';
            if (!controls.isLocked) {
                controls.lock();
            }
        }
    }
}

// Update keyboard event listener for blueprint menu
document.addEventListener('keydown', (event) => {
    if (event.code === 'KeyB') {
        event.preventDefault();
        const blueprintMenu = document.getElementById('blueprintMenu');
        const isVisible = blueprintMenu.style.display === 'block';
        console.log('Blueprint menu toggle triggered. Current visibility:', isVisible);
        toggleBlueprintMenu(!isVisible);
    }
});

// Function to place blueprint
function placeBlueprint(position) {
    if (!selectedBlueprint) {
        console.log('No blueprint selected');
        return;
    }

    console.log('Placing blueprint:', selectedBlueprint.name);
    selectedBlueprint.blocks.forEach(block => {
        const blockType = blockTypes[block.type];
        if (!blockType) {
            console.error('Invalid block type:', block.type);
            return;
        }
        
        if (block.repeat) {
            const [repeatX, repeatY, repeatZ] = block.repeat;
            
            for (let x = 0; x < repeatX; x++) {
                for (let y = 0; y < repeatY; y++) {
                    for (let z = 0; z < repeatZ; z++) {
                        const pos = new THREE.Vector3(
                            position.x + block.pos[0] + x,
                            position.y + block.pos[1] + y,
                            position.z + block.pos[2] + z
                        );
                        
                        createBlock(pos, blockType, block.size || 1);
                    }
                }
            }
        } else {
            const pos = new THREE.Vector3(
                position.x + block.pos[0],
                position.y + block.pos[1],
                position.z + block.pos[2]
            );
            createBlock(pos, blockType, block.size || 1);
        }
    });
    
    console.log('Blueprint placement complete');
    isPlacingBlueprint = false;
    selectedBlueprint = null;
}

// Update mouse click handling for blueprints
document.addEventListener('mousedown', function(event) {
    if (!controls.isLocked) return;
    
    if (event.button === 0) { // Left click
        if (isPlacingBlueprint && selectedBlueprint) {
            console.log('Attempting to place blueprint:', selectedBlueprint.name);
            raycaster.setFromCamera(new THREE.Vector2(), camera);
            const intersects = raycaster.intersectObjects(scene.children);
            
            if (intersects.length > 0) {
                const intersect = intersects[0];
                const position = intersect.point.add(intersect.face.normal.multiplyScalar(0.5));
                console.log('Placing blueprint at position:', position);
                placeBlueprint(position);
                updateBlueprintMenu();
            }
        } else {
            isPlacing = true;
            startBlockUpdates();
        }
    } else if (event.button === 2) { // Right click
        if (!isPlacingBlueprint) {
            isRemoving = true;
            startBlockUpdates();
        }
    }
});

// Add function to update blueprint menu display
function updateBlueprintMenu() {
    const blockMenu = document.getElementById('blockMenu');
    if (!blockMenu || !selectedBlueprint) return;
    
    blockMenu.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
    blockMenu.innerHTML = `
        <div style="
            font-size: 24px;
            margin-right: 10px;
            display: inline-block;
        ">${selectedBlueprint.preview}</div>
        <span>${selectedBlueprint.name}<br>Click to place blueprint</span>
    `;
}

// Make these functions available to the window scope
window.updateBlockMenu = updateBlockMenu;
window.toggleBlueprintMenu = toggleBlueprintMenu;
window.blockTypes = blockTypes;
window.blueprints = blueprints;
window.selectedBlockType = selectedBlockType;
window.selectedBlueprint = selectedBlueprint;
window.isPlacingBlueprint = isPlacingBlueprint; 