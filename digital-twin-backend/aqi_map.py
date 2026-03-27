
import folium
import os
import time
import random
import pandas as pd
from pathlib import Path
from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.chrome.service import Service
from webdriver_manager.chrome import ChromeDriverManager

# Delhi center coordinates
DELHI_LAT = 28.7041
DELHI_LON = 77.1025

# Base hotspots data with AQI values and weight ratios
# Weight = how much this location deviates from average (>1 = higher, <1 = lower)
BASE_HOTSPOTS = [
    {"name": "Chandni Chowk", "lat": 28.656, "lon": 77.231, "base_aqi": 384, "weight": 1.2092},
    {"name": "Nehru Nagar", "lat": 28.5697, "lon": 77.253, "base_aqi": 384, "weight": 1.2092},
    {"name": "New Moti Bagh", "lat": 28.582, "lon": 77.1717, "base_aqi": 377, "weight": 1.1872},
    {"name": "Shadipur", "lat": 28.6517, "lon": 77.1582, "base_aqi": 375, "weight": 1.1809},
    {"name": "Wazirpur", "lat": 28.6967, "lon": 77.1658, "base_aqi": 354, "weight": 1.1148},
    {"name": "Mundka", "lat": 28.6794, "lon": 77.0284, "base_aqi": 353, "weight": 1.1116},
    {"name": "Punjabi Bagh", "lat": 28.673, "lon": 77.1374, "base_aqi": 349, "weight": 1.0990},
    {"name": "RK Puram", "lat": 28.5505, "lon": 77.1849, "base_aqi": 342, "weight": 1.0770},
    {"name": "Jahangirpuri", "lat": 28.716, "lon": 77.1829, "base_aqi": 338, "weight": 1.0644},
    {"name": "Okhla Phase-2", "lat": 28.5365, "lon": 77.2803, "base_aqi": 337, "weight": 1.0612},
    {"name": "Dwarka Sector-8", "lat": 28.5656, "lon": 77.067, "base_aqi": 336, "weight": 1.0581},
    {"name": "Dhyanchand Stadium", "lat": 28.6125, "lon": 77.2372, "base_aqi": 335, "weight": 1.0549},
    {"name": "Patparganj", "lat": 28.612, "lon": 77.292, "base_aqi": 334, "weight": 1.0518},
    {"name": "Bawana", "lat": 28.8, "lon": 77.03, "base_aqi": 328, "weight": 1.0329},
    {"name": "Sirifort", "lat": 28.5521, "lon": 77.2193, "base_aqi": 326, "weight": 1.0266},
    {"name": "ITO", "lat": 28.6294, "lon": 77.241, "base_aqi": 324, "weight": 1.0203},
    {"name": "Karni Singh Shooting Range", "lat": 28.4998, "lon": 77.2668, "base_aqi": 323, "weight": 1.0171},
    {"name": "Sonia Vihar", "lat": 28.7074, "lon": 77.2599, "base_aqi": 317, "weight": 0.9982},
    {"name": "JLN Stadium", "lat": 28.5828, "lon": 77.2344, "base_aqi": 314, "weight": 0.9888},
    {"name": "Rohini", "lat": 28.7019, "lon": 77.0984, "base_aqi": 312, "weight": 0.9825},
    {"name": "Narela", "lat": 28.85, "lon": 77.1, "base_aqi": 311, "weight": 0.9793},
    {"name": "Mandir Marg", "lat": 28.6325, "lon": 77.1994, "base_aqi": 311, "weight": 0.9793},
    {"name": "IGI Airport T3", "lat": 28.5562, "lon": 77.1, "base_aqi": 305, "weight": 0.9605},
    {"name": "Vivek Vihar", "lat": 28.6635, "lon": 77.3152, "base_aqi": 303, "weight": 0.9542},
    {"name": "Pusa IMD", "lat": 28.6335, "lon": 77.1651, "base_aqi": 298, "weight": 0.9384},
    {"name": "Burari Crossing", "lat": 28.7592, "lon": 77.1938, "base_aqi": 294, "weight": 0.9258},
    {"name": "Aurobindo Marg", "lat": 28.545, "lon": 77.205, "base_aqi": 287, "weight": 0.9038},
    {"name": "Dilshad Garden (IHBAS)", "lat": 28.681, "lon": 77.305, "base_aqi": 283, "weight": 0.8912},
    {"name": "Lodhi Road", "lat": 28.5921, "lon": 77.2284, "base_aqi": 282, "weight": 0.8880},
    {"name": "NSIT-Dwarka", "lat": 28.6081, "lon": 77.0193, "base_aqi": 275, "weight": 0.8660},
    {"name": "Alipur", "lat": 28.8, "lon": 77.15, "base_aqi": 273, "weight": 0.8597},
    {"name": "Najafgarh", "lat": 28.6125, "lon": 76.983, "base_aqi": 262, "weight": 0.8250},
    {"name": "CRRI-Mathura Road", "lat": 28.5518, "lon": 77.2752, "base_aqi": 252, "weight": 0.7936},
    {"name": "DTU", "lat": 28.7501, "lon": 77.1177, "base_aqi": 219, "weight": 0.6896},
]

