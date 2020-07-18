import React, { Component } from 'react';
import { getLatLngObj, getGroundTracks, getSatelliteInfo } from "tle.js";
import ReactMapGL, { Source, Layer } from 'react-map-gl';
import { Container, Row, Col, Card, Table } from 'react-bootstrap';
import 'bootstrap/dist/css/bootstrap.min.css';
import './App.css';
class App extends Component {
  mapRef = React.createRef();
  map;
  constructor(props) {
    super(props);
    this.state = {
      viewport: {
        width: '100%',
        height: '100vh',
        latitude: 23.774647899999998,
        longitude: 90.4031033,
        zoom: 2,
      },
      iss: {},
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

  setIssGeoJson() {
    const { iss, viewport } = this.state;
    const { tleArr } = iss;
    const name = tleArr[0].trim();
    const latLonObj = getLatLngObj([tleArr[1], tleArr[2]]);
    const { lng, lat } = latLonObj;

    const satInfo = getSatelliteInfo(
      tleArr.join('\n'),         // Satellite TLE string or array.
      Date.now(),  // Timestamp (ms)
      lat,      // Observer latitude (degrees)
      lng,    // Observer longitude (degrees)
      0               // Observer elevation (km)
    );
    this.setState({
      viewport: {
        ...viewport,
        latitude: lat,
        longitude: lng,
      },
    });
    const geojson = {
      type: 'FeatureCollection',
      features: [{
        type: 'Feature',
        geometry: {
          type: 'Point',
          coordinates: [lng, lat]
        },
        properties: {
          id: name,
          name: name,
          title: name,
          icon: 'rocket-15',
        }
      }],
    }
    this.setState({
      iss: {
        ...iss,
        info: satInfo,
        geojson,
      }
    });
  }

  async setIssPath() {
    const { iss } = this.state;
    const { tleArr } = iss;
    const tleStr = tleArr && tleArr.join('\n');
    const threeOrbitsArr = await getGroundTracks({
      tle: tleStr,
      // Relative time to draw orbits from.  This will be used as the "middle"/current orbit.
      startTimeMS: Date.now(),
      // Resolution of plotted points.  Defaults to 1000 (plotting a point once for every second).
      stepMS: 60000,
      // Returns points in [lng, lat] order when true, and [lng, lat] order when false.
      isLngLatFormat: true
    });
    this.setState({
      iss: {
        ...iss,
        path: {
          "type": "FeatureCollection",
          "features": [
            {
              "type": "Feature",
              "properties": {
                "stroke": "#FFF",
                "stroke-width": 15,
                "stroke-opacity": 1,
                "line-join": "round",
                "line-cap": "round"
              },
              "geometry": {
                "type": "LineString",
                "coordinates": threeOrbitsArr[1],
              }
            }
          ]
        },
      }
    });
  }

  async fetchISSPoints() {
    try {
      const response = await fetch('http://www.celestrak.com/NORAD/elements/stations.txt');
      const data = await response.text();
      const lines = data.split('\n');
      const tleArr = [lines[0], lines[1], lines[2]];
      const tleStr = tleArr && tleArr.join('\n');
      const { lng, lat } = this.state;

      const satInfo = getSatelliteInfo(
        tleStr,         // Satellite TLE string or array.
        Date.now(),  // Timestamp (ms)
        lat,      // Observer latitude (degrees)
        lng,    // Observer longitude (degrees)
        0               // Observer elevation (km)
      );
      this.setState({
        iss: {
          name: lines[0].trim(),
          tleArr: tleArr,
          info: satInfo || null,
        }
      }, () => {
        this.setIssGeoJson();
      });
    } catch (e) {

    }
  }

  async fetchPoints() {
    const markers = [];
    // http://www.celestrak.com/NORAD/elements/stations.txt');
    try {
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
    await this.fetchISSPoints();
    await this.setIssPath();
    // this.setState({
    //   geojson: {
    //     type: 'FeatureCollection',
    //     features: await this.fetchPoints(),
    //   },
    // });
    window.setInterval(async () => {
      await this.setIssGeoJson();
      // const features = await this.fetchPoints();
      // this.setState({
      //   geojson: {
      //     type: 'FeatureCollection',
      //     features: features,
      //   },
      // });
    }, 5000);
  }

  render() {
    const { viewport, iss: { geojson, path, info, name } } = this.state;
    return (
      <div className="App">
        <Container fluid className="m-0 p-0">
          <Row noGutters>
            <Col md={2} lg={2} className="info-container">
              <Card body className="m-3"><h3 className="text-center">{name}</h3></Card>
              {
                info && (
                  <Card body className="m-3">
                    <Table  striped bordered hover>
                      <tbody>
                        <tr>
                          <th>Time</th>
                          <td>{new Date().toLocaleTimeString()}</td>
                        </tr>
                        <tr>
                          <th>Latitude</th>
                          <td>{info.lat.toFixed(2)}</td>
                        </tr>
                        <tr>
                          <th>Longitude</th>
                          <td>{info.lng.toFixed(2)}</td>
                        </tr>
                        <tr>
                          <th>Altitude</th>
                          <td>{info.height.toFixed(2)} km</td>
                        </tr>
                        <tr>
                          <th>Azimuth</th>
                          <td>{info.azimuth.toFixed(2)}</td>
                        </tr>
                        <tr>
                          <th>Elevation</th>
                          <td>{info.elevation.toFixed(2)}</td>
                        </tr>
                        <tr>
                          <th>Velocity</th>
                          <td>{info.velocity.toFixed(2)} km/s</td>
                        </tr>
                      </tbody>
                    </Table>
                  </Card>
                )
              }
            </Col>
            <Col md={10} lg={10} className="m-0 p-0">
              <div className="map-container">
                <ReactMapGL
                  {...viewport}
                  mapStyle="mapbox://styles/ashekur/ckcilirq435u31il5sqube24d"
                  mapboxApiAccessToken={process.env.REACT_APP_MAPBOX_ACCESS_TOKEN}
                  onViewportChange={nextViewport => this.setState({ viewport: { ...nextViewport } })}
                >
                  {
                    path && (
                      <Source id="sat-path" type='geojson' data={path}>
                        <Layer
                          beforeId="point"
                          icon="marker-15"
                          id="route"
                          type="line"
                          layout={{
                            "line-join": "round",
                            "line-cap": "round"
                          }}
                          paint={{
                            "line-color": "#FFF",
                            "line-width": 1
                          }}
                        />
                      </Source>
                    )
                  }
                  {
                    geojson && (
                      <Source id="sat" type='geojson' data={geojson}>
                        <Layer
                          icon="marker-15"
                          id="point"
                          type="symbol"
                          layout={{
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
                          paint={{
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
            </Col>
          </Row>
        </Container>
      </div>
    );
  }
}

export default App;
