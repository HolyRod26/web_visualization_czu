import "./styles.css";

import { Map as OlMap, View } from "ol";
import { fromLonLat } from "ol/proj";
import TileLayer from "ol/layer/Tile";
import Image from "ol/layer/Image";
import OSM from "ol/source/OSM";
import ImageWMS from "ol/source/ImageWMS";
import VectorSource from "ol/source/Vector";
import VectorLayer from "ol/layer/Vector";
import { Style, Stroke, Fill, Text, Circle } from "ol/style";
import GeoJSON from "ol/format/GeoJSON";
import { Select } from "ol/interaction";
import { click } from "ol/events/condition";

// Fetch and process temperature data
let temperatures = new Map();

try {
  const response = await fetch("data/temperatures.json");

  if (!response.ok) {
    throw new Error(`Data request failed with status ${response.status}`);
  }
  const data = await response.json();
  // Populate the nested Map structure
  for (const record of data) {
    const { time, location, value } = record;
    if (!temperatures.has(time)) {
      temperatures.set(time, new Map());
    }
    temperatures.get(time).set(location, value);
  }
  console.log(temperatures);
} catch (error) {
  console.error("Error fetching temperature data:", error);
}

// Vector sources
const locationsSource = new VectorSource({
  url: "data/locations.geojson",
  format: new GeoJSON(),
});

const countriesSource = new VectorSource({
  url: "data/countries.geojson",
  format: new GeoJSON(),
});

// Styling for countries and locations
const countriesStyle = new Style({
  stroke: new Stroke({
    color: "#bd3939",
    width: 3,
  }),
  text: new Text({
    font: "18px sans-serif",
    fill: new Fill({ color: "#bd3939" }),
    stroke: new Stroke({ color: "#fff", width: 3 }),
  }),
});

const getLocationsStyle = (isSelected) =>
  new Style({
    image: new Circle({
      radius: 15,
      fill: new Fill({ color: isSelected ? "pink" : "navy" }),
      stroke: new Stroke({ color: "white", width: 4 }),
    })
});

// Layers for map visualization
const locationsLayer = new VectorLayer({
  source: locationsSource,
  style: getLocationsStyle(false),
});

const countriesLayer = new VectorLayer({
  source: countriesSource,
  style: (feature) => {
    countriesStyle.getText().setText(feature.get("name"));
    return countriesStyle;
  },
});

// Map initialization
const map = new OlMap({
  target: "map",
  layers: [
    new TileLayer({ source: new OSM() }),
    countriesLayer,
    locationsLayer,
  ],
  view: new View({
    center: fromLonLat([15, 50]),
    zoom: 7.5,
  }),
});

function normalizeName(name) {
  // Removes diacritics, converts to lowercase, and replaces spaces with underscores
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, "_"); // Replaces one or more spaces with an underscore
}

// Interaction for selecting locations
const selectClick = new Select({
  condition: click,
  style: getLocationsStyle(true),
  layers: [locationsLayer],
});
map.addInteraction(selectClick);

// Event listener for selecting a location
selectClick.on("select", (e) => {
  if (
    e.selected.length === 1 &&
    locationsLayer.getSource().getFeatures().includes(e.selected[0])
  ) {
    const feature = e.selected[0];
    const rawLocationName = feature.getProperties().name;
    const normalizedLocationName = normalizeName(rawLocationName);

    console.log("Original location name:", rawLocationName);
    console.log("Normalized location name:", normalizedLocationName);

    document.querySelector(
      "#info"
    ).innerHTML = `<p>Selected location: ${rawLocationName}</p>`;
    displayTemperatureChart(normalizedLocationName);
  }
});

// Function to display temperature chart for the selected location
function displayTemperatureChart(locationName) {
  const ctx = document.getElementById("temperatureChart").getContext("2d");

  // Extract the year from currentMonth
  const currentYear = currentMonth.split("-")[0];

  // Extract labels and corresponding temperature data for the specific year
  const labels = [...temperatures.keys()].filter((date) =>
    date.startsWith(currentYear)
  );
  const tempData = labels.map((date) => {
    const locationData = temperatures.get(date);
    const temperature = locationData ? locationData.get(locationName) : null;
    return temperature !== undefined ? temperature : null;
  });

  // Prepare chart data
  const chartData = {
    labels: labels,
    datasets: [
      {
        label: `Temperature in ${locationName}`,
        backgroundColor: "rgba(22, 35, 224, 0.3)",
        borderColor: "rgb(22, 35, 224)",
        data: tempData,
        fill: false,
      },
    ],
  };

  // Destroy existing chart instance if any
  if (window.temperatureChart instanceof Chart) {
    window.temperatureChart.destroy();
  }

  // Create a new chart instance
  window.temperatureChart = new Chart(ctx, {
    type: "line",
    data: chartData,
    options: {
      responsive: true,
      scales: {
        x: {
          title: {
            display: true,
            text: "Date",
          },
        },
        y: {
          title: {
            display: true,
            text: "Temperature (°C)",
          },
        },
      },
      plugins: {
        legend: {
          display: true,
        },
      },
    },
  });
}

// Populate month select dropdown
for (const date of temperatures.keys()) {
  const option = document.createElement("option");
  option.setAttribute("value", date);
  option.innerHTML = date;
  document.getElementById("monthSelect").appendChild(option);
}

// Initialize currentMonth and update table when features are loaded
let currentMonth = "1950-01-01";

const setCurrentMonth = function (month) {
  currentMonth = month;
  updateTemperatureTable();
  locationsLayer.changed(); // Update the map with the current month
};

// Event listener for month selection change
document.querySelector("#monthSelect").addEventListener("change", function (e) {
  setCurrentMonth(e.target.value);

  // Get the selected feature (if any) from the Select interaction
  const selectedFeatures = selectClick.getFeatures().getArray();
  if (selectedFeatures.length === 1) {
    const feature = selectedFeatures[0];
    const rawLocationName = feature.getProperties().name;
    const normalizedLocationName = normalizeName(rawLocationName);

    // Update the chart with the new month/year data
    displayTemperatureChart(normalizedLocationName);
  }
});

const updateTemperatureTable = function () {
  const features = locationsLayer.getSource().getFeatures();
  let featuresValuesText =
    "<table><tr><th>Location</th><th>Temperature (°C)</th></tr>";

  for (const feature of features) {
    const temperature = temperatures
      .get(currentMonth)
      .get(feature.getProperties().id)
      .toFixed(0);
    featuresValuesText += `<tr><td>${
      feature.getProperties().name
    }</td><td>${temperature} °C</td></tr>`;
  }
  featuresValuesText += "</table>";

  // Set the table content in the HTML element
  document.getElementById("temperatureTable").innerHTML = featuresValuesText;
};

// Wait for features to load and initialize the table
locationsLayer.getSource().on("featuresloadend", function (e) {
  setCurrentMonth(currentMonth); // Use first time of the series
});
