# Dataset Inspection and Validation Report
**Phase 7.2: Dataset Preparation & Training Pipeline**

## 1. Files Detected
The following datasets were successfully located in `ml/data/`:
1. `Global_Landslide_Catalog_Export_rows.csv` (8.08 MB)
2. `g4.areaAvgTimeSeries.GPM_3IMERGHH_07_precipitation.20200101-20201231.88E_21N_98E_30N.csv` (561 KB)

---

## 2. Dataset 1: NASA GPM IMERG Rainfall (Area-Averaged)
*File: g4.areaAvgTimeSeries.GPM_3IMERGHH_07_precipitation.20200101-20201231.88E_21N_98E_30N.csv*

### Metadata & Structure
- **Row Count:** 17,568 rows
- **Columns (2):** `time`, ` mean_GPM_3IMERGHH_07_precipitation`
- **Data Types:** `time` (String), `precipitation` (Float64)
- **Missing Values:** 0 missing values in the primary columns.
- **Date/Timestamp Columns:** `time` (30-minute intervals).
- **Latitude/Longitude Columns:** **MISSING** (This is an Area-Averaged time series).
- **Rainfall Columns:** `mean_GPM_3IMERGHH_07_precipitation`.
- **Landslide Columns:** **MISSING**.

### Regional Verification
- The file header explicitly states: `User Bounding Box: "88,21,98,30.5"`.
- This perfectly matches the requested NER region: Longitude 88-98 E, Latitude 21-30.5 N.

---

## 3. Dataset 2: Global Landslide Catalog (GLC)
*File: Global_Landslide_Catalog_Export_rows.csv*

### Metadata & Structure
- **Row Count:** 11,033 rows
- **Columns (31):** `source_name`, `source_link`, `event_id`, `event_date`, `event_time`, `event_title`, `event_description`, `location_description`, `location_accuracy`, `landslide_category`, `landslide_trigger`, `landslide_size`, `landslide_setting`, `fatality_count`, `injury_count`, `storm_name`, `photo_link`, `notes`, `event_import_source`, `event_import_id`, `country_name`, `country_code`, `admin_division_name`, `admin_division_population`, `gazeteer_closest_point`, `gazeteer_distance`, `submitted_date`, `created_date`, `last_edited_date`, `longitude`, `latitude`.
- **Data Types:** 8 Float64, 1 Int64, 22 String.
- **Missing Values:** High sparsity in `event_time` (0 non-null), `storm_name`, `photo_link`, and `notes`. `country_name` is missing for some rows.
- **Date/Timestamp Columns:** `event_date`, `event_time`, `submitted_date`, `created_date`, `last_edited_date`.
- **Latitude/Longitude Columns:** `latitude`, `longitude`.
- **Rainfall Columns:** **MISSING** (only text triggers like "downpour" in `landslide_trigger`).
- **Landslide Columns:** `landslide_category`, `landslide_size`, `landslide_trigger`, etc.

### Regional Verification (NER States)
Filtering for `country_name == 'India'` yields 1,265 historical records. The `admin_division_name` column successfully confirms the presence of Northeast Region (NER) states, including:
- Manipur
- Nagaland / Nāgāland
- Assam
- Meghalaya / Meghālaya
- Sikkim
- Arunachal Pradesh / Arunāchal Pradesh
- Mizoram
- Tripura

---

## 4. Feature Mapping
Mapping the available data to the required BHUSHAKTI AI feature vector:

- **`rainfall24h`**: **DERIVABLE** (By temporally rolling and summing the GPM time series).
- **`rainfallDuration24h`**: **DERIVABLE**.
- **`soilMoisture`**: **MISSING** (Requires external data, e.g., SMAP).
- **`slope`**: **MISSING** (Requires external DEM data, e.g., SRTM 30m).
- **`elevation`**: **MISSING** (Requires external DEM data).
- **`landUse`**: **MISSING** (Requires external Land Cover classification data).
- **`historicalSusceptibility`**: **MISSING** (Requires external geological mapping).
- **`Target (1 = Landslide)`**: **AVAILABLE** (All GLC rows represent positive events).
- **`Target (0 = No Landslide)`**: **MISSING** (Requires generating negative samples/absence data).

---

## 5. Feasibility of Joining Datasets
While theoretically joinable on the date dimension, combining these two specific datasets into a spatial ML training set is **unrealistic** for the following critical reasons:

1. **Spatial Collapse:** The GPM file is *Area-Averaged*. It collapses the entire NER region (hundreds of thousands of square kilometers) into a single mean rainfall value per timestamp. Consequently, every landslide in the catalog occurring at `Time T` would be assigned the exact same rainfall value, regardless of whether it occurred in Sikkim or Tripura. A *gridded* precipitation dataset (NetCDF/HDF5) is required to map localized rainfall to exact lat/lon coordinates.
2. **Temporal Mismatch:** The GPM data strictly spans only the year 2020 (`20200101-20201231`). The NASA Global Landslide Catalog predominantly covers events from 2007 up to 2017. Filtering the GLC for 2020 India events yields virtually zero matches.
3. **Absence of Negative Classes:** The GLC only records landslides. An ML classifier cannot learn what triggers a landslide without also seeing conditions that *did not* trigger a landslide (`0` targets).

---

## Conclusion
**STATUS: BLOCKED**

A robust, localized Random Forest prediction model cannot be legitimately trained using only an Area-Averaged rainfall file and a landslide catalog with mismatched temporal coverage. Furthermore, 5 out of 7 required primary environmental features (Soil Moisture, Slope, Elevation, Land Use, Susceptibility) are missing.

As per strict phase instructions, I have stopped the pipeline. No fake data has been generated, no arbitrary joins have been forced, and no models have been fabricated.
