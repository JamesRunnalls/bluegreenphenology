import React, { Component } from "react";
import axios from "axios";
import L from "leaflet";
import "leaflet.markercluster";
import "./css/leaflet.css";
import "./css/markercluster.css";
import "./css/markerclusterdefault.css";
import "../../App.css";

class Home extends Component {
  state = {
    lake: false,
    lakes: [],
  };
  setLake = (e) => {
    this.setState({ lake: e.target.options.id });
  };
  getLakes = async () => {
    const { data } = await axios
      .get(
        "https://bluegreenphenology.s3.eu-central-1.amazonaws.com/lakes.json"
      )
      .catch((error) => {
        console.error(error);
      });

    var markers = L.markerClusterGroup();
    var icon = L.divIcon({
      className: "map-marker",
      html: `<div class="circle" style="background-color:blue;box-shadow: 0px 0px 15px blue;"></div> `,
    });
    for (var lake of data) {
      markers.addLayer(
        new L.marker(lake.coords, {
          icon: icon,
          id: lake.id,
        })
          .bindTooltip(lake.name)
          .on("click", this.setLake)
      );
    }
    this.map.addLayer(markers);
    this.setState({ lakes: data });
  };
  async componentDidMount() {
    this.map = L.map("map", {
      preferCanvas: true,
      zoomControl: false,
      center: [25, 0],
      zoom: 3,
    });
    L.tileLayer(
      "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
      {
        attribution:
          "Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community",
      }
    ).addTo(this.map);
    window.setTimeout(() => {
      this.getLakes();
    }, 0);
  }

  render() {
    document.title =
      "Global remotely sensed phenology of Blue-Green Ecosystems";
    const { lake, lakes } = this.state;
    var name = "";
    if (lake !== false) name = lakes.find((lk) => lk.id === lake).name;
    return (
      <React.Fragment>
        <div id="map" className="home">
          <div className={lake ? "sidepanel" : "sidepanel hide"}>{name}</div>
        </div>
      </React.Fragment>
    );
  }
}

export default Home;
