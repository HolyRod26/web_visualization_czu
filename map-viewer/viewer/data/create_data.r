locations = data.frame(
    name = c("snezka", "palava", "komorni_hurka"), latitude = c(50.74, 48.84, 50.10), longitude = c(15.74, 16.64, 12.34))

data = NULL
for (loc in 1:nrow(locations)) {
    location_data = read.csv(paste0("data/", locations[loc, ]$name, ".csv"))
    location_data$time = as.Date(location_data$time)
    location_data$location = as.factor(locations[loc, ]$name)

    if (is.null(data)) {
        data = location_data
    } else {
        data = rbind(data, location_data)
    }
}

library(data.table)
data = as.data.table(data)
data$sd = NULL
colnames(data)[2] = "value"

library(jsonlite)
write_json(data, "temperatures.json")

