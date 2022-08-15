// ISSUES

const HEIGHT = 10000;
const WIDTH = 10000;
const container = document.getElementById('container');
const genericAudio = new Audio();
const stepAudio = new Audio('sounds/step.wav');
const itemPixelSize = 40;
const tileSize = 45;
const inventoryRowSize = 9;
const backgroundSize = `${itemPixelSize * 40}px ${itemPixelSize * 25}px`;
let tileId = 0;
let availableItems = [];

// items
const itemSpriteSheet = 'url("images/itemSprites_transparent.png")';

class ItemFunctions {
  static craftingTable(inventory) {
    inventory.open();
  }

  static tnt(tntItem, tntTile, x, y) {
    let item;
    let explosionImage

    if (tntItem.quantity.collected > 0) {
      item = newItemElement(tntItem, x + 'px', y + 'px');
      container.appendChild(item);

      decrement(tntItem);

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
  
        const inRange = hasCollisionsBetween(explosionImage, collections.items);
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
            collections.collectables.unshift(oreElement);
          }

          destroyed.remove();
        })
      }, 1000);
  
      setTimeout(function() {
        explosionImage.remove();
      }, 1800);
    } 
  }
}

const items = {
  none: {  // for tile switching. Try to think of a better way
    name: 'none',
    setImage: resetTile
  },

  tree: {
    name: 'tree',
    quantity: { starting: 1000 },
    itemType: 'raw',
    setImage: element => element.appendChild(newTree()),
    
    next: {
      name: 'plank',
      itemType: 'ore',
      isCollectable: true,
      setImage: setBackGroundImage(4, 0),
      sound: 'sounds/tada.flac',

      next: {
        name: 'stick',
        itemType: 'refined',
        quantity: { crafted: 10 },
        setImage: setBackGroundImage(29, 3),
        craftedBy: `1PLANK  none
                    1PLANK  none`
      }
    }
  },

  craftingTable: {
    name: 'craftingTable',
    setImage: setBackGroundImage(11, 2),
    function: ItemFunctions.craftingTable,
    craftedBy: `2PLANK  2PLANK
                2PLANK  2PLANK`
  },

  coin: {
    name: 'coin',
    isCollectable: true,
    quantity: { starting: 1000 },
    itemType: 'tool',
    setImage: setBackGroundImage(34, 0),
    sound: 'sounds/coin.wav'
  },

  tnt: {
    name: 'tnt',
    isCollectable: true,
    quantity: { starting: 1000 },
    itemType: 'tool',
    setImage: setBackGroundImage(8, 0),
    function: ItemFunctions.tnt,
    sound: 'sounds/coin.wav'
  },

  sword: {
    name: 'sword',
    itemType: 'tool',
    setImage: setBackGroundImage(24, 4),
    craftedBy: `none  1PLANK  none
                none  1PLANK  none
                none  1STICK  none`

  },

  spade: {
    name: 'spade',
    itemType: 'tool',
    setImage: setBackGroundImage(24, 5),
    craftedBy: `none  1PLANK  none
                none  1STICK  none
                none  1STICK  none`
  },
  
  pickaxe: {
    name: 'pickaxe',
    itemType: 'tool',
    setImage: setBackGroundImage(24, 6),
    craftedBy: `1PLANK  1PLANK  1PLANK
                none    1STICK  none
                none    1STICK  none`
  },

  axe: {
    name: 'axe',
    itemType: 'tool',
    setImage: setBackGroundImage(24, 7),
    craftedBy: `1PLANK  1PLANK  none
                1PLANK  1STICK  none
                none    1STICK  none`
  },

  hoe: {
    name: 'hoe',
    itemType: 'tool',
    setImage: setBackGroundImage(24, 8),
    craftedBy: `1PLANK  1PLANK  none
                none    1STICK  none
                none    1STICK  none`
  }
}

function flattenItem(value) {
  if (!value.hasOwnProperty('next')) {
    return value;
  }

  const next = value.next;
  return [value, flattenItem(next)].flat();
}

