
import pandas as pd
import numpy as np
from pathlib import Path
from sqlalchemy import create_engine, text

# ============================================================
# CONFIGURATION
# ============================================================

CSV_PATH = "C:/Users/balki/Downloads/pi_dwh/motor_insurance_prepared_after_changes.csv"

DB_USER = "postgres"
DB_PASSWORD = "system"
DB_HOST = "localhost"
DB_PORT = "5432"
DB_NAME = "pi_assurance_dw"

DATABASE_URL = (
    f"postgresql+psycopg2://{DB_USER}:{DB_PASSWORD}"
    f"@{DB_HOST}:{DB_PORT}/{DB_NAME}"
)

engine = create_engine(DATABASE_URL)

# ============================================================
# FONCTIONS UTILES
# ============================================================

def read_csv_safely(path):
    try:
        df = pd.read_csv(path, sep=";", low_memory=False)
        if df.shape[1] == 1:
            df = pd.read_csv(path, sep=",", low_memory=False)
    except Exception:
        df = pd.read_csv(path, sep=",", low_memory=False)
    return df


def to_date(series):
    return pd.to_datetime(series, errors="coerce", dayfirst=True)


def ensure_col(df, col, default_value):
    if col not in df.columns:
        df[col] = default_value
    return df


def month_to_season(month):
    if pd.isna(month):
        return None

    month = int(month)

    if month in [12, 1, 2]:
        return "Hiver"
    elif month in [3, 4, 5]:
        return "Printemps"
    elif month in [6, 7, 8]:
        return "Ete"
    else:
        return "Automne"


def clean_text_value(x):
    if pd.isna(x):
        return "Non renseigne"
    return str(x).strip()


# ============================================================
# 1. CHARGEMENT DU CSV
# ============================================================

csv_path = Path(CSV_PATH)

if not csv_path.exists():
    raise FileNotFoundError(f"CSV introuvable : {csv_path.resolve()}")

df = read_csv_safely(csv_path)

print("✅ CSV chargé")
print("Dimensions :", df.shape)
print("Colonnes :", list(df.columns))

# ============================================================
# 2. SÉCURISER LES COLONNES
# ============================================================

optional_defaults = {
    "ID": None,
    "Date_start_contract": pd.NaT,
    "Date_last_renewal": pd.NaT,
    "Date_next_renewal": pd.NaT,
    "Date_lapse": pd.NaT,
    "Date_birth": pd.NaT,
    "Date_driving_licence": pd.NaT,
    "Year_matriculation": np.nan,
    "Region": None,
    "Area": None,
    "Zone": None,
    "Gender": None,
    "Marital_status": None,
    "Power": None,
    "Type_risk": None,
    "Type_fuel": None,
    "Brand": None,
    "Payment": None,
    "Distribution_channel": None,
    "Exposure": 1,
    "Premium": 0,
    "N_claims_year": 0,
    "Cost_claims_year": 0,
}

for col, default in optional_defaults.items():
    df = ensure_col(df, col, default)

if df["ID"].isna().all():
    df["ID"] = df.index.astype(str)

df["ID"] = df["ID"].astype(str)

# ============================================================
# 3. CONVERTIR LES DATES
# ============================================================

date_cols = [
    "Date_start_contract",
    "Date_last_renewal",
    "Date_next_renewal",
    "Date_lapse",
    "Date_birth",
    "Date_driving_licence",
]

for col in date_cols:
    df[col] = to_date(df[col])

# Date d'observation
df["observation_date"] = df["Date_last_renewal"]

df.loc[df["observation_date"].isna(), "observation_date"] = df.loc[
    df["observation_date"].isna(), "Date_start_contract"
]

df.loc[df["observation_date"].isna(), "observation_date"] = pd.Timestamp.today().normalize()

# ============================================================
# 4. VARIABLES DÉRIVÉES
# ============================================================

df["year"] = df["observation_date"].dt.year
df["month"] = df["observation_date"].dt.month
df["quarter"] = df["observation_date"].dt.quarter
df["semester"] = np.where(df["month"] <= 6, 1, 2)
df["season"] = df["month"].apply(month_to_season)
df["month_name"] = df["observation_date"].dt.month_name()

df["age_driver"] = (
    df["observation_date"] - df["Date_birth"]
).dt.days / 365.25

df["driving_experience"] = (
    df["observation_date"] - df["Date_driving_licence"]
).dt.days / 365.25

