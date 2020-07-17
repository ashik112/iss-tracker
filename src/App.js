import React, { Component } from 'react';
import { getLatLngObj } from "tle.js";
import ReactMapGL, { Source, Layer } from 'react-map-gl';
import './App.css';

// mapboxgl.accessToken = process.env.REACT_APP_MAPBOX_ACCESS_TOKEN;

class App extends Component {
  mapRef = React.createRef();
  map;
  constructor(props) {
    super(props);
    this.state = {
      viewport: {
        width: '100vw',
        height: '100vh',
        latitude: 23.774647899999998,
        longitude: 90.4031033,
        zoom: 1,
      },
      geojson: null,
      features: [],
      sattelites: [],
      lng: 90.4031033,
      lat: 23.774647899999998,
    };
  }

  getCurrentLocation() {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(position => {
        const { coords: { latitude, longitude } } = position;
        this.setState({
          lat: latitude,
          lng: longitude,
        });
      });
    } else {
      alert("Geolocation is not supported by this browser.");
    }
  }

  async fetchPoints() {
    const markers = [];
    // http://www.celestrak.com/NORAD/elements/stations.txt');
    try {
      const response = await fetch('/satellites');
      const data = await response.text();
      const lines = data.split('\n');
      const satellites = {};
      for (let i = 0; i < lines.length; i += 3) {
        if (i + 1 < lines.length) {
          try {
            const latLonObj = getLatLngObj([lines[i + 1], lines[i + 2]]);
            satellites[lines[i]] = latLonObj;
          } catch (e) {
            console.error(e);
          }
        }
      }

      Object.keys(satellites).forEach(key => {
        markers.push({
          type: 'Feature',
          geometry: {
            type: 'Point',
            coordinates: [satellites[key].lng, satellites[key].lat]
          },
          properties: {
            id: key,
            name: key.trim(),
            title: key.trim(),
            icon: 'rocket-15',
          }
        });
      });
    } catch (e) {
      console.error(e);
    }
    return markers;
  }

  async componentDidMount() {
    this.getCurrentLocation();
    this.setState({
      geojson: {
        type: 'FeatureCollection',
        features: await this.fetchPoints(),
      },
    });
    window.setInterval(async () => {
      const features = await this.fetchPoints();
      this.setState({
        geojson: {
          type: 'FeatureCollection',
          features: features,
        },
      });
    }, 5000);
  }

  render() {
    const { viewport, geojson } = this.state;
    return (
      <div className="App">
        <ReactMapGL
          {...viewport}
          mapStyle="mapbox://styles/ashekur/ckcilirq435u31il5sqube24d"
          mapboxApiAccessToken={process.env.REACT_APP_MAPBOX_ACCESS_TOKEN}
          onViewportChange={nextViewport => this.setState({ viewport: { ...nextViewport } })}
        >
          {
            geojson && (
              <Source id="sat" type='geojson' data={geojson}>
                <Layer
                  icon="marker-15"
                  id="point"
                  type="symbol"
                  layout= {{
                    'text-field': ['get', 'title'],
                    'text-variable-anchor': ['top', 'bottom', 'left', 'right'],
                    'text-radial-offset': 0.5,
                    'text-justify': 'auto',
                    'text-padding': 5,
                    'text-size': 12,
                    // full list of icons here: https://labs.mapbox.com/maki-icons
                    'icon-image': 'rocket-15', // this will put little croissants on our map
                    'icon-padding': 0,
                    'icon-allow-overlap': true,
                  }}
                  paint= {{
                    "text-color": "#FFFFFF",
                    'text-halo-color': '#008000',
                    'text-halo-width': 1,
                  }}
                />
              </Source>
            )
          }
        </ReactMapGL>
      </div>
    );
  }
}

export default App;