const flattenedItems = Object.values(items)
  .map(flattenItem)
  .flat()
  .reduce((obj, item) => {
    if (!item.quantity) item.quantity = {};
    item.quantity.starting = item.quantity.starting || 0;
    item.quantity.collected = item.quantity.collected || 0;
    item.quantity.crafted = item.quantity.crafted || 1;

    obj[item.name] = item;
    return obj;
  }, {});

// input format to product
// eg: 1plank-none-1plank-none: stickItem
const crafting = Object.values(flattenedItems)
  .filter(item => 'craftedBy' in item)
  .reduce((acc, item) => {
    const key = item.craftedBy.split(/\s+/).join('-').toLocaleLowerCase();
    return {...acc, [key]: item}
  }, {});

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
  craftInput: document.querySelector('.crafting-input'),
  craftOutput: document.querySelector('.crafting-output'),
  inventoryHidden: document.getElementById('inventory-hidden'),
  inventoryAvailableItems: document.getElementById('inventory-available-items'),
  mainAvailableItems: document.getElementById('main-available-items'),
  activeTool: document.getElementById('active-tool')
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

function getVisibleElement(selector) {
  return [...document.querySelectorAll(selector)].find(isVisible);
}

function isVisible(element) {
  if (element.nodeName === 'BODY') return true;
  if (element.classList.contains('hide')) return false;

  return isVisible(element.parentNode);
}