df["year_matriculation"] = pd.to_numeric(
    df["Year_matriculation"], errors="coerce"
)

df["vehicle_age"] = df["year"] - df["year_matriculation"]

df["contract_age_years"] = (
    df["observation_date"] - df["Date_start_contract"]
).dt.days / 365.25

df["contract_status"] = np.where(
    df["Date_lapse"].notna(),
    "lapsed",
    "active"
)

# Nettoyage valeurs aberrantes
df.loc[(df["age_driver"] < 16) | (df["age_driver"] > 100), "age_driver"] = np.nan
df.loc[(df["driving_experience"] < 0) | (df["driving_experience"] > 80), "driving_experience"] = np.nan
df.loc[(df["vehicle_age"] < 0) | (df["vehicle_age"] > 60), "vehicle_age"] = np.nan
df.loc[(df["contract_age_years"] < 0) | (df["contract_age_years"] > 80), "contract_age_years"] = np.nan

# ============================================================
# 5. VARIABLES ACTUARIELLES
# ============================================================

df["Exposure"] = pd.to_numeric(df["Exposure"], errors="coerce").fillna(1)
df["Exposure"] = df["Exposure"].clip(0.01, 1)

df["Premium"] = pd.to_numeric(df["Premium"], errors="coerce").fillna(0)
df["N_claims_year"] = pd.to_numeric(df["N_claims_year"], errors="coerce").fillna(0).clip(lower=0)
df["Cost_claims_year"] = pd.to_numeric(df["Cost_claims_year"], errors="coerce").fillna(0).clip(lower=0)

df["frequence"] = df["N_claims_year"] / df["Exposure"].clip(lower=1e-6)

df["severite"] = np.where(
    df["N_claims_year"] > 0,
    df["Cost_claims_year"] / df["N_claims_year"].clip(lower=1e-6),
    0
)

df["prime_pure"] = df["Cost_claims_year"] / df["Exposure"].clip(lower=1e-6)

df["loss_ratio"] = np.where(
    df["Premium"] > 0,
    df["Cost_claims_year"] / df["Premium"],
    0
)

# Profil risque simple
q75 = df["prime_pure"].quantile(0.75)

df["risk_profile"] = np.where(
    df["prime_pure"] == 0,
    "low",
    np.where(df["prime_pure"] < q75, "medium", "high")
)

# ============================================================
# 6. NETTOYAGE TEXTES
# ============================================================

text_cols = [
    "Region", "Area", "Zone",
    "Gender", "Marital_status",
    "Power", "Type_risk", "Type_fuel", "Brand",
    "Payment", "Distribution_channel"
]

for col in text_cols:
    df[col] = df[col].apply(clean_text_value)

# ============================================================
# 7. CRÉATION DES DIMENSIONS AVEC IDS
# ============================================================

# ------------------------------
# dim_date
# ------------------------------

dim_date = df[[
    "observation_date",
    "year",
    "month",
    "month_name",
    "quarter",
    "semester",
    "season"
]].drop_duplicates().reset_index(drop=True)

dim_date["date_id"] = range(1, len(dim_date) + 1)

dim_date = dim_date.rename(columns={
    "observation_date": "full_date"
})

dim_date = dim_date[[
    "date_id",
    "full_date",
    "year",
    "month",
    "month_name",
    "quarter",
    "semester",
    "season"
]]

df = df.merge(
    dim_date[["date_id", "full_date"]],
    left_on="observation_date",
    right_on="full_date",
    how="left"
)

# ------------------------------
# dim_region
# ------------------------------

dim_region = df[[
    "Region",
    "Area",
    "Zone"
]].drop_duplicates().reset_index(drop=True)

dim_region["region_id"] = range(1, len(dim_region) + 1)

dim_region = dim_region.rename(columns={
    "Region": "region_name",
    "Area": "area",
    "Zone": "zone"
})

dim_region = dim_region[[
    "region_id",
    "region_name",
    "area",
    "zone"
]]

df = df.merge(
    dim_region,
    left_on=["Region", "Area", "Zone"],
    right_on=["region_name", "area", "zone"],
    how="left"
)

# ------------------------------
# dim_assure
# ------------------------------

dim_assure = df[[
    "ID",
    "age_driver",
    "driving_experience",
    "Gender",
    "Marital_status",
    "risk_profile"
]].copy()

