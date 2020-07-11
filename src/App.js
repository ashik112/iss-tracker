import React, { Component } from 'react';
import './App.css';
import mapboxgl from 'mapbox-gl';
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
    const response = await fetch('http://www.celestrak.com/NORAD/elements/stations.txt');
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
    const markers = [];

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
    return markers;
  }

  componentDidMount() {
    this.getCurrentLocation();
    this.map = new mapboxgl.Map({
      container: this.mapRef.current,
      style: 'mapbox://styles/mapbox/streets-v11',
      center: [this.state.lng, this.state.lat],
      zoom: this.state.zoom
    });
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
          // full list of icons here: https://labs.mapbox.com/maki-icons
          'icon-image': 'rocket-15', // this will put little croissants on our map
          'icon-padding': 0,
          'icon-allow-overlap': true,
        },
        paint: {
          "text-color": "#FF0000"
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

  componentWillUnmount() {

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