# Baseline average AQI (average of all base_aqi values)
BASELINE_AVG_AQI = sum(h['base_aqi'] for h in BASE_HOTSPOTS) / len(BASE_HOTSPOTS)

def get_emission_scaling_factor(year: int) -> float:
    """
    Calculate the scaling factor for a forecast year relative to 2025 baseline.
    Returns the ratio of year's avg emissions to 2025's avg emissions.
    """
    try:
        # Load forecast data
        forecast_path = Path(__file__).parent / "emission_forecast_3years_full.csv"
        if not forecast_path.exists():
            print(f"Forecast file not found: {forecast_path}")
            return 1.0
        
        df = pd.read_csv(forecast_path)
        df['Date'] = pd.to_datetime(df['Date'])
        df['Year'] = df['Date'].dt.year
        
        # Get baseline 2025 average
        baseline_2025 = df[df['Year'] == 2025]['Total_Emission'].mean()
        
        # Get selected year average
        year_avg = df[df['Year'] == year]['Total_Emission'].mean()
        
        if pd.isna(baseline_2025) or pd.isna(year_avg) or baseline_2025 == 0:
            print(f"Could not calculate scaling factor for year {year}")
            return 1.0
        
        scaling_factor = year_avg / baseline_2025
        print(f"Year {year}: avg emission = {year_avg:.2f}, baseline = {baseline_2025:.2f}, scaling = {scaling_factor:.4f}")
        return scaling_factor
        
    except Exception as e:
        print(f"Error calculating emission scaling factor: {e}")
        return 1.0


def add_delhi_boundary_to_map(m):
    """Helper to fetch and add Delhi boundary to a map."""
    import requests
    try:
        geojson_url = "https://raw.githubusercontent.com/datameet/Municipal_Spatial_Data/master/Delhi/Delhi_Boundary.geojson"
        
        # Add Boundary Outline
        folium.GeoJson(
            geojson_url,
            name="Delhi Boundary",
            style_function=lambda x: {
                'fillColor': 'none',
                'color': 'black', # Black for visibility on light tiles
                'weight': 3,
                'dashArray': '5, 5',
                'opacity': 0.6
            }
        ).add_to(m)
        return True
    except Exception as e:
        print(f"Error adding boundary: {e}")
        return False