function resetTiles(tiles) {
  tiles.forEach(resetTile)
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

let collections = {};
collections.items = [...document.getElementsByClassName('item')];
collections.collectables = collections.items.filter(item => item.classList.contains('collectable'));
collections.storageTiles; // initialised by inventory

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

function sum(collection) {
  return collection.reduce((total, n) => total + n);
}

function groupBy(groupFunc, selected) {
  const selectedByParent = selected.reduce((acc, entity) => {
    const key = groupFunc(entity);

    return {
      ...acc,                               
      [key]: [ ...(acc[key] || []), entity ]
    }
  }, {});

  return Object.entries(selectedByParent);
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

function populatedTilesFrom(element) {
  const tiles = [...element.querySelectorAll('.tile:not([data-type="none"])')];
  return tiles.map(tile => ({ name: tile.dataset.type, quantity: tile.dataset.quantity }));
}

function existingOrEmptyTile(itemName, tiles) {
  return firstTileOfItem(itemName, tiles) || firstTileOfItem('none', tiles);
}

function firstTileOfItem(itemName, tiles) {
  const targetTile = tiles.find(tile => tile.dataset.type == itemName);
  return targetTile;
}

function updateTile(tile, item, quantity) {
  if (quantity === 0) {
    resetTile(tile);
    tile.classList.remove('active');
  } 
  else {
    tile.dataset.type = item.name;
    tile.dataset.quantity = quantity;
  
    item.setImage(tile);
  }
}

// Is this necessary? ///////////////////////////////////////////////////////////////////////////////////
const increment = item => changeItemQuantity(item, item => ++item.quantity.collected);
const decrement = item => changeItemQuantity(item, item => --item.quantity.collected);
const increase = (item, delta) => changeItemQuantity(item, item => item.quantity.collected += delta);
const reduce = (item, delta) => changeItemQuantity(item, item => item.quantity.collected -= delta);

function changeItemQuantity(item, changeFunc) {
  const quantity = changeFunc(item);

  var storageTiles = [ elements.mainAvailableItems, elements.inventoryAvailableItems, elements.inventoryHidden ]
    .map(storage => [...storage.getElementsByClassName('tile')])
    .flat();

  const storageTile = firstTileOfItem(item.name, storageTiles) || firstTileOfItem('none', storageTiles);
  updateTile(storageTile, item, quantity);
}
//////////////////////////////////////////////////////////////////////////////////////////////////////////

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
    return Object.values(elements)

    // return [
    //   elements.inventoryCraftInput,
    //   elements.inventoryHidden,
    //   elements.inventoryAvailableItems
    // ]
    .reduce((acc, e) => ({...acc, ...{[this.idAndClass(e)]: e}}) , {});
  } 

  checkAndHandleSwitch(parent) {
    // prepare selection groups and check readiness for switch
    const selected = [...parent.getElementsByClassName('selected')];
    
    const selectedByParent = groupBy(
      tile => this.idAndClass(tile.parentNode), selected);

    const selectedByPopulationStatus = groupBy(
      tile => tile.dataset.type === 'none' ? 'empty' : 'populated', selected);

    const includesCrafting = selectedByParent
      .map(p => p[0])
      .some(p => p.includes('crafting-input'));
    
    const includesTwoParents = selectedByParent.length > 1;
    const isInterParentSwitch = includesTwoParents && !includesCrafting;
    const isIntraParentSwitch = !includesTwoParents && selectedByPopulationStatus.length > 1;
    const isSwitch = isInterParentSwitch || isIntraParentSwitch
    const requiresCrafting = includesTwoParents && includesCrafting; 
    let selections;

    if (isSwitch) {
      if (isInterParentSwitch) {
        selections = this.prepareSelectionObjectsWithParent(
          entry => this.inventorySections[entry[0]], selectedByParent);
      }

      else if (isIntraParentSwitch) {
        selections = this.prepareSelectionObjectsWithParent(
          entry => entry[1][0].parentNode, selectedByPopulationStatus);
      }
      

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
    const craftingInput = getVisibleElement('.crafting-input');

    const craftPattern = [...craftingInput.getElementsByClassName('tile')]
    .map(t => (t.dataset.quantity || "") + (t.dataset.type))
    .join('-');

    const product = crafting[craftPattern];
    const craftingOutput = getVisibleElement('.crafting-output');

    if (product) {
      updateTile(craftingOutput, product, product.quantity.crafted);
    } 
    else {
      resetTile(craftingOutput);
    } 
  }

  prepareForCrafting(selection1, selection2) {
    // craft input
    const craftingInput = [selection1, selection2].find(s => s.parent.classList.contains('crafting-input'));
    const selectedCraftTiles = craftingInput.selectedTiles;
    const selectedCraftItems = selectedCraftTiles.map(t => ({ name: t.dataset.type, quantity: 1 })); // each selected craft tile is worth 1

    // resource tile
    const inventoryStore = [selection1, selection2].find(s => !s.parent.classList.contains('crafting-input'));
    const storeTile = inventoryStore.selectedTiles[0];
    const itemType = storeTile.dataset.type;

    const allMatching = new Set([...selectedCraftItems.map(i => i.name), itemType]).size == 1;
    // reset (item is 'none' or matching all in crafting)
    if (itemType == 'none' || allMatching) {
     resetTiles(selectedCraftTiles);
    }
    
    // insufficient resources
    else if(!this.isSufficientForCrafting(itemType)) {
      announce(`insufficient ${ itemType }s for crafting`, elements.inventory, 2000);
    }

    // replace craft selection with item
    else if (selectedCraftItems.some(item => item.name != 'none')) {
      resetTiles(selectedCraftTiles);
      this.populateCraftingTiles(selectedCraftTiles.slice(0, 1), storeTile);
    }
    // populate
    else {
      this.populateCraftingTiles(selectedCraftTiles, storeTile);
    }
  }

  getCraftSummary(tiles) {
    const craftItems = groupBy(tile => tile.dataset.type, tiles)
      .map(item => ({ 
        name: item[0],
        requiredTiles: item[1],
        requiredQuantity: sum(item[1].map(t => parseInt(t.dataset.quantity))),
        resourceTile: collections.storageTiles.find(tile => tile.dataset.type === item[0]),
        resourceQuantity: parseInt(collections.storageTiles.find(tile => tile.dataset.type === item[0]).dataset.quantity)})) // refactor
      .filter(item => item.name != 'none');

    return craftItems;
  }

  isSufficientForCrafting(itemName) {
    const resourceTile = collections.storageTiles.find(tile => tile.dataset.type === itemName);    
    if (!resourceTile) return false;

    const requiredForCrafting = [...elements.craftInput.querySelectorAll(`.tile.selected, .tile[data-type="${ itemName }"]`)];
    if (requiredForCrafting.length === 0) return true;

    const resourceQuantity = parseInt(resourceTile.dataset.quantity);
    const requiredQuantity = [...elements.craftInput.querySelectorAll(`.tile.selected, .tile[data-type="${ itemName }"]`)]
    .map(tile => tile.dataset.type == 'none' ? 1 : parseInt(tile.dataset.quantity))
    .reduce((acc, quantity) => acc + parseInt(quantity));

    return resourceQuantity >= requiredQuantity;
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

      if (targetTile) updateTile(targetTile, item, items[i].quantity);
    }
  }
}

