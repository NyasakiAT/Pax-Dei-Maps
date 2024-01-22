async function fetchData(url) {
  const response = await fetch(url);
  const data = await response.json(); //extract JSON from the http response
  return data
}

async function fetchResourceLocations() {
  return fetchData("http://localhost/api/resources");
}

async function fetchCategories() {
  return fetchData("http://localhost/api/categories");
}

/*async function fetchPlayerLocations() {
  const playerLocations = await fetchData("_data/players.json");
  playerLocations.push({
      name: "Check All",
      lat: null,
      lng: null
  });
  return playerLocations;
}*/

let map;
let selectedFruits = [];
let selectedAnimals = [];
let selectedPlants = [];
let selectedMushrooms = [];
let selectedFlowers = [];
let selectedPlayers = [];
let selectedStone = [];
let selectedSpecial = [];
const markersByName = {};
let markers = [];
let temporaryMarkers = [];
const temporaryMarkersWithData = [];

//Icons and formatting
/*
  iconSize: [72, 72],
  iconAnchor: [36, 72],
  popupAnchor: [-3, -76]

const commonIcon = L.icon({
  iconUrl: 'https://cdn.discordapp.com/attachments/885950046506450955/1133845956316631090/3.png',

});
*/

function createDropdown(category) {
  let categoryName = String(category.name)
  let dropdownId = categoryName.toLowerCase()

  console.log(category)
  // Create the main div for the dropdown
  const customDropdown = document.createElement('div');
  customDropdown.className = 'custom-dropdown';
  customDropdown.style.marginBottom = '20px';

  // Create the title div
  const dropdownTitle = document.createElement('div');
  dropdownTitle.className = 'dropdown-title';
  dropdownTitle.onclick = function () { toggleDropdown(dropdownId); };

  // Create the image for the title
  const image = document.createElement('img');
  image.src = String(category.icon_rel);
  image.style.width = '50px';
  image.style.height = '50px';
  image.alt = 'Fruit Icon';

  // Add the image to the title div
  dropdownTitle.appendChild(image);

  // Add text node to the title div
  dropdownTitle.appendChild(document.createTextNode(categoryName));

  // Create the options div
  const fruitDropdown = document.createElement('div');
  fruitDropdown.className = 'dropdown-options';
  fruitDropdown.id = dropdownId + "-dropdown";

  // Add the title and options div to the main dropdown div
  customDropdown.appendChild(dropdownTitle);
  customDropdown.appendChild(fruitDropdown);

  // Append the main dropdown div to the sidebar
  document.getElementById('sidebar').appendChild(customDropdown);

  // Assuming filterUniqueLocations and onOptionSelect are already defined, populate the options
  const uniqueFruitLocations = filterUniqueLocations(resourceLocations, dropdownId);
  category.resources.forEach((location) => {
    const option = document.createElement("div");
    option.className = "option";
    option.textContent = location.name;
    fruitDropdown.appendChild(option);
    option.addEventListener("click", (event) => {
      onOptionSelect(event, location.name, location.lat, location.lng);
    });
  });

  addMousemoveListenerToDocument(dropdownId + "-dropdown")
}