def generate_heatmap_html(level="ward"):
    """Generates a Folium map with Ward-wise or Zone-wise Heatmap."""
    m = folium.Map(
        location=[DELHI_LAT, DELHI_LON], 
        zoom_start=10, 
        control_scale=True,
        tiles='cartodbpositron'
    )
    
    geojson_url = "https://raw.githubusercontent.com/datameet/Municipal_Spatial_Data/master/Delhi/Delhi_Wards.geojson"
    
    import requests
    import random
    from shapely.geometry import shape, mapping
    from shapely.ops import unary_union
    
    try:
        from zone_mapper import get_zone_for_ward
    except ImportError:
        def get_zone_for_ward(w): return 'Unknown Zone'
    
    try:
        resp = requests.get(geojson_url)
        data = resp.json()
        
        def get_color(value):
            if value < 100: return "#fee5d9"
            if value < 200: return "#fcae91"
            if value < 300: return "#fb6a4a"
            if value < 400: return "#de2d26"
            return "#a50f15"
            
        if level == "zone":
            zone_features = {}
            for feature in data['features']:
                ward_name = feature['properties'].get('Ward_Name') or ''
                zone_name = get_zone_for_ward(ward_name)
                
                geom = shape(feature['geometry'])
                
                sum_chars = sum(ord(c) for c in ward_name) if ward_name else 0
                base_aqi = 200 + (sum_chars % 200)
                is_hotspot = any(h['name'].lower() in ward_name.lower() for h in BASE_HOTSPOTS)
                if is_hotspot: base_aqi += 50
                val = min(500, max(50, base_aqi))
                
                if zone_name not in zone_features:
                    zone_features[zone_name] = {'geoms': [], 'aqis': []}
                if geom.is_valid:
                    zone_features[zone_name]['geoms'].append(geom)
                zone_features[zone_name]['aqis'].append(val)
                
            new_features = []
            for zname, zdata in zone_features.items():
                if not zdata['geoms']: continue
                try:
                    merged_geom = unary_union(zdata['geoms'])
                    avg_aqi = sum(zdata['aqis']) / len(zdata['aqis'])
                    new_features.append({
                        "type": "Feature",
                        "geometry": mapping(merged_geom),
                        "properties": {
                            "Zone_Name": zname,
                            "simulated_aqi": round(avg_aqi),
                            "fill_color": get_color(avg_aqi)
                        }
                    })
                except Exception as e:
                    print(f"Error merging zone {zname}: {e}")
                    
            map_data = {"type": "FeatureCollection", "features": new_features}
            
            folium.GeoJson(
                map_data,
                name="Delhi Zones AQI",
                style_function=lambda feature: {
                    'fillColor': feature['properties']['fill_color'],
                    'color': '#ffffff', 
                    'weight': 1.5,
                    'fillOpacity': 0.75,
                },
                highlight_function=lambda feature: {
                    'weight': 3,
                    'color': 'black',
                    'fillOpacity': 0.95
                },
                tooltip=folium.GeoJsonTooltip(
                    fields=['Zone_Name', 'simulated_aqi'],
                    aliases=['Zone:', 'Avg AQI:'],
                    style=("background-color: white; color: #333; font-family: arial; font-size: 13px; padding: 10px; font-weight: bold;")
                )
            ).add_to(m)
            
        else:
            for feature in data['features']:
                ward_name = feature['properties'].get('Ward_Name') or ''
                sum_chars = sum(ord(c) for c in ward_name) if ward_name else 0
                base_aqi = 200 + (sum_chars % 200)
                is_hotspot = any(h['name'].lower() in ward_name.lower() for h in BASE_HOTSPOTS)
                if is_hotspot:
                    base_aqi += 50
                val = min(500, max(50, base_aqi))
                
                feature['properties']['simulated_aqi'] = val
                feature['properties']['fill_color'] = get_color(val)
                feature['properties']['display_name'] = ward_name.title()
                
            folium.GeoJson(
                data,
                name="Delhi Wards AQI",
                style_function=lambda feature: {
                    'fillColor': feature['properties']['fill_color'],
                    'color': 'white',
                    'weight': 1,
                    'fillOpacity': 0.7,
                },
                highlight_function=lambda feature: {
                    'weight': 2,
                    'color': 'black',
                    'fillOpacity': 0.9
                },
                tooltip=folium.GeoJsonTooltip(
                    fields=['display_name', 'Ward_No', 'simulated_aqi'],
                    aliases=['Ward Name:', 'Ward No:', 'AQI Index:'],
                    style=("background-color: white; color: #333; font-family: arial; font-size: 12px; padding: 10px;")
                )
            ).add_to(m)
        
    except Exception as e:
        print(f"Error generating heatmap ({level}): {e}")
        add_delhi_boundary_to_map(m)
        
    return m.get_root().render()