// IIIII  TTTTT  EEEEE  MM    MM
//   I      T    EE     MMM  MMM
//   I      T    EEEE   MMMMMMMM
//   I      T    EE     MM MM MM
// IIIII    T    EEEEE  MM    MM
class ItemStore {
  constructor() {
    this.tiles;
    this.markedTile = {};

    this.getNewTileBy = {
      [keyCode.arrow.right]: index => modulo((index + 1), this.tiles.length),
      [keyCode.arrow.left]: index => modulo((index - 1), this.tiles.length),
      [keyCode.arrow.up]: index => modulo((index - inventoryRowSize), this.tiles.length),
      [keyCode.arrow.down]: index => modulo((index + inventoryRowSize),this.tiles.length)
    };
  }

  moveMarkedTile(markingType, direction) {
    let currentMarked = this.tiles[this.tiles.length - 1];
    
    if (markingType in this.markedTile) {
      currentMarked = this.markedTile[markingType]
    }

    // TODO: Why can't this.tiles be set as an array in the constructor?
    const currentMarkedIndex = [...this.tiles].findIndex(tile => tile.dataset.id === currentMarked.dataset.id);

    const newIndex = this.getNewTileBy[direction](currentMarkedIndex);
    const newTile = this.tiles[newIndex];
    
    this.setMarkedTile(newTile, markingType);

    return newTile;
  }

  setMarkedTile(tile, markingType) {
    if (!tile) return;

    const currentMarked = this.markedTile[markingType];

    if (currentMarked) {
      currentMarked.classList.remove(markingType);
    }
    
    this.markedTile[markingType] = tile;
    tile.classList.add(markingType);
  }

  resetAndPopulateTiles(items, parent) {
    const destinationTiles = [...parent.getElementsByClassName('tile')];
    resetTiles(destinationTiles);
  
    items.forEach((item, i) => {
        const flattenedItem = flattenedItems[item.name];
        const quantity = item.quantity;

        updateTile(destinationTiles[i], flattenedItem, quantity);
    })
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
    this.element = document.getElementById('main-available-items');
    this.tiles = this.element.getElementsByClassName('tile');
  }

  initialise() {
    append(1 * inventoryRowSize, 'tile', elements.mainAvailableItems);

    elements.mainAvailableItems.addEventListener('click', e => {
      const tile = e.target;
      this.setMarkedTile('active', tile);
    })
  }

  open(availableItems) {
    elements.mainAvailableItems.classList.remove('hide');

    this.resetAndPopulateTiles(availableItems, elements.mainAvailableItems);
    this.tiles = [...this.element.getElementsByClassName('tile')];
  }

