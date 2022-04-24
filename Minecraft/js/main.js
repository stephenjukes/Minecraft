const HEIGHT = 10000;
const WIDTH = 10000;
const container = document.getElementById('container');
const genericAudio = new Audio();
const stepAudio = new Audio('sounds/step.wav');
const itemPixelSize = 40;
const tileSize = 45;
const inventoryRowSize = 9;
const backgroundSize = `${itemPixelSize * 40}px ${itemPixelSize * 25}px`;

// items
const itemSpriteSheet = 'url("images/itemSprites_transparent.png")';

class ItemFunctions {
  static tnt(tntItem, tntTile, x, y) {
    let item;
    let explosionImage

    if (tntItem.quantity.collected > 0) {
      item = newItemElement(tntItem, x + 'px', y + 'px');
      container.appendChild(item);

      // can we get rid of this duplication?
      tntItem.quantity.collected--;
      tntTile.dataset.quantity = tntItem.quantity.collected;

      setTimeout(function() {
        explosionImage = document.createElement('img');
        const explosionSize = 200;
        explosionImage.src = 'images/explosion.gif';
        explosionImage.style.position = 'absolute';
        explosionImage.style.height = explosionSize + 'px';
        explosionImage.style.width = explosionSize + 'px';
        explosionImage.style.left = (x - explosionSize/2 + itemPixelSize) + 'px';
        explosionImage.style.top = (y - explosionSize/2) + 'px';
        explosionImage.style.zIndex = y + 2;
  
        container.appendChild(explosionImage);
        item.remove();
        genericAudio.src = 'sounds/explosion.wav';
        genericAudio.play();
  
        const inRange = hasCollisionsBetween(explosionImage, elements.items);
        inRange.forEach(destroyed => {          
          const destroyedItem = items[destroyed.dataset.type];
          const ore = destroyedItem.next;
          if (ore) {
            const destroyedStyle = window.getComputedStyle(destroyed);
            const leftOffset = parseInt(destroyed.style.left);
            const topOffset = parseInt(destroyed.style.top);
            const height = parseInt(destroyedStyle.height);
            const width = parseInt(destroyedStyle.width);
            
            const oreElement = newItemElement(ore, 
              (leftOffset + width/2) + 'px', 
              (topOffset + height) + 'px'
            );
          
            oreElement.style.zIndex = y + 1;
            container.appendChild(oreElement);
            elements.collectables.unshift(oreElement);
          }

          destroyed.remove();
        })
      }, 1000);
  
      setTimeout(function() {
        explosionImage.remove();
      }, 3000);
    } 

    if (tntItem.quantity.collected === 0) {
      resetTiles([tntTile]);
      tntTile.classList.remove('active');
    }
  }
}

const items = {
  none: {  // for tile switching. Try to think of a better way
    name: 'none',
    quantity: {
      starting: 0,
      collected: ""
    },
    setImage: resetTile
  },

  tree: {
    name: 'tree',
    quantity: {
      starting: 1000
    },
    itemType: 'raw',
    setImage: element => element.appendChild(newTree()),
    
    next: {
      name: 'plank',
      itemType: 'ore',
      isCollectable: true,
      quantity: {
        collected: 0
      },
      setImage: setBackGroundImage(4, 0),
      sound: 'sounds/tada.flac',

      next: {
        name: 'stick',
        itemType: 'refined',
        quantity: {
          collected: 0
        },
        setImage: setBackGroundImage(29, 3)
      }
    }
  },

  coin: {
    name: 'coin',
    isCollectable: true,
    quantity: {
      starting: 1000,
      collected: 0
    },
    itemType: 'tool',
    setImage: setBackGroundImage(34, 0),
    sound: 'sounds/coin.wav'
  },

  tnt: {
    name: 'tnt',
    isCollectable: true,
    quantity: {
      starting: 1000,
      collected: 0
    },
    itemType: 'tool',
    setImage: setBackGroundImage(8, 0),
    function: ItemFunctions.tnt,
    sound: 'sounds/coin.wav'
  },

  // sword: {
  //   name: 'sword',
  //   quantity: {
  //     starting: 50,
  //     collected: 0
  //   },
  //   itemType: 'for-use',
  //   image: { x: 28, y: 4 },
  //   sound: 'sounds/tada.flac'
  // },

  // spade: {
  //   name: 'spade',
  //   quantity: {
  //     starting: 100,
  //     collected: 0
  //   },
  //   itemType: 'for-use',
  //   image: { x: 28, y: 5 },
  //   sound: 'sounds/coin.wav'
  // },
  
  // pickaxe: {
  //   name: 'pickaxe',
  //   quantity: {
  //     starting: 100,
  //     collected: 0
  //   },
  //   itemType: 'for-use',
  //   image: { x: 28, y: 6 },
  //   sound: 'sounds/coin.wav'
  // },

  // axe: {
  //   name: 'axe',
  //   quantity: {
  //     starting: 100,
  //     collected: 0
  //   },
  //   itemType: 'for-use',
  //   image: { x: 28, y: 7 },
  //   sound: 'sounds/coin.wav'
  // },

  // hoe: {
  //   name: 'hoe',
  //   quantity: {
  //     starting: 100,
  //     collected: 0
  //   },
  //   itemType: 'for-use',
  //   image: { x: 28, y: 8 },
  //   sound: 'sounds/coin.wav'
  // }
}

