# HydroLang Examples - How to Use

## 🚀 Quick Start

### Running Examples

**Option 1: Double-click the HTML file**
- Open any `.html` file in your browser
- Open DevTools (F12) to see results

**Option 2: From VS Code**
- Install "Live Server" extension
- Right-click → "Open with Live Server"

**Option 3: Python Server**
```bash
cd HydroLangWP
python -m http.server 8000
# Visit: http://localhost:8000/examples/
```

## 📁 What's In Each Folder

### `data-sources/` - Fetching Data
- Retrieve climate, elevation, and streamflow data
- Examples: ECMWF, 3DEP DEM, USGS gauges

### `geoprocessing/` - Terrain & Watershed Analysis  
- DEM processing, flow analysis, watershed delineation
- Examples: Flow direction, terrain indices, stream extraction

### `machine-learning/` - Neural Networks
- Time series forecasting, classification, segmentation
- Examples: LSTM streamflow, flood classification, land cover

### `statistical-analysis/` - Hydrological Stats
- Correlation, efficiency metrics, drought indices
- Examples: Flood frequency, NSE calculation, SPI drought index

## 💡 Reading Example Code

All examples follow this pattern:
```javascript
async function runExample() {
    // 1. Get data
    const data = await hydro.data.retrieve({...});
    
    // 2. Process/analyze
    const result = await hydro.analyze.something({...});
    
    // 3. Display results
    console.log(result);
}
```

## ⚠️ Notes

- Examples require internet for data retrieval
- Check browser console (F12) for output
- Some examples may take time to download large datasets

## 📖 More Help

- See individual example files for detailed comments
- Check HydroLang documentation for API details
- Visit repository for more resources