  close() {
    elements.mainAvailableItems.classList.add('hide');
  
    // save active item
    const activeTile = elements.mainAvailableItems.querySelector('.active');
    if (activeTile) {
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
  }

  initialise() {
    append(9, 'tile', elements.craftTableInput); // craft table

    append(4, 'tile', elements.inventoryCraftInput); // inventory craft input
    append(3 * inventoryRowSize, 'tile', this.inventoryHidden); // hidden inventory
    append(1 * inventoryRowSize, 'tile', this.inventoryAvailableItems); // shown inventory

    collections.storageTiles = [elements.inventoryAvailableItems, elements.inventoryHidden]
      .map(section => [...section.getElementsByClassName('tile')])
      .flat();

    this.inventory.addEventListener('click', e => { this.handleSelection(e.target) });
  }

  handleKeyEvent(e) {
    if (isArrowKey(e.keyCode)) {
      if (e.ctrlKey) {
        this.incrementCraftSelection(e.keyCode);
      } else {
        this.moveMarkedTile('hover', e.keyCode)
      }
    }
  
    if (e.keyCode == keyCode.space) {
      var target = this.markedTile['hover'];
      this.handleSelection(target);
    }
  }

  incrementCraftSelection(direction) {
    const delta = direction == keyCode.arrow.up ? 1 : -1;
    const craftSelection = [...elements.craftInput.getElementsByClassName('selected')];

    // check for sufficiency
    if (delta > 0) {
      const selectionSummary = this.itemMovement.getCraftSummary(craftSelection);
    
      const testSelection = selectionSummary.map(item => ({ ...item, requiredQuantity: item.requiredQuantity + item.requiredTiles.length }));
      const insufficientItems = testSelection.filter(item => item.requiredQuantity > item.resourceQuantity);
  
      if (insufficientItems.length > 0) {
        const invalidItemNames = insufficientItems
          .map(item => item.name + 's')
          .join(', ');
  
        announce(`insufficient ${ invalidItemNames } to update all selected craft items`, elements.inventory, 2000);
        
        return;
      }
    }

    // update
    craftSelection.forEach(tile => {
      tile.dataset.quantity = parseInt(tile.dataset.quantity) + delta

      if (tile.dataset.quantity == 0) {
        resetTile(tile);
      }
    });

    this.itemMovement.setCraftOutput();
  }

  handleSelection(target) {
    // crafting output tile
    if (target.classList.contains('crafting-output')) {
      // check resources are sufficient
      const inputTiles = [...getVisibleElement('.crafting-input').getElementsByClassName('tile')];
      const craftItems = this.itemMovement.getCraftSummary(inputTiles);

      // confirmed sufficient resources
      const itemName = target.dataset.type;
      const item = flattenedItems[itemName];
      const storageTile = existingOrEmptyTile(itemName, collections.storageTiles);

      updateTile(storageTile, item, parseInt(storageTile.dataset.quantity || 0) + parseInt(target.dataset.quantity));
      [...elements.craftInput.getElementsByClassName('selected')].forEach(tile => tile.classList.remove('selected'));

      craftItems.forEach(item => {
        item.resourceQuantity -= item.requiredQuantity;
        item.resourceTile.dataset.quantity -= item.requiredQuantity;

        if (item.resourceTile.dataset.quantity <= 0) {
          resetTile(item.resourceTile);
        }
      })

      const sufficientForRepeatCrafting = craftItems.every(item => item.requiredQuantity <= item.resourceQuantity);
      if (!sufficientForRepeatCrafting) {
        resetTiles([...inputTiles, target]);
      }
    }

    // any other tile
    else if (target.classList.contains('tile') || target.classList.contains('item')) {
      target.classList.toggle('selected');
      this.itemMovement.checkAndHandleSwitch(this.inventory);
    }
  }

  toggle(inventoryElement) {
    inventoryElement.classList.toggle('hide');
  
    // hide all existing hideable elements
    [...this.inventory.getElementsByClassName('hideable')]
      .filter(h => h.id != inventoryElement.id)
      .forEach(e => e.classList.add('hide'));
  
      return inventoryElement.classList.contains('hide');
  }

  openWithElement(inventoryElement, availableItems) {
    inventoryElement.classList.remove('hide');
    this.open(availableItems);
  }

  open(availableItems) {
    this.inventory.classList.remove('hide');
    // audio
    genericAudio.src = 'sounds/pageOpen.wav';
    genericAudio.currentTime = 0.15;
    genericAudio.play();

    // TODO: repeated from AvailableItems. Consider refactoring
    // Remove Increment method if this works
    this.resetAndPopulateTiles(availableItems, elements.inventoryAvailableItems);

    // prepare tiles for keyboard navigation
    this.tiles = [...this.inventory.getElementsByClassName('tile-section')]
      .filter(section => !section.classList.contains('hide'))
      .map(section => [...section.getElementsByClassName('tile')])
      .flat();
  } 

  close() {
    [...document.getElementsByClassName('selected')]
      .forEach(tile => tile.classList.remove('selected'));

    [...document.getElementsByClassName('hideable')]
      .forEach(e => e.classList.add('hide'));

    genericAudio.src = 'sounds/pageClose.wav';
    genericAudio.currentTime = 0.15;
    genericAudio.play();
  }

  isOpen() {
    return !this.inventory.classList.contains('hide');
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
    const itemElement = hasCollisionBetween(steve, collections.collectables);
    if (itemElement) {
      const itemName = itemElement.dataset.type
      const item = flattenedItems[itemName];

      // collect
      container.removeChild(itemElement);
      increment(item);

      // collect audio
      genericAudio.src = item.sound;
      genericAudio.play();
    }

    return counter + 1;
  }

  hold(item) {
    item.setImage(elements.activeTool)
  }
}

//  MMM  MMM    AA    IIIIII  NNN   NN
//  MMMMMMMM  AA  AA    II    NNNN  NN
//  MM MM MM  AAAAAA    II    NN NN NN
//  MM    MM  AA  AA    II    NN  NNNN
//  MM    MM  AA  AA  IIIIII  NN   NNN

class MainScreen {
  constructor(inventory) { 
    this.steve = new Steve();
    this.mainAvailableItems = new AvailableItems();
    this.inventory = inventory;
  }

