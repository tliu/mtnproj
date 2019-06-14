var db;
var map;
var markers = {};


document.addEventListener("DOMContentLoaded",() => {
    map = init();
    db = new PouchDB("mtnproj");
    addListeners();
    db.destroy().then(() => {
        db = new PouchDB("mtnproj");
        initDB().then(() => {
            createMarkers();
        });;
    });

});

const addListeners = () => {
    document.getElementById("search").addEventListener("input", ev => {
        const val = document.getElementById("search").value;
        db.find({
            selector: {name: {$regex: `.*${val}.*`}},
            fields: ["id", "name"],
        }).then(res => {
            toggleMarkers(res.docs.map(doc => {
                return doc.id;
            }));
        }).catch(err => {
            console.log(err);
        });
    });
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
    const map = L.map('map').setView([42.510583, -71.006972], 18);
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
    return Promise.all(
        MTN_PROJ["routes"].map((doc) => {
            doc._id = "" + doc["id"];
            return db.put(doc);
        }));
}

const createMarkers = () => {
    db.allDocs({
        include_docs: true
    }).then(res => {
        res.rows.forEach(row => {
            addMarker(row.doc)
        });
    }).catch(err => {
        console.log(err);
    });
}

const addMarker = doc => {
    const marker = L.marker([doc.latitude, doc.longitude], {
        title: doc.name.split()[0],
        icon: new L.ExtraMarkers.icon({
            shape: "penta",
            markerColor: starColor(doc.stars),
            innerHTML: `<p class="marker">${doc.rating}</p>`
        }),
    }).addTo(map);
    markers[`${doc.id}`] = marker
    marker.bindPopup(doc.name + "<br>" + doc.rating);
}

var COLOR_MAP = ["red", "orange-dark", "orange", "green-dark", "green", "green-light"];
const starColor = stars => {
    return COLOR_MAP[Math.round(stars)];
}
