import React, { Component } from "react";
import axios from "axios";
import L from "leaflet";
import "./css/leaflet.css";
import "../../App.css";

class Home extends Component {
  async componentDidMount() {
    this.map = L.map("map", {
      preferCanvas: true,
      zoomControl: false,
      center: [46.8, 8.2],
      zoom: 9,
      minZoom: 5,
      maxZoom: 15,
      maxBoundsViscosity: 0.5,
    });
    L.tileLayer(
      "https://api.mapbox.com/styles/v1/jamesrunnalls/ckq0mb8fa16u017p8ktbdiclc/tiles/256/{z}/{x}/{y}?access_token=pk.eyJ1IjoiamFtZXNydW5uYWxscyIsImEiOiJjazk0ZG9zd2kwM3M5M2hvYmk3YW0wdW9yIn0.uIJUZoDgaC2LfdGtgMz0cQ",
      {
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> | &copy; <a href="https://www.mapbox.com/">mapbox</a>',
      }
    ).addTo(this.map);
    window.setTimeout(() => {
      //this.addLayers();
    }, 0);
  }

  render() {
    document.title = "Global remotely sensed phenology of Blue-Green Ecosystems";
    return (
      <React.Fragment>
        <div id="map" className="home"></div>
      </React.Fragment>
    );
  }
}

export default Home;
