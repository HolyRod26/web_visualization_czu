library(sf)

locations = data.frame(
    name = c("Sněžka", "Pálava", "Komorní hůrka"),
    id = c("snezka", "palava", "komorni_hurka"),
    latitude = c(50.74, 48.84, 50.10),
    longitude = c(15.74, 16.64, 12.34)
)
locations_sf = st_as_sf(locations, coords = c("longitude", "latitude"), crs = 4326)

write_sf(locations_sf, "locations.geojson", driver = "GEOJSON")
write_sf(locations_sf, "locations.gpkg", driver = "GPKG")

