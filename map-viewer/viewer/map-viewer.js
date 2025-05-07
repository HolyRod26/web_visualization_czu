import "./styles.css";

import { Map as OlMap, View } from "ol";
import { fromLonLat } from "ol/proj";
import TileLayer from "ol/layer/Tile";
import OSM from "ol/source/OSM";
import VectorSource from "ol/source/Vector";
import VectorLayer from "ol/layer/Vector";
import { Style, Stroke, Fill, Text, Circle } from "ol/style";
import GeoJSON from "ol/format/GeoJSON";
import { Select } from "ol/interaction";
import { click } from "ol/events/condition";
import Chart from "chart.js/auto";

function populateYearSelect() {
  const yearSelect = document.getElementById("yearSelect");
  const years = Array.from(temperatures.keys()).map((date) =>
    date.split("-")[0]
  );
  const uniqueYears = Array.from(new Set(years)).sort();

  uniqueYears.forEach((year) => {
    const option = document.createElement("option");
    option.value = year;
    option.textContent = year;
    yearSelect.appendChild(option);
  });
}

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
  populateYearSelect();
} catch (error) {
  console.error("Error fetching temperature data:", error);
}

let currentMonth = "1950-01-01";

// Vector sources
const locationsSource = new VectorSource({
  url: "data/locations.geojson",
  format: new GeoJSON(),
});

// Styling for locations
const getLocationsStyle = (isSelected) =>
  new Style({
    image: new Circle({
      radius: 15, // Keep the radius constant
      fill: new Fill({
        color: isSelected ? "rgba(0, 128, 0, 0.8)" : "rgba(0, 0, 128, 1)", // Lower opacity when selected
      }),
      stroke: new Stroke({ color: "white", width: 4 }),
    }),
  });

// Layers for map visualization
const locationsLayer = new VectorLayer({
  source: locationsSource,
  style: (feature) => getLocationsStyle(feature.get("isSelected") || false),
});

// Map initialization
const map = new OlMap({
  target: "map",
  layers: [new TileLayer({ source: new OSM() }), locationsLayer],
  view: new View({
    center: fromLonLat([15, 50]),
    zoom: 7.5,
  }),
});

// Initialize an array to keep track of selected location names
let selectedLocationNames = [];

const selectClick = new Select({
  condition: click,
  toggleCondition: click,
  layers: [locationsLayer],
  multi: true, // Allow multiple selections
});

map.addInteraction(selectClick);

// Modify the event listener for selecting a location
selectClick.on("select", (e) => {
  e.selected.forEach((feature) => {
    feature.set("isSelected", true);
    feature.changed
    const rawLocationName = feature.getProperties().name;
    const normalizedLocationName = normalizeName(rawLocationName);
    if (!selectedLocationNames.includes(normalizedLocationName)) {
      selectedLocationNames.push(normalizedLocationName);
    }
  });

  e.deselected.forEach((feature) => {
    feature.set("isSelected", false);
    const rawLocationName = feature.getProperties().name;
    const normalizedLocationName = normalizeName(rawLocationName);
    const index = selectedLocationNames.indexOf(normalizedLocationName);
    if (index > -1) {
      selectedLocationNames.splice(index, 1);
    }
  });

  displayTemperatureChart(selectedLocationNames);
});

function normalizeName(name) {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, "_");
}

function displayTemperatureChart(locationNames) {
  const ctx = document.getElementById("temperatureChart").getContext("2d");
  const currentYear = currentMonth.split("-")[0];
  const labels = [...temperatures.keys()].filter((date) =>
    date.startsWith(currentYear)
  );

  // Define the color palette
  const colorPalette = [
    "#1b9e77",
    "#d95f02",
    "#7570b3",
    "#e7298a",
    "#66a61e",
  ];

  const datasets = locationNames.map((locationName, index) => {
    const tempData = labels.map((date) => {
      const locationData = temperatures.get(date);
      const temperature = locationData ? Number(locationData.get(locationName)).toFixed(0) : null;
      return temperature !== undefined ? temperature : null;
    });

    // Get the corresponding color from the palette
    const borderColor = colorPalette[index % colorPalette.length];
    const backgroundColor = `${borderColor}4D`; // Add transparency using HEX '4D'

    return {
      label: `Temperature in ${locationName}`,
      backgroundColor: backgroundColor,
      borderColor: borderColor,
      data: tempData,
      fill: false,
    };
});

  const chartData = {
    labels: labels,
    datasets: datasets,
  };

  if (window.temperatureChart instanceof Chart) {
    window.temperatureChart.destroy();
  }

  window.temperatureChart = new Chart(ctx, {
    type: "line",
    data: chartData,
    options: {
      responsive: true,
      scales: {
        x: { title: { display: true, text: "Date" } },
        y: { title: { display: true, text: "Temperature (°C)" } },
      },
      plugins: {
        legend: { display: true },
      },
    },
  });
}

// Add event listener for year selection change
document
  .getElementById("yearSelect")
  .addEventListener("change", (event) => {
    const selectedYear = event.target.value;
    currentMonth = `${selectedYear}-01-01`; // Set the selected year
    displayTemperatureChart(selectedLocationNames); // Update the chart
  });