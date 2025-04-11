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

let temperatures = new Map();

async function fetchTemperatureData() {
  try {
    const response = await fetch("data/temperatures.json");
    if (!response.ok) {
      throw new Error(`Data request failed with status ${response.status}`);
    }
    const data = await response.json();
    for (const record of data) {
      const { time, location, value } = record;
      const normalizedLocation = normalizeName(location);
      if (!temperatures.has(time)) {
        temperatures.set(time, new Map());
      }
      temperatures.get(time).set(normalizedLocation, value);
    }
    console.log(temperatures);
  } catch (error) {
    console.error("Error fetching temperature data:", error);
  }
}

fetchTemperatureData();

const locationsSource = new VectorSource({
  url: "data/locations.geojson",
  format: new GeoJSON(),
});

const countriesSource = new VectorSource({
  url: "data/countries.geojson",
  format: new GeoJSON(),
});

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
    }),
  });

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
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

const selectClick = new Select({
  condition: click,
  style: getLocationsStyle(true),
  layers: [locationsLayer],
});

map.addInteraction(selectClick);

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

    document.getElementById(
      "info"
    ).innerHTML = `<p>Selected location: ${rawLocationName}</p>`;
    displayTemperatureChart(normalizedLocationName);
  }
});

function displayTemperatureChart(locationName) {
  const ctx = document.getElementById("temperatureChart").getContext("2d");

  const labels = [...temperatures.keys()];
  const tempData = labels.map((date) => {
    const locationData = temperatures.get(date);
    const temperature = locationData ? locationData.get(locationName) : null;
    return temperature !== undefined ? temperature : null;
  });

  const chartData = {
    labels: labels,
    datasets: [
      {
        label: `Temperature for ${locationName}`,
        backgroundColor: "rgba(255, 99, 132, 0.2)",
        borderColor: "rgba(255, 99, 132, 1)",
        data: tempData,
        fill: false,
      },
    ],
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

const monthSelect = document.getElementById("monthSelect");
for (const date of temperatures.keys()) {
  const option = document.createElement("option");
  option.setAttribute("value", date);
  option.innerHTML = date;
  monthSelect.appendChild(option);
}

let currentMonth = "1950-01-01";

monthSelect.addEventListener("change", function (e) {
  setCurrentMonth(e.target.value);
});

function updateTemperatureTable() {
  const features = locationsLayer.getSource().getFeatures();
  let featuresValuesText =
    "<table><tr><th>Location</th><th>Temperature (°C)</th></tr>";

  for (const feature of features) {
    const locationId = normalizeName(feature.getProperties().id);
    const temperature = temperatures.get(currentMonth).get(locationId);
    featuresValuesText += `<tr><td>${feature.getProperties().name}</td><td>${
      temperature !== undefined ? temperature.toFixed(2) : "N/A"
    } °C</td></tr>`;
  }
  featuresValuesText += "</table>";

  document.getElementById("temperatureTable").innerHTML = featuresValuesText;
}

locationsLayer.getSource().on("featuresloadend", function (e) {
  setCurrentMonth(currentMonth);
});

// Helper function to update current month
function setCurrentMonth(month) {
  currentMonth = month;
  updateTemperatureTable();
  locationsLayer.changed();
}