dim_assure = dim_assure.drop_duplicates(subset=["ID"]).reset_index(drop=True)

dim_assure["assure_id"] = range(1, len(dim_assure) + 1)

dim_assure = dim_assure.rename(columns={
    "ID": "original_assure_id",
    "Gender": "gender",
    "Marital_status": "marital_status"
})

dim_assure = dim_assure[[
    "assure_id",
    "original_assure_id",
    "age_driver",
    "driving_experience",
    "gender",
    "marital_status",
    "risk_profile"
]]

df = df.merge(
    dim_assure[["assure_id", "original_assure_id"]],
    left_on="ID",
    right_on="original_assure_id",
    how="left"
)

# ------------------------------
# dim_vehicule
# ------------------------------

dim_vehicule = df[[
    "vehicle_age",
    "year_matriculation",
    "Power",
    "Type_risk",
    "Type_fuel",
    "Brand"
]].copy()

dim_vehicule = dim_vehicule.drop_duplicates().reset_index(drop=True)

dim_vehicule["vehicule_id"] = range(1, len(dim_vehicule) + 1)

dim_vehicule = dim_vehicule.rename(columns={
    "Power": "vehicle_power",
    "Type_risk": "vehicle_type",
    "Type_fuel": "fuel_type",
    "Brand": "brand"
})

dim_vehicule = dim_vehicule[[
    "vehicule_id",
    "vehicle_age",
    "year_matriculation",
    "vehicle_power",
    "vehicle_type",
    "fuel_type",
    "brand"
]]

df = df.merge(
    dim_vehicule,
    left_on=[
        "vehicle_age",
        "year_matriculation",
        "Power",
        "Type_risk",
        "Type_fuel",
        "Brand"
    ],
    right_on=[
        "vehicle_age",
        "year_matriculation",
        "vehicle_power",
        "vehicle_type",
        "fuel_type",
        "brand"
    ],
    how="left"
)

# ------------------------------
# dim_contrat
# ------------------------------

dim_contrat = df[[
    "ID",
    "Date_start_contract",
    "Date_last_renewal",
    "Date_next_renewal",
    "Date_lapse",
    "contract_age_years",
    "Payment",
    "Distribution_channel",
    "contract_status"
]].copy()

# Si un même ID apparaît plusieurs fois, on garde une ligne contrat par ID.
dim_contrat = dim_contrat.drop_duplicates(subset=["ID"]).reset_index(drop=True)

dim_contrat["contrat_id"] = range(1, len(dim_contrat) + 1)

dim_contrat = dim_contrat.rename(columns={
    "ID": "original_contract_id",
    "Date_start_contract": "date_start_contract",
    "Date_last_renewal": "date_last_renewal",
    "Date_next_renewal": "date_next_renewal",
    "Date_lapse": "date_lapse",
    "Payment": "payment_type",
    "Distribution_channel": "distribution_channel"
})

dim_contrat = dim_contrat[[
    "contrat_id",
    "original_contract_id",
    "date_start_contract",
    "date_last_renewal",
    "date_next_renewal",
    "date_lapse",
    "contract_age_years",
    "payment_type",
    "distribution_channel",
    "contract_status"
]]

df = df.merge(
    dim_contrat[["contrat_id", "original_contract_id"]],
    left_on="ID",
    right_on="original_contract_id",
    how="left"
)

# ============================================================
# 8. TABLE DE FAITS
# ============================================================

fact_sinistres = pd.DataFrame({
    "date_id": df["date_id"],
    "region_id": df["region_id"],
    "assure_id": df["assure_id"],
    "vehicule_id": df["vehicule_id"],
    "contrat_id": df["contrat_id"],

    "exposure": df["Exposure"],
    "premium": df["Premium"],
    "nb_sinistres": df["N_claims_year"],
    "cout_sinistres": df["Cost_claims_year"],

    "frequence": df["frequence"],
    "severite": df["severite"],
    "prime_pure": df["prime_pure"],
    "loss_ratio": df["loss_ratio"],
})

fact_sinistres["fact_id"] = range(1, len(fact_sinistres) + 1)

fact_sinistres = fact_sinistres[[
    "fact_id",
    "date_id",
    "region_id",
    "assure_id",
    "vehicule_id",
    "contrat_id",
    "exposure",
    "premium",
    "nb_sinistres",
    "cout_sinistres",
    "frequence",
    "severite",
    "prime_pure",
    "loss_ratio"
]]