const flattenedItems = Object.values(items)
  .map(flattenItem)
  .flat()
  .reduce((obj, item) => {
    obj[item.name] = item;
    return obj;
  }, {});

function flattenItem(value) {
  if (!value.hasOwnProperty('next')) {
    return value;
  }

  const next = value.next;
  return [value, flattenItem(next)].flat();
}

let craftKeys = {
  stick: `PLANK none
          PLANK none`
}

craftKeys = Object.entries(craftKeys)
  .reduce((acc, kvp) => ({
    ...acc, 
    [kvp[0]]: kvp[1].split(/\s+/).join('-').toLocaleLowerCase() 
  }) , {});

const crafting = {
  [craftKeys.stick]: flattenedItems.stick 
}

console.log(crafting);

function setBackGroundImage(x, y) {
  return element => {
    element.style.background = "url('images/itemSprites_transparent.png')";
    element.style.backgroundSize = `${ itemPixelSize * 40 }px ${ itemPixelSize * 25 }px`;

    const backgroundPosition = `${ -itemPixelSize * x }px ${ -itemPixelSize * y}px`;
    element.style.backgroundPosition = backgroundPosition;
  }
}

function newItemElement(item, x = 0, y = 0) {
  let element = document.createElement('div');

  element.classList.add(item.name, item.itemType, 'item');
  if (item.isCollectable) element.classList.add('collectable');
  element.dataset.type = item.name;

  element.style.top = y;
  element.style.left = x;

  item.setImage(element);

  return element;
}

Object.values(items).forEach(item => {
  for(let i = 0; i < item.quantity.starting; i++) {
    container.appendChild(newItemElement(item,
      (Math.random() * WIDTH) + 'px',
      (Math.random() * HEIGHT) + 'px'));
  }
})

// elements
function append(quantity, childClass, parent) {
  for(let i = 0; i < quantity; i++) {
    var child = document.createElement('div');
    child.classList.add(childClass);

    // for tiles only
    child.dataset.type = 'none';
    child.dataset.position = i;

    parent.appendChild(child);
  }
}

const audio = {
  collect: { url: 'sounds.coin.wav' },
  collectSword: {}
}

const elements = {
  help: document.getElementById('help'),
  inventory: document.getElementById('inventory'),
  inventoryTop: document.getElementById('inventory-top'),
  craftingTable: document.getElementById('craft-table'),
  craftTableInput: document.getElementById('craft-table-input'),
  inventoryCraftInput: document.getElementById('inventory-craft-input'),
  craftOutput: document.querySelector('.crafting-output'),
  inventoryHidden: document.getElementById('inventory-hidden'),
  inventoryAvailableItems: document.getElementById('inventory-available-items'),
  availableItems: document.getElementById('available-items')
}

function getBackgroundImage(item) {
  if (item.image.url) return item.image.url;
  if (item.name == 'none') return '#888'; // this has to match background in css, so maybe set in js?

  return itemSpriteSheet;
}