def generate_hotspots_html():
    """Generates the original Hotspot Map with markers."""
    m = folium.Map(location=[DELHI_LAT, DELHI_LON], zoom_start=11)
    
    # Add Visual Boundary
    add_delhi_boundary_to_map(m)
    
    # Original Hotspots Data
    hotspots = [
        {"name": "Chandni Chowk", "lat": 28.656, "lon": 77.231, "aqi": 384},
        {"name": "Nehru Nagar", "lat": 28.5697, "lon": 77.253, "aqi": 384},
        {"name": "New Moti Bagh", "lat": 28.582, "lon": 77.1717, "aqi": 377},
        {"name": "Shadipur", "lat": 28.6517, "lon": 77.1582, "aqi": 375},
        {"name": "Wazirpur", "lat": 28.6967, "lon": 77.1658, "aqi": 354},
        {"name": "Ashok Vihar", "lat": 28.6856, "lon": 77.178, "aqi": 231},
        {"name": "Mundka", "lat": 28.6794, "lon": 77.0284, "aqi": 353},
        {"name": "Punjabi Bagh", "lat": 28.673, "lon": 77.1374, "aqi": 349},
        {"name": "RK Puram", "lat": 28.5505, "lon": 77.1849, "aqi": 342},
        {"name": "Jahangirpuri", "lat": 28.716, "lon": 77.1829, "aqi": 338},
        {"name": "Okhla Phase-2", "lat": 28.5365, "lon": 77.2803, "aqi": 337},
        {"name": "Dwarka Sector-8", "lat": 28.5656, "lon": 77.067, "aqi": 336},
        {"name": "Patparganj", "lat": 28.612, "lon": 77.292, "aqi": 334},
        {"name": "Bawana", "lat": 28.8, "lon": 77.03, "aqi": 328},
        {"name": "Sonia Vihar", "lat": 28.7074, "lon": 77.2599, "aqi": 317},
        {"name": "Rohini", "lat": 28.7019, "lon": 77.0984, "aqi": 312},
        {"name": "Narela", "lat": 28.85, "lon": 77.1, "aqi": 311},
        {"name": "Mandir Marg", "lat": 28.6325, "lon": 77.1994, "aqi": 311},
        {"name": "Vivek Vihar", "lat": 28.6635, "lon": 77.3152, "aqi": 303},
        {"name": "Anand Vihar", "lat": 28.6508, "lon": 77.3152, "aqi": 335},
        {"name": "Dhyanchand Stadium", "lat": 28.6125, "lon": 77.2372, "aqi": 335},
        {"name": "Sirifort", "lat": 28.5521, "lon": 77.2193, "aqi": 326},
        {"name": "Karni Singh Shooting Range", "lat": 28.4998, "lon": 77.2668, "aqi": 323},
        {"name": "ITO", "lat": 28.6294, "lon": 77.241, "aqi": 324},
        {"name": "JLN Stadium", "lat": 28.5828, "lon": 77.2344, "aqi": 314},
        {"name": "IGI Airport T3", "lat": 28.5562, "lon": 77.1, "aqi": 305},
        {"name": "Pusa IMD", "lat": 28.6335, "lon": 77.1651, "aqi": 298},
        {"name": "Burari Crossing", "lat": 28.7592, "lon": 77.1938, "aqi": 294},
        {"name": "Aurobindo Marg", "lat": 28.545, "lon": 77.205, "aqi": 287},
        {"name": "Dilshad Garden (IHBAS)", "lat": 28.681, "lon": 77.305, "aqi": 283},
        {"name": "Lodhi Road", "lat": 28.5921, "lon": 77.2284, "aqi": 282},
        {"name": "NSIT-Dwarka", "lat": 28.6081, "lon": 77.0193, "aqi": 275},
        {"name": "Alipur", "lat": 28.8, "lon": 77.15, "aqi": 273},
        {"name": "Najafgarh", "lat": 28.6125, "lon": 76.983, "aqi": 262},
        {"name": "CRRI-Mathura Road", "lat": 28.5518, "lon": 77.2752, "aqi": 252},
        {"name": "DTU", "lat": 28.7501, "lon": 77.1177, "aqi": 219},
        {"name": "DU North Campus", "lat": 28.69, "lon": 77.21, "aqi": 298},
        {"name": "Ayanagar", "lat": 28.4809, "lon": 77.1255, "aqi": 342}
    ]

    for spot in hotspots:
        color = "gray"
        aqi = spot['aqi']
        if isinstance(aqi, (int, float)):
             color = "green"
             if aqi > 100: color = "yellow"
             if aqi > 200: color = "orange"
             if aqi > 300: color = "red"
             if aqi > 400: color = "purple"
        
        folium.CircleMarker(
            location=[spot['lat'], spot['lon']],
            radius=15,
            popup=f"{spot['name']}: AQI {spot['aqi']}",
            color=color,
            fill=True,
            fill_color=color,
            fill_opacity=0.7
        ).add_to(m)
        
        folium.Marker(
            location=[spot['lat'], spot['lon']],
            icon=folium.DivIcon(html=f'<div style="font-weight: bold; color: white; text-shadow: 0 0 3px black;">{spot["aqi"]}</div>')
        ).add_to(m)
        
    return m.get_root().render()

