var db;
var map;
var markers = {};
var geoToClimb = {};

document.addEventListener("DOMContentLoaded",() => {
    map = init();
    db = new PouchDB("mtnproj");
    addListeners();
    db.destroy().then(() => {
        db = new PouchDB("mtnproj");
        initDB().then(() => {
            indexDB().then(() => {
                createMarkers();
            })
        });
    });

});

const addListeners = () => {
    document.getElementById("search").addEventListener("input", updateMarkers);
    var grade = document.getElementById("grade");
    grade.addEventListener("mouseup", updateMarkers);
    grade.nextElementSibling.addEventListener('mouseup', updateMarkers);
    grade.addEventListener("input", updateGrade);
    grade.nextElementSibling.addEventListener('input', updateGrade);
}

const updateGrade = () => {
    const grade = document.getElementById("grade");
    const low = Math.round((grade.valueLow / 100) * 15);
    const high = Math.round((grade.valueHigh / 100) * 15);
    document.getElementById("low").innerHTML = `V${low}`;
    document.getElementById("high").innerHTML = `V${high}`;
}

const indexDB = () => {
    return Promise.all([
        db.createIndex({index: {fields: ["calcGrade"]}}),
        db.createIndex({index: {fields: ["name"]}}),
        db.createIndex({index: {fields: ["name", "calcGrade"]}}),
    ]);
}

const updateMarkers = () => {
    const grade = document.getElementById("grade");
    const low = Math.round((grade.valueLow / 100) * 15);
    const high = Math.round((grade.valueHigh / 100) * 15);
    const val = document.getElementById("search").value;
    let sel = {
        calcGrade: {
            $gte: low,
            $lte: high
        }
    }

    if (val != "") {
        sel.name = {$regex: `.*${val}.*`}
    }
    db.find({
        selector: sel,
        fields: ["id", "name", "calcGrade"],
    }).then(res => {
        toggleMarkers(res.docs.map(doc => {
            return doc.id;
        }));
        updateBoulderCounter(res.docs.length);
    }).catch(err => {
        console.log(err);
    });
}

const updateBoulderCounter = len => {
    document.getElementById("results").innerHTML = `${len}`
}

const toggleMarkers = showIds => {
    Object.values(markers).forEach(marker => {
        marker.setOpacity(0);
    });
    showIds.forEach(id => { 
        markers[id].setOpacity(100);
    });
}

const init = () => {
    const map = L.map('map').setView([42.510583, -71.006972], 15);
    L.tileLayer('https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.png?access_token=pk.eyJ1IjoidGxpdSIsImEiOiJjand3aTRnNHowanB6M3ltejlpZG5hZTY5In0.8UEgMFo3dvgXq8avCl8o3A', {
        maxZoom: 18,
        attribution: 'Map data &copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors, ' +
        '<a href="https://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, ' +
        'Imagery © <a href="https://www.mapbox.com/">Mapbox</a>',
        id: 'mapbox.satellite'
    }).addTo(map);

    //map.locate({setView: true, maxZoom: 18})
    return map
}

const initDB = () => {
    Object.entries(ROUTES).forEach(([grade, routes]) => {
        routes.map(route => {
            route._id = "" + route["id"];
            route.calcGrade = parseInt(grade);
        });
    });
    routes = Object.values(ROUTES).flat();
    return Promise.all(
        routes.map(route => {
            return db.put(route);
        })
    );
}

const createMarkers = () => {
    db.find({
        selector: {id: {$regex: "^(?![_design]).*"}},
    }).then(res => {
        res.docs.forEach(doc => {
            key = `${doc.latitude},${doc.longitude}`
            if (key in geoToClimb) {
                geoToClimb[key].push(doc)
            } else {
                geoToClimb[key] = [doc]
            }
        });
        for (let [key, value] of Object.entries(geoToClimb)) {
            addMarker(key, value)
        }
        updateMarkers();
        updateGrade();
    }).catch(err => {
        console.log(err);
    });
}

const addMarker = (key, docs) => {
    html = "";
    let lat, lng;
    let total = 0;
    docs.forEach(doc => {
        html += `<p>${doc.name}, ${doc.rating}<br>${doc.stars}<br>(<a href=${doc.url} target=_blank>link</a>)</p>`
        lat = doc.latitude;
        lng = doc.longitude;
        total += doc.stars;
    });
    let avg = total / docs.length;
    const marker = L.marker([lat, lng], {
        icon: new L.ExtraMarkers.icon({
            shape: "penta",
            markerColor: starColor(avg),
            innerHTML: `<p class="marker">${docs.length}</p>`
        }),
    }).addTo(map);
    docs.forEach(doc => {
        markers[`${doc.id}`] = marker
    });
    marker.bindPopup(html);
}

var COLOR_MAP = ["red", "orange-dark", "orange", "green-dark", "green", "green-light"];
const starColor = stars => {
    return COLOR_MAP[Math.round(stars)];
}