function lowerOffset(element) {
  const rect = element.getBoundingClientRect();
  return String(Math.round(rect.bottom + window.scrollY));
}

function hasCollisionBetween(subject, collection) {
  return collection.find(c => hasCollision(subject, c));
}

function hasCollisionsBetween(subject, collection) {
  return collection.filter(c => hasCollision(subject, c));
}

function hasCollision(a, b) {
  const aRect = a.getBoundingClientRect();
  const bRect = b.getBoundingClientRect();

  return aRect.bottom > bRect.top
    && aRect.top < bRect.bottom
    && aRect.left < bRect.right
    && aRect.right > bRect.left;
}

function resetTiles(tiles) {
  tiles.forEach(t => resetTile)
}

function resetTile(tile) {
    // set class instead of style here
    tile.dataset.type = 'none';
    tile.style.background = '#888'; // this has to match the background set in css so set in js?
    tile.dataset.quantity = "";
}

// trees
function newTree(x = 0, y = 0) {
  const foliageheight = 80;4
  const foliagewidth = 80;
  const trunkHeight = 50;
  const zIndex = String(Math.round(y + foliageheight + trunkHeight));

  const foliage = document.createElement('div');
  foliage.classList.add('tree', 'item');
  foliage.dataset.type = 'tree';
  foliage.style.height = foliageheight + 'px';
  foliage.style.width = foliagewidth + 'px';
  foliage.style.top = y + 'px';
  foliage.style.left = x + 'px';
  foliage.style.zIndex = zIndex;

  const trunk = document.createElement('div');
  trunk.classList.add('trunk');
  trunk.style.height = trunkHeight + 'px';
  trunk.style.zIndex = zIndex;

  foliage.appendChild(trunk);
  return foliage;
}

elements.items = [...document.getElementsByClassName('item')];
elements.collectables = elements.items.filter(item => item.classList.contains('collectable'));

const keyCode = {
  arrow: {
    right: 39,
    left: 37,
    up: 38,
    down: 40,
  },
  space: 32
}

function isArrowKey(key) {
  return Object.values(keyCode.arrow).includes(key);
}

function modulo(dividend, divisor) {
  const result = ((dividend % divisor) + divisor) % divisor;
  return result;
}

function announce(message, parent, time = 0) {  
  const content = document.createElement('div');
  content.classList.add('announcement');
  content.innerText = message;
  
  parent.appendChild(content);

  if (time) {
    setTimeout(_ => content.remove(), time); 
  } 
}

function fromParent(tileSection) {
  return {
    getTile: itemName => tileSection.querySelector(`.tile[data-type="${itemName}"]`)
  }
}

function firstTileOfItem(itemName, tiles) {
  return tiles.find(tile => tile.dataset.type == itemName);
}

function populateTile(tile, item) {
  tile.dataset.type = item.name;
  tile.dataset.quantity = item.quantity.collected;

  item.setImage(tile);
}


//  MMM  MMM    OO    VV  VV  EEEEE  MMM  MMM  EEEEE  NNN   NN  TTTTTT
//  MMMMMMMM  OO  OO  VV  VV  EE     MMMMMMMM  EE     NNNN  NN    TT
//  MM MM MM  OO  OO  VV  VV  EEEE   MM MM MM  EEEE   NN NN NN    TT
//  MM    MM  OO  OO  VV  VV  EE     MM    MM  EE     NN  NNNN    TT
//  MM    MM    OO      VV    EEEEE  MM    MM  EEEEE  NN   NNN    TT

class ItemMovement {
  constructor() {
    this.inventorySections = this.inventorySections()
  }

  inventorySections() {
    return [
      elements.inventoryCraftInput,
      elements.inventoryHidden,
      elements.inventoryAvailableItems
    ]
    .reduce((acc, e) => ({...acc, ...{[this.idAndClass(e)]: e}}) , {});
  } 

