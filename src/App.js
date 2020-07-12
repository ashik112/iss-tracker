import React, { Component } from 'react';
import './App.css';
import mapboxgl from 'mapbox-gl';
import MapboxGeocoder from '@mapbox/mapbox-gl-geocoder';
import { getLatLngObj } from "tle.js";

mapboxgl.accessToken = process.env.REACT_APP_MAPBOX_ACCESS_TOKEN;

class App extends Component {
  mapRef = React.createRef();
  map;
  constructor(props) {
    super(props);
    this.state = {
      lng: 90.4031033,
      lat: 23.774647899999998,
      zoom: 1,
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

  componentDidMount() {
    this.getCurrentLocation();
    this.map = new mapboxgl.Map({
      container: this.mapRef.current,
      style: 'mapbox://styles/ashekur/ckcilirq435u31il5sqube24d',
      center: [this.state.lng, this.state.lat],
      zoom: this.state.zoom,
      maxBounds: [ [-180, -85], [180, 85] ],
    });
    this.map.addControl(
      new MapboxGeocoder({
        accessToken: mapboxgl.accessToken,
        mapboxgl: mapboxgl
      })
    );
    // Add zoom and rotation controls to the map.
    this.map.addControl(new mapboxgl.NavigationControl(), 'bottom-right');
    this.map.on('load', async () => {
      window.setInterval(async () => {
        const features = await this.fetchPoints();
        this.map.getSource('point').setData({
          type: 'FeatureCollection',
          features: features,
        })
      }, 5000);
      const features = await this.fetchPoints();
      this.map.addSource('point', {
        'type': 'geojson',
        'data': {
          type: 'FeatureCollection',
          features: features,
        },
      });
      this.map.addLayer({
        id: 'point-layer',
        source: 'point',
        type: 'symbol',
        layout: {
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
        },
        paint: {
          "text-color": "#FFFFFF",
          'text-halo-color': '#008000',
          'text-halo-width': 1,
        }
      });
    });

    this.map.on('move', () => {
      this.setState({
        lng: this.map.getCenter().lng.toFixed(4),
        lat: this.map.getCenter().lat.toFixed(4),
        zoom: this.map.getZoom().toFixed(5)
      });
    });
  }

  render() {
    return (
      <div className="App">
        <div ref={this.mapRef} className="mapContainer" />
      </div>
    );
  }
}

export default App;
