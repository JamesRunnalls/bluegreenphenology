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
import ply from "./img/logo_ply.png";
import beta from "./img/beta.png";

class Image extends Component {
  state = { fullscreen: false, display: true };
  hide = () => {
    this.setState({ display: false });
  };
  fullscreen = () => {
    if (!this.state.fullscreen) this.setState({ fullscreen: true });
  };
  close = () => {
    if (this.state.fullscreen) this.setState({ fullscreen: false });
  };
  render() {
    var { id, name, base_url, info, title } = this.props;
    var { fullscreen, display } = this.state;
    if (display) {
      return (
        <div
          className={fullscreen ? "image fullscreen" : "image"}
          onClick={this.close}
        >
          <div className="title">{title}</div>
          <img
            alt={name}
            title={fullscreen ? "Close Image" : "View Large Image"}
            src={`${base_url}/Lake_${id}_${name}.png`}
            onError={this.hide}
            onClick={this.fullscreen}
          />
          <div className="infobox">{info}</div>
        </div>
      );
    } else {
      return <React.Fragment></React.Fragment>;
    }
  }
}

class ShowImages extends Component {
  state = {
    images: [
      {
        name: "wShedDistReg",
        title: "Land phenology",
        info: "",
      },
      {
        name: "lakePhenoMETDistReg",
        title: "Lake phenology",
        info: "",
      },
      {
        name: "lakePhenoMETLakeFrac",
        title: "Bloom size (fraction of pixels) per year",
        info: "",
      },
      {
        name: "scatterLakeStartEndPeak",
        title: "Timing of chlorophyll in- and decrease",
        info: "",
      },
      {
        name: "scatterLakeStartEndPeak_simClust",
        title: "Clusters of overlap in timing",
        info: "",
      },
      {
        name: "lakePhenoMETLakeFrac_1",
        title: "Cluster 1",
        info: "",
      },
      {
        name: "lakePhenoMETLakeFrac_2",
        title: "Cluster 2",
        info: "",
      },
      {
        name: "lakePhenoMETLakeFrac_3",
        title: "Cluster 3",
        info: "",
      },
      {
        name: "lakePhenoMETLakeFrac_4",
        title: "Cluster 4",
        info: "",
      },
      {
        name: "lakePhenoMETLakeFrac_5",
        title: "Cluster 5",
        info: "",
      },
    ],
  };
  onError = (e) => {
    var { images } = this.state;
    var name = e.target.alt;
    images = images.filter((i) => i !== name);
    this.setState({ images });
  };
  render() {
    var { id, base_url } = this.props;
    var { images } = this.state;
    if (id !== false) {
      return (
        <React.Fragment>
          {images.map((i) => (
            <Image
              id={id}
              name={i.name}
              base_url={base_url}
              key={id + i.name}
              info={i.info}
              title={i.title}
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
    show_lake: true,
    show_watershed: true,
    lakes: [],
    options: [],
    data: [],
    noname: { value: -1, label: "Unnamed Lake" },
    sidebar: 408,
    base_url: "https://bluegreenphenology.s3.eu-central-1.amazonaws.com",
    properties: false,
    map_active: true,
    modal: true,
  };

  activateMap = () => {
    if (!this.state.map_active) this.setState({ map_active: true });
  };

  deactivateMap = () => {
    if (this.state.map_active) this.setState({ map_active: false });
  };

  closeModal = () => {
    this.setState({ modal: false });
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
            fillColor: "red",
            weight: feature["properties"]["stroke-width"],
            opacity: feature["properties"]["stroke-opacity"],
            color: "red",
            fillOpacity: feature["properties"]["fill-opacity"],
          };
        },
      });
      this.watershed = L.geoJSON(data["features"][0], {
        style: function (feature) {
          return {
            fillColor: "yellow",
            weight: feature["properties"]["stroke-width"],
            opacity: feature["properties"]["stroke-opacity"],
            color: "yellow",
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
    var options = data.map((d) => {
      return {
        value: d.id,
        label:
          d.name === "None"
            ? "Lake ID: " + d.id
            : d.name + " (ID: " + d.id + ")",
      };
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
    new L.Control.Zoom({ position: "topright" }).addTo(this.map);
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
      lakes,
      options,
      noname,
      base_url,
      properties,
      show_lake,
      show_watershed,
      map_active,
      modal,
    } = this.state;
    var lakeInfo = lakes.find((item) => item.id === lake);
    var id_str = "";
    if (lakeInfo) id_str = lakeInfo.id_str;
    var option = options.find((item) => item.value === lake);
    if (option === undefined && lake !== false) option = noname;
    var text = this.processText(properties, option ? option.label : "");
    var side =
      "side-bar" + (lake ? "" : " hide") + (!map_active ? " pointers" : "");
    return (
      <React.Fragment>
        {modal && (
          <div className="modal" onClick={this.closeModal}>
            <div className="modal-inner">
              <h2>Global Phenology Map of Blue-Green Ecosystems.</h2>
              <div className="modal-text">
                <p>
                  This project contributes to the{" "}
                  <a href="https://www.eawag.ch/en/research/water-for-ecosystem/biodiversity/blue-green-biodiversity-research-initiative/">
                    Blue Green Biodiversity Research Initiative
                  </a>{" "}
                  – an Eawag-WSL collaboration focusing on Biodiversity at the
                  interface of aquatic and terrestrial ecosystems.
                </p>
                <p>
                  On this page you can find a comparison of the phenology
                  between more than 4000 lakes and their watersheds.
                </p>
                <p>*This is a beta version.</p>
              </div>
              <h5>Click anywhere to start.</h5>
            </div>
          </div>
        )}

        <div className="map">
          <div id="map" />
          <img
            src={beta}
            className="beta"
            title="The data contained in this site is still a beta version."
            alt="BETA"
          />
        </div>
        <div className={side}>
          <div
            className={map_active ? "header pointers" : "header"}
            onMouseEnter={this.activateMap}
            onClick={this.activateMap}
            onDrag={this.activateMap}
            onMouseOver={this.activateMap}
            onTouchMove={this.activateMap}
          ></div>
          <div
            className="content"
            onMouseEnter={this.deactivateMap}
            onClick={this.deactivateMap}
            onDrag={this.deactivateMap}
            onMouseOver={this.deactivateMap}
            onTouchMove={this.deactivateMap}
          >
            <div className="info">
              <div className="title">{option && option.label}</div>
              <div className="id">{id_str}</div>
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
                        <div className="red square" />
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
                        <div className="yellow square" />
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
            href="https://www.pml.ac.uk/"
            target="_blank"
            rel="noopener noreferrer"
          >
            <img src={ply} alt="Plymouth Marine Laboratory" />
          </a>
          <a
            href="https://www.wsl.ch/de/projekte/how-will-changes-in-the-phenology-of-species-affect-the-biodiversity-of-lakes-and-their-surrounding-watersheds.html"
            target="_blank"
            rel="noopener noreferrer"
          >
            <img src={wsl} alt="WSL" />
          </a>
          <a
            href="https://www.eawag.ch/en/department/surf/projects/phenology-of-blue-green-ecosystems/"
            target="_blank"
            rel="noopener noreferrer"
          >
            <img src={eawag} alt="Eawag" />
          </a>
          <div className="contact">For more information, please contact jelle.lever@eawag.ch</div>
        </div>
      </React.Fragment>
    );
  }
}

export default Home;