  checkAndHandleSwitch(parent) {
    // prepare selection groups and check readiness for switch
    const selected = [...parent.getElementsByClassName('selected')];
    
    const selectedByParent = this.groupBy(
      tile => this.idAndClass(tile.parentNode), selected);

    const selectedByPopulationStatus = this.groupBy(
      tile => tile.dataset.type === 'none' ? 'empty' : 'populated', selected);

    const includesCrafting = selectedByParent
      .map(p => p[0])
      .some(p => p.includes('crafting-input'));
    
    const includesTwoParents = selectedByParent.length > 1;
    const isInterParentSwitch = includesTwoParents && !includesCrafting;
    const isIntraParentSwitch = !includesTwoParents && selectedByPopulationStatus.length > 1;
    const isSwitch = isInterParentSwitch || isIntraParentSwitch
    const requiresCrafting = includesTwoParents && includesCrafting; 

    if (isSwitch) {
      const selections = this.prepareSelectionObjectsWithParent(
        entry => entry[1][0].parentNode, selectedByPopulationStatus);

      this.switchItems(selections[0], selections[1]);    
      selected.forEach(tile => tile.classList.remove('selected'));
    }

    if (requiresCrafting) {
      const selections = this.prepareSelectionObjectsWithParent(
        entry => this.inventorySections[entry[0]], selectedByParent);

      this.prepareForCrafting(selections[0], selections[1]);
      selected.forEach(tile => tile.classList.remove('selected'));
    }

    this.setCraftOutput();
  }

  idAndClass(element) {
    return `${element.id} ${element.className}`;
  }

  setCraftOutput() {
    const craftingInput = document.querySelector('.crafting-input');
    const craftPattern = [...craftingInput.getElementsByClassName('tile')]
    .map(t => t.dataset.type)
    .join('-');

    const product = crafting[craftPattern];

    if (product) {
      product.setImage(elements.craftOutput);
    } else {
      resetTile(elements.craftOutput);
    } 
  }

  prepareForCrafting(selection1, selection2) {
    const craftingInput = [selection1, selection2].find(s => s.parent.classList.contains('crafting-input'));
    const selectedCraftTiles = craftingInput.selectedTiles;
    const selectedCraftItems = selectedCraftTiles.map(t => t.dataset.type);

    const inventoryStore = [selection1, selection2].find(s => !s.parent.classList.contains('crafting-input'));
    const storeTile = inventoryStore.selectedTiles[0];
    const itemType = storeTile.dataset.type;
    
    const allMatching = new Set([...selectedCraftItems, itemType]).size == 1;
    // reset (item is 'none' or matching all in crafting)
    if (itemType == 'none' || allMatching) {
      this.resetCraftingInput(selectedCraftTiles);
    }
    // insufficient (selected tiles exceed items)
    else if (selectedCraftTiles.length > storeTile.dataset.quantity) {
      announce(`insufficient ${ itemType }s for crafting`, elements.inventory, 2000);
    }
    // replace craft selection with item
    else if (selectedCraftItems.some(item => item != 'none')) {
      this.resetCraftingInput(selectedCraftTiles);
      this.populateCraftingTiles(selectedCraftTiles.slice(0, 1), storeTile);
    }
    // populate
    else {
      this.populateCraftingTiles(selectedCraftTiles, storeTile);
    }
  }

  populateCraftingTiles(craftTiles, storeTile) {
    craftTiles.forEach(craftTile => {
      const itemName = storeTile.dataset.type;
      craftTile.dataset.type = itemName;
    
      const quantity = craftTile.dataset.quantity;
      craftTile.dataset.quantity = quantity ? quantity++ : 1;
    
      const item = flattenedItems[itemName];
      item.setImage(craftTile);
    })

    storeTile.dataset.quantity -= craftTiles.length;
  }

  resetCraftingInput(craftTiles) {
    craftTiles.forEach(craftTile => {
      const craftTileType = craftTile.dataset.type;

      const targetTile = fromParent(elements.inventoryHidden).getTile(craftTileType)
        || fromParent(elements.inventoryAvailableItems).getTile(craftTileType);

      targetTile.dataset.quantity++;

      resetTile(craftTile);
    })
  }

  groupBy(groupFunc, selected) {
    const selectedByParent = selected.reduce((acc, tile) => {
      const key = groupFunc(tile);
  
      return {
        ...acc,                               
        [key]: [ ...(acc[key] || []), tile ]
      }
    }, {});
  
    return Object.entries(selectedByParent);
  }
  
