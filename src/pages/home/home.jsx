import React, { Component } from "react";
import axios from "axios";
import Select from "react-select";
import L from "leaflet";
import "leaflet.markercluster";
import "./css/leaflet.css";
import "./css/markercluster.css";
import "./css/markerclusterdefault.css";
import "../../App.css";
import eawag from "./img/logo_eawag.png";
import wsl from "./img/logo_wsl.png";

class Image extends Component {
  state = { fullscreen: false };
  fullscreen = () => {
    if (!this.state.fullscreen) this.setState({ fullscreen: true });
  };
  close = () => {
    if (this.state.fullscreen) this.setState({ fullscreen: false });
  };
  render() {
    var { id, name, base_url } = this.props;
    var { fullscreen } = this.state;
    return (
      <div className={fullscreen ? "fullscreen" : ""} onClick={this.close}>
        <img
          alt={name}
          title="View Large Image"
          src={`${base_url}/Lake_${id}_${name}.png`}
          onError={(i) => (i.target.style.display = "none")}
          onClick={this.fullscreen}
        />
      </div>
    );
  }
}

class ShowImages extends Component {
  state = {
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
    var { id, base_url } = this.props;
    var { img_names } = this.state;
    if (id !== false) {
      return (
        <React.Fragment>
          {img_names.map((i) => (
            <Image id={id} name={i} base_url={base_url} key={id + i} />
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
    show_lake: true,
    show_watershed: true,
    lakes: [],
    options: [],
    data: [],
    noname: { value: -1, label: "Unnamed Lake" },
    sidebar: 408,
    base_url: "https://bluegreenphenology.s3.eu-central-1.amazonaws.com",
    properties: false,
  };

  toggleShowLake = () => {
    var { show_lake } = this.state;
    try {
      if (show_lake) {
        this.map.removeLayer(this.lake);
      } else {
        this.map.addLayer(this.lake);
      }
    } catch (e) {}
    this.setState({ show_lake: !show_lake });
  };

  toggleShowWatershed = () => {
    var { show_watershed } = this.state;
    try {
      if (show_watershed) {
        this.map.removeLayer(this.watershed);
      } else {
        this.map.addLayer(this.watershed);
      }
    } catch (e) {}
    this.setState({ show_watershed: !this.state.show_watershed });
  };

  processText = (p, name) => {
    if (p) {
      return `${name} covers a surface area of ${Math.round(
        p.lake_area
      )}km² and is part of the following countries; ${p.countries.join(
        ", "
      )}. The watershed covers an area of ${Math.round(
        p.watershed_area / 1000000
      )}km².`;
    } else {
      return "";
    }
  };

  downloadLakeMetadata = async (id) => {
    const { base_url } = this.state;
    try {
      const { data } = await axios.get(base_url + "/" + id + "_metadata.json");
      return data;
    } catch (e) {
      return false;
    }
  };

  plotZoomLake = (data, latlng) => {
    var { sidebar } = this.state;
    if (data) {
      this.lake = L.geoJSON(data["features"][1], {
        style: function (feature) {
          return {
            fillColor: feature["properties"]["fill"],
            weight: feature["properties"]["stroke-width"],
            opacity: feature["properties"]["stroke-opacity"],
            color: feature["properties"]["stroke"],
            fillOpacity: feature["properties"]["fill-opacity"],
          };
        },
      });
      this.watershed = L.geoJSON(data["features"][0], {
        style: function (feature) {
          return {
            fillColor: feature["properties"]["fill"],
            weight: feature["properties"]["stroke-width"],
            opacity: feature["properties"]["stroke-opacity"],
            color: feature["properties"]["stroke"],
            fillOpacity: feature["properties"]["fill-opacity"],
          };
        },
      });
      this.map.addLayer(this.watershed);
      this.map.addLayer(this.lake);
      var bounds = this.watershed.getBounds();
      this.map.fitBounds(bounds);
    } else {
      var pr = this.map.project(latlng, 9);
      pr.x = pr.x - sidebar / 2;
      this.map.flyTo(this.map.unproject(pr, 9), 9);
    }
  };

  setLakeSelect = (event) => {
    try {
      this.map.removeLayer(this.lake);
      this.map.removeLayer(this.watershed);
    } catch (e) {}
    if (event === null) {
      this.setState({ lake: false, properties: false });
    } else {
      var { lakes } = this.state;
      var latlng = lakes.find((d) => d.id === event.value).coords;

      this.setState({ lake: event.value }, async () => {
        var data = await this.downloadLakeMetadata(event.value);
        this.plotZoomLake(data, latlng);
        if (data) {
          var properties = {
            countries: data["features"][1]["properties"]["countries"],
            lake_area: data["features"][1]["properties"]["area"],
            watershed_area: data["features"][0]["properties"]["area"],
          };
          this.setState({ properties, show_lake: true, show_watershed: true });
        }
      });
    }
  };

  setLakeLeaflet = (e) => {
    try {
      this.map.removeLayer(this.lake);
      this.map.removeLayer(this.watershed);
    } catch (e) {}
    var latlng = e.latlng;
    this.setState({ lake: e.target.options.id }, async () => {
      var data = await this.downloadLakeMetadata(e.target.options.id);
      this.plotZoomLake(data, latlng);
      if (data) {
        var properties = {
          countries: data["features"][1]["properties"]["countries"],
          lake_area: data["features"][1]["properties"]["area"],
          watershed_area: data["features"][0]["properties"]["area"],
        };
        this.setState({ properties, show_lake: true, show_watershed: true });
      }
    });
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
          .bindTooltip(lake.name === "None" ? "Unnamed Lake" : lake.name, {
            direction: "top",
            offset: L.point(0, -5),
          })
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
    const { base_url } = this.state;
    const { data } = await axios
      .get(base_url + "/lakes.json")
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
    document.title = "Global Phenology Map of Blue-Green Ecosystems";
    const {
      lake,
      options,
      noname,
      base_url,
      properties,
      show_lake,
      show_watershed,
    } = this.state;
    var option = options.find((item) => item.value === lake);
    if (option === undefined && lake !== false) option = noname;
    var text = this.processText(properties, option ? option.label : "");
    return (
      <React.Fragment>
        <div className="map">
          <div id="map" />
        </div>
        <div className={lake ? "side-bar" : "side-bar hide"}>
          <div className="header"></div>
          <div className="content">
            <div className="info">
              <div className="title">{option && option.label}</div>
              <div className="text">{text}</div>
              <div className="legend">
                <table>
                  <tbody>
                    <tr>
                      <td>
                        <input
                          type="checkbox"
                          onChange={this.toggleShowLake}
                          checked={show_lake}
                        />
                      </td>
                      <td>
                        <div className="yellow square" />
                      </td>
                      <td>Lake Surface Area</td>
                    </tr>
                    <tr>
                      <td>
                        <input
                          type="checkbox"
                          onChange={this.toggleShowWatershed}
                          checked={show_watershed}
                        />
                      </td>
                      <td>
                        <div className="red square" />
                      </td>
                      <td>Watershed Area</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
            <div className="images">
              <ShowImages id={lake} base_url={base_url} />
            </div>
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
        <div className="logos">
          <a
            href="https://www.eawag.ch/en/department/surf/projects/phenology-of-blue-green-ecosystems/"
            target="_blank"
            rel="noopener noreferrer"
          >
            <img src={eawag} alt="Eawag" />
          </a>
          <a
            href="https://www.wsl.ch/de/projekte/how-will-changes-in-the-phenology-of-species-affect-the-biodiversity-of-lakes-and-their-surrounding-watersheds.html"
            target="_blank"
            rel="noopener noreferrer"
          >
            <img src={wsl} alt="WSL" />
          </a>
        </div>
      </React.Fragment>
    );
  }
}

export default Home;