  initialise() {
    this.steve.initialise();
    this.mainAvailableItems.initialise();
  }

  open(availableItemTiles) {
    this.mainAvailableItems.open(availableItemTiles);
  }

  close() {
    this.mainAvailableItems.close();
  }

  handleKeyEvent(e) {
    if (isArrowKey(e.keyCode))  {
      if (e.ctrlKey) {
        var activeItem = this.mainAvailableItems.moveMarkedTile('active', e.keyCode);
      } else {
        this.steve.handleKeyEvent(e);
      }
    }

    if (e.keyCode == keyCode.space) {
      const activeTile = this.mainAvailableItems.markedTile['active'];

      if (!activeTile) return;

      if (activeTile.dataset.type = 'craftingTable') {
        var availableItems = populatedTilesFrom(elements.mainAvailableItems);
        this.inventory.openWithElement(elements.craftingTable, availableItems);
        this.close();
      }

      const activeItem = flattenedItems[activeTile.dataset.type];
      const steveStyle = window.getComputedStyle(this.steve.steve);
      
      if (activeItem && activeItem.hasOwnProperty('function')) {
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
    this.inventory = new Inventory();
    this.mainScreen = new MainScreen(this.inventory);
  }

  initialise() {
    this.mainScreen.initialise();
    this.inventory.initialise();

    // temp
    var availableItems = [...elements.mainAvailableItems.getElementsByClassName('tile')];
    updateTile(availableItems[0], flattenedItems['craftingTable'], 1);
    updateTile(availableItems[1], flattenedItems['plank'], 20);
    updateTile(availableItems[2], flattenedItems['stick'], 20);

    // set tile data-id
    [...document.getElementsByClassName('tile')].forEach(tile => tile.dataset.id = tileId++);

    collections.tiles = Object.entries(elements)
      .map(kvp => ({ key: kvp[0], tiles: [...kvp[1].getElementsByClassName('tile')] }))
      .filter(section => section.tiles.some(t => t))
      .reduce((acc, section) => ({ ...acc, [section.key]: section.tiles}), {});

    document.addEventListener("keydown", e => {
        e.preventDefault();
    
        if (e.key == 'h') elements.help.classList.toggle('hide');
        else if (e.key == 'i') this.toggle(elements.inventoryTop);
        else if (e.key == 'Escape') {
          // duplicated from toggle - refactori
          var availableItems = populatedTilesFrom(elements.inventoryAvailableItems);
          this.inventory.close();
          this.mainScreen.open(availableItems);
        }
    
        else if (this.inventory.isOpen()) {
          this.inventory.handleKeyEvent(e);
        } 
        else {
          this.mainScreen.handleKeyEvent(e);
        }
    })
  }

  toggle(inventoryElement) {
    const isClosing = this.inventory.toggle(inventoryElement);  

    if (isClosing) {  
      var availableItems = populatedTilesFrom(elements.inventoryAvailableItems);
      this.mainScreen.open(availableItems);
      this.inventory.close();
    }
    else {
      var availableItems = populatedTilesFrom(elements.mainAvailableItems);
      this.inventory.open(availableItems);
      this.mainScreen.close();
    }
  }
}

const game = new Game();
game.initialise();