  prepareSelectionObjectsWithParent(getParent, selectionEntries) {
    const selectionObjects = selectionEntries.reduce((acc, entry, i) => {
      const parent = getParent(entry);
      const selectedTiles = entry[1];
  
      return [ ...acc,
        {
          parent: parent,
          // this needs to be in object form so it doesn't get changed in the switch
          selectedTiles: selectedTiles,
          selectedItems: [...selectedTiles].map(t => ({
            type: t.dataset.type,
            quantity: t.dataset.quantity,
            position: parseInt(t.dataset.position)
          })),
          unselectedItems: parent.querySelectorAll('.tile:not(.selected):not([data-type="none"])'),
          availableTiles: [...new Set([...[...parent.querySelectorAll('.tile[data-type="none"]')], ...selectedTiles])]
        }
      ]
    }, []);
  
    return selectionObjects;
  }
  
  switchItems(selection1, selection2) {
    const validSelection1Tiles = selection1.selectedTiles.slice(0, selection2.availableTiles.length);
    const validSelection2Tiles = selection2.selectedTiles.slice(0, selection1.availableTiles.length);
  
    resetTiles([...validSelection1Tiles, ...validSelection2Tiles]);
  
    this.moveItem(selection1, selection2);
    this.moveItem(selection2, selection1);
  }
  
  moveItem(source, destination) {
    const firstTargetTilePosition = Math.min(...destination.selectedItems.map(t => t.position));
  
    const orderedAvailableTiles = destination.availableTiles
      .sort((a, b) =>
          a.dataset.position - b.dataset.position)
      .reduce((acc, tile) => {
          const position = tile.dataset.position;
          const i = position >= firstTargetTilePosition ? 0 : 1;
  
          acc[i].push(tile);
          return acc; }, [[],[]])
      .flat()
    
    this.populateTiles(source.selectedItems, orderedAvailableTiles);
  }

  populateTiles(items, availableTiles) {
    for (let i = 0; i < items.length; i++) {
      const targetTile = availableTiles[i];
      let item = flattenedItems[items[i].type];

      item = {
        ...item,
        quantity: {
          ...item.quantity,
          collected: items[i].quantity
        }
      };

      if (targetTile) populateTile(targetTile, item);
    }
  }
}

class ItemStore {
  constructor() {}

  resetAndPopulateTiles(parent) {
    // get all items
    // this is done twice (for inventory and available items).
    // Can we find a way to run this once?
    const inventoryAvailableItems = [
      ...elements.inventoryAvailableItems
        .querySelectorAll('.tile:not(.tile[data-type="none"])')
    ]
    .map(tile => items[tile.dataset.type])

    // populate items from start
    const tiles = [...parent.getElementsByClassName('tile')];
    resetTiles(tiles);
  
    inventoryAvailableItems
      .forEach((item, i) => populateTile(tiles[i], item));
  }
}

//   AAA     VV  VV     AA      LL        AA    IIIII  LL         AA    BBBB    LL       EEEEEE
// AA   AA   VV  VV   AA  AA    LL      AA  AA    I    LL       AA  AA  BB  BB  LL       EE
// AA   AA   VV  VV   AA  AA    LL      AA  AA    I    LL       AA  AA  BBBB    LL       EEEEE
// AAAAAAA   VV  VV   AAAAAA    LL      AAAAAA    I    LL       AAAAAA  BB  BB  LL       EE
// AA   AA     VV     AA  AA    LLLLLL  AA  AA  IIIII  LLLLLLL  AA  AA  BBBB    LLLLLLL  EEEEEEE

class AvailableItems extends ItemStore {
  constructor() {
    super();
    this.element = document.getElementById('available-items');
    this.tiles = this.element.getElementsByClassName('tile');
    this.activeTile = this.element.querySelector('.active');
    this.activeItem = null; // are these both needed?
  }

  initialise() {
    append(1 * inventoryRowSize, 'tile', elements.availableItems);

    elements.availableItems.addEventListener('click', e => {
      const tile = e.target;

      if (tile.dataset.type !== 'none') {
        this.setAsActive(tile, tile.parentNode);
      }
    })
  }