async function initMap() {
  try {
    resourceLocations = await fetchResourceLocations();
    categories = await fetchCategories();
    //playerLocations = await fetchPlayerLocations();

    map = L.map("map", {
      zoomControl: false,
      maxZoom: 4,
      scrollWheelZoom: false,
      smoothWheelZoom: true,
      smoothSensitivity: 1,
      wheelDebounceTime: 100,
      zoomSnap: 0.1,
      crs: L.CRS.Simple
    }).setView(
      [0, 0], 0);
    map.on("zoomend", function () {
      if (map.getZoom() > map.options.maxZoom) {
        map.setZoom(map.options.maxZoom);
      }
    });

    L.Control.zoomHome = L.Control.extend({
      options: {
        position: "topright",
        zoomInText: "+",
        zoomInTitle: "Zoom in",
        zoomOutText: "-",
        zoomOutTitle: "Zoom out",
        zoom: 0,
      },

      onAdd: function (map) {
        var controlName = "gin-control-zoom",
          container = L.DomUtil.create("div", controlName + " leaflet-bar"),
          options = this.options;

        this._zoomInButton = this._createButton(
          options.zoomInText,
          options.zoomInTitle,
          controlName + "-in",
          container,
          this._zoomIn
        );

        this._zoomHomeButton = this._createButton(
          "",
          "Zoom home",
          controlName + "-home",
          container,
          this._zoomHome,
          "https://cdn.discordapp.com/attachments/885950046506450955/1133842273310871702/home.png"
        );

        this._zoomOutButton = this._createButton(
          options.zoomOutText,
          options.zoomOutTitle,
          controlName + "-out",
          container,
          this._zoomOut
        );

        this._updateDisabled();
        map.on("zoomend zoomlevelschange", this._updateDisabled, this);

        return container;
      },

      _zoomHome: function (e) {
        this._map.setView([0, 0], 0, {
          animate: true
        });
      },

      onRemove: function (map) {
        map.off("zoomend zoomlevelschange", this._updateDisabled, this);
      },

      _zoomIn: function (e) {
        this._map.zoomIn(e.shiftKey ? 3 : 1);
      },

      _zoomOut: function (e) {
        this._map.zoomOut(e.shiftKey ? 3 : 1);
      },

      _createButton: function (html, title, className, container, fn, iconUrl) {
        var link = L.DomUtil.create("a", className, container);
        link.innerHTML = html;
        link.href = "#";
        link.title = title;

        if (iconUrl) {
          link.style.backgroundImage = `url(${iconUrl})`;
          link.style.backgroundSize = "contain";
          link.style.width = "30px";
          link.style.height = "30px";
        }

        L.DomEvent.on(link, "mousedown dblclick", L.DomEvent.stopPropagation)
          .on(link, "click", L.DomEvent.stop)
          .on(link, "click", fn, this)
          .on(link, "click", this._refocusOnMap, this);

        return link;
      },

      _updateDisabled: function () {
        var map = this._map,
          className = "leaflet-disabled";

        L.DomUtil.removeClass(this._zoomInButton, className);
        L.DomUtil.removeClass(this._zoomOutButton, className);

        if (map._zoom === map.getMinZoom()) {
          L.DomUtil.addClass(this._zoomOutButton, className);
        }
        if (map._zoom === map.getMaxZoom()) {
          L.DomUtil.addClass(this._zoomInButton, className);
        }
      },


    });

    var zoomHome = new L.Control.zoomHome();
    zoomHome.addTo(map);


    const clearAllButton = document.querySelector(".clear-all-button");
    clearAllButton.addEventListener("click", clearAllMarkers);
    var bounds = [[-360, -360], [360, 360]];
    var imageOverlay = L.imageOverlay(
      "assets/map.jpg", [
      [480, -480], // North West
      [-480, 480], // South East
    ]
    ).addTo(map);

    //TODO: Create dynamically

    // Generate options for the "Fruit" dropdown menu
    const sidebar = document.getElementById("sidebar");

    // Create category dropdowns
    categories.forEach(category => {
      createDropdown(category);
    });
    /*
    const fruitDropdown = document.getElementById("fruit-dropdown");
    const uniqueFruitLocations = filterUniqueLocations(resourceLocations, "Fruit");
    uniqueFruitLocations.forEach((location) => {
      const option = document.createElement("div");
      option.className = "option";
      option.textContent = location.name;
      fruitDropdown.appendChild(option);
      option.addEventListener("click", (event) => {
        onOptionSelect(event, location.name, location.lat, location.lng);
      });
    });

    // Generate options for the "Animals" dropdown menu
    const animalsDropdown = document.getElementById("animals-dropdown");
    const uniqueAnimalLocations = filterUniqueLocations(resourceLocations, "Animals");
    uniqueAnimalLocations.forEach((location) => {
      const option = document.createElement("div");
      option.className = "option";
      option.textContent = location.name;
      animalsDropdown.appendChild(option);
      option.addEventListener("click", (event) => {
        onOptionSelect(event, location.name, location.lat, location.lng);
      });
    });
    // Generate options for the "Plants" dropdown menu
    const plantsDropdown = document.getElementById("plants-dropdown");
    const uniquePlantLocations = filterUniqueLocations(resourceLocations, "Plants");
    uniquePlantLocations.forEach((location) => {
      const option = document.createElement("div");
      option.className = "option";
      option.textContent = location.name;
      plantsDropdown.appendChild(option);
      option.addEventListener("click", (event) => {
        onOptionSelect(event, "Plants", location.name, location.lat, location.lng);
      });
    });

    // Generate options for the "Mushrooms" dropdown menu
    const mushroomsDropdown = document.getElementById("mushrooms-dropdown");
    const uniqueMushroomLocations = filterUniqueLocations(resourceLocations, "Mushrooms");
    uniqueMushroomLocations.forEach((location) => {
      const option = document.createElement("div");
      option.className = "option";
      option.textContent = location.name;
      mushroomsDropdown.appendChild(option);
      option.addEventListener("click", (event) => {
        onOptionSelect(event, "Mushrooms", location.name, location.lat, location.lng);
      });
    });
    // Generate options for the "Players" dropdown menu
    const playersDropdown = document.getElementById("players-dropdown");
    const uniquePlayerLocations = filterUniqueLocations(playerLocations, "Players");
    uniquePlayerLocations.forEach((location) => {
      const option = document.createElement("div");
      option.className = "option";
      option.textContent = location.name;
      playersDropdown.appendChild(option);
      option.addEventListener("click", (event) => {
        onOptionSelect(event, "Players", location.lat, location.lng);
      });
    });

    // Generate options for the "Flowers" dropdown menu
    const flowersDropdown = document.getElementById("flowers-dropdown");
    const uniqueFlowerLocations = filterUniqueLocations(resourceLocations, "Flowers");
    uniqueFlowerLocations.forEach((location) => {
      const option = document.createElement("div");
      option.className = "option";
      option.textContent = location.name;
      flowersDropdown.appendChild(option);
      option.addEventListener("click", (event) => {
        onOptionSelect(event, "Flowers", location.lat, location.lng);
      });
    });

    // Generate options for the "Stone" dropdown menu
    const stoneDropdown = document.getElementById("stone-dropdown");
    const uniqueStoneLocations = filterUniqueLocations(resourceLocations, "Stone");
    uniqueStoneLocations.forEach((location) => {
      const option = document.createElement("div");
      option.className = "option";
      option.textContent = location.name;
      stoneDropdown.appendChild(option);
      option.addEventListener("click", (event) => {
        onOptionSelect(event, "Stone", location.lat, location.lng);
      });
    });

    // Generate options for the "Stone" dropdown menu
    const specialDropdown = document.getElementById("special-dropdown");
    const uniqueSpecialLocations = filterUniqueLocations(resourceLocations, "Special");
    uniqueSpecialLocations.forEach((location) => {
      const option = document.createElement("div");
      option.className = "option";
      option.textContent = location.name;
      specialDropdown.appendChild(option);
      option.addEventListener("click", (event) => {
        onOptionSelect(event, "Stone", location.lat, location.lng);
      });
    });*/

    // Add event listener to update mouse coordinates when the mouse moves over the map
    map.on("mousemove", (e) => {
      const mouseCoordinates = document.getElementById("mouse-coordinates");
      mouseCoordinates.textContent = `[${e.latlng.lat.toFixed(3)}], ${e.latlng.lng.toFixed(3)}]`;
    });
    const mouseCoordinatesDiv = document.getElementById("mouse-coordinates");
    map.on("mousemove", (e) => {
      mouseCoordinatesDiv.textContent = `WORK-IN-PROGRESS\nBecause of their abundance,\nGneiss Rocks and Sapwood\nare not marked on the map.\n\n[${e.latlng.lat.toFixed(3)}], [${e.latlng.lng.toFixed(3)}]`;
    });


    // Event listener for the map's click event
    map.on("click", function (e) {
      // Create a temporary marker
      const tempMarker = L.marker(e.latlng, { icon: tempMarkerIcon }).addTo(map);

      // Create a custom popup-like behavior
      const popupDiv = document.createElement("div");
      const inputField = document.createElement("input");
      inputField.type = "text";
      inputField.id = "marker-input";
      inputField.placeholder = "Enter text";

      const coordinatesText = document.createElement("p");
      coordinatesText.textContent = `Coordinates: [${e.latlng.lat.toFixed(3)}, ${e.latlng.lng.toFixed(3)}]`;

      const copyButton = document.createElement("button");
      copyButton.id = "copy-data";
      copyButton.textContent = "Copy Data";

      popupDiv.appendChild(inputField);
      popupDiv.appendChild(coordinatesText);
      popupDiv.appendChild(copyButton);

      // Bind the custom popup to the temporary marker
      tempMarker.bindPopup(popupDiv).openPopup();

      // Event listener for the marker's click event
      tempMarker.on("click", function (event) {
        // Check if the Ctrl key (Windows/Linux) or Command key (Mac) is pressed
        if (event.originalEvent.ctrlKey || event.originalEvent.metaKey) {
          // Remove the temporary marker
          tempMarker.remove();
        }
      });


      // Event listener for copying data (text and coordinates)
      const copyDataButton = popupDiv.querySelector("#copy-data");
      copyDataButton.addEventListener("click", function () {
        // Get the text and coordinates entered by the user
        const inputField = document.getElementById("marker-input");
        const enteredText = inputField.value;
        const coordinates = ` ${e.latlng.lat.toFixed(3)},${e.latlng.lng.toFixed(3)}`;

        // Combine text and coordinates without brackets and copy to clipboard
        const combinedText = `${enteredText}${coordinates}`;
        copyToClipboard(combinedText);
      });
      // Function to copy text to the clipboard
      function copyToClipboard(text) {
        const textArea = document.createElement("textarea");
        textArea.value = text;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand("copy");
        document.body.removeChild(textArea);
      }
    });


  } catch (error) {
    console.error(error);
  }
}

