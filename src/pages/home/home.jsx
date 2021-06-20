import React, { Component } from "react";
import axios from "axios";
import Select from "react-select";
import L from "leaflet";
import "leaflet.markercluster";
import "./css/leaflet.css";
import "./css/markercluster.css";
import "./css/markerclusterdefault.css";
import "../../App.css";

class ShowImages extends Component {
  state = {
    base_url: "https://bluegreenphenology.s3.eu-central-1.amazonaws.com",
    img_names: [
      "wShedDistReg",
      "lakePhenoMETDistReg",
      "lakePhenoMETLakeFrac",
      "scatterLakeStartEndPeak",
      "scatterLakeStartEndPeak_simClust",
      "lakePhenoMETLakeFrac_1",
      "lakePhenoMETLakeFrac_2",
      "lakePhenoMETLakeFrac_3",
      "lakePhenoMETLakeFrac_4",
      "lakePhenoMETLakeFrac_5",
    ],
  };
  onError = (e) => {
    var { img_names } = this.state;
    var name = e.target.alt;
    img_names = img_names.filter((i) => i !== name);
    this.setState({ img_names });
  };
  render() {
    var { id } = this.props;
    var { base_url, img_names } = this.state;
    if (id !== false) {
      return (
        <React.Fragment>
          {img_names.map((i) => (
            <img
              className=""
              key={id + i}
              alt={i}
              title="View Large Image"
              src={`${base_url}/Lake_${id}_${i}.png`}
              onError={(i) => (i.target.style.display = "none")}
            />
          ))}
        </React.Fragment>
      );
    } else {
      return <React.Fragment />;
    }
  }
}

class Home extends Component {
  state = {
    lake: false,
    lakes: [],
    options: [],
    data: [],
    noname: { value: -1, label: "Unnamed Lake" },
    sidebar: 408,
  };
  setLakeSelect = (event) => {
    if (event === null) {
      this.setState({ lake: false });
    } else {
      var { lakes, sidebar } = this.state;
      var latlng = lakes.find((d) => d.id === event.value).coords;
      var pr = this.map.project(latlng, 9);
      pr.x = pr.x - sidebar / 2;
      this.map.flyTo(this.map.unproject(pr, 9), 9);
      this.setState({ lake: event.value });
    }
  };
  setLakeLeaflet = (e) => {
    var { sidebar } = this.state;
    var latlng = e.latlng;
    var px = this.map.project(latlng).x - this.map.getPixelBounds().min.x;
    if (px < this.state.sidebar) {
      var pr = this.map.project(latlng);
      pr.x = pr.x - sidebar / 2;
      this.map.flyTo(this.map.unproject(pr));
    }
    this.setState({ lake: e.target.options.id });
  };
  plotLakes = (data) => {
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
          .on("click", this.setLakeLeaflet)
      );
    }
    this.map.addLayer(markers);
  };
  parseOptions = (data) => {
    var options = data
      .filter((d) => d.name !== "None")
      .map((d) => {
        return { value: d.id, label: d.name };
      });
    options.push(this.state.noname);
    return options;
  };
  getLakes = async () => {
    const { data } = await axios
      .get(
        "https://bluegreenphenology.s3.eu-central-1.amazonaws.com/lakes.json"
      )
      .catch((error) => {
        console.error(error);
      });
    this.plotLakes(data);
    const options = this.parseOptions(data);
    this.setState({ lakes: data, options });
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

  componentDidUpdate() {
    var map = this.map;
    setTimeout(function () {
      map.invalidateSize();
    }, 400);
  }

  render() {
    document.title =
      "Global remotely sensed phenology of Blue-Green Ecosystems";
    const { lake, options, noname } = this.state;
    var option = options.find((item) => item.value === lake);
    if (option === undefined && lake !== false) option = noname;
    return (
      <React.Fragment>
        <div className="map">
          <div id="map" />
        </div>
        <div className={lake ? "side-bar" : "side-bar hide"}>
          <div className="header"></div>
          <div className="info">
            <div className="title">{option && option.label}</div>
          </div>
          <div className="images">
            <ShowImages id={lake} />
          </div>
        </div>
        <div className="search-bar">
          <Select
            options={options}
            placeholder="Search Worldwide Lakes"
            onChange={this.setLakeSelect}
            isClearable={true}
            value={option}
          />
        </div>
      </React.Fragment>
    );
  }
}

export default Home;