  setAsActive(tile, parent) {
    const currentActive = parent.querySelector('.active');
    if (currentActive) {
      currentActive.classList.remove('active');
    }
  
    const firstItem = parent.querySelector(`.tile:not([data-type="none"])`);
    const targetTile = tile || firstItem;
  
    if (targetTile) {
      this.activeTile = targetTile;
      this.activeItem = targetTile.dataset.type;
      targetTile.classList.add('active');
    }
  }

  open() {
    elements.availableItems.classList.remove('hide');

    const activeTile = elements.availableItems.querySelector(`.tile[data-type=${this.activeItem}]`);
    this.setAsActive(activeTile, elements.availableItems);

    this.resetAndPopulateTiles(elements.availableItems);
  }

  close() {
    elements.availableItems.classList.add('hide');
  
    // save active item
    const activeTile = elements.availableItems.querySelector('.active');
    if (activeTile) {
      const type = activeTile.dataset.type;

      this.activeItem = activeTile.dataset.type;
    }
  }
}

// IIIII  NN    NN  VV  VV  EEEEE  NNN   NN  TTTTTT    OO    RRRRR    YY  YY
//   I    NNNN  NN  VV  VV  EE     NNNN  NN    TT    OO  OO  RR   RR  YY  YY
//   I    NN NN NN  VV  VV  EEEE   NN NN NN    TT    OO  OO  RRRRR      YY 
//   I    NN  NNNN  VV  VV  EE     NN  NNNN    TT    OO  OO  RR  RR     YY
// IIIII  NN   NNN    VV    EEEEE  NN   NNN    TT      OO    RR   RR    YY

class Inventory extends ItemStore {
  constructor(){ 
    super();
    this.itemMovement = new ItemMovement();
    this.inventory = document.getElementById('inventory');
    this.inventoryHidden = document.getElementById('inventory-hidden');
    this.inventoryAvailableItems = document.getElementById('inventory-available-items');
    this.tiles;
    this.tileQuantity;
    this.tileIndexUnderHover = 0; 

    this.getNewTileBy = {
      [keyCode.arrow.right]: index => modulo((index + 1), this.tileQuantity),
      [keyCode.arrow.left]: index => modulo((index - 1), this.tileQuantity),
      [keyCode.arrow.up]: index => modulo((index - inventoryRowSize), this.tileQuantity),
      [keyCode.arrow.down]: index => modulo((index + inventoryRowSize),this.tileQuantity)
    };
  }

  initialise() {
    append(9, 'tile', elements.craftTableInput); // craft table

    append(4, 'tile', elements.inventoryCraftInput); // inventory craft input
    append(3 * inventoryRowSize, 'tile', this.inventoryHidden); // hidden inventory
    append(1 * inventoryRowSize, 'tile', this.inventoryAvailableItems); // shown inventory

    this.inventory.addEventListener('click', e => {
      // toggle selection border
      const target = e.target;
      if (target.classList.contains('tile') || target.classList.contains('item')) {
        e.target.classList.toggle('selected');
        this.checkAndHandleSwitch();
      }
    });
  }

  toggle(inventoryElement) {
    inventoryElement.classList.toggle('hide');
  
    // hide all existing hideable elements
    [...document.getElementsByClassName('hideable')]
      .filter(h => h.id != inventoryElement.id)
      .forEach(e => e.classList.add('hide'));
  
      return inventoryElement.classList.contains('hide');
  }

  open() {
    this.inventory.classList.remove('hide');
    // audio
    genericAudio.src = 'sounds/pageOpen.wav';
    genericAudio.currentTime = 0.15;
    genericAudio.play();

    // prepare tiles for keyboard navigation
    this.tiles = [...this.inventory.getElementsByClassName('tile-section')]
    .filter(section => !section.classList.contains('hide'))
    .map(section => [...section.getElementsByClassName('tile')])
    .flat();

    this.tileQuantity = this.tiles.length;
  } 

  close() {
    [...document.getElementsByClassName('selected')]
    .forEach(tile => tile.classList.remove('selected'));

    this.resetAndPopulateTiles(this.inventoryAvailableItems);

    genericAudio.src = 'sounds/pageClose.wav';
    genericAudio.currentTime = 0.15;
    genericAudio.play();
  }