// Function to filter unique locations based on category
function filterUniqueLocations(locations, category) {
  const uniqueLocations = [];
  const namesSet = new Set();
  locations.forEach((location) => {
    if (location.category === category && !namesSet.has(location.name)) {
      uniqueLocations.push(location);
      namesSet.add(location.name);
    }
  });
  return uniqueLocations;
}

// Function to add a marker for a specific location
function addMarker(name, lat, lng, rarity, iconUrl) {
  let icon;

  if (iconUrl) {
    icon = L.icon({
      iconUrl: iconUrl,
      iconSize: [128, 128],
    });
  } else {
    // Icon logic
    if (name.toLowerCase() === "blueberry") {
      icon = blueberryIcon;
    } else if (name.toLowerCase() === "boar") {
      icon = boarIcon;
    } else if (name.toLowerCase() === "daisy") {
      icon = daisyIcon;
    } else if (name.toLowerCase() === "datura") {
      icon = daturaIcon;
    } else if (name.toLowerCase() === "deathcap") {
      icon = deathcapIcon;
    } else if (name.toLowerCase() === "deer") {
      icon = deerIcon;
    } else if (name.toLowerCase() === "amanita") {
      icon = amanitaIcon;
    } else if (name.toLowerCase() === "batflower") {
      icon = batflowerIcon;
    } else if (name.toLowerCase() === "bear") {
      icon = bearIcon;
    } else if (name.toLowerCase() === "grey wolf") {
      icon = greywolfIcon;
    } else if (name.toLowerCase() === "loios tears") {
      icon = loiostearsIcon;
    } else if (name.toLowerCase() === "mustard") {
      icon = mustardIcon;
    } else if (name.toLowerCase() === "nightshade") {
      icon = nightshadeIcon;
    } else if (name.toLowerCase() === "periwinkle") {
      icon = periwinkleIcon;
    } else if (name.toLowerCase() === "divine") {
      icon = divineIcon;
    } else if (name.toLowerCase() === "flax") {
      icon = flaxIcon;
    } else if (name.toLowerCase() === "rabbit") {
      icon = rabbitIcon;
    } else if (name.toLowerCase() === "rain lily") {
      icon = rainlilyIcon;
    } else if (name.toLowerCase() === "raspberry") {
      icon = raspberryIcon;
    } else if (name.toLowerCase() === "sage") {
      icon = sageIcon;
    } else if (name.toLowerCase() === "reeds") {
      icon = reedsIcon;
    } else if (name.toLowerCase() === "silver fir branch") {
      icon = silverfirIcon;
    } else if (name.toLowerCase() === "garlic") {
      icon = garlicIcon;
    } else if (name.toLowerCase() === "clay") {
      icon = clayIcon;
    } else if (name.toLowerCase() === "grapes") {
      icon = grapesIcon;
    } else if (name.toLowerCase() === "copper deposit") {
      icon = copperDepositIcon;
    } else if (name.toLowerCase() === "impure iron deposit") {
      icon = impureIronDepositIcon;
    } else if (name.toLowerCase() === "granite deposit") {
      icon = graniteDepositIcon;
    } else if (name.toLowerCase() === "iron deposit") {
      icon = ironDepositIcon;
    } else if (name.toLowerCase() === "gneiss deposit") {
      icon = gneissDepositIcon;
    } else if (name.toLowerCase() === "flint stones") {
      icon = flintStoneIcon;
    } else if (name.toLowerCase() === "tin deposit") {
      icon = tinDepositIcon;
    } else if (name.toLowerCase() === "limestone deposit") {
      icon = limestoneDepositIcon;
    } else if (name.toLowerCase() === "badger") {
      icon = badgerIcon;
    } else if (name.toLowerCase() === "fox") {
      icon = foxIcon;
    } else if (name.toLowerCase() === "pennybun") {
      icon = pennybunIcon;
    } else if (name.toLowerCase() === "corrupted boar") {
      icon = corruptedBoarIcon;
    } else if (name.toLowerCase() === "corrupted wolf") {
      icon = corruptedWolfIcon;
    } else if (name.toLowerCase() === "wolf elder") {
      icon = wolfElderIcon;

    } else if (rarity === "common") {
      icon = commonIcon;
    } else if (rarity === "uncommon") {
      icon = uncommonIcon;
    } else if (rarity === "rare") {
      icon = rareIcon;
    } else {

      icon = defaultIcon;
    }
  }

  const marker = L.marker([lat, lng], {
    icon: icon,
  }).bindPopup(`${name}, (${lat.toFixed(3)}, ${lng.toFixed(3)})`);

  return marker;

}