# ============================================================
# 9. AFFICHAGE AVANT CHARGEMENT
# ============================================================

print("\n==============================")
print("TABLES PRÉPARÉES")
print("==============================")
print("dim_date       :", dim_date.shape)
print("dim_region     :", dim_region.shape)
print("dim_assure     :", dim_assure.shape)
print("dim_vehicule   :", dim_vehicule.shape)
print("dim_contrat    :", dim_contrat.shape)
print("fact_sinistres :", fact_sinistres.shape)

# ============================================================
# 10. CHARGEMENT DANS POSTGRESQL
# ============================================================

print("\nConnexion PostgreSQL...")

with engine.begin() as conn:
    print("✅ Connexion OK")

    print("Suppression anciennes données...")
    conn.execute(text("TRUNCATE TABLE fact_sinistres RESTART IDENTITY CASCADE;"))
    conn.execute(text("TRUNCATE TABLE dim_date RESTART IDENTITY CASCADE;"))
    conn.execute(text("TRUNCATE TABLE dim_region RESTART IDENTITY CASCADE;"))
    conn.execute(text("TRUNCATE TABLE dim_assure RESTART IDENTITY CASCADE;"))
    conn.execute(text("TRUNCATE TABLE dim_vehicule RESTART IDENTITY CASCADE;"))
    conn.execute(text("TRUNCATE TABLE dim_contrat RESTART IDENTITY CASCADE;"))

print("Insertion dim_date...")
dim_date.to_sql("dim_date", engine, if_exists="append", index=False)

print("Insertion dim_region...")
dim_region.to_sql("dim_region", engine, if_exists="append", index=False)

print("Insertion dim_assure...")
dim_assure.to_sql("dim_assure", engine, if_exists="append", index=False)

print("Insertion dim_vehicule...")
dim_vehicule.to_sql("dim_vehicule", engine, if_exists="append", index=False)

print("Insertion dim_contrat...")
dim_contrat.to_sql("dim_contrat", engine, if_exists="append", index=False)

print("Insertion fact_sinistres...")
fact_sinistres.to_sql("fact_sinistres", engine, if_exists="append", index=False)

# ============================================================
# 11. CORRECTION DES SEQUENCES SERIAL
# ============================================================

with engine.begin() as conn:
    conn.execute(text("""
        SELECT setval('dim_date_date_id_seq', COALESCE((SELECT MAX(date_id) FROM dim_date), 1));
    """))

    conn.execute(text("""
        SELECT setval('dim_region_region_id_seq', COALESCE((SELECT MAX(region_id) FROM dim_region), 1));
    """))

    conn.execute(text("""
        SELECT setval('dim_assure_assure_id_seq', COALESCE((SELECT MAX(assure_id) FROM dim_assure), 1));
    """))

    conn.execute(text("""
        SELECT setval('dim_vehicule_vehicule_id_seq', COALESCE((SELECT MAX(vehicule_id) FROM dim_vehicule), 1));
    """))

    conn.execute(text("""
        SELECT setval('dim_contrat_contrat_id_seq', COALESCE((SELECT MAX(contrat_id) FROM dim_contrat), 1));
    """))

    conn.execute(text("""
        SELECT setval('fact_sinistres_fact_id_seq', COALESCE((SELECT MAX(fact_id) FROM fact_sinistres), 1));
    """))

print("\n✅ Data Warehouse chargé avec succès")

# ============================================================
# 12. VÉRIFICATION
# ============================================================

tables = [
    "dim_date",
    "dim_region",
    "dim_assure",
    "dim_vehicule",
    "dim_contrat",
    "fact_sinistres"
]

with engine.connect() as conn:
    for table in tables:
        count = conn.execute(text(f"SELECT COUNT(*) FROM {table};")).scalar()
        print(f"{table}: {count} lignes")

    kpi = conn.execute(text("""
        SELECT
            SUM(exposure) AS exposition_totale,
            SUM(premium) AS prime_totale,
            SUM(nb_sinistres) AS nb_sinistres,
            SUM(cout_sinistres) AS cout_sinistres,
            SUM(cout_sinistres) / NULLIF(SUM(premium), 0) AS loss_ratio,
            SUM(cout_sinistres) / NULLIF(SUM(exposure), 0) AS prime_pure
        FROM fact_sinistres;
    """)).mappings().first()

    print("\nKPI Data Warehouse :")
    print(dict(kpi))