  isOpen() {
    return !this.inventory.classList.contains('hide');
  }

  setAsHover(direction) {
    this.tiles[this.tileIndexUnderHover].classList.remove('hover');

    this.tileIndexUnderHover = this.getNewTileBy[direction](this.tileIndexUnderHover);
    const newTile = this.tiles[this.tileIndexUnderHover];

    newTile.classList.add('hover')
  }

  handleKeyEvent(e) {
    if (isArrowKey(e.keyCode)) {
      this.setAsHover(e.keyCode)
    }
  
    if (e.keyCode == keyCode.space) {
      this.tiles[this.tileIndexUnderHover].classList.toggle('selected');
      this.itemMovement.checkAndHandleSwitch(this.inventory);
    }
  }

  checkAndHandleSwitch() {
    this.itemMovement.checkAndHandleSwitch(this.inventory);
  }
}

//   SSSSS  TTTTTT  EEEEE  VV  VV  EEEEE
//  SS        TT    EE     VV  VV  EE
//    SS      TT    EEEE   VV  VV  EEEE
//      SS    TT    EE     VV  VV  EE
//  SSSSS     TT    EEEEE    VV    EEEEE

class Steve {
  constructor() {
    this.steve = document.getElementById('steve');
    this.currentKey = null;
    this.counter = 0;
    this.steveWalkInterval;
    this.steveWalkingSpeed = 30;
    this.steveSprite = this.steveSprite();
    this.gameModeDirection = this.gameModeDirection();
  }

  steveSprite() {
    return {
      faceSouth: { width: '50px', position: '0 0' },
      faceNorth: { width: '50px', position: '-57px 0' },
      faceEast: { width: '40px', position: '-108px 0' },
      faceWest: { width: '40px', position: '-145px 0' },
      walkSouthRightLeading: { width: '50px', position: '-185px 0' },
      walkSouthLeftLeading: { width: '50px', position: '-243px 0' },
      walkNorthLeftLeading: { width: '50px', position: '-297px 0' },
      walkNorthRightLeading: { width: '50px', position: '-350px 0' },
      walkWestRightLeading: { width: '72px', position: '2px -110px' },
      walkWestLeftLeading: { width: '72px', position: '-78px -110px' },
      walkEastRightLeading: { width: '72px', position: '-154px -110px' },
      walkEastLeftLeading: { width: '72px', position: '-228px -110px' },
      faceSouthHandUp: { width: '50px', position: '-305px -110px' }
    }
  }

  gameModeDirection() {
    return {
      [keyCode.arrow.right]: {
        scrollOptions: { left: this.steveWalkingSpeed },
        sprites: [
          this.steveSprite.walkEastLeftLeading, 
          this.steveSprite.faceEast,
          this.steveSprite.walkEastRightLeading, 
          this.steveSprite.faceEast
        ]
      },
      [keyCode.arrow.up]: {
        scrollOptions: { top: -this.steveWalkingSpeed },
        sprites: [
          this.steveSprite.walkNorthLeftLeading, 
          this.steveSprite.walkNorthRightLeading
        ]
      },
      [keyCode.arrow.left]: {
        scrollOptions: { left: -this.steveWalkingSpeed },
        sprites: [
          this.steveSprite.walkWestLeftLeading, 
          this.steveSprite.faceWest, 
          this.steveSprite.walkWestRightLeading, 
          this.steveSprite.faceWest
        ]
      },
      [keyCode.arrow.down]: {
        scrollOptions: { top: this.steveWalkingSpeed },
        sprites: [
          this.steveSprite.walkSouthLeftLeading, 
          this.steveSprite.walkSouthRightLeading
        ]
      }
    }
  }

  initialise() {
    document.addEventListener("keyup", e => {
      clearInterval(this.steveWalkInterval);
      this.currentKey = null;
    })
  }

  handleKeyEvent(e) {
    // do not clear if already walking
    if (this.currentKey != e.keyCode) {
      this.currentKey = e.keyCode;
      this.walk(this.gameModeDirection[e.keyCode]);
    }
  }

  walk(direction) {
    clearInterval(this.steveWalkInterval);

    // invoked first for immmediate response
    this.counter = this.step(direction, this.counter);

    // continued within interval
    this.steveWalkInterval = setInterval(
      () => { this.counter = this.step(direction, this.counter); }
      , 200)
  }