function clearAllMarkers() {
  markers.forEach((marker) => marker.remove());
  markers = [];
  selectedFruits = [];
  selectedAnimals = [];
  selectedPlants = [];
  selectedMushrooms = [];
  selectedFlowers = [];
  selectedPlayers = [];
  selectedStone = [];
  selectedSpecial = [];
  tempMarkers = [];
  updateDropdownAppearance();
  map.setView([0, 0], 0, {
    animate: true
  });
}

// Function to update the markers based on the selected fruits or animals
function updateMarkers() {
  // Remove all existing markers from the map
  markers.forEach((marker) => marker.remove());
  markers = [];

  // Add markers for selected options
  selectedFruits.forEach((selectedOption) => {
    const locationData = resourceLocations.find(
      (location) => location.name === selectedOption
    );
    if (locationData) {
      locationData.locations.forEach((location) => {
        const marker = addMarker(
          locationData.name,
          location.lat,
          location.lng,
          locationData.rarity
        );
        markers.push(marker);
      });
    }
    const playerData = playerLocations.find(
      (location) => location.name === selectedOption
    );
    if (playerData) {
      playerData.locations.forEach((location) => {
        const marker = addMarker(playerData.name, location.lat, location.lng);
        markers.push(marker);
      });
    }
  });

  // Add all markers back to the map
  markers.forEach((marker) => marker.addTo(map));
}