def generate_forecast_hotspots_html(year: int):
    """
    Generates a Hotspot Map with AQI values adjusted for the forecast year.
    Uses emission scaling factor to project future AQI values.
    """
    m = folium.Map(location=[DELHI_LAT, DELHI_LON], zoom_start=11)
    
    # Add Visual Boundary
    add_delhi_boundary_to_map(m)
    
    # Get scaling factor for the year
    scaling_factor = get_emission_scaling_factor(year)
    
    # Generate adjusted hotspots
    for spot in BASE_HOTSPOTS:
        # Apply scaling: new_aqi = base_aqi * scaling_factor
        # The weight is already embedded in base_aqi, so we just scale by emission change
        adjusted_aqi = int(spot['base_aqi'] * scaling_factor)
        
        # Determine color based on AQI
        color = "gray"
        if isinstance(adjusted_aqi, (int, float)):
            color = "green"
            if adjusted_aqi > 100: color = "yellow"
            if adjusted_aqi > 200: color = "orange"
            if adjusted_aqi > 300: color = "red"
            if adjusted_aqi > 400: color = "purple"
        
        folium.CircleMarker(
            location=[spot['lat'], spot['lon']],
            radius=15,
            popup=f"{spot['name']}: AQI {adjusted_aqi} ({year} Forecast)",
            color=color,
            fill=True,
            fill_color=color,
            fill_opacity=0.7
        ).add_to(m)
        
        folium.Marker(
            location=[spot['lat'], spot['lon']],
            icon=folium.DivIcon(html=f'<div style="font-weight: bold; color: white; text-shadow: 0 0 3px black;">{adjusted_aqi}</div>')
        ).add_to(m)
        
    return m.get_root().render()


def render_map_to_png(html_content, output_path):
    """
    Renders the HTML content to a PNG image using Selenium headless Chrome.
    """
    import uuid
    unique_id = uuid.uuid4()
    tmp_html_path = os.path.abspath(f"temp_map_{unique_id}.html")
    
    # Write HTML to temp file
    with open(tmp_html_path, "w", encoding="utf-8") as f:
        f.write(html_content)
        
    chrome_options = Options()
    chrome_options.add_argument("--headless")
    chrome_options.add_argument("--window-size=800,600")
    chrome_options.add_argument("--disable-gpu")
    chrome_options.add_argument("--no-sandbox")
    
    driver = None
    try:
        # Auto-install chromedriver
        service = Service(ChromeDriverManager().install())
        driver = webdriver.Chrome(service=service, options=chrome_options)
        
        # Load local HTML file
        driver.get(f"file:///{tmp_html_path}")
        time.sleep(2) # Wait for map to render tiles
        
        # Save screenshot
        driver.save_screenshot(output_path)
        print(f"Map image saved to {output_path}")
        
    except Exception as e:
        print(f"Error rendering map to PNG: {e}")
        import traceback
        traceback.print_exc()
    finally:
        if driver:
            driver.quit()
        # Cleanup temp file
        if os.path.exists(tmp_html_path):
            os.remove(tmp_html_path)

if __name__ == "__main__":
    # Test run
    html = generate_aqi_map_html()
    render_map_to_png(html, "aqi_map_test.png")