  step(direction, counter) {
    // posture
    const sprite = direction.sprites[counter % direction.sprites.length];
    this.steve.style.width = sprite.width;
    this.steve.style.backgroundPosition = sprite.position;

    this.steve.style.zIndex = lowerOffset(steve);

    // position
    window.scrollBy(direction.scrollOptions);

    // step audio
    stepAudio.currentTime = 0;
    stepAudio.play();

    // Interaction
    const itemElement = hasCollisionBetween(steve, elements.collectables);
    if (itemElement) {
      const itemName = itemElement.dataset.type
      const item = flattenedItems[itemName];

      // collect
      container.removeChild(itemElement);
      item.quantity.collected++;

      // collect audio
      genericAudio.src = item.sound;
      genericAudio.play();

      // populate inventory
      const inventory = [
        ...elements.inventoryAvailableItems.getElementsByClassName('tile'),
        ...elements.inventoryHidden.getElementsByClassName('tile')
      ]

      const inventoryTile = firstTileOfItem(itemName, inventory) || firstTileOfItem('none', inventory);
      populateTile(inventoryTile, item);

      if (inventoryTile.parentNode.id == elements.inventoryAvailableItems.id) {
        const tilePosition = inventoryTile.dataset.position;
        const availableItemsTile = elements.availableItems.querySelector(`.tile[data-position="${tilePosition}"]`);

        populateTile(availableItemsTile, item);
      }
    }

    return counter + 1;
  }
}

//  MMM  MMM    AA    IIIIII  NNN   NN
//  MMMMMMMM  AA  AA    II    NNNN  NN
//  MM MM MM  AAAAAA    II    NN NN NN
//  MM    MM  AA  AA    II    NN  NNNN
//  MM    MM  AA  AA  IIIIII  NN   NNN

class MainScreen {
  constructor() { 
    this.steve = new Steve();
    this.availableItems = new AvailableItems();
  }

  initialise() {
    this.steve.initialise();
    this.availableItems.initialise();
  }

  open() {
    this.availableItems.open();
  }

  close() {
    this.availableItems.close();
  }

  handleKeyEvent(e) {
    if (isArrowKey(e.keyCode))  {
      this.steve.handleKeyEvent(e);
    }

    if (e.keyCode == keyCode.space) {
      const activeItem = flattenedItems[this.availableItems.activeItem];
      const activeTile = this.availableItems.activeTile;
      const steveStyle = window.getComputedStyle(this.steve.steve);
      
      if (activeItem) {
        // fix
        activeItem.function(activeItem, activeTile,
          window.scrollX + parseInt(steveStyle.left) + 20, 
          window.scrollY + parseInt(steveStyle.top) + parseInt(steveStyle.height) - 50) 
      }
    }
  }
}

//    GG      AA    MMM  MMM  EEEEE
//  GG  GG  AA  AA  MMMMMMMM  EE
//  GG      AAAAAA  MM MM MM  EEEE
//  GG  GG  AA  AA  MM    MM  EE
//    GGGG  AA  AA  MM    MM  EEEEE

class Game {
  constructor() {
    this.mainScreen = new MainScreen();
    this.inventory = new Inventory();
  }

  initialise() {
    this.mainScreen.initialise();
    this.inventory.initialise();

    // let inventoryIsVisible;
    document.addEventListener("keydown", e => {
        e.preventDefault();
    
        if (e.key == 'h') elements.help.classList.toggle('hide');
        if (e.key == 'i') this.toggle(elements.inventoryTop);
        if (e.key == 'c') this.toggle(elements.craftingTable);
    
        if (this.inventory.isOpen()) {
          this.inventory.handleKeyEvent(e);
        } else {
          this.mainScreen.handleKeyEvent(e);
        }
    })
  }

  toggle(inventoryElement) {
    const isClosing = this.inventory.toggle(inventoryElement);  

    if (isClosing) {  
      this.mainScreen.open();
      this.inventory.close();
    }
    else {
      this.mainScreen.close();
      this.inventory.open();
    }
  }
}

const game = new Game();
game.initialise();