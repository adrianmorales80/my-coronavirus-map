import React from 'react';
import Helmet from 'react-helmet';
import L, { geoJson, map } from 'leaflet';

import Layout from 'components/Layout';
import Container from 'components/Container';
import Map from 'components/Map';

import axios from 'axios';

const LOCATION = {
  lat: 0,
  lng: 0
};
const CENTER = [LOCATION.lat, LOCATION.lng];
const DEFAULT_ZOOM = 2;

const IndexPage = () => {

  /**
   * mapEffect
   * @description Fires a callback once the page renders
   * @example Here this is and example of being used to zoom in and set a popup on load
   */

  async function mapEffect({ leafletElement: map } = {}) {
    // Get data from API
    let response;

    try {
      response = await axios.get('https://corona.lmao.ninja/countries');
    } catch(e) {
      console.log(`Failed to fetch countries: ${e.message}`, e);
      return e;
    }

    // If data is available create geoJson object
    const {data = []} = response;
    const hasData = Array.isArray(data) && data.length > 0;

    if (!hasData) return;

    const geoJson = {
      type: 'FeatureCollection',
      features: data.map((country = {}) => {
        const { countryInfo = {} } = country;
        const { lat, long: lng } = countryInfo;
        return {
          type: 'Feature',
          properties: {
            ...country,
          },
          geometry: {
            type: 'Point',
            coordinates: [ lng, lat ]
          }
        }
      })
    }

    console.log('API response: ',data); // Print API response
    console.log('geoJson object', geoJson); // Print geojson object; https://geojson.org/

    // Create new instance of L.GeoJSON to transform GeoJSON doc into something Leaflet understands
    const geoJsonLayers = new L.GeoJSON(geoJson, {
      // Custom pointToLayer method to customize map layer Leaflet creates
      pointToLayer: (feature  = {}, latlng) => {
        const { properties = {}} = feature;
        let updatedFormatted;
        let casesString;
        
        // Datapoints we are interested in
        const {
          country,
          updated,
          cases,
          deaths,
          recovered
        } = properties

        casesString = `${cases}`;

        // Show 1K+ instead of 1000
        if (cases > 1000) {
          casesString = `${casesString.slice(0,-3)}k+`
        }

        if (updated) {
          updatedFormatted = new Date(updated).toLocaleDateString();
        }

        // Define map marker added to map and HTML for tooltip on hover
        const html = `
        <span class="icon-marker">
          <span class="icon-marker-tooltip">
            <h2>${country}</h2>
            <ul>
              <li><strong>Confirmed:</strong> ${cases}</li>
              <li><strong>Deaths:</strong> ${deaths}</li>
              <li><strong>Recovered</strong> ${recovered}</li>
              <li><strong>Last Update:</strong> ${updatedFormatted}</li>
            </ul>
          </span>
          ${casesString}
        </span>
        `;

        // Return L.marker custom config, including .icon for container and custom HTML
        return L.marker(latlng, {
          icon: L.divIcon({
            className: 'icon',
            html
          }),
          riseOnHover: true // Hover over the markers on the map
        });
      }
    });

    // Add geoJsonLayers to the map
    geoJsonLayers.addTo(map);

  }

  const mapSettings = {
    center: CENTER,
    defaultBaseMap: 'OpenStreetMap',
    zoom: DEFAULT_ZOOM,
    mapEffect
  };

  return (
    <Layout pageName="home">
      <Helmet>
        <title>Home Page</title>
      </Helmet>

      <Map {...mapSettings}/>

      <Container type="content" className="text-center home-start">
        <h2>Still Getting Started?</h2>
        <p>Run the following in your terminal!</p>
        <pre>
          <code>gatsby new [directory] https://github.com/colbyfayock/gatsby-starter-leaflet</code>
        </pre>
        <p className="note">Note: Gatsby CLI required globally for the above command</p>
      </Container>
    </Layout>
  );
};

export default IndexPage;