L.Map.mergeOptions({
  // @section Mousewheel options
  // @option smoothWheelZoom: Boolean|String = true
  // Whether the map can be zoomed by using the mouse wheel. If passed `'center'`,
  // it will zoom to the center of the view regardless of where the mouse was.
  smoothWheelZoom: true,

  // @option smoothWheelZoom: number = 1
  // setting zoom speed
  smoothSensitivity: 1

});


L.Map.SmoothWheelZoom = L.Handler.extend({

  addHooks: function () {
    L.DomEvent.on(this._map._container, 'wheel', this._onWheelScroll, this);
  },

  removeHooks: function () {
    L.DomEvent.off(this._map._container, 'wheel', this._onWheelScroll, this);
  },

  _onWheelScroll: function (e) {
    if (!this._isWheeling) {
      this._onWheelStart(e);
    }
    this._onWheeling(e);
  },

  _onWheelStart: function (e) {
    var map = this._map;
    this._isWheeling = true;
    this._wheelMousePosition = map.mouseEventToContainerPoint(e);
    this._centerPoint = map.getSize()._divideBy(2);
    this._startLatLng = map.containerPointToLatLng(this._centerPoint);
    this._wheelStartLatLng = map.containerPointToLatLng(this._wheelMousePosition);
    this._startZoom = map.getZoom();
    this._moved = false;
    this._zooming = true;

    map._stop();
    if (map._panAnim) map._panAnim.stop();

    this._goalZoom = map.getZoom();
    this._prevCenter = map.getCenter();
    this._prevZoom = map.getZoom();

    this._zoomAnimationId = requestAnimationFrame(this._updateWheelZoom.bind(this));
  },

  _onWheeling: function (e) {
    var map = this._map;

    this._goalZoom = this._goalZoom + L.DomEvent.getWheelDelta(e) * 0.003 * map.options.smoothSensitivity;
    if (this._goalZoom < map.getMinZoom() || this._goalZoom > map.getMaxZoom()) {
      this._goalZoom = map._limitZoom(this._goalZoom);
    }
    this._wheelMousePosition = this._map.mouseEventToContainerPoint(e);

    clearTimeout(this._timeoutId);
    this._timeoutId = setTimeout(this._onWheelEnd.bind(this), 200);

    L.DomEvent.preventDefault(e);
    L.DomEvent.stopPropagation(e);
  },

  _onWheelEnd: function (e) {
    this._isWheeling = false;
    cancelAnimationFrame(this._zoomAnimationId);
    this._map._moveEnd(true);
  },

  _updateWheelZoom: function () {
    var map = this._map;

    if ((!map.getCenter().equals(this._prevCenter)) || map.getZoom() != this._prevZoom)
      return;

    this._zoom = map.getZoom() + (this._goalZoom - map.getZoom()) * 0.3;
    this._zoom = Math.floor(this._zoom * 100) / 100;

    var delta = this._wheelMousePosition.subtract(this._centerPoint);
    if (delta.x === 0 && delta.y === 0)
      return;

    if (map.options.smoothWheelZoom === 'center') {
      this._center = this._startLatLng;
    } else {
      this._center = map.unproject(map.project(this._wheelStartLatLng, this._zoom).subtract(delta), this._zoom);
    }

    if (!this._moved) {
      map._moveStart(true, false);
      this._moved = true;
    }

    map._move(this._center, this._zoom);
    this._prevCenter = map.getCenter();
    this._prevZoom = map.getZoom();

    this._zoomAnimationId = requestAnimationFrame(this._updateWheelZoom.bind(this));
  }

});

L.Map.addInitHook('addHandler', 'smoothWheelZoom', L.Map.SmoothWheelZoom);

// Call the initMap function when the DOM is ready
document.addEventListener("DOMContentLoaded", function () {
  initMap();